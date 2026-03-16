<template>
  <div class="page-market">
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div class="card-title" style="margin-bottom:0;">市场行情</div>
        <button @click="cycleSpeed" :style="{ background: speedColor }"
          style="font-size:12px;font-weight:700;padding:3px 12px;border-radius:14px;border:none;color:#fff;cursor:pointer;">
          {{ store.gameSpeed }}x
        </button>
      </div>

      <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid #f0f0f0;">
        <button v-for="tab in marketTabs" :key="tab.value"
          @click="store.marketFilter = tab.value"
          :style="store.marketFilter === tab.value
            ? { background: tab.activeBg, color: '#fff' }
            : { background: tab.bg, color: tab.color }"
          style="flex-shrink:0;border:none;border-radius:12px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;">
          {{ tab.label }}
        </button>
      </div>

      <div class="stock-stack">
        <div v-for="s in store.filteredStocks" :key="s.code"
          :class="['stock-item', { active: store.currentCode === s.code }]"
          @click="selectStock(s.code)">
          <div class="stock-info-left">
            <div class="stock-name-text">
              <span>{{ s.name }}</span>
              <span v-if="s.market" class="market-badge"
                :style="{ background: MARKET_COLORS[s.market]?.bg, color: MARKET_COLORS[s.market]?.text }">
                {{ s.market }}
              </span>
              <span v-if="s.isIPO"
                style="background:#ff9800;color:#fff;font-size:9px;border-radius:3px;padding:1px 4px;">IPO</span>
            </div>
            <div class="stock-desc-text">
              {{ s.code }} · {{ s.desc }}
              <span style="font-size:10px;color:#aaa;"> 量:{{ fmtVol(store.stockVolume[s.code] || 0) }}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div :class="['stock-price-text', chg(s) >= 0 ? 'up' : 'down']">
              {{ getCurrencySymbol(s.market) }}{{ fmtPrice(s.price) }}
            </div>
            <div :style="{ fontSize:'11px', fontWeight:600, color: chg(s) >= 0 ? '#00c48c' : '#ff5252' }">
              {{ chg(s) >= 0 ? '+' : '' }}{{ chg(s).toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/game.js'
import { MARKET_COLORS, getCurrencySymbol } from '../data/stocks.js'
import { fmtPrice, fmtVol } from '../utils/format.js'

const emit = defineEmits(['navigate'])
const store = useGameStore()

const marketTabs = [
  { value: 'all',  label: '全部',     bg: '#f0f0f0', color: '#555', activeBg: '#222' },
  { value: 'A股',  label: '🇨🇳 A股',  bg: '#fee2e2', color: '#ef4444', activeBg: '#ef4444' },
  { value: '港股', label: '🇭🇰 港股', bg: '#fff7ed', color: '#f97316', activeBg: '#f97316' },
  { value: '美股', label: '🇺🇸 美股', bg: '#eff6ff', color: '#3b82f6', activeBg: '#3b82f6' },
  { value: '加密', label: '₿ 加密',   bg: '#faf5ff', color: '#a855f7', activeBg: '#a855f7' },
]

const speedColors = { 1: '#4285f4', 2: '#00c48c', 5: '#ff9800', 10: '#ff5252' }
const speedColor = computed(() => speedColors[store.gameSpeed] || '#4285f4')
const speedOpts = [1, 2, 5, 10]

function cycleSpeed() {
  const idx = (speedOpts.indexOf(store.gameSpeed) + 1) % speedOpts.length
  store.gameSpeed = speedOpts[idx]
  if (store.gameSpeed > 1) store.showToast(`⚡ ${store.gameSpeed}倍速运行中`, 'info', 1500)
}

function chg(s) { return (s.price - s.basePrice) / s.basePrice * 100 }

function selectStock(code) {
  store.currentCode = code
  emit('navigate', 'page-trade')
}
</script>
