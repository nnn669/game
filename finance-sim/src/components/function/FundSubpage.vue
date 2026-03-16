<template>
  <SubpageShell title="📊 理财基金" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="card" style="margin:0 0 12px;" v-for="f in FUNDS" :key="f.id">
        <div style="font-weight:700;font-size:15px;margin-bottom:2px;">{{ f.name }}</div>
        <div style="font-size:12px;color:#888;margin-bottom:6px;">{{ f.desc }}</div>

        <template v-if="f.type === 'commercial'">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">
            <span>每20秒收益：<span style="color:#00c48c;">+{{ (f.rate * 100).toFixed(1) }}%</span>
              <span v-if="game.hasVip" style="color:#ff5722;font-weight:700;"> →{{ ((f.rate + 0.03) * 100).toFixed(1) }}%(贵宾)</span>
            </span>
            <span v-if="game.fundPositions[f.id]" style="color:#4285f4;">持有: ¥{{ game.fundPositions[f.id].invested.toFixed(0) }}</span>
          </div>
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px;">
              <span>投入金额</span>
              <span style="font-weight:700;color:#4285f4;">¥{{ fmtNum(calcAmt(f, sliderPct[f.id] || 25)) }} ({{ sliderPct[f.id] || 25 }}%)</span>
            </div>
            <input type="range" min="5" max="100" step="5" :value="sliderPct[f.id] || 25"
              @input="e => sliderPct[f.id] = parseInt(e.target.value)"
              style="width:100%;accent-color:#4285f4;cursor:pointer;" />
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" style="flex:1;padding:9px;" @click="invest(f)">投入</button>
            <button v-if="game.fundPositions[f.id]" class="btn btn-danger" style="flex:1;padding:9px;" @click="redeem(f)">
              赎回 ¥{{ game.fundPositions[f.id].invested.toFixed(0) }}
            </button>
          </div>
        </template>

        <template v-else>
          <!-- Charity -->
          <div style="font-size:12px;color:#e91e63;margin-bottom:10px;">❤️ 累计捐款：¥{{ fmtNum(game.charityTotal) }}</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px;">
            <span>捐款金额</span>
            <span style="font-weight:700;color:#e91e63;">¥{{ fmtNum(calcCharityAmt(charityPct)) }} ({{ charityPct }}%)</span>
          </div>
          <input type="range" min="1" max="100" step="1" v-model.number="charityPct"
            style="width:100%;accent-color:#e91e63;cursor:pointer;margin-bottom:10px;" />
          <button class="btn btn-primary" style="width:100%;padding:10px;background:#e91e63;" @click="donate">❤️ 确认捐款</button>
        </template>
      </div>
    </div>
  </SubpageShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useGameStore } from '../../store/game.js'
import { FUNDS } from '../../data/properties.js'
import { fmtNum } from '../../utils/format.js'
import SubpageShell from './SubpageShell.vue'

defineEmits(['back'])
const game = useGameStore()
const sliderPct  = reactive({})
const charityPct = ref(10)

function calcAmt(f, pct) {
  const maxAmt = Math.floor(Math.min(game.cash, game.totalAsset) / 100) * 100
  return Math.max(f.minInvest, Math.floor(maxAmt * pct / 100 / 100) * 100)
}
function calcCharityAmt(pct) {
  const mx = Math.floor(game.cash / 100) * 100
  return Math.max(100, Math.floor(mx * pct / 100 / 100) * 100)
}

function invest(f) {
  const pct = sliderPct[f.id] || 25
  const amt = calcAmt(f, pct)
  const r = game.buyFund(f.id, amt)
  if (r.ok) game.showToast(`✅ 投入成功 ¥${fmtNum(amt)}`, 'tp', 2000)
  else game.showToast(r.msg, 'sl', 3000)
}
function redeem(f) {
  const r = game.redeemFund(f.id)
  if (r.ok) game.showToast(`✅ 赎回成功 ¥${fmtNum(r.amount)}`, 'tp', 2000)
}
function donate() {
  const amt = calcCharityAmt(charityPct.value)
  const r = game.donateCharity(amt)
  if (r.ok) game.showToast(`❤️ 感谢捐款 ¥${fmtNum(amt)}！累计 ¥${fmtNum(game.charityTotal)}`, 'tp', 3000)
  else game.showToast(r.msg, 'sl', 3000)
}
</script>
