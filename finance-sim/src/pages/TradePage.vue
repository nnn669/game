<template>
  <div class="trade-container">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="price-row">
        <span class="stock-name">{{ stock?.name }}</span>
        <span class="current-price" :class="priceClass">{{ fmtPrice(stock?.price || 0) }}</span>
        <span id="vol-badge" :style="{ background: volBadge.bg, color: volBadge.color }">{{ volBadge.label }}</span>
        <div class="time-toggle" :class="{ active: game.useShortCandle }" @click="game.useShortCandle = !game.useShortCandle">2m</div>
        <span class="change" :class="priceClass">{{ changeStr }}</span>
      </div>
    </div>

    <!-- K-Line Chart -->
    <div class="chart-area" style="position:relative;">
      <CandleChart />
    </div>

    <!-- Trade Panels -->
    <div class="trade-area">
      <div class="trade-left">
        <!-- Tab Switch -->
        <div style="display:flex;gap:0;margin-bottom:12px;background:#f7f8fa;border-radius:10px;padding:3px;">
          <div v-for="tab in orderTabs" :key="tab.id"
            :class="['order-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id">{{ tab.label }}</div>
        </div>

        <!-- Panel: Spot (现价单) -->
        <div v-show="activeTab === 'market'" class="order-panel">
          <div class="available-funds">可用资金: <span>{{ fmtNum(game.cash) }}</span></div>
          <div class="available-funds" style="margin-top:2px;">
            持有: <span>{{ holdingQty }}</span> 股 &nbsp;|&nbsp; 均价: <span>{{ spotAvgPrice ? ('¥' + spotAvgPrice.toFixed(2)) : '--' }}</span>
          </div>
          <div class="quantity-row" style="margin-top:8px;">
            <div class="input-card" style="flex:1;">
              <input type="number" class="quantity-input" v-model.number="spotQty" min="1" inputmode="numeric" />
            </div>
          </div>
          <div class="quick-buttons">
            <button v-for="p in [25,50,75,100]" :key="p"
              :class="['quick-btn', { active: spotPct === p }]" :data-percent="p"
              @click="setSpotPct(p)">{{ p }}%</button>
          </div>
          <div class="margin-info">
            预计花费 <span>{{ fmtNum((stock?.price || 0) * spotQty) }}</span> / 共 <span>{{ spotQty }}</span> 股
          </div>
          <button class="open-btn buy" style="width:100%;margin-top:6px;" @click="doBuy">买入</button>
          <button class="open-btn sell" style="width:100%;margin-top:6px;" @click="doSellAll">一键清仓（当前股票）</button>
        </div>

        <!-- Panel: Limit Order (限价单) -->
        <div v-show="activeTab === 'limit'" class="order-panel">
          <div style="font-size:clamp(11px,2.8vw,13px);color:#888;margin-bottom:4px;">
            触发价格 <span style="color:#4285f4;">（点击输入框自动填入当前价）</span>
          </div>
          <input type="number" v-model.number="lmtPrice" @click="lmtPrice = stock?.price || 0"
            placeholder="点击自动填入当前价" readonly
            style="width:100%;padding:10px;border-radius:8px;border:2px solid #4285f4;background:#f0f4ff;font-size:clamp(13px,3.5vw,15px);outline:none;margin-bottom:10px;cursor:pointer;" />
          <div class="quantity-row" style="margin-bottom:6px;">
            <div class="input-card" style="flex:1;">
              <input type="number" class="quantity-input" v-model.number="lmtQty" min="1" inputmode="numeric" />
            </div>
          </div>
          <div class="quick-buttons" style="margin-bottom:10px;">
            <button v-for="p in [25,50,75,100]" :key="p"
              :class="['quick-btn', { active: lmtPct === p }]" :data-percent="p"
              @click="setLmtPct(p)">{{ p }}%</button>
          </div>
          <div class="available-funds" style="margin-bottom:8px;">可用资金: {{ fmtNum(game.cash) }}</div>
          <button class="open-btn" style="width:100%;background:#4285f4;margin-bottom:12px;" @click="placeLimit">挂单买入</button>
          <div style="font-size:clamp(12px,3.2vw,14px);font-weight:600;margin-bottom:8px;">当前挂单</div>
          <div v-if="!game.limitOrders.length" style="font-size:13px;color:#999;text-align:center;padding:6px;">暂无挂单</div>
          <div v-for="o in game.limitOrders" :key="o.id"
            style="display:flex;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:13px;">
            <span style="background:#4285f4;color:#fff;border-radius:4px;padding:1px 5px;font-size:11px;">限价买</span>
            <span style="font-weight:600;">{{ o.name }} x{{ o.qty }}</span>
            <span style="color:#4285f4;font-weight:600;">@{{ o.price }}</span>
            <button @click="game.cancelLimitOrder(o.id)" style="margin-left:auto;background:none;border:none;color:#ff5252;cursor:pointer;">撤单</button>
          </div>
        </div>

        <!-- Panel: Futures (期货合约) -->
        <div v-show="activeTab === 'futures'" class="order-panel">
          <div class="direction-buttons">
            <button :class="['dir-btn', { active: futDir === 'long', long: futDir === 'long' }]" @click="futDir = 'long'">做多合约</button>
            <button :class="['dir-btn', { active: futDir === 'short', short: futDir === 'short' }]" @click="futDir = 'short'">做空合约</button>
          </div>
          <div class="quantity-row" style="margin-top:8px;">
            <div class="input-card" style="flex:3;">
              <input type="number" class="quantity-input" v-model.number="futQty" min="1" inputmode="numeric" />
            </div>
            <div class="leverage-card" style="flex:1;">
              <div class="leverage-btn" @click="cycleLeverage">{{ futLeverage }}x</div>
              <div class="leverage-label">杠杆</div>
            </div>
          </div>
          <div class="quick-buttons" style="margin:8px 0;">
            <button v-for="p in [25,50,75,100]" :key="p"
              :class="['quick-btn', { active: futPct === p }]" :data-percent="p"
              @click="setFutPct(p)">{{ p }}%</button>
          </div>
          <div class="available-funds">可用资金: {{ fmtNum(game.cash) }}</div>
          <div v-if="futMargin > 0" class="margin-info">
            保证金: <b>{{ fmtNum(futMargin) }}</b>
            &nbsp;·&nbsp; 爆仓价: <b style="color:#ff5252;">{{ futLiqPrice.toFixed(2) }}</b>
          </div>
          <button class="open-btn" style="width:100%;margin-top:4px;"
            :style="{ background: futDir === 'long' ? '#00c48c' : '#ff5252' }"
            @click="doOpenFutures">
            {{ futDir === 'long' ? '开多合约' : '开空合约' }}
          </button>
          <button class="open-btn" style="width:100%;background:#ff5252;margin-top:6px;" @click="game.closeAllFutures()">一键平仓（全部期货）</button>
          <!-- Active futures list -->
          <div v-if="futuresPositions.length" style="margin-top:12px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;color:#555;">当前持仓</div>
            <div v-for="p in futuresPositions" :key="p.id"
              style="background:#f7f8fa;border-radius:10px;padding:10px;margin-bottom:6px;font-size:12px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-weight:700;">{{ getStockName(p.code) }}</span>
                <span :style="{ color: posPL(p) >= 0 ? '#00c48c' : '#ff5252', fontWeight: 700 }">
                  {{ posPL(p) >= 0 ? '+' : '' }}{{ fmtNum(posPL(p)) }}
                </span>
              </div>
              <div style="display:flex;gap:8px;color:#888;">
                <span>{{ p.direction === 'long' ? '多' : '空' }} {{ p.leverage }}x</span>
                <span>数量: {{ p.quantity }}</span>
                <span>开仓: ¥{{ p.openPrice }}</span>
              </div>
              <button @click="game.closeFutures(p.id)"
                style="width:100%;margin-top:6px;padding:7px;border-radius:8px;border:none;background:#222;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">
                平仓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../store/game.js'
