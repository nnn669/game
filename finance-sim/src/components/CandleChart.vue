<template>
  <div style="position:relative;">
    <!-- Indicator Tabs -->
    <div class="ind-tabs">
      <button v-for="tab in indTabs" :key="tab.id"
        :class="['ind-tab', { active: indicator === tab.id }]"
        @click="indicator = tab.id">{{ tab.label }}</button>
      <span id="ma-legend" style="margin-left:6px;font-size:10px;line-height:1.8;color:#aaa;">
        <span style="color:#f97316;">MA5 </span>
        <span style="color:#4285f4;">MA10 </span>
        <span style="color:#9c27b0;">MA20</span>
      </span>
    </div>

    <!-- Chart SVG -->
    <div class="price-chart" style="height:345px;position:relative;" ref="chartEl">
      <svg ref="svgEl" width="100%" height="345" viewBox="0 0 380 345" preserveAspectRatio="none"
        @mousemove="onMouseMove" @mouseleave="tooltip.show = false">
        <!-- Candles rendered here -->
        <g v-html="candleSvg"></g>
      </svg>

      <!-- Tooltip -->
      <div class="tooltip" v-if="tooltip.show" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', display: 'block' }">
        <div>{{ tooltip.time }}</div>
        <div>开: {{ tooltip.open }}  高: {{ tooltip.high }}</div>
        <div>低: {{ tooltip.low }}   收: {{ tooltip.close }}</div>
        <div v-if="tooltip.vol">量: {{ tooltip.vol }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../store/game.js'
import { calcMA, calcRSI, calcMACD } from '../utils/candle.js'
import { fmtNum, fmtVol } from '../utils/format.js'

const game = useGameStore()
const indicator = ref('vol')
const svgEl  = ref(null)
const chartEl = ref(null)

const indTabs = [
  { id: 'vol',  label: '量' },
  { id: 'rsi',  label: 'RSI' },
  { id: 'macd', label: 'MACD' },
]

const tooltip = ref({ show: false, x: 0, y: 0, time: '', open: '', high: '', low: '', close: '', vol: '' })

// Layout constants
const LEFT = 44, RIGHT = 376, TOP = 8, BOTTOM = 198
const I_TOP = 210, I_H = 80, X_Y = 304
const VOL_H = I_H

const data = computed(() => {
  const code = game.currentCode
  const arr  = game.candleData[code] || []
  return game.useShortCandle ? arr.slice(-24) : arr.slice(-120)
})

const candleSvg = computed(() => {
  const d = data.value
  if (!d || d.length < 2) return ''
  const innerW = RIGHT - LEFT
  const step   = innerW / d.length
  const cW     = Math.max(2, step * 0.6)
  let out = ''

  // Price range
  const prices = d.flatMap(c => [c.high, c.low])
  const pMax = Math.max(...prices)
  const pMin = Math.min(...prices)
  const pRange = (pMax - pMin) || 1
  const py = v => TOP + (BOTTOM - TOP) * (1 - (v - pMin) / pRange)

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = TOP + (BOTTOM - TOP) * i / 4
    const v = pMax - pRange * i / 4
    out += `<line x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}" stroke="#f0f0f0" stroke-width="0.5"/>`
    out += `<text x="${LEFT - 4}" y="${y + 3}" class="axis-text" text-anchor="end">${fmtNum(v)}</text>`
  }
  out += `<line x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${BOTTOM}" class="axis-line"/>`
  out += `<line x1="${LEFT}" y1="${BOTTOM}" x2="${RIGHT}" y2="${BOTTOM}" class="axis-line"/>`

  // Current price line
  const lastClose = d[d.length - 1].close
  const cpY = py(lastClose)
  out += `<line x1="${LEFT}" y1="${cpY}" x2="${RIGHT}" y2="${cpY}" stroke="#4285f4" stroke-width="1.2" stroke-dasharray="5,3"/>`
  out += `<text x="${RIGHT}" y="${cpY - 2}" font-size="10" fill="#4285f4" font-weight="600" text-anchor="end">${lastClose.toFixed(2)}</text>`

  // MA lines
  const ma5  = calcMA(d, 5)
  const ma10 = calcMA(d, 10)
  const ma20 = calcMA(d, 20)
  const drawMA = (arr, color) => {
    let pts = []
    arr.forEach((v, i) => {
      if (v === null) { if (pts.length > 1) out += polyline(pts, color, 1); pts = []; return }
      pts.push([LEFT + i * step + step / 2, py(v)])
    })
    if (pts.length > 1) out += polyline(pts, color, 1)
  }
  drawMA(ma5,  '#f97316')
  drawMA(ma10, '#4285f4')
  drawMA(ma20, '#9c27b0')

  // Candles
  d.forEach((c, i) => {
    const x    = LEFT + i * step
    const cx   = x + step / 2
    const isUp = c.close >= c.open
    const cls  = isUp ? 'candle-up' : 'candle-down'
    const bodyY = py(Math.max(c.open, c.close))
    const bodyH = Math.max(1, Math.abs(py(c.open) - py(c.close)))
    out += `<rect x="${x + step * 0.2}" y="${bodyY}" width="${cW}" height="${bodyH}" class="${cls}"/>`
    out += `<line x1="${cx}" y1="${py(c.high)}" x2="${cx}" y2="${py(c.low)}" stroke="${isUp ? '#00c48c' : '#ff5252'}" stroke-width="1"/>`
  })

  // Indicator sub-chart
  out += drawIndicator(d, step, indicator.value)

  // X-axis labels
  const xStep = Math.max(1, Math.floor(d.length / 5))
  for (let i = 0; i < d.length; i += xStep) {
    const xt = LEFT + i * step + step / 2
    out += `<text x="${xt}" y="${X_Y}" class="axis-text" text-anchor="middle">${i + 1}</text>`
  }

  return out
})

