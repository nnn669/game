/**
 * 生成初始K线数据
 */
export function generateInitialCandles(basePrice, baseVol = 1000000) {
  const candles = []
  const now = new Date()
  let prevClose = basePrice
  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5000)
    const timeStr = time.toLocaleTimeString()
    const changePercent = (Math.random() * 4.9 + 0.1) / 100
    const direction = Math.random() > 0.5 ? 1 : -1
    const close = Math.max(0.2, prevClose * (1 + direction * changePercent))
    const high = Math.max(prevClose, close) * (1 + Math.random() * 0.01)
    const low  = Math.min(prevClose, close) * (1 - Math.random() * 0.01)
    candles.push({
      time: timeStr,
      open:   +prevClose.toFixed(2),
      high:   +high.toFixed(2),
      low:    +Math.max(0.2, low).toFixed(2),
      close:  +close.toFixed(2),
      volume: Math.floor(baseVol * (0.5 + Math.random() * 1.0)),
    })
    prevClose = close
  }
  return candles
}

/**
 * 量比 → 波动率倍数
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
 * 计算 SMA（简单移动平均）
 * @param {number[]} closes
 * @param {number} period
 * @returns {(number|null)[]}
 */
export function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

/**
 * 计算 EMA
 */
export function calcEMA(closes, period) {
  const k = 2 / (period + 1)
  const result = []
  let ema = null
  for (let i = 0; i < closes.length; i++) {
    if (ema === null) {
      if (i < period - 1) { result.push(null); continue }
      ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
    } else {
      ema = closes[i] * k + ema * (1 - k)
    }
    result.push(+ema.toFixed(4))
  }
  return result
}

/**
 * 计算 RSI(14)
 */
export function calcRSI(closes, period = 14) {
  const result = Array(closes.length).fill(null)
  if (closes.length < period + 1) return result
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) avgGain += d; else avgLoss -= d
  }
  avgGain /= period; avgLoss /= period
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    const gain = d > 0 ? d : 0
    const loss = d < 0 ? -d : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

/**
 * 计算 MACD(12, 26, 9)
 */
export function calcMACD(candles) {
  const closes = candles.map(c => c.close)
  const ema12 = calcEMA(closes, 12)
  const ema26 = calcEMA(closes, 26)
  const macdLine = ema12.map((v, i) => (v !== null && ema26[i] !== null) ? +(v - ema26[i]).toFixed(4) : null)
  // Signal: EMA9 of macdLine (skip nulls)
  const signal = Array(macdLine.length).fill(null)
  const validStart = macdLine.findIndex(v => v !== null)
  if (validStart >= 0) {
    const k = 2 / 10
    let ema = null
    let count = 0
    for (let i = validStart; i < macdLine.length; i++) {
      if (ema === null) {
        if (count < 8) { count++; continue }
        ema = macdLine.slice(validStart, validStart + 9).reduce((a, b) => a + b, 0) / 9
        signal[validStart + 8] = +ema.toFixed(4)
      } else {
        ema = macdLine[i] * k + ema * (1 - k)
        signal[i] = +ema.toFixed(4)
      }
    }
  }
  const hist = macdLine.map((v, i) => (v !== null && signal[i] !== null) ? +(v - signal[i]).toFixed(4) : null)
  return { macdLine, signal, hist }
}

/**
 * 生成平滑SVG路径（Cardinal Spline）
 */
export function getSmoothPath(points, tension = 0.5) {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : p2
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}