import { fmtNum, fmtPrice } from '../utils/format.js'
import { volRatioLabel } from '../utils/trade.js'
import CandleChart from '../components/CandleChart.vue'

const game = useGameStore()
const activeTab = ref('market')
const orderTabs = [
  { id: 'market',  label: '现价单' },
  { id: 'limit',   label: '限价单' },
  { id: 'futures', label: '期货合约' },
]

// Spot panel
const spotQty  = ref(1)
const spotPct  = ref(0)

// Limit panel
const lmtPrice = ref(0)
const lmtQty   = ref(1)
const lmtPct   = ref(0)

// Futures panel
const futDir      = ref('long')
const futQty      = ref(1)
const futPct      = ref(0)
const leveragePool = computed(() => {
  const max = game.maxFuturesLeverage
  return [1, 2, 5, 10, ...(max >= 20 ? [20] : []), ...(max >= 50 ? [50] : [])]
})
const futLevIdx   = ref(0)
const futLeverage = computed(() => leveragePool.value[futLevIdx.value] || 1)

function cycleLeverage() {
  futLevIdx.value = (futLevIdx.value + 1) % leveragePool.value.length
}

const stock = computed(() => game.currentStock)

const changeStr = computed(() => {
  const s = stock.value
  if (!s) return '0.00%'
  const candles = game.candleData[s.code]
  const prev = candles?.length >= 2 ? candles[candles.length - 2].close : s.basePrice
  const c = ((s.price - prev) / prev * 100).toFixed(2)
  return (parseFloat(c) >= 0 ? '+' : '') + c + '%'
})
const priceClass = computed(() => {
  const s = stock.value; if (!s) return ''
  return s.price >= s.basePrice ? 'up' : 'down'
})

