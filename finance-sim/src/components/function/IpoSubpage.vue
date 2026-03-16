<!-- IpoSubpage.vue -->
<template>
  <SubpageShell title="🚀 IPO新股申购" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="card" style="margin:0 0 12px;">
        <div v-if="!game.ipoActive">
          <div style="color:#999;text-align:center;padding:24px;font-size:14px;">暂无新股发行</div>
          <div style="text-align:center;font-size:13px;color:#4285f4;">
            {{ game.ipoPhase === 'cooldown' ? `距下次发行: ${game.ipoNextIn}秒` : '' }}
          </div>
        </div>
        <div v-else>
          <div class="card-title">{{ game.ipoActive.name }}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="font-size:13px;color:#555;">发行价</span>
            <span style="font-size:20px;font-weight:700;color:#4285f4;">¥{{ game.ipoActive.issuePrice }}</span>
          </div>
          <div style="font-size:13px;color:#ff5252;font-weight:600;margin-bottom:12px;text-align:center;">
            ⏰ 倒计时: {{ game.ipoActive.countdown }}秒
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>申购数量</span>
            <span style="color:#4285f4;">可用: {{ fmtNum(game.cash) }}</span>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <input type="number" v-model.number="ipoQty" min="100" step="100" class="quantity-input"
              style="flex:1;padding:10px;border:1px solid #e0e0e0;border-radius:8px;font-size:15px;" />
            <button class="btn btn-primary" style="padding:10px 16px;" @click="doApply">申购</button>
          </div>
          <div v-if="game.ipoActive.applied > 0" style="font-size:13px;color:#00c48c;text-align:center;">
            ✅ 已申购 {{ game.ipoActive.applied }} 股，等待上市
          </div>
        </div>
      </div>
      <div class="card" style="margin:0;">
        <div class="card-title">申购记录</div>
        <div v-if="!game.ipoHistory.length" style="color:#999;text-align:center;padding:16px;font-size:14px;">暂无申购记录</div>
        <div v-for="h in game.ipoHistory" :key="h.time" class="history-item">
          <div class="history-row">
            <span style="font-weight:600;">{{ h.name }}</span>
            <span :style="{ color: h.listPrice >= h.issuePrice ? '#00c48c' : '#ff5252' }">
              {{ h.listPrice >= h.issuePrice ? '上涨' : '下跌' }} {{ ((h.listPrice - h.issuePrice) / h.issuePrice * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="history-row" style="margin-top:4px;font-size:12px;color:#999;">
            <span>发行 ¥{{ h.issuePrice }} → 开盘 ¥{{ h.listPrice }}</span>
            <span>{{ h.qty }}股 · {{ h.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </SubpageShell>
</template>
<script setup>
import { ref } from 'vue'
import { useGameStore } from '../../store/game.js'
import { fmtNum } from '../../utils/format.js'
import SubpageShell from './SubpageShell.vue'
defineEmits(['back'])
const game = useGameStore()
const ipoQty = ref(100)
function doApply() {
  const r = game.applyIPO(ipoQty.value)
  if (r.ok) game.showToast(`✅ 申购 ${ipoQty.value} 股`, 'tp', 2000)
  else game.showToast(r.msg, 'sl', 3000)
}
</script>
