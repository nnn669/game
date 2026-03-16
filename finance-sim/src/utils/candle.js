import { STOCK_BASE_VOL, STOCK_LIST } from '../data/stocks.js'

export const VOL_WINDOW = 10

/**
 * 获取基准成交量
 */
export function getBaseVol(code, stocks) {
  if (STOCK_BASE_VOL[code]) return STOCK_BASE_VOL[code]
  const s = stocks.find(x => x.code === code)
  return s && s.isIPO ? 300000 : 1000000
}

/**
 * 量比 → 波动率倍数映射
 */
export function volRatioToMult(ratio) {
  if (ratio <= 0)   return 0.5
  if (ratio < 0.5)  return 0.35 + ratio * 0.5
  if (ratio < 0.8)  return 0.60 + (ratio - 0.5) * 0.67
  if (ratio <= 1.5) return 0.80 + (ratio - 0.8) * 0.4
  if (ratio <= 3.0) return 1.08 + (ratio - 1.5) * 0.65
  return Math.min(3.5, 2.06 + (ratio - 3.0) * 0.3)
}

/**
 * 为单只股票生成初始K线（10根）
 */
export function generateInitialCandles(basePrice, baseVol) {
  const candles = []
  const now = new Date()
  let prevClose = basePrice
  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5000)
    const timeStr = time.toLocaleTimeString()
    const changePercent = (Math.random() * 4.9 + 0.1) / 100
    const direction = Math.random() > 0.5 ? 1 : -1
    const close = prevClose * (1 + direction * changePercent)
    const finalClose = Math.max(0.2, close)
    const high = Math.max(prevClose, finalClose) * (1 + Math.random() * 0.01)
    const low  = Math.min(prevClose, finalClose) * (1 - Math.random() * 0.01)
    candles.push({
      time: timeStr,
      open:   +prevClose.toFixed(2),
      high:   +high.toFixed(2),
      low:    +Math.max(0.2, low).toFixed(2),
      close:  +finalClose.toFixed(2),
      volume: Math.floor(baseVol * (0.5 + Math.random() * 1.0)),
    })
    prevClose = finalClose
  }
  return candles
}

/**
 * 生成一根新K线（价格 + 量价联动）
 */
export function generateNewCandle({
  prevCandles, baseVol, baseVolPct, moodBias, trendBias,
  marketMode, newsImpulse, prevClose,
}) {
  // 成交量
  const mktVolMult  = marketMode === 'bull' ? 1.35 : marketMode === 'bear' ? 1.20 : 0.85
  const moodVolMult = moodBias > 0 ? 1.25 : moodBias < 0 ? 1.15 : 1.0
  const newsVolMult = newsImpulse ? (1.8 + Math.random() * 1.2) : 1.0
  const randVolMult = 0.4 + Math.random() * 1.4
  const thisVol = Math.floor(baseVol * randVolMult * mktVolMult * moodVolMult * newsVolMult)

  // 量比
  const recentVols = prevCandles.slice(-VOL_WINDOW).map(c => c.volume || baseVol).filter(v => v > 0)
  const avgVol = recentVols.length > 0 ? recentVols.reduce((a, b) => a + b, 0) / recentVols.length : baseVol
  const volRatio = thisVol / avgVol
  const volMult = volRatioToMult(volRatio)

  // 价格
  const adjVolPct = baseVolPct * volMult
  const changePercent = (Math.random() * adjVolPct + 0.05) / 100 + trendBias + moodBias * (Math.random() > 0.5 ? 1 : -1)
  const direction = (Math.random() + moodBias * 10) > 0.5 ? 1 : -1
  const newPrice = prevClose * (1 + direction * changePercent)
  const finalClose = Math.max(0.2, newPrice)

  // 影线
  const wickMult = Math.min(0.025, 0.005 + volRatio * 0.006)
  const high = Math.max(prevClose, finalClose) * (1 + Math.random() * wickMult)
  const low  = Math.min(prevClose, finalClose) * (1 - Math.random() * wickMult)

  return {
    time:   new Date().toLocaleTimeString(),
    open:   +prevClose.toFixed(2),
    high:   +high.toFixed(2),
    low:    +Math.max(0.2, low).toFixed(2),
    close:  +finalClose.toFixed(2),
    volume: thisVol,
    volRatio,
  }
}

