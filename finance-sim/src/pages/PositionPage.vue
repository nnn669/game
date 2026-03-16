<template>
  <div class="card">
    <div class="card-title">我的持仓</div>
    <div v-if="!game.positions.length" style="color:#999;text-align:center;padding:20px;">暂无持仓</div>

    <div v-for="p in [...game.positions].reverse()" :key="p.id" class="position-card">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:16px;font-weight:800;color:#111;">{{ getStock(p.code)?.name }}</span>
          <span :style="typeBadgeStyle(p)">{{ typeLabel(p) }}</span>
          <span :style="dirBadgeStyle(p)">{{ p.direction === 'long' ? '做多' : '做空' }}</span>
        </div>
        <div style="text-align:right;">
          <div :style="{ fontSize: '13px', fontWeight: 800, color: plColor(p), lineHeight: 1.1 }">
            {{ pl(p) >= 0 ? '+' : '' }}{{ fmtNum(pl(p)) }}
          </div>
          <div :style="{ fontSize: '11px', color: plColor(p), fontWeight: 600 }">
            {{ plPct(p).toFixed(2) }}%
          </div>
        </div>
      </div>

      <!-- Row 1: qty / open / current -->
      <div class="chip-row">
        <div class="chip">
          <span class="chip-label">持仓数量</span>
          <span class="chip-value">{{ fmtNum(p.quantity) }} 股</span>
        </div>
        <div class="chip">
          <span class="chip-label">开仓价</span>
          <span class="chip-value">¥{{ p.openPrice.toFixed(2) }}</span>
        </div>
        <div class="chip" :style="{ background: getStock(p.code)?.price >= p.openPrice ? '#f0fdf8' : '#fff5f5' }">
          <span class="chip-label">现价</span>
          <span class="chip-value" :style="{ color: getStock(p.code)?.price >= p.openPrice ? '#00a572' : '#e53935' }">
            ¥{{ getStock(p.code)?.price.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Row 2: spot vs futures -->
      <div class="chip-row">
        <template v-if="isSpot(p)">
          <div class="chip">
            <span class="chip-label">持仓市值</span>
            <span class="chip-value">¥{{ fmtNum((getStock(p.code)?.price || 0) * p.quantity) }}</span>
          </div>
          <div class="chip">
            <span class="chip-label">持仓成本</span>
            <span class="chip-value">¥{{ fmtNum(p.openPrice * p.quantity) }}</span>
          </div>
          <div class="chip" :style="{ background: pl(p) >= 0 ? '#f0fdf8' : '#fff5f5', borderColor: pl(p) >= 0 ? '#c8edd8' : '#ffd5d5' }">
            <span class="chip-label">浮动盈亏</span>
            <span class="chip-value" :style="{ color: plColor(p) }">{{ pl(p) >= 0 ? '+' : '' }}{{ fmtNum(pl(p)) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="chip" style="background:#fdf3ff;border-color:#e8c8f5;">
            <span class="chip-label">杠杆</span>
            <span class="chip-value" style="color:#7b1fa2;">{{ p.leverage }}x</span>
          </div>
          <div class="chip" style="background:#e8f0fe;border-color:#c5d8fb;">
            <span class="chip-label">保证金</span>
            <span class="chip-value" style="color:#1a73e8;">¥{{ fmtNum(p.margin || p.openPrice * p.quantity / p.leverage) }}</span>
          </div>
          <div class="chip" style="background:#fff0f0;border-color:#ffc5c5;">
            <span class="chip-label">爆仓价</span>
            <span class="chip-value" style="color:#e53935;">¥{{ liqPrice(p).toFixed(2) }}</span>
          </div>
        </template>
      </div>

      <!-- Close Button -->
      <button class="close-pos-btn" :style="{ background: isSpot(p) ? '#e53935' : '#222' }"
        @click="game.closeSinglePosition(p.id)">
        {{ isSpot(p) ? '卖出清仓' : '立即平仓' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../store/game.js'
import { fmtNum } from '../utils/format.js'

const game = useGameStore()

function getStock(code) { return game.stocks.find(s => s.code === code) }
function isSpot(p) { return p.leverage === 1 && p.direction === 'long' && !p.isFutures }

function pl(p) {
  const s = getStock(p.code); if (!s) return 0
  return p.direction === 'long' ? (s.price - p.openPrice) * p.quantity : (p.openPrice - s.price) * p.quantity
}
function plPct(p) {
  const cost = p.openPrice * p.quantity / (isSpot(p) ? 1 : p.leverage)
  return cost > 0 ? pl(p) / cost * 100 : 0
}
function plColor(p) { return pl(p) >= 0 ? '#00a572' : '#e53935' }
function liqPrice(p) {
  return p.direction === 'long'
    ? p.openPrice * (1 - 1 / p.leverage)
    : p.openPrice * (1 + 1 / p.leverage)
}

const typeMap = {
  futures: { label: '期货', bg: '#fff3e0', color: '#e65100' },
  limit:   { label: '限价', bg: '#e8f0fe', color: '#1a73e8' },
  spot:    { label: '现货', bg: '#e6f9f3', color: '#00a572' },
  other:   { label: '合约', bg: '#eceff1', color: '#546e7a' },
}
function typeKey(p) {
  return p.isFutures ? 'futures' : p.isLimit ? 'limit' : isSpot(p) ? 'spot' : 'other'
}
function typeLabel(p) { return typeMap[typeKey(p)].label }
function typeBadgeStyle(p) {
  const t = typeMap[typeKey(p)]
  return { background: t.bg, color: t.color, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }
}
function dirBadgeStyle(p) {
  const c = p.direction === 'long' ? '#00a572' : '#e53935'
  return { background: c + '18', color: c, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }
}
</script>
