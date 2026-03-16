<template>
  <SubpageShell title="👑 贵宾服务" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">贵宾资格</div>
        <div v-if="game.hasVip" style="color:#00c48c;font-weight:700;font-size:15px;">✅ 贵宾会员</div>
        <div v-else style="color:#999;font-size:14px;">
          需购买顶级别墅方可解锁<br>
          <span style="color:#4285f4;font-size:12px;margin-top:6px;display:block;">→ 综合 > 房产投资 > 顶级别墅</span>
        </div>
      </div>
      <div class="card" style="margin:0;">
        <div class="card-title">贵宾专属福利</div>
        <div style="font-size:14px;color:#555;line-height:2.5;">
          👑 期货杠杆解锁50倍<br>
          📊 理财利率额外+3%<br>
          💳 交易手续费减少0.2%
        </div>
      </div>
    </div>
  </SubpageShell>
</template>
<script setup>
import { useGameStore } from '../../store/game.js'
import SubpageShell from './SubpageShell.vue'
defineEmits(['back'])
const game = useGameStore()
</script>
