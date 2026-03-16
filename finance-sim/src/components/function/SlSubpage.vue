<template>
  <SubpageShell title="🎯 止盈止损" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="card" style="margin:0;">
        <div class="card-title">为持仓设置止盈止损</div>
        <div v-if="!game.positions.length" style="color:#999;text-align:center;padding:20px;">暂无持仓</div>
        <div v-for="p in game.positions" :key="p.id" class="sl-order-item">
          <div style="font-weight:600;font-size:14px;margin-bottom:6px;">
            {{ getStock(p.code)?.name }}
            <span style="font-size:11px;color:#aaa;margin-left:4px;">{{ p.direction === 'long' ? '多' : '空' }} {{ p.leverage }}x</span>
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:8px;">现价: ¥{{ getStock(p.code)?.price.toFixed(2) }} · 开仓: ¥{{ p.openPrice.toFixed(2) }}</div>
          <div style="display:flex;gap:8px;margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-size:11px;color:#ff5252;margin-bottom:3px;">止损价</div>
              <input type="number" v-model.number="slVals[p.id + '_sl']" placeholder="留空不设"
                style="width:100%;padding:7px;border:1px solid #f0f0f0;border-radius:6px;font-size:13px;outline:none;" />
            </div>
            <div style="flex:1;">
              <div style="font-size:11px;color:#00c48c;margin-bottom:3px;">止盈价</div>
              <input type="number" v-model.number="slVals[p.id + '_tp']" placeholder="留空不设"
                style="width:100%;padding:7px;border:1px solid #f0f0f0;border-radius:6px;font-size:13px;outline:none;" />
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;padding:8px;" @click="setOrder(p)">设置止盈止损</button>
          <div v-if="existingOrder(p.id)" style="font-size:12px;color:#4285f4;margin-top:4px;">
            当前: 止损 {{ existingOrder(p.id).sl || '--' }} / 止盈 {{ existingOrder(p.id).tp || '--' }}
          </div>
        </div>
      </div>
    </div>
  </SubpageShell>
</template>
<script setup>
import { reactive } from 'vue'
import { useGameStore } from '../../store/game.js'
import SubpageShell from './SubpageShell.vue'
defineEmits(['back'])
const game = useGameStore()
const slVals = reactive({})
function getStock(code) { return game.stocks.find(s => s.code === code) }
function existingOrder(posId) { return game.slOrders.find(o => o.positionId === posId) }
function setOrder(p) {
  const sl = slVals[p.id + '_sl'] || null
  const tp = slVals[p.id + '_tp'] || null
  game.setSLOrder(p.id, sl ? parseFloat(sl) : null, tp ? parseFloat(tp) : null)
  game.showToast('✅ 止盈止损已设置', 'tp', 2000)
}
</script>
