<template>
  <div>
    <!-- Function Hub -->
    <div v-if="!activeSubpage" id="function-main">
      <div class="fn-section-label">投资工具</div>
      <div class="fn-row fn-row-3">
        <div class="fn-card" @click="open('property')"><div class="fn-icon">🏠</div><div class="fn-name">房产投资</div><div class="fn-desc">购房/分期/出租</div></div>
        <div class="fn-card" @click="open('fund')"><div class="fn-icon">📊</div><div class="fn-name">理财基金</div><div class="fn-desc">稳健/成长/公益</div></div>
        <div class="fn-card" @click="open('loan')"><div class="fn-icon">🏦</div><div class="fn-name">银行贷款</div><div class="fn-desc">借款/还款</div></div>
      </div>
      <div class="fn-section-label">市场功能</div>
      <div class="fn-row fn-row-2">
        <div class="fn-card" @click="open('ipo')"><div class="fn-icon">🚀</div><div class="fn-name">IPO申购</div><div class="fn-desc">新股认购</div></div>
        <div class="fn-card" @click="open('company')"><div class="fn-icon">🏢</div><div class="fn-name">上市公司</div><div class="fn-desc">经营/管理</div></div>
      </div>
      <div class="fn-row fn-row-2">
        <div class="fn-card" @click="open('sl')"><div class="fn-icon">🎯</div><div class="fn-name">止盈止损</div><div class="fn-desc">自动止盈止损</div></div>
        <div class="fn-card" @click="open('news')"><div class="fn-icon">📰</div><div class="fn-name">市场新闻</div><div class="fn-desc">行情资讯</div></div>
      </div>
      <div class="fn-section-label">其他</div>
      <div class="fn-row fn-row-3">
        <div class="fn-card" @click="open('ranking')"><div class="fn-icon">🏆</div><div class="fn-name">资产排名</div></div>
        <div class="fn-card" @click="open('vip')"><div class="fn-icon">👑</div><div class="fn-name">贵宾服务</div></div>
        <div class="fn-card" @click="open('settings')"><div class="fn-icon">⚙️</div><div class="fn-name">存档设置</div></div>
      </div>
      <div class="fn-row fn-row-1">
        <div class="fn-card fn-card-wide" @click="open('redeem')"><div class="fn-icon">🎁</div><div class="fn-name">兑换码</div><div class="fn-desc">输入兑换码领取奖励</div></div>
      </div>
    </div>

    <!-- Sub Pages -->
    <PropertySubpage v-if="activeSubpage === 'property'" @back="close" />
    <FundSubpage     v-if="activeSubpage === 'fund'"     @back="close" />
    <LoanSubpage     v-if="activeSubpage === 'loan'"     @back="close" />
    <IpoSubpage      v-if="activeSubpage === 'ipo'"      @back="close" />
    <CompanySubpage  v-if="activeSubpage === 'company'"  @back="close" />
    <SlSubpage       v-if="activeSubpage === 'sl'"       @back="close" />
    <NewsSubpage     v-if="activeSubpage === 'news'"     @back="close" />
    <RankingSubpage  v-if="activeSubpage === 'ranking'"  @back="close" />
    <VipSubpage      v-if="activeSubpage === 'vip'"      @back="close" />
    <SettingsSubpage v-if="activeSubpage === 'settings'" @back="close" />
    <RedeemSubpage   v-if="activeSubpage === 'redeem'"   @back="close" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PropertySubpage from '../components/function/PropertySubpage.vue'
import FundSubpage     from '../components/function/FundSubpage.vue'
import LoanSubpage     from '../components/function/LoanSubpage.vue'
import IpoSubpage      from '../components/function/IpoSubpage.vue'
import CompanySubpage  from '../components/function/CompanySubpage.vue'
import SlSubpage       from '../components/function/SlSubpage.vue'
import NewsSubpage     from '../components/function/NewsSubpage.vue'
import RankingSubpage  from '../components/function/RankingSubpage.vue'
import VipSubpage      from '../components/function/VipSubpage.vue'
import SettingsSubpage from '../components/function/SettingsSubpage.vue'
import RedeemSubpage   from '../components/function/RedeemSubpage.vue'

// eslint-disable-next-line no-unused-vars

const activeSubpage = ref(null)
function open(name) { activeSubpage.value = name }
function close()    { activeSubpage.value = null }
</script>
