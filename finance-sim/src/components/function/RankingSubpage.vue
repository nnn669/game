<template>
  <SubpageShell title="🏆 资产排名" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">历史峰值</div>
        <div style="font-size:clamp(20px,5.5vw,26px);font-weight:700;color:#4285f4;">¥{{ fmtNum(game.peakAsset) }}</div>
        <div style="font-size:12px;color:#aaa;margin-top:4px;">创造于 {{ game.peakTime }}</div>
      </div>
      <div class="card" style="margin:0 0 12px;">
        <div style="display:flex;">
          <div style="text-align:center;flex:1;">
            <div style="font-size:clamp(11px,3vw,13px);color:#666;margin-bottom:4px;">当前总资产</div>
            <div style="font-size:clamp(16px,4.5vw,20px);font-weight:700;">¥{{ fmtNum(game.totalAsset) }}</div>
          </div>
          <div style="width:1px;height:40px;background:#f0f0f0;align-self:center;"></div>
          <div style="text-align:center;flex:1;">
            <div style="font-size:clamp(11px,3vw,13px);color:#666;margin-bottom:4px;">距峰值回撤</div>
            <div style="font-size:clamp(16px,4.5vw,20px);font-weight:700;color:#ff5252;">{{ drawdown.toFixed(1) }}%</div>
          </div>
          <div style="width:1px;height:40px;background:#f0f0f0;align-self:center;"></div>
          <div style="text-align:center;flex:1;">
            <div style="font-size:clamp(11px,3vw,13px);color:#666;margin-bottom:4px;">总盈亏</div>
            <div :style="{ fontSize: 'clamp(16px,4.5vw,20px)', fontWeight: 700, color: totalPL >= 0 ? '#00c48c' : '#ff5252' }">
              {{ totalPL >= 0 ? '+' : '' }}{{ fmtNum(Math.abs(totalPL)) }}
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin:0;">
        <div class="card-title">历史里程碑</div>
        <div v-if="!game.milestones.length" style="color:#999;text-align:center;padding:16px;font-size:14px;">暂无里程碑，继续加油！</div>
        <div v-for="m in [...game.milestones].reverse()" :key="m.value" class="milestone-item">
          <span>🎉 资产突破 <strong>¥{{ fmtNum(m.value) }}</strong></span>
          <span style="color:#999;">{{ m.time }}</span>
        </div>
      </div>
    </div>
  </SubpageShell>
</template>
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../store/game.js'
import { fmtNum } from '../../utils/format.js'
import SubpageShell from './SubpageShell.vue'
defineEmits(['back'])
const game = useGameStore()
const drawdown = computed(() => game.peakAsset > 0 ? (game.peakAsset - game.totalAsset) / game.peakAsset * 100 : 0)
const totalPL  = computed(() => game.totalAsset - 100000000000)
</script>