// ===== 技术指标 =====

export function calcMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null
    const sum = data.slice(i - period + 1, i + 1).reduce((a, c) => a + c.close, 0)
    return +(sum / period).toFixed(3)
  })
}

export function calcRSI(data, period = 14) {
  const result = new Array(data.length).fill(null)
  if (data.length < period + 1) return result
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff > 0) gains += diff; else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  result[period] = avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2)
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close
    avgGain = (avgGain * (period - 1) + Math.max(0, diff)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period
    result[i] = avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2)
  }
  return result
}

export function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const closes = data.map(d => d.close)
  const emaFast = calcEMA(closes, fast)
  const emaSlw  = calcEMA(closes, slow)
  const macdLine = closes.map((_, i) =>
    emaFast[i] !== null && emaSlw[i] !== null ? +(emaFast[i] - emaSlw[i]).toFixed(4) : null
  )
  const macdVals = macdLine.filter(v => v !== null)
  const signalLine = new Array(macdLine.length).fill(null)
  let sigIdx = 0
  macdLine.forEach((v, i) => { if (v !== null) { signalLine[i] = calcEMASingle(macdVals, sigIdx++, signal) } })
  const hist = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? +(v - signalLine[i]).toFixed(4) : null
  )
  return { macdLine, signal: signalLine, hist }
}

function calcEMA(values, period) {
  const k = 2 / (period + 1)
  const result = new Array(values.length).fill(null)
  let sum = 0, count = 0
  for (let i = 0; i < values.length; i++) {
    if (count < period) {
      sum += values[i]; count++
      if (count === period) result[i] = +(sum / period).toFixed(4)
    } else {
      result[i] = +((values[i] - result[i - 1]) * k + result[i - 1]).toFixed(4)
    }
  }
  return result
}

function calcEMASingle(values, idx, period) {
  if (values.length === 0) return null
  const k = 2 / (period + 1)
  let ema = values[0]
  for (let i = 1; i <= idx && i < values.length; i++) {
    ema = (values[i] - ema) * k + ema
  }
  return +ema.toFixed(4)
}

/**
 * 基本面引力（公允价值锚定）
 */
export function applyFundamentalGravity(code, currentPrice, companies, sectorPE, stockFloatShares) {
  const co = companies.find(c => c.code === code)
  if (!co || co.isCrypto) return currentPrice
  const floatSh = stockFloatShares[code] || 1000000
  const eps = co.profit / floatSh
  if (eps <= 0) return currentPrice
  const benchPE = sectorPE[co.sector] || 20
  const fv = eps * benchPE
  if (!fv || fv <= 0) return currentPrice
  const ratio = currentPrice / fv
  let gravity = 0
  if (ratio > 1.5)      gravity = -(ratio - 1.5) * 0.0008
  else if (ratio < 0.5) gravity = (0.5 - ratio)  * 0.0008
  return Math.max(0.5, currentPrice * (1 + gravity))
}

/**
 * 动量叠加（EMA momentum）
 */
export function applyMomentum(code, newPrice, prevPrice, priceVelocity) {
  if (!priceVelocity[code]) priceVelocity[code] = 0
  const rawChange = (newPrice - prevPrice) / Math.max(prevPrice, 0.01)
  priceVelocity[code] = priceVelocity[code] * 0.7 + rawChange * 0.3
  priceVelocity[code] = Math.max(-0.05, Math.min(0.05, priceVelocity[code]))
  return Math.max(0.5, newPrice * (1 + priceVelocity[code] * 0.15))
}
