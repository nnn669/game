<template>
  <SubpageShell title="🎁 兑换码" @back="$emit('back')">
    <div class="redeem-container">
      <div style="font-size:14px;color:#666;margin-bottom:16px;">输入兑换码领取现金奖励</div>
      <input v-model="code" class="redeem-input" placeholder="请输入兑换码" maxlength="20" />
      <button class="redeem-button" @click="submit">兑换</button>
      <div class="redeem-message" :style="{ color: msgOk ? '#00c48c' : '#ff5252' }">{{ msg }}</div>
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
const code  = ref('')
const msg   = ref('')
const msgOk = ref(false)
function submit() {
  const r = game.redeemCode(code.value.trim())
  if (r.ok) { msg.value = `✅ 兑换成功！获得 ¥${fmtNum(r.reward)}`; msgOk.value = true; code.value = '' }
  else       { msg.value = r.msg; msgOk.value = false }
  setTimeout(() => msg.value = '', 4000)
}
</script>
