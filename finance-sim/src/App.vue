<template>
  <div id="app-root">
    <div v-if="errorMsg" class="err-banner">❌ {{ errorMsg }}</div>

    <div id="toast-container">
      <div v-for="t in store.toasts" :key="t.id" :class="['toast', 'toast-' + t.type]">
        <span>{{ toastIcon(t.type) }}</span><span>{{ t.msg }}</span>
      </div>
    </div>

    <div id="global-danmu-layer">
      <div v-for="d in danmuItems" :key="d.id" class="gdanmu-item"
        :style="{ top: d.top + 'px', background: d.bg, color: d.color }">
        {{ d.text }}
      </div>
    </div>

    <MarketPage   :class="['page', { active: currentPage === 'page-market' }]"
      @navigate="navigate" />
    <TradePage    :class="['page', { active: currentPage === 'page-trade' }]" />
    <PositionPage :class="['page', { active: currentPage === 'page-position' }]" />
    <AssetPage    :class="['page', { active: currentPage === 'page-asset' }]" />
    <FunctionPage :class="['page', { active: currentPage === 'page-history' }]" />

    <nav class="bottom-nav">
      <div v-for="item in navItems" :key="item.page"
        :class="['nav-item', { active: currentPage === item.page }]"
        @click="navigate(item.page)">
        {{ item.label }}
        <span v-if="item.page === 'page-position' && store.liquidationBadgeCount > 0" class="nav-badge">
          {{ store.liquidationBadgeCount }}
        </span>
        <span v-if="item.page === 'page-history' && showIPOBadge"
          class="nav-badge" style="background:#ff9800;">IPO</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from './store/game.js'
import MarketPage   from './pages/MarketPage.vue'
import TradePage    from './pages/TradePage.vue'
import PositionPage from './pages/PositionPage.vue'
import AssetPage    from './pages/AssetPage.vue'
import FunctionPage from './pages/FunctionPage.vue'

const store = useGameStore()
const errorMsg = ref('')
const currentPage = ref('page-market')
const danmuItems = ref([])
let _danmuId = 0

const navItems = [
  { page: 'page-market',   label: '行情' },
  { page: 'page-position', label: '持仓' },
  { page: 'page-trade',    label: '交易' },
  { page: 'page-asset',    label: '资产' },
  { page: 'page-history',  label: '综合' },
]

const showIPOBadge = computed(() => store.ipoPhase === 'active' && !!store.ipoActive)

function navigate(page) { currentPage.value = page }
function toastIcon(type) {
  return { liq: '💥', sl: '🛡️', tp: '🎯', news: '📰', info: 'ℹ️' }[type] || 'ℹ️'
}

// Danmu
const BULL_TEXTS = ['💰 利好消息！', '🚀 强势拉升！', '📈 看多！', '🔥 量能放大！', '🐂 牛市来了！']
const BEAR_TEXTS = ['⚠️ 风险警示', '📉 注意回调', '🐻 空头施压', '💔 跌破支撑']
let _danmuTick = 0
function emitDanmu() {
  _danmuTick++
  if (_danmuTick % 5 !== 0) return
  const isBull = Math.random() > 0.4
  const texts = isBull ? BULL_TEXTS : BEAR_TEXTS
  const id = ++_danmuId
  danmuItems.value.push({
    id, text: texts[Math.floor(Math.random() * texts.length)],
    top: 10 + Math.floor(Math.random() * 80),
    bg: isBull ? 'rgba(0,196,140,0.85)' : 'rgba(255,82,82,0.85)',
    color: '#fff',
  })
  setTimeout(() => { danmuItems.value = danmuItems.value.filter(d => d.id !== id) }, 9500)
}

let _loop = null, _saveLoop = null

onMounted(() => {
  try {
    store.init()
    _loop = setInterval(() => {
      try { store.priceTick(); emitDanmu() } catch (e) { errorMsg.value = e.message }
    }, 3000)
    _saveLoop = setInterval(() => store.saveGame(), 60000)
  } catch (e) { errorMsg.value = e.message }
})

onUnmounted(() => {
  if (_loop) clearInterval(_loop)
  if (_saveLoop) clearInterval(_saveLoop)
})
</script>

<style scoped>
#app-root { position: relative; min-height: 100vh; }
.err-banner { position: fixed; top: 0; left: 0; right: 0; background: #c62828; color: #fff; padding: 8px 14px; font-size: 13px; font-weight: 700; z-index: 99999; word-break: break-all; }
</style>
