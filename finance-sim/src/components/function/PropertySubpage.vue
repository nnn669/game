<template>
  <SubpageShell title="🏠 房产投资" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="property-cards">
        <div v-for="p in regularProps" :key="p.id" class="property-card">
          <div class="property-name">{{ p.name }}</div>
          <div class="property-price">总价: ¥{{ fmtNum(p.price) }}</div>
          <div class="property-down">首付: ¥{{ fmtNum(p.downPayment) }} (次供¥{{ fmtNum(p.monthly) }}/分钟×100期)</div>
          <div style="font-size:clamp(11px,2.8vw,13px);color:#999;margin-bottom:8px;">出租收益: +¥{{ fmtNum(p.rent) }}/30秒 | 逾期罚息: 5%/30秒</div>

          <!-- Owned: Full -->
          <template v-if="game.ownedProperties[p.id]?.type === 'full'">
            <div style="color:#00a572;font-size:13px;">✅ 全款已购 | 租金: +¥{{ fmtNum(p.rent) }}/30秒</div>
            <button class="btn" disabled style="margin-top:8px;width:100%;">已拥有</button>
          </template>

          <!-- Owned: Installment -->
          <template v-else-if="game.ownedProperties[p.id]?.type === 'installment'">
            <div style="font-size:12px;line-height:1.8;margin-bottom:8px;">
              分期中 ({{ game.ownedProperties[p.id].paidPeriods }}/{{ p.periods }}) | 次供: ¥{{ fmtNum(p.monthly) }}/1分钟<br>
              租金: +¥{{ fmtNum(p.rent) }}/30秒<br>
              逾期次数: <span style="color:#ff5252;font-weight:600;">{{ game.ownedProperties[p.id].overdueCount }}</span><br>
              剩余欠款: ¥{{ fmtNum(game.ownedProperties[p.id].totalOwed) }}
            </div>
            <button class="btn btn-warning" style="width:100%;" @click="prepay(p.id)">提前还款</button>
          </template>

          <!-- Not owned -->
          <template v-else>
            <div class="property-buttons">
              <button class="btn btn-primary" @click="buyFull(p.id)">全款 ¥{{ fmtNum(p.price) }}</button>
              <button class="btn btn-success" @click="buyInstall(p.id)">首付 ¥{{ fmtNum(p.downPayment) }}</button>
            </div>
          </template>
        </div>

        <!-- Villa card -->
        <div class="property-card" style="border:2px solid #ff9800;">
          <div class="property-name" style="color:#ff9800;">🏰 顶级别墅</div>
          <div style="font-size:13px;color:#555;margin-bottom:6px;">一次性全款 ¥2000万 · 解锁期货50x杠杆 + 银行贵宾服务</div>
          <div v-if="game.ownedProperties['villa']" style="color:#00c48c;font-weight:600;font-size:13px;">
            ✅ 已拥有 · 贵宾服务已解锁 · 50x杠杆已解锁
          </div>
          <button v-else class="btn btn-primary" style="width:100%;padding:10px;" @click="buyVilla">一次性购买 ¥2000万</button>
        </div>
      </div>
    </div>
  </SubpageShell>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../store/game.js'
import { PROPERTIES } from '../../data/properties.js'
import { fmtNum } from '../../utils/format.js'
import SubpageShell from './SubpageShell.vue'

defineEmits(['back'])
const game = useGameStore()
const regularProps = PROPERTIES.filter(p => !p.noInstall)

function buyFull(id) {
  const r = game.buyPropertyFull(id)
  const p = PROPERTIES.find(x => x.id === id)
  if (r.ok) game.showToast(`✅ 全款购买${p.name}成功！`, 'tp', 3000)
  else game.showToast(r.msg, 'sl', 3000)
}

function buyInstall(id) {
  const r = game.buyPropertyInstallment(id)
  const p = PROPERTIES.find(x => x.id === id)
  if (r.ok) game.showToast(`✅ 首付购买${p.name}成功！开始分期。`, 'tp', 3000)
  else game.showToast(r.msg, 'sl', 3000)
}

function prepay(id) {
  const r = game.prepayProperty(id)
  const p = PROPERTIES.find(x => x.id === id)
  if (r.ok) game.showToast(`✅ 提前还款成功！支付总额 ¥${fmtNum(r.amount)}`, 'tp', 3000)
  else game.showToast(r.msg, 'sl', 3000)
}

function buyVilla() {
  const r = game.buyVilla()
  if (r.ok) game.showToast('🏰 顶级别墅购买成功！已解锁贵宾服务', 'tp', 4000)
  else game.showToast(r.msg, 'sl', 3000)
}
</script>
