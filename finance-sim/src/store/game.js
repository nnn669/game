import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STOCK_LIST, STOCK_BASE_VOL, VALID_REDEEM_CODES } from '../data/stocks.js'
import { COMPANIES, STOCK_FLOAT_SHARES, SECTOR_MACRO } from '../data/companies.js'
import { PROPERTIES, FUNDS } from '../data/properties.js'
import { generateInitialCandles, volRatioToMult } from '../utils/indicators.js'
import { fmtNum } from '../utils/format.js'

const SAVE_KEY = 'financeSave_v8'
const MAX_CANDLES = 120
const VOL_WINDOW = 10

export const useGameStore = defineStore('game', () => {
  // ── Core ──
  const cash = ref(100000000000)
  const currentCode = ref('X001')
  const stocks = ref(JSON.parse(JSON.stringify(STOCK_LIST)))
  const positions = ref([])
  const history = ref([])
  const profitHistory = ref([])
  const candleData = ref({})
  const posHistory = ref([])
  const useShortCandle = ref(false)
  const liquidationBadgeCount = ref(0)
  const gameSpeed = ref(1)

  // ── Trading UI ──
  const currentDir = ref('long')
  const currentLeverage = ref(1)
  const leverageIndex = ref(0)
  const currentTab = ref('market')
  const currentIndicator = ref('vol')
  const marketFilter = ref('all')
  const LEVERAGE_VALUES = [1, 2, 5, 10, 20, 50]
  const COMMISSION_RATE_BASE = 0.001

  // ── Volume ──
  const stockVolume = ref({})
  const volRatioMap = ref({})
  const priceVelocity = ref({})

  // ── Orders ──
  const limitOrders = ref([])
  const slOrders = ref([])

  // ── IPO ──
  const ipoActive = ref(null)
  const ipoHistory = ref([])
  const ipoPhase = ref('cooldown')
  const ipoNextIn = ref(300)
  const ipoAppeared = ref(0)
  const ipoFrozen = ref(0)
  const _ipoUsedNames = new Set()
  const IPO_NAMES = ['绿能科技','蓝海通讯','华芯半导体','星辰医疗','金石矿业','云端数据','宏图新能','鑫源材料','银河航天','泰和生物']

  // ── Loan ──
  const loanBalance = ref(0)
  const loanInterest = ref(0)

  // ── Properties & Funds ──
  const ownedProperties = ref({})
  const fundPositions = ref({})
  const charityTotal = ref(0)
  const gameCycle = ref(0)

  // ── Leaderboard ──
  const peakAsset = ref(0)
  const peakTime = ref('游戏开始')
  const milestones = ref([])
  const MILESTONE_VALUES = [20000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 1e8]

  // ── Companies ──
  const companiesData = ref(JSON.parse(JSON.stringify(COMPANIES)))
  const companyDynamic = ref({})
  const newsHistory = ref([])
  const newsImpulseQueue = ref({})

  // ── Redeem ──
  const redeemedCodes = ref({})

  // ── Toast ──
  const toasts = ref([])

  // ── Internal ticks ──
  let _fundTick = 0
  let _loanTick = 0
  let _ipoTick = 0
  let _marketMode = 'normal'
  let _marketTick = 0

  // ──────────────── Init ────────────────
  function init() {
    stocks.value.forEach(s => {
      const base = STOCK_BASE_VOL[s.code] || 1000000
      candleData.value[s.code] = generateInitialCandles(s.price, base)
      s.price = candleData.value[s.code].at(-1).close
      stockVolume.value[s.code] = base
      volRatioMap.value[s.code] = 1
      priceVelocity.value[s.code] = 0
    })
    stocks.value.forEach(s => { s.basePrice = s.price })
    posHistory.value = [getCurrentStock()?.price ?? 0]
    profitHistory.value.push(cash.value)
    COMPANIES.forEach(co => {
      companyDynamic.value[co.code] = { sentiment: 0 }
      newsImpulseQueue.value[co.code] = []
    })
    _loadSave()
  }

  // ──────────────── Computed ────────────────
  const currentStock = computed(() => stocks.value.find(s => s.code === currentCode.value))

  const floatingPL = computed(() => {
    let fl = 0
    positions.value.forEach(p => {
      const s = stocks.value.find(x => x.code === p.code)
      if (s) fl += p.direction === 'long' ? (s.price - p.openPrice) * p.quantity : (p.openPrice - s.price) * p.quantity
    })
    return fl
  })

  const fundValue = computed(() => {
    let v = 0
    Object.values(fundPositions.value).forEach(pos => { if (pos) v += pos.invested })
    return v
  })

  const totalAsset = computed(() => cash.value + floatingPL.value + fundValue.value)

  const hasVilla = computed(() => !!ownedProperties.value['villa'])
  const commissionRate = computed(() => hasVilla.value ? COMMISSION_RATE_BASE * 0.8 : COMMISSION_RATE_BASE)
  const maxFutureLeverage = computed(() => hasVilla.value ? 50 : 20)

  const currentCandles = computed(() => {
    const data = candleData.value[currentCode.value] || []
    return useShortCandle.value ? data.slice(-24) : data
  })

  const filteredStocks = computed(() =>
    marketFilter.value === 'all' ? stocks.value : stocks.value.filter(s => s.market === marketFilter.value)
  )

  // ──────────────── Helpers ────────────────
  function getCurrentStock() {
    return stocks.value.find(s => s.code === currentCode.value)
  }

  function getHoldingQty(code) {
    return positions.value
      .filter(p => p.code === code && p.direction === 'long' && p.leverage === 1 && !p.isFutures)
      .reduce((a, p) => a + p.quantity, 0)
  }

  function getHoldingAvgPrice(code) {
    const spots = positions.value.filter(p => p.code === code && p.leverage === 1 && p.direction === 'long' && !p.isFutures)
    if (!spots.length) return 0
    const totalCost = spots.reduce((a, p) => a + p.openPrice * p.quantity, 0)
    const totalQty  = spots.reduce((a, p) => a + p.quantity, 0)
    return totalQty > 0 ? totalCost / totalQty : 0
  }

  function getBaseVol(code) {
    if (STOCK_BASE_VOL[code]) return STOCK_BASE_VOL[code]
    const s = stocks.value.find(x => x.code === code)
    return s?.isIPO ? 300000 : 1000000
  }

  // ──────────────── Toast ────────────────
  function showToast(msg, type = 'info', ms = 3000) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, msg, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, ms)
  }

  // ──────────────── Trading ────────────────
  function openPosition(code, direction, quantity, leverage, isFutures = false) {
    const stock = stocks.value.find(s => s.code === code)
    if (!stock || quantity <= 0) return false
    const price = stock.price
    const margin = isFutures ? (quantity * price / leverage) : (quantity * price)
    const fee = isFutures ? 0 : +(margin * commissionRate.value).toFixed(2)
    if (cash.value < margin + fee) { showToast('可用资金不足', 'info'); return false }
    cash.value -= margin + fee
    positions.value.push({
      id: Date.now() + Math.random(),
      code, direction, quantity, leverage,
      openPrice: +price.toFixed(4),
      margin: isFutures ? margin : null,
      isFutures, fee,
    })
    history.value.push({
      name: stock.name,
      type: isFutures ? (direction === 'long' ? '开多' : '开空') : (direction === 'long' ? '买入' : '卖出'),
      num: quantity, price: price.toFixed(2),
      time: new Date().toLocaleTimeString(),
      leverage, pl: null, fee: fee.toFixed(2),
    })
    profitHistoryPush()
    return true
  }

  function closePosition(id) {
    const idx = positions.value.findIndex(p => p.id === id)
    if (idx === -1) return
    const p = positions.value[idx]
    const stock = stocks.value.find(s => s.code === p.code)
    if (!stock) return
    const pl = p.direction === 'long'
      ? (stock.price - p.openPrice) * p.quantity
      : (p.openPrice - stock.price) * p.quantity
    const ret = p.isFutures ? (p.margin + pl) : (stock.price * p.quantity)
    cash.value += ret
    history.value.push({
      name: stock.name,
      type: p.direction === 'long' ? (p.isFutures ? '平多' : '卖出') : '平空',
      num: p.quantity, price: stock.price.toFixed(2),
      time: new Date().toLocaleTimeString(),
      leverage: p.leverage, pl: pl.toFixed(2), fee: '0',
    })
    positions.value.splice(idx, 1)
    profitHistoryPush()
  }

  function oneClickSellSpot() {
    const stock = getCurrentStock()
    if (!stock) return
    const spots = positions.value.filter(p => p.code === stock.code && p.leverage === 1 && p.direction === 'long' && !p.isFutures)
    if (!spots.length) { showToast('当前股票无现货持仓', 'info'); return }
    const qty = spots.reduce((s, p) => s + p.quantity, 0)
    cash.value += qty * stock.price
    spots.forEach(p => {
      history.value.push({ name: stock.name, type: '卖出', num: p.quantity, price: stock.price.toFixed(2), time: new Date().toLocaleTimeString(), leverage: 1, pl: ((stock.price - p.openPrice) * p.quantity).toFixed(2), fee: '0' })
    })
    positions.value = positions.value.filter(p => !(p.code === stock.code && p.leverage === 1 && p.direction === 'long' && !p.isFutures))
    profitHistoryPush()
    showToast('一键清仓完成', 'tp')
  }

  function oneClickCloseFutures() {
    const futures = positions.value.filter(p => p.isFutures)
    if (!futures.length) { showToast('当前无期货持仓', 'info'); return }
    let totalPL = 0
    futures.forEach(p => {
      const stock = stocks.value.find(s => s.code === p.code)
      if (!stock) return
      const pl = p.direction === 'long' ? (stock.price - p.openPrice) * p.quantity : (p.openPrice - stock.price) * p.quantity
      totalPL += pl
      cash.value += p.margin + pl
      history.value.push({ name: stock.name, type: p.direction === 'long' ? '平多' : '平空', num: p.quantity, price: stock.price.toFixed(2), time: new Date().toLocaleTimeString(), leverage: p.leverage, pl: pl.toFixed(2), fee: '0' })
    })
    positions.value = positions.value.filter(p => !p.isFutures)
    profitHistoryPush()
    showToast(`一键平仓 盈亏 ${totalPL >= 0 ? '+' : ''}${fmtNum(totalPL)}`, totalPL >= 0 ? 'tp' : 'sl')
  }

  // ──────────────── Checks ────────────────
  function checkLiquidation() {
    const rem = []
    positions.value.forEach(p => {
      if (!p.isFutures && p.leverage <= 1) return
      const stock = stocks.value.find(s => s.code === p.code)
      if (!stock) return
      const pl = p.direction === 'long' ? (stock.price - p.openPrice) * p.quantity : (p.openPrice - stock.price) * p.quantity
      const margin = p.margin ?? (p.quantity * p.openPrice / p.leverage)
      if (pl <= -margin * 0.9) {
        rem.push(p.id)
        history.value.push({ name: stock.name, type: '爆仓', num: p.quantity, price: stock.price.toFixed(2), time: new Date().toLocaleTimeString(), leverage: p.leverage, pl: (-margin).toFixed(2), fee: '0', reason: '爆仓' })
        liquidationBadgeCount.value++
        showToast(`💥 ${stock.name} 爆仓！`, 'liq', 5000)
      }
    })
    if (rem.length) { positions.value = positions.value.filter(p => !rem.includes(p.id)); profitHistoryPush() }
  }

  function checkSLOrders() {
    slOrders.value.forEach(o => {
      const stock = stocks.value.find(s => s.code === o.code)
      if (!stock) return
      const hit = (o.type === 'sl' && (o.direction === 'long' ? stock.price <= o.price : stock.price >= o.price))
        || (o.type === 'tp' && (o.direction === 'long' ? stock.price >= o.price : stock.price <= o.price))
      if (!hit) return
      const p = positions.value.find(pos => pos.id === o.posId)
      if (p) { closePosition(p.id); showToast(`${o.type === 'sl' ? '🛡️ 止损' : '🎯 止盈'} ${stock.name}`, o.type, 4000) }
      slOrders.value = slOrders.value.filter(x => x.id !== o.id)
    })
  }

  function checkLimitOrders() {
    const filled = []
    limitOrders.value.forEach(o => {
      const s = stocks.value.find(x => x.code === o.code)
      if (!s || s.price > o.price) return
      filled.push(o.id)
      positions.value.push({ id: Date.now() + Math.random(), code: o.code, direction: 'long', quantity: o.qty, leverage: 1, openPrice: o.price, isFutures: false, isLimit: true, fee: o.fee })
      history.value.push({ name: o.name, type: '限价成交', num: o.qty, price: o.price.toFixed(2), time: new Date().toLocaleTimeString(), leverage: 1, pl: null, fee: (o.fee || 0).toFixed(2) })
      showToast(`📋 限价单成交 ${o.name}`, 'tp', 3000)
    })
    if (filled.length) { limitOrders.value = limitOrders.value.filter(o => !filled.includes(o.id)); profitHistoryPush() }
  }

  // ──────────────── Limit Orders ────────────────
  function placeLimitOrder(code, name, price, qty) {
    const cost = qty * price
    const fee = +(cost * commissionRate.value).toFixed(2)
    if (cash.value < cost + fee) { showToast('资金不足（含手续费）', 'info'); return false }
    cash.value -= (cost + fee)
    limitOrders.value.push({ id: Date.now(), code, name, price, qty, cost, fee })
    return true
  }

  function cancelLimitOrder(id) {
    const o = limitOrders.value.find(x => x.id === id)
    if (o) cash.value += o.cost
    limitOrders.value = limitOrders.value.filter(x => x.id !== id)
  }

  // ──────────────── Loan ────────────────
  function applyLoan(amount) {
    loanBalance.value += amount
    cash.value += amount
    showToast(`贷款 ¥${fmtNum(amount)} 到账`, 'tp')
    profitHistoryPush()
  }

  function repayLoan(amount) {
    const pay = Math.min(amount, loanBalance.value, cash.value)
    if (pay <= 0) return
    cash.value -= pay
    loanBalance.value -= pay
    const intPay = Math.min(cash.value, loanInterest.value)
    if (intPay > 0) { cash.value -= intPay; loanInterest.value -= intPay }
    showToast(`还款 ¥${fmtNum(pay)} 成功`, 'tp')
  }

  // ──────────────── IPO ────────────────
  function applyIPO(qty) {
    if (!ipoActive.value || ipoPhase.value !== 'active') return
    const cost = qty * ipoActive.value.issuePrice
    if (cash.value < cost) { showToast('资金不足', 'info'); return }
    cash.value -= cost
    ipoFrozen.value += cost
    ipoAppeared.value += qty
    showToast(`已申购 ${ipoActive.value.name} ${qty}股`, 'info')
  }

  // ──────────────── Properties ────────────────
  function buyPropertyFull(id) {
    const prop = PROPERTIES.find(p => p.id === id)
    if (!prop || cash.value < prop.price) { showToast('现金不足', 'info'); return }
    cash.value -= prop.price
    ownedProperties.value[id] = { type: 'full', lastRentCycle: gameCycle.value }
    showToast(`全款购买${prop.name}成功！`, 'tp')
    profitHistoryPush()
  }

  function buyPropertyInstallment(id) {
    const prop = PROPERTIES.find(p => p.id === id)
    if (!prop || cash.value < prop.downPayment) { showToast('现金不足', 'info'); return }
    cash.value -= prop.downPayment
    ownedProperties.value[id] = { type: 'installment', paidPeriods: 0, overdueCount: 0, totalOwed: prop.price - prop.downPayment, lastRentCycle: gameCycle.value, nextPaymentCycle: gameCycle.value + 20 }
    showToast(`首付购买${prop.name}成功！开始分期`, 'tp')
    profitHistoryPush()
  }

  function buyVilla() {
    if (cash.value < 20000000) { showToast('需要¥2000万购买顶级别墅', 'info'); return }
    if (ownedProperties.value['villa']) { showToast('已拥有顶级别墅', 'info'); return }
    cash.value -= 20000000
    ownedProperties.value['villa'] = { owned: true }
    showToast('🏰 顶级别墅购买成功！已解锁贵宾服务', 'tp', 5000)
    profitHistoryPush()
  }

  function prepayProperty(id) {
    const owned = ownedProperties.value[id]
    const prop = PROPERTIES.find(p => p.id === id)
    if (!owned || owned.type !== 'installment' || !prop) return
    const totalPay = owned.totalOwed * 1.1
    if (cash.value < totalPay) { showToast('现金不足', 'info'); return }
    cash.value -= totalPay
    ownedProperties.value[id] = { type: 'full', lastRentCycle: gameCycle.value }
    showToast(`提前还款成功！支付 ¥${fmtNum(totalPay)}`, 'tp')
    profitHistoryPush()
  }

  // ──────────────── Funds ────────────────
  function buyFund(id, amount) {
    const f = FUNDS.find(x => x.id === id)
    if (!f || cash.value < amount) { showToast('现金不足', 'info'); return }
    if (amount < f.minInvest) { showToast(`最低投入 ¥${fmtNum(f.minInvest)}`, 'info'); return }
    cash.value -= amount
    if (!fundPositions.value[id]) fundPositions.value[id] = { invested: 0, cycles: 0 }
    fundPositions.value[id].invested += amount
    showToast(`投入成功 ¥${fmtNum(amount)}`, 'tp')
    profitHistoryPush()
  }

  function redeemFund(id) {
    const pos = fundPositions.value[id]
    if (!pos) return
    cash.value += pos.invested
    delete fundPositions.value[id]
    showToast(`赎回成功 ¥${fmtNum(pos.invested)}`, 'tp')
    profitHistoryPush()
  }

  function donateCharity(amount) {
    if (cash.value < amount || amount < 100) { showToast(amount < 100 ? '最低捐款¥100' : '现金不足', 'info'); return }
    cash.value -= amount
    charityTotal.value += amount
    showToast(`❤️ 感谢捐款 ¥${fmtNum(amount)}！`, 'tp')
    profitHistoryPush()
  }

  // ──────────────── Redeem ────────────────
  function redeemCode(code) {
    if (redeemedCodes.value[code]) return { ok: false, msg: '该兑换码已使用' }
    const reward = VALID_REDEEM_CODES[code]
    if (!reward) return { ok: false, msg: '无效兑换码' }
    cash.value += reward
    redeemedCodes.value[code] = true
    profitHistoryPush()
    return { ok: true, msg: `兑换成功！获得 ¥${fmtNum(reward)}` }
  }

  // ──────────────── Leaderboard ────────────────
  function updatePeakAndMilestones() {
    const cur = totalAsset.value
    if (cur > peakAsset.value) { peakAsset.value = cur; peakTime.value = new Date().toLocaleTimeString() }
    MILESTONE_VALUES.forEach(v => {
      if (cur >= v && !milestones.value.find(m => m.value === v)) {
        milestones.value.push({ value: v, time: new Date().toLocaleTimeString() })
        showToast(`🎉 资产突破 ¥${fmtNum(v)}！`, 'tp', 4000)
      }
    })
  }

  // ──────────────── Main price tick ────────────────
  function priceTick() {
    _marketTick++
    if (_marketTick % 20 === 0) {
      const r = Math.random()
      _marketMode = r < 0.2 ? 'bull' : r < 0.4 ? 'bear' : 'normal'
    }

    stocks.value.forEach(s => {
      const code = s.code
      const prev = candleData.value[code] || []
      const prevClose = prev.length > 0 ? prev.at(-1).close : s.price
      const co = companiesData.value.find(c => c.code === code)
      const macro = co ? SECTOR_MACRO[co.sector] : null
      const baseVolPct = macro?.volatility ? macro.volatility * 100 : (co?.isCrypto ? 8 : ['HK001','HK002'].includes(code) ? 2.5 : ['US001','US002'].includes(code) ? 3.0 : 2.0)
      const moodBias = co ? (co.aiMood === 'bull' ? 0.003 : co.aiMood === 'bear' ? -0.003 : 0) : 0
      const trendBias = macro ? macro.trend * 0.15 : 0

      // Volume
      const baseVol = getBaseVol(code)
      const mktVM = _marketMode === 'bull' ? 1.35 : _marketMode === 'bear' ? 1.20 : 0.85
      const moodVM = co ? (co.aiMood === 'bull' ? 1.25 : co.aiMood === 'bear' ? 1.15 : 1.0) : 1.0
      const hasImpulse = newsImpulseQueue.value[code]?.some(e => e.ticks > 0)
      const newsVM = hasImpulse ? (1.8 + Math.random() * 1.2) : 1.0
      const thisVol = Math.floor(baseVol * (0.4 + Math.random() * 1.4) * mktVM * moodVM * newsVM)

      const recentVols = prev.slice(-VOL_WINDOW).map(c => c.volume || baseVol)
      const avgVol = recentVols.reduce((a, b) => a + b, 0) / Math.max(recentVols.length, 1)
      const volRatio = thisVol / Math.max(avgVol, 1)
      volRatioMap.value[code] = volRatio
      stockVolume.value[code] = thisVol

      // Price change
      const adjVolPct = baseVolPct * volRatioToMult(volRatio)
      const chgPct = (Math.random() * adjVolPct + 0.05) / 100 + trendBias + moodBias * (Math.random() > 0.5 ? 1 : -1)
      const dir = (Math.random() + moodBias * 10) > 0.5 ? 1 : -1
      let fc = Math.max(0.2, prevClose * (1 + dir * chgPct))

      // Fundamental gravity
      fc = _gravity(code, fc)
      // Momentum
      fc = _momentum(code, fc, prevClose)

      // News impulse
      if (newsImpulseQueue.value[code]?.length) {
        newsImpulseQueue.value[code] = newsImpulseQueue.value[code].filter(e => {
          if (e.ticks <= 0) return false
          fc = Math.max(0.2, fc * (1 + e.impact))
          e.ticks--
          return e.ticks > 0
        })
      }

      const wm = Math.min(0.025, 0.005 + volRatio * 0.006)
      const newCandle = {
        time: new Date().toLocaleTimeString(),
        open:   +prevClose.toFixed(2),
        high:   +Math.max(prevClose, fc, fc * (1 + Math.random() * wm)).toFixed(2),
        low:    +Math.max(0.2, Math.min(prevClose, fc, fc * (1 - Math.random() * wm))).toFixed(2),
        close:  +fc.toFixed(2),
        volume: thisVol,
      }
      s.price = newCandle.close
      candleData.value[code] = [...prev, newCandle].slice(-MAX_CANDLES)
    })

    const cur = getCurrentStock()
    if (cur) posHistory.value = [...posHistory.value, cur.price].slice(-20)
    profitHistory.value = [...profitHistory.value, Math.round(totalAsset.value)].slice(-720)

    checkLiquidation()
    checkSLOrders()
    checkLimitOrders()
    updatePeakAndMilestones()
    _tickFunds()
    _tickProperties()
    _tickLoanInterest()
    _tickIPO()
  }

  // ── Price model ──
  function _gravity(code, price) {
    const co = companiesData.value.find(c => c.code === code)
    if (!co || co.isCrypto) return price
    const eps = co.profit / (STOCK_FLOAT_SHARES[code] || 1e6)
    if (eps <= 0) return price
    const sectorPE = { '能源化工':12,'战略资源':18,'公用事业':14,'科技创新':35,'民生消费':20,'互联网':28,'新能源汽车':30,'消费电子':22,'AI芯片':45 }
    const fv = eps * (sectorPE[co.sector] || 20)
    const ratio = price / fv
    let g = 0
    if (ratio > 1.5)      g = -(ratio - 1.5) * 0.0008
    else if (ratio < 0.5) g =  (0.5 - ratio) * 0.0008
    return Math.max(0.5, price * (1 + g))
  }

  function _momentum(code, newPrice, prevPrice) {
    if (!priceVelocity.value[code]) priceVelocity.value[code] = 0
    const raw = (newPrice - prevPrice) / Math.max(prevPrice, 0.01)
    priceVelocity.value[code] = Math.max(-0.05, Math.min(0.05, priceVelocity.value[code] * 0.7 + raw * 0.3))
    return Math.max(0.5, newPrice * (1 + priceVelocity.value[code] * 0.15))
  }

  // ── Sub-ticks ──
  function _tickFunds() {
    _fundTick++
    if (_fundTick % 7 !== 0) return
    Object.entries(fundPositions.value).forEach(([id, pos]) => {
      if (!pos || pos.invested <= 0) return
      const f = FUNDS.find(x => x.id === id)
      if (!f || f.type !== 'commercial' || f.rate <= 0) return
      pos.invested += pos.invested * (f.rate + (hasVilla.value ? 0.03 : 0))
    })
  }

  function _tickProperties() {
    gameCycle.value++
    Object.entries(ownedProperties.value).forEach(([id, owned]) => {
      const prop = PROPERTIES.find(p => p.id === id)
      if (!prop || id === 'villa') return
      if (gameCycle.value >= owned.lastRentCycle + 10) {
        cash.value += prop.rent
        owned.lastRentCycle = gameCycle.value
      }
      if (owned.type === 'installment' && gameCycle.value >= (owned.nextPaymentCycle || 0)) {
        if (cash.value >= prop.monthly) {
          cash.value -= prop.monthly
          owned.paidPeriods++
          owned.totalOwed -= prop.monthly
          owned.overdueCount = 0
          owned.nextPaymentCycle = gameCycle.value + 20
          if (owned.paidPeriods >= prop.periods || owned.totalOwed <= 0) {
            ownedProperties.value[id] = { type: 'full', lastRentCycle: gameCycle.value }
          }
        } else {
          owned.totalOwed += prop.monthly * 0.05
          owned.overdueCount = (owned.overdueCount || 0) + 1
          owned.nextPaymentCycle = gameCycle.value + 20
          showToast(`逾期罚息！${prop.name}（第${owned.overdueCount}次）`, 'sl', 3000)
          if (owned.overdueCount >= 3) { delete ownedProperties.value[id]; showToast(`😢 ${prop.name} 因逾期被收回`, 'liq', 5000) }
        }
      }
    })
  }

  function _tickLoanInterest() {
    if (loanBalance.value <= 0) return
    _loanTick++
    if (_loanTick % 4 !== 0) return
    loanInterest.value += loanBalance.value * 0.0000027778 // ≈12%/year per 12s
  }

  function _tickIPO() {
    _ipoTick++
    if (ipoPhase.value === 'cooldown') {
      ipoNextIn.value = Math.max(0, ipoNextIn.value - 3)
      if (ipoNextIn.value <= 0) _launchIPO()
    } else if (ipoPhase.value === 'active' && ipoActive.value) {
      ipoActive.value.countdown = Math.max(0, ipoActive.value.countdown - 3)
      ipoActive.value.applicants += Math.floor(Math.random() * 5)
      if (ipoActive.value.countdown <= 0) _settleIPO()
    }
  }

  function _launchIPO() {
    const avail = IPO_NAMES.filter(n => !_ipoUsedNames.has(n))
    if (!avail.length) { ipoNextIn.value = 300; return }
    const name = avail[Math.floor(Math.random() * avail.length)]
    _ipoUsedNames.add(name)
    const issuePrice = +(5 + Math.random() * 20).toFixed(2)
    ipoActive.value = { code: 'IPO' + Date.now(), name, issuePrice, totalShares: 500000, countdown: 60, applicants: 0 }
    ipoPhase.value = 'active'
    ipoAppeared.value = 0
    ipoFrozen.value = 0
    showToast(`🚀 新股 ${name} 开始申购！发行价 ¥${issuePrice}`, 'news', 4000)
  }

  function _settleIPO() {
    if (!ipoActive.value) return
    const ipo = ipoActive.value
    const overRatio = Math.max(1, ipo.applicants / (ipo.totalShares / 100))
    const allotQty = ipoAppeared.value > 0 ? Math.floor(ipoAppeared.value / overRatio) : 0
    if (ipoFrozen.value > 0) cash.value += ipoFrozen.value
    if (allotQty > 0) {
      const cost = allotQty * ipo.issuePrice
      cash.value -= cost
      const listPrice = +(ipo.issuePrice * (1.2 + Math.random() * 0.8)).toFixed(2)
      stocks.value.push({ code: ipo.code, name: ipo.name, desc: 'IPO新股', price: listPrice, basePrice: ipo.issuePrice, market: 'A股', isIPO: true })
      candleData.value[ipo.code] = generateInitialCandles(listPrice)
      stockVolume.value[ipo.code] = 500000
      newsImpulseQueue.value[ipo.code] = []
      positions.value.push({ id: Date.now(), code: ipo.code, direction: 'long', quantity: allotQty, leverage: 1, openPrice: ipo.issuePrice, isFutures: false })
      ipoHistory.value.unshift({ name: ipo.name, qty: allotQty, issuePrice: ipo.issuePrice, listPrice, time: new Date().toLocaleTimeString(), result: '中签' })
      showToast(`🎉 ${ipo.name} 中签 ${allotQty}股 上市价¥${listPrice}`, 'tp', 5000)
    } else {
      ipoHistory.value.unshift({ name: ipo.name, qty: 0, issuePrice: ipo.issuePrice, time: new Date().toLocaleTimeString(), result: '未中签' })
    }
    ipoActive.value = null; ipoPhase.value = 'cooldown'; ipoNextIn.value = 300; ipoAppeared.value = 0; ipoFrozen.value = 0
  }

  // ──────────────── profitHistoryPush ────────────────
  function profitHistoryPush() {
    profitHistory.value = [...profitHistory.value, Math.round(totalAsset.value)].slice(-720)
  }

  // ──────────────── Save/Load ────────────────
  function getSaveData() {
    return JSON.stringify({ saveTime: new Date().toLocaleString(), cash: cash.value, positions: positions.value, history: history.value.slice(-200), profitHistory: profitHistory.value, candleData: candleData.value, ownedProperties: ownedProperties.value, fundPositions: fundPositions.value, charityTotal: charityTotal.value, loanBalance: loanBalance.value, loanInterest: loanInterest.value, limitOrders: limitOrders.value, slOrders: slOrders.value, redeemedCodes: redeemedCodes.value, stocks: stocks.value.map(s => ({ code: s.code, price: s.price, basePrice: s.basePrice, isIPO: s.isIPO })) })
  }

  function saveGame() {
    try { localStorage.setItem(SAVE_KEY, getSaveData()); showToast('存档已保存', 'tp') } catch { showToast('存档失败', 'info') }
  }

  function resetGame() {
    try { localStorage.removeItem(SAVE_KEY) } catch { }
    location.reload()
  }

  function importSave(raw) {
    try {
      const d = JSON.parse(raw)
      if (!d || d.cash === undefined) return false
      _applyLoad(d)
      localStorage.setItem(SAVE_KEY, raw)
      return true
    } catch { return false }
  }

  function _loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (!d || d.cash === undefined) return
      _applyLoad(d)
    } catch { }
  }

  function _applyLoad(d) {
    if (d.cash !== undefined) cash.value = d.cash
    if (d.positions) positions.value = d.positions
    if (d.history) history.value = d.history
    if (d.profitHistory) profitHistory.value = d.profitHistory
    if (d.candleData) {
      Object.assign(candleData.value, d.candleData)
      stocks.value.forEach(s => { if (d.candleData[s.code]?.length) s.price = d.candleData[s.code].at(-1).close })
    }
    if (d.ownedProperties) ownedProperties.value = d.ownedProperties
    if (d.fundPositions) fundPositions.value = d.fundPositions
    if (d.charityTotal) charityTotal.value = d.charityTotal
    if (d.loanBalance) loanBalance.value = d.loanBalance
    if (d.loanInterest) loanInterest.value = d.loanInterest
    if (d.limitOrders) limitOrders.value = d.limitOrders
    if (d.slOrders) slOrders.value = d.slOrders
    if (d.redeemedCodes) redeemedCodes.value = d.redeemedCodes
    if (d.stocks) {
      d.stocks.forEach(ds => {
        const s = stocks.value.find(x => x.code === ds.code)
        if (s) { s.price = ds.price; s.basePrice = ds.basePrice }
        else if (ds.isIPO) stocks.value.push({ code: ds.code, name: ds.name || ds.code, desc: 'IPO', price: ds.price, basePrice: ds.basePrice, market: 'A股', isIPO: true })
      })
    }
    stocks.value.forEach(s => { s.basePrice = s.price })
  }

  return {
    cash, currentCode, stocks, positions, history, profitHistory,
    candleData, posHistory, useShortCandle, liquidationBadgeCount, gameSpeed,
    currentDir, currentLeverage, leverageIndex, currentTab, currentIndicator, marketFilter,
    stockVolume, volRatioMap, limitOrders, slOrders,
    ipoActive, ipoHistory, ipoPhase, ipoNextIn, ipoAppeared, ipoFrozen,
    loanBalance, loanInterest,
    ownedProperties, fundPositions, charityTotal, gameCycle,
    peakAsset, peakTime, milestones,
    companiesData, companyDynamic, newsHistory, newsImpulseQueue,
    redeemedCodes, toasts,
    currentStock, floatingPL, fundValue, totalAsset, hasVilla,
    commissionRate, maxFutureLeverage, currentCandles, filteredStocks,
    LEVERAGE_VALUES,
    init, priceTick, getCurrentStock, getHoldingQty, getHoldingAvgPrice,
    openPosition, closePosition, oneClickSellSpot, oneClickCloseFutures,
    placeLimitOrder, cancelLimitOrder,
    applyLoan, repayLoan, applyIPO,
    buyPropertyFull, buyPropertyInstallment, buyVilla, prepayProperty,
    buyFund, redeemFund, donateCharity,
    redeemCode, updatePeakAndMilestones, profitHistoryPush, showToast,
    getSaveData, saveGame, resetGame, importSave,
  }
})
