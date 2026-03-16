<template>
  <div class="sub-page">
    <div class="sub-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <span class="sub-title">🏢 上市公司</span>
    </div>

    <!-- Market filter tabs -->
    <div style="padding:8px 12px 0;background:#f5f5f7;position:sticky;top:0;z-index:5;">
      <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:8px;">
        <button v-for="tab in tabs" :key="tab.value"
          @click="activeTab = tab.value"
          :style="activeTab === tab.value
            ? { background: '#222', color: '#fff' }
            : { background: tab.bg, color: tab.color }"
          style="flex-shrink:0;border:none;border-radius:14px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div style="padding:8px 12px 20px;">
      <div v-for="co in filteredCompanies" :key="co.code" class="company-card">
        <div class="company-header">
          <span class="company-logo">{{ co.logo }}</span>
          <div>
            <div class="company-name">{{ co.name }}</div>
            <div class="company-sector">{{ co.sector }}
              <span :style="{ color: moodColor(co.aiMood), fontWeight:700 }">
                · {{ moodLabel(co.aiMood) }}
              </span>
            </div>
          </div>
          <div style="margin-left:auto;text-align:right;">
            <div style="font-size:13px;font-weight:700;color:#4285f4;">
              {{ getCurrencySymbol(getMarket(co.code)) }}{{ fmtPrice(getPrice(co.code)) }}
            </div>
            <div :style="{ fontSize:11, color: priceChg(co.code) >= 0 ? '#00c48c' : '#ff5252', fontWeight:600 }">
              {{ priceChg(co.code) >= 0 ? '+' : '' }}{{ priceChg(co.code).toFixed(2) }}%
            </div>
          </div>
        </div>

        <div class="company-stats">
          <div class="company-stat">
            <div class="company-stat-label">营收</div>
            <div class="company-stat-value">{{ fmtNum(co.revenue) }}</div>
          </div>
          <div class="company-stat">
            <div class="company-stat-label">净利</div>
            <div class="company-stat-value" :style="{ color: co.profit > 0 ? '#00a572' : '#e53935' }">{{ fmtNum(co.profit) }}</div>
          </div>
          <div class="company-stat">
            <div class="company-stat-label">负债率</div>
            <div class="company-stat-value" :style="{ color: co.debtRatio > 0.6 ? '#ff5252' : '#333' }">{{ (co.debtRatio * 100).toFixed(0) }}%</div>
          </div>
        </div>

        <!-- Holding info -->
        <div v-if="holdingPct(co.code) > 0"
          style="background:#f0f8ff;border-radius:8px;padding:6px 10px;margin-bottom:10px;font-size:12px;color:#1565c0;display:flex;gap:8px;">
          <span>📊 持股 {{ holdingPct(co.code).toFixed(2) }}%</span>
          <span>均价 ¥{{ store.getHoldingAvgPrice(co.code).toFixed(2) }}</span>
        </div>

        <!-- Upgrade actions -->
        <div class="company-actions">
          <button v-for="upg in upgradeDefs" :key="upg.id"
            @click="doUpgrade(co, upg)"
            class="btn"
            :disabled="!canUpgrade(co, upg)"
            :style="canUpgrade(co, upg) ? { background:'#4285f4', color:'#fff' } : {}"
            style="flex:1;padding:7px 4px;font-size:12px;min-width:0;">
            {{ upg.icon }}{{ upg.label }}
          </button>
        </div>

        <!-- Cost hint -->
        <div style="font-size:10px;color:#bbb;margin-top:4px;">
          CEO: {{ co.ceoName }} · {{ co.ceoStyle }}
        </div>
      </div>

      <div v-if="!filteredCompanies.length"
        style="color:#bbb;text-align:center;padding:40px;font-size:14px;">
        该市场暂无公司数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../../store/game.js'
import { UPGRADE_DEFS, STOCK_FLOAT_SHARES } from '../../data/companies.js'
import { getCurrencySymbol } from '../../data/stocks.js'
import { fmtNum, fmtPrice } from '../../utils/format.js'

defineEmits(['back'])
const store = useGameStore()

const activeTab = ref('all')
const tabs = [
  { value: 'all', label: '全部', bg: '#f0f0f0', color: '#555' },
  { value: 'A股', label: '🇨🇳 A股', bg: '#ff525218', color: '#ff5252' },
  { value: '港股', label: '🇭🇰 港股', bg: '#ff980018', color: '#ff9800' },
  { value: '美股', label: '🇺🇸 美股', bg: '#4285f418', color: '#4285f4' },
  { value: '加密', label: '₿ 加密', bg: '#9c27b018', color: '#9c27b0' },
]

const upgradeDefs = UPGRADE_DEFS.slice(0, 3) // show first 3

function getMarket(code) {
  return store.stocks.find(s => s.code === code)?.market || 'A股'
}
function getPrice(code) {
  return store.stocks.find(s => s.code === code)?.price || 0
}
function priceChg(code) {
  const s = store.stocks.find(x => x.code === code)
  if (!s) return 0
  return (s.price - s.basePrice) / s.basePrice * 100
}
function holdingPct(code) {
  const qty = store.getHoldingQty(code)
  const float = STOCK_FLOAT_SHARES[code] || 1e6
  return qty / float * 100
}

const filteredCompanies = computed(() => {
  if (activeTab.value === 'all') return store.companiesData
  return store.companiesData.filter(co => getMarket(co.code) === activeTab.value)
})

function moodColor(mood) {
  return mood === 'bull' ? '#00a572' : mood === 'bear' ? '#e53935' : '#aaa'
}
function moodLabel(mood) {
  return mood === 'bull' ? '看涨' : mood === 'bear' ? '看跌' : '中性'
}

function canUpgrade(co, upg) {
  if (co.isCrypto) return false
  const cost = upg.costFn(co)
  return store.cash >= cost && holdingPct(co.code) >= upg.minPct
}

function doUpgrade(co, upg) {
  if (!canUpgrade(co, upg)) {
    const pct = holdingPct(co.code)
    if (pct < upg.minPct) {
      store.showToast(`需持股 ≥${upg.minPct}%（当前 ${pct.toFixed(2)}%）`, 'info', 3000)
    } else {
      store.showToast('资金不足', 'info')
    }
    return
  }
  const cost = upg.costFn(co)
  store.cash -= cost
  const stock = store.stocks.find(s => s.code === co.code)
  const msg = upg.apply(co, stock, store.companyDynamic)
  store.showToast(`${upg.icon} ${msg}`, 'tp', 4000)
  store.profitHistoryPush()
}
</script>
