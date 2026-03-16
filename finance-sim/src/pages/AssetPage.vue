<template>
  <div>
    <!-- Asset Summary Card -->
    <div class="card">
      <div class="asset-grid">
        <div class="asset-item" style="grid-column:1/3;">
          <div class="asset-label">总资产</div>
          <div class="asset-amount" style="font-size:clamp(18px,5vw,24px);" :class="totalClass">
            ¥{{ fmtNum(game.totalAsset) }}
          </div>
        </div>
        <div class="asset-item">
          <div class="asset-label">可用余额</div>
          <div class="asset-amount up">¥{{ fmtNum(game.cash) }}</div>
        </div>
        <div class="asset-item">
          <div class="asset-label">持仓盈亏</div>
          <div class="asset-amount" :class="game.floatingPL >= 0 ? 'up' : 'down'">
            {{ game.floatingPL >= 0 ? '+' : '' }}{{ fmtNum(game.floatingPL) }}
          </div>
        </div>
        <div class="asset-item">
          <div class="asset-label">贷款余额</div>
          <div class="asset-amount" :style="{ color: game.loanBalance > 0 ? '#ff5252' : '#999' }">
            ¥{{ fmtNum(game.loanBalance) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Profit Chart -->
    <div class="card">
      <div class="card-title">收益趋势</div>
      <div class="chart-box">
        <svg ref="profitSvg" width="100%" height="175" viewBox="0 0 320 175" preserveAspectRatio="none">
          <g v-html="profitSvgHtml"></g>
        </svg>
      </div>
    </div>

    <!-- Trade History -->
    <div class="card">
      <div class="card-title">交易记录</div>
      <div v-if="!game.history.length" style="color:#999;text-align:center;padding:10px;">暂无交易记录</div>
      <div v-for="(h, i) in [...game.history].reverse()" :key="i" class="history-item">
        <div class="history-row">
          <div>{{ h.name }}</div>
          <div :class="typeClass(h.type)">{{ h.type }}</div>
        </div>
        <div class="history-row" style="margin-top:4px;">
          <div>{{ h.time }}</div>
          <div>{{ fmtNum(h.num) }}股 × {{ h.price }} ({{ h.leverage || 1 }}x){{ h.reason ? ' ' + h.reason : '' }}</div>
        </div>
        <div v-if="h.pl !== null && h.pl !== undefined" class="history-row">
          <span :class="parseFloat(h.pl) >= 0 ? 'up' : 'down'">
            盈亏: ¥{{ fmtNum(parseFloat(h.pl)) }}
          </span>
          <span v-if="h.fee && parseFloat(h.fee) > 0" style="color:#aaa;font-size:11px;">
            手续费 ¥{{ fmtNum(parseFloat(h.fee)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/game.js'
import { fmtNum } from '../utils/format.js'

const game = useGameStore()

const totalClass = computed(() => game.totalAsset >= 100000000000 ? '' : game.floatingPL >= 0 ? 'up' : 'down')

function typeClass(type) {
  if (['买入', '平多'].includes(type)) return 'up'
  if (['卖出', '平空', '爆仓'].includes(type)) return 'down'
  return ''
}

// Profit chart SVG
const profitSvgHtml = computed(() => {
  const arr = game.profitHistory
  if (!arr || arr.length < 2) {
    return '<text x="160" y="95" text-anchor="middle" fill="#bbb" font-size="12">游戏中数据将在此显示</text>'
  }
  const left = 40, right = 300, top = 15, bottom = 158
  const w = right - left, h = bottom - top
  const maxV = Math.max(...arr), minV = Math.min(...arr)
  const range = (maxV - minV) || (maxV * 0.02) || 100
  const flat = maxV === minV
  const mapY = v => flat ? (top + bottom) / 2 : bottom - ((v - minV) / range) * h
  const stepX = w / (arr.length - 1)
  const pts = arr.map((v, i) => ({ x: left + i * stepX, y: mapY(v) }))

  // Cardinal spline
  function smooth(points) {
    if (points.length < 2) return ''
    let d = `M${points[0].x},${points[0].y}`
    const t = 0.5
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i]
      const p1 = points[i], p2 = points[i + 1]
      const p3 = i < points.length - 2 ? points[i + 2] : p2
      const cp1x = p1.x + (p2.x - p0.x) * t / 3
      const cp1y = p1.y + (p2.y - p0.y) * t / 3
      const cp2x = p2.x - (p3.x - p1.x) * t / 3
      const cp2y = p2.y - (p3.y - p1.y) * t / 3
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }
  const sd = smooth(pts)
  const lp = pts[pts.length - 1]
  let out = ''

  // Fill pattern
  out += `<defs><pattern id="dotPat" patternUnits="userSpaceOnUse" width="3" height="3"><circle cx="1.5" cy="1.5" r="1" fill="#4285f4" opacity="0.5"/></pattern></defs>`
  out += `<path d="${sd} L${lp.x},${bottom} L${left},${bottom} Z" fill="url(#dotPat)" stroke="none"/>`
  // Glow
  out += `<path d="${sd}" stroke="rgba(255,255,255,0.45)" stroke-width="6" fill="none"/>`
  // Main line
  out += `<path d="${sd}" stroke="#4285f4" stroke-width="2" fill="none"/>`

  // Axes
  out += `<line x1="${left-5}" y1="${top}" x2="${left-5}" y2="${bottom}" class="axis-line"/>`
  out += `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" class="axis-line"/>`

  // Y labels
  for (let i = 0; i <= 4; i++) {
    const y = top + (bottom - top) * i / 4
    const val = maxV - range * i / 4
    out += `<text x="${left - 8}" y="${y + 3}" class="axis-text" text-anchor="end">${fmtNum(val)}</text>`
    out += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#eee" stroke-width="0.5"/>`
  }
  return out
})
</script>
