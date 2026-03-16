/**
 * 获取手续费率（默认1%，贵宾减0.2%）
 */
export function getCommissionRate(hasVip = false) {
  return hasVip ? 0.008 : 0.01
}

/**
 * 计算并返回手续费金额
 */
export function calcCommission(amount, hasVip = false) {
  return +(amount * getCommissionRate(hasVip)).toFixed(2)
}

/**
 * 量比标签映射
 */
export function volRatioLabel(vr) {
  if (vr >= 2.5)     return { label: '超级放量', bg: '#ff3b3020', color: '#ff3b30' }
  if (vr >= 1.5)     return { label: '放量',     bg: '#ff980020', color: '#e65100' }
  if (vr >= 1.1)     return { label: '温和放量', bg: '#ffeb3b20', color: '#b8860b' }
  if (vr < 0.5)      return { label: '严重缩量', bg: '#4285f420', color: '#1565c0' }
  if (vr < 0.8)      return { label: '缩量',     bg: '#4285f415', color: '#4285f4' }
  return { label: '量比 ' + vr.toFixed(1) + 'x', bg: '#f0f0f0', color: '#aaa' }
}
