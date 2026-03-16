<template>
  <SubpageShell title="🏦 银行贷款" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <!-- Debt Status -->
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">当前债务</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:clamp(12px,3.2vw,14px);color:#666;">未还本金</span>
          <span style="font-size:clamp(18px,5vw,22px);font-weight:700;color:#ff5252;">¥{{ fmtNum(game.loanBalance) }}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:clamp(12px,3.2vw,14px);color:#666;">累计利息 (年化12%)</span>
          <span style="font-size:clamp(14px,4vw,17px);font-weight:600;color:#ff9800;">¥{{ fmtNum(game.loanInterest) }}</span>
        </div>
      </div>

      <!-- Mortgage -->
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">🏛️ 股票质押贷款</div>
        <div style="font-size:12px;color:#888;margin-bottom:10px;line-height:1.6;">
          以现货持仓为抵押，最高可借市值 <b style="color:#4285f4;">70%</b>，年化利率 <b style="color:#ff9800;">18%</b>
        </div>
        <div v-if="!mortgagePositions.length" style="color:#bbb;font-size:13px;text-align:center;padding:12px 0;">暂无现货持仓可抵押</div>
        <div v-for="mp in mortgagePositions" :key="mp.code" style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
            <span style="font-weight:600;">{{ mp.name }}</span>
            <span style="color:#4285f4;">市值 ¥{{ fmtNum(mp.mktVal) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px;">
            <span>借款比例 {{ mortgagePct[mp.code] || 50 }}%</span>
            <span style="font-weight:700;color:#4285f4;">¥{{ fmtNum(Math.floor(mp.mktVal * 0.7 * (mortgagePct[mp.code] || 50) / 100)) }}</span>
          </div>
          <input type="range" min="10" max="70" step="5" :value="mortgagePct[mp.code] || 50"
            @input="e => mortgagePct[mp.code] = parseInt(e.target.value)"
            style="width:100%;accent-color:#4285f4;cursor:pointer;margin-bottom:8px;" />
          <button class="btn btn-primary" style="width:100%;" @click="doMortgage(mp.code)">确认质押借款</button>
        </div>
      </div>

      <!-- Loan Options -->
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">申请贷款</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="opt in LOAN_OPTIONS" :key="opt.id" class="loan-option">
            <div>
              <div style="font-size:14px;font-weight:700;">{{ opt.icon }} {{ opt.label }}</div>
              <div style="font-size:12px;color:#888;">年化 {{ (opt.rate * 100).toFixed(0) }}% · {{ opt.duration }}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:15px;font-weight:700;color:#4285f4;">¥{{ fmtNum(opt.amount) }}</div>
              <button class="btn btn-primary" style="padding:6px 14px;font-size:12px;margin-top:4px;" @click="doLoan(opt)">借款</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Repay -->
      <div class="card" style="margin:0;">
        <div class="card-title">还款</div>
        <div style="display:flex;justify-content:space-between;font-size:clamp(11px,3vw,13px);color:#555;margin-bottom:4px;">
          <span>还款金额</span>
          <span style="font-weight:700;color:#ff5252;">¥{{ fmtNum(repayAmount) }} ({{ repayPct }}%)</span>
        </div>
        <input type="range" min="0" max="100" step="1" v-model.number="repayPct"
          style="width:100%;accent-color:#ff5252;cursor:pointer;margin-bottom:8px;" />
        <div style="display:flex;gap:8px;">
          <button class="btn btn-danger" style="flex:1;padding:11px;" @click="doRepay">确认还款</button>
          <button class="btn" style="padding:11px 14px;" @click="repayPct = 100">全额</button>
        </div>
        <div v-if="repayMsg" style="margin-top:10px;font-size:clamp(12px,3.2vw,14px);min-height:18px;" :style="{ color: repayOk ? '#00c48c' : '#ff5252' }">{{ repayMsg }}</div>
      </div>
    </div>
  </SubpageShell>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useGameStore } from '../../store/game.js'
import { LOAN_OPTIONS } from '../../data/properties.js'
import { fmtNum } from '../../utils/format.js'
import SubpageShell from './SubpageShell.vue'

defineEmits(['back'])
const game = useGameStore()
const repayPct  = ref(100)
const repayMsg  = ref('')
const repayOk   = ref(true)
const mortgagePct = reactive({})

const repayAmount = computed(() => {
  const bal = game.loanBalance
  const maxPay = Math.min(bal, game.cash)
  return Math.round(maxPay * repayPct.value / 100)
})

const mortgagePositions = computed(() => {
  const map = {}
  game.positions.filter(p => p.leverage === 1 && p.direction === 'long' && !p.isFutures).forEach(p => {
    const s = game.stocks.find(x => x.code === p.code)
    if (!s) return
    if (!map[p.code]) map[p.code] = { code: p.code, name: s.name, qty: 0, mktVal: 0 }
    map[p.code].qty += p.quantity
    map[p.code].mktVal = s.price * map[p.code].qty
  })
  return Object.values(map)
})

function doLoan(opt) {
  game.takeLoan(opt.amount)
  game.showToast(`✅ 贷款成功 ¥${fmtNum(opt.amount)}`, 'tp', 3000)
}

function doRepay() {
  const r = game.repayLoan(repayAmount.value)
  if (r.ok) { repayMsg.value = `✅ 还款 ¥${fmtNum(r.paid)} 成功`; repayOk.value = true }
  else      { repayMsg.value = r.msg; repayOk.value = false }
  setTimeout(() => repayMsg.value = '', 3000)
}

function doMortgage(code) {
  const pct = mortgagePct[code] || 50
  const r   = game.mortgageLoan(code, pct)
  if (r.ok) game.showToast(`✅ 质押借款 ¥${fmtNum(r.amount)}`, 'tp', 3000)
  else      game.showToast(r.msg, 'sl', 3000)
}
</script>
