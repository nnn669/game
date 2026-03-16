<template>
  <SubpageShell title="📰 市场新闻" @back="$emit('back')">
    <div style="padding:0 16px 16px;">
      <div class="card" style="margin:0;">
        <div v-if="!game.newsHistory.length" style="color:#999;text-align:center;padding:20px;">暂无新闻</div>
        <div v-for="(n, i) in game.newsHistory" :key="i" class="news-item">
          <div style="margin-bottom:4px;">
            <span :class="['news-tag', n.type === 'bull' ? 'news-tag-bull' : n.type === 'bear' ? 'news-tag-bear' : '']">
              {{ n.tag }}
            </span>
            <span style="font-size:13px;font-weight:600;">{{ n.msg }}</span>
          </div>
          <div style="font-size:11px;color:#aaa;">{{ n.time }}</div>
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
