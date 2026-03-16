/**
 * 格式化数字，大数自动转为万/亿单位
 * @param {number} num
 * @returns {string}
 */
export function fmtNum(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + '兆'
  if (abs >= 1e8)  return sign + (abs / 1e8).toFixed(2)  + '亿'
  if (abs >= 1e4)  return sign + (abs / 1e4).toFixed(2)  + '万'
  return sign + abs.toFixed(2)
}

/**
 * 格式化股价（大价格用万）
 */
export function fmtPrice(price) {
  if (price >= 10000) return (price / 10000).toFixed(2) + '万'
  if (price >= 1000)  return price.toFixed(1)
  return price.toFixed(2)
}

/**
 * 格式化成交量
 */
export function fmtVol(vol) {
  if (vol >= 1e8) return (vol / 1e8).toFixed(1) + '亿'
  if (vol >= 1e4) return (vol / 1e4).toFixed(1) + '万'
  return vol.toFixed(0)
}
