<template>
  <div class="sub-page">
    <div class="sub-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <span class="sub-title">⚙️ 存档设置</span>
    </div>

    <div style="padding:0 16px 16px;">
      <!-- Save info -->
      <div class="card" style="margin:12px 0;">
        <div class="card-title">存档信息</div>
        <div style="font-size:13px;color:#666;line-height:2;">
          <div>总资产：<span style="font-weight:700;color:#4285f4;">¥{{ fmtNum(store.totalAsset) }}</span></div>
          <div>可用现金：<span style="font-weight:700;">¥{{ fmtNum(store.cash) }}</span></div>
          <div>交易笔数：<span style="font-weight:700;">{{ store.history.length }}</span></div>
          <div v-if="saveInfo" style="color:#aaa;font-size:12px;">上次存档：{{ saveInfo }}</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">存档操作</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-primary" style="padding:12px;" @click="doSave">💾 立即保存</button>
          <button class="btn btn-success" style="padding:12px;" @click="doExport">📤 导出存档</button>
          <label class="btn btn-warning" style="padding:12px;text-align:center;cursor:pointer;">
            📥 导入存档
            <input type="file" accept=".json" style="display:none;" @change="doImport">
          </label>
          <button class="btn btn-danger" style="padding:12px;" @click="doReset">🗑️ 重置游戏</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="card" style="margin:0;">
        <div class="card-title">游戏统计</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:#f7f8fa;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:11px;color:#aaa;margin-bottom:3px;">历史峰值</div>
            <div style="font-weight:700;color:#4285f4;font-size:13px;">¥{{ fmtNum(store.peakAsset) }}</div>
          </div>
          <div style="background:#f7f8fa;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:11px;color:#aaa;margin-bottom:3px;">持仓数量</div>
            <div style="font-weight:700;color:#333;font-size:13px;">{{ store.positions.length }} 笔</div>
          </div>
          <div style="background:#f7f8fa;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:11px;color:#aaa;margin-bottom:3px;">贷款余额</div>
            <div style="font-weight:700;color:#ff5252;font-size:13px;">¥{{ fmtNum(store.loanBalance) }}</div>
          </div>
          <div style="background:#f7f8fa;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:11px;color:#aaa;margin-bottom:3px;">爆仓次数</div>
            <div style="font-weight:700;color:#ff5252;font-size:13px;">{{ store.liquidationBadgeCount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../store/game.js'
import { fmtNum } from '../../utils/format.js'

defineEmits(['back'])
const store = useGameStore()

const saveInfo = computed(() => {
  try {
    const raw = localStorage.getItem('financeSave_v8')
    if (!raw) return null
    const d = JSON.parse(raw)
    return d.saveTime || null
  } catch { return null }
})

function doSave() { store.saveGame() }

function doExport() {
  const data = store.getSaveData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `finance_save_${Date.now()}.json`; a.click()
  URL.revokeObjectURL(url)
  store.showToast('存档已导出', 'tp')
}

function doImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const ok = store.importSave(ev.target.result)
    store.showToast(ok ? '✅ 导入成功！' : '❌ 存档文件损坏', ok ? 'tp' : 'liq', 3000)
  }
  reader.readAsText(file)
  e.target.value = ''
}

function doReset() {
  if (confirm('确定要重置游戏吗？所有进度将清空！')) store.resetGame()
}
</script>