function polyline(pts, color, w = 1) {
  const d = pts.map(([x, y]) => `${x},${y}`).join(' ')
  return `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="${w}" opacity="0.9"/>`
}

function drawIndicator(d, step, mode) {
  if (!d.length) return ''
  let out = ''
  out += `<line x1="${LEFT}" y1="${I_TOP}" x2="${RIGHT}" y2="${I_TOP}" stroke="#f0f0f0" stroke-width="0.5"/>`

  if (mode === 'vol') {
    const vols = d.map(c => c.volume || 0)
    const maxV = Math.max(...vols, 1)
    const vy = v => I_TOP + VOL_H - (v / maxV) * VOL_H * 0.9
    d.forEach((c, i) => {
      const x    = LEFT + i * step
      const vh   = Math.max(1, (c.volume || 0) / maxV * VOL_H * 0.9)
      const isUp = c.close >= c.open
      const barY = I_TOP + VOL_H - vh
      out += `<rect x="${x + step * 0.2}" y="${barY}" width="${Math.max(1, step * 0.6)}" height="${vh}" fill="${isUp ? '#00c48c' : '#ff5252'}" opacity="0.65"/>`
    })
    out += `<text x="${LEFT + 4}" y="${I_TOP + 12}" class="axis-text" fill="#aaa">VOL</text>`
  }

  else if (mode === 'rsi') {
    const rsi = calcRSI(d, 14)
    const rpy = v => I_TOP + I_H * (1 - v / 100)
    // 70/30 reference lines
    out += `<line x1="${LEFT}" y1="${rpy(70)}" x2="${RIGHT}" y2="${rpy(70)}" stroke="#ff5252" stroke-width="0.5" stroke-dasharray="3,2"/>`
    out += `<line x1="${LEFT}" y1="${rpy(30)}" x2="${RIGHT}" y2="${rpy(30)}" stroke="#4285f4" stroke-width="0.5" stroke-dasharray="3,2"/>`
    out += `<text x="${LEFT - 4}" y="${rpy(70) + 3}" class="axis-text" text-anchor="end" fill="#ff5252">70</text>`
    out += `<text x="${LEFT - 4}" y="${rpy(30) + 3}" class="axis-text" text-anchor="end" fill="#4285f4">30</text>`
    let pts = []
    rsi.forEach((v, i) => {
      if (v === null) { if (pts.length > 1) out += polyline(pts, '#f97316', 1.2); pts = []; return }
      pts.push([LEFT + i * step + step / 2, rpy(v)])
    })
    if (pts.length > 1) out += polyline(pts, '#f97316', 1.2)
    const lastRSI = rsi.slice().reverse().find(v => v !== null)
    if (lastRSI !== undefined) {
      const rc = lastRSI >= 70 ? '#ff5252' : lastRSI <= 30 ? '#4285f4' : '#f97316'
      out += `<text x="${RIGHT - 4}" y="${I_TOP + 12}" class="axis-text" text-anchor="end" fill="${rc}">RSI ${lastRSI.toFixed(1)}</text>`
    }
  }

  else if (mode === 'macd') {
    const { macdLine, signal: sigLine, hist } = calcMACD(d)
    const allVals = macdLine.concat(sigLine).filter(v => v !== null)
    const mMax = (allVals.length ? Math.max(...allVals.map(Math.abs)) : 1) * 1.15 || 1
    const mpy = v => I_TOP + I_H / 2 - (v / mMax) * (I_H / 2)
    const zeroY = mpy(0)
    out += `<line x1="${LEFT}" y1="${zeroY}" x2="${RIGHT}" y2="${zeroY}" stroke="#aaa" stroke-width="0.5" stroke-dasharray="2,2"/>`
    hist.forEach((hv, i) => {
      if (hv === null) return
      const x = LEFT + i * step
      const hy = mpy(hv)
      const bh = Math.max(0.5, Math.abs(hy - zeroY))
      out += `<rect x="${x + 0.5}" y="${hv >= 0 ? hy : zeroY}" width="${Math.max(1, step - 1)}" height="${bh}" fill="${hv >= 0 ? '#00c48c' : '#ff5252'}" opacity="0.55"/>`
    })
    let mp = [], sp = []
    macdLine.forEach((v, i) => {
      if (v === null) { if (mp.length > 1) out += polyline(mp, '#4285f4', 1.2); mp = []; return }
      mp.push([LEFT + i * step + step / 2, mpy(v)])
    })
    if (mp.length > 1) out += polyline(mp, '#4285f4', 1.2)
    sigLine.forEach((v, i) => {
      if (v === null) { if (sp.length > 1) out += polyline(sp, '#f97316', 1.1); sp = []; return }
      sp.push([LEFT + i * step + step / 2, mpy(v)])
    })
    if (sp.length > 1) out += polyline(sp, '#f97316', 1.1)
    out += `<text x="${LEFT + 4}" y="${I_TOP + 10}" class="axis-text" fill="#aaa">MACD</text>`
  }

  return out
}

function onMouseMove(e) {
  const svg = svgEl.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const ratioX = 380 / rect.width
  const svgX = (e.clientX - rect.left) * ratioX
  const d = data.value
  if (!d.length) return
  const innerW = RIGHT - LEFT
  const step   = innerW / d.length
  const idx    = Math.floor((svgX - LEFT) / step)
  if (idx < 0 || idx >= d.length) { tooltip.value.show = false; return }
  const c = d[idx]
  tooltip.value = {
    show: true,
    x: Math.min(e.clientX - rect.left + 10, rect.width - 160),
    y: Math.max(e.clientY - rect.top - 10, 0),
    time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
    vol: fmtVol(c.volume || 0),
  }
}
</script>