const volBadge = computed(() => {
  const vr = game.volRatioMap[game.currentCode] || 1
  return volRatioLabel(vr)
})

const holdingQty  = computed(() => game.getHoldingQty(game.currentCode))
const spotAvgPrice = computed(() => game.getSpotAvgPrice(game.currentCode))

const futMargin = computed(() => {
  if (!stock.value || !futQty.value) return 0
  return stock.value.price * futQty.value / futLeverage.value
})
const futLiqPrice = computed(() => {
  if (!stock.value || !futLeverage.value) return 0
  return futDir.value === 'long'
    ? stock.value.price * (1 - 1 / futLeverage.value)
    : stock.value.price * (1 + 1 / futLeverage.value)
})

const futuresPositions = computed(() => game.positions.filter(p => p.isFutures))

function posPL(p) {
  const s = game.stocks.find(x => x.code === p.code)
  if (!s) return 0
  return p.direction === 'long' ? (s.price - p.openPrice) * p.quantity : (p.openPrice - s.price) * p.quantity
}

function getStockName(code) {
  return game.stocks.find(s => s.code === code)?.name || code
}

function setSpotPct(p) {
  spotPct.value = p
  const s = stock.value; if (!s) return
  const max = Math.floor(game.cash / s.price)
  spotQty.value = Math.max(1, Math.floor(max * p / 100))
}

function setLmtPct(p) {
  lmtPct.value = p
  const s = stock.value; if (!s) return
  const max = Math.floor(game.cash / (s.price * 1.01))
  lmtQty.value = Math.max(1, Math.floor(max * p / 100))
}

function setFutPct(p) {
  futPct.value = p
  const s = stock.value; if (!s || !futLeverage.value) return
  const maxMargin = game.cash * p / 100
  futQty.value = Math.max(1, Math.floor(maxMargin * futLeverage.value / s.price))
}

function doBuy() {
  const r = game.buySpot(game.currentCode, spotQty.value)
  if (!r.ok) game.showToast(r.msg, 'sl', 3000)
}

function doSellAll() {
  game.sellAllSpot(game.currentCode)
}

function placeLimit() {
  const r = game.placeLimitOrder(game.currentCode, lmtPrice.value, lmtQty.value)
  if (!r.ok) game.showToast(r.msg, 'sl', 3000)
  else game.showToast(`挂单成功: ${stock.value?.name} x${lmtQty.value} @¥${lmtPrice.value}`, 'tp', 2000)
}

function doOpenFutures() {
  const r = game.openFutures(game.currentCode, futDir.value, futQty.value, futLeverage.value)
  if (!r.ok) game.showToast(r.msg, 'sl', 3000)
}
</script>

<style scoped>
.order-panel { animation: fadeIn .15s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
