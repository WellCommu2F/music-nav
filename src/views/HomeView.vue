<script setup>
import { computed, ref } from 'vue'
import ResourceCard from '../components/ResourceCard.vue'
import {
  getNode,
  primaryResource,
  orderNodes,
  routeNodes,
  firstActiveNode,
  dailyNodes,
  nodes
} from '../store/data.js'
import {
  getNodeStatus,
  isDailyDoneToday,
  markDailyDone,
  unmarkDailyDone
} from '../store/progress.js'

// 三根并行线（硬性要求：不合并、互不影响）
const LANES = [
  { key: 'theory', label: '乐理线' },
  { key: 'daw', label: 'DAW 线' },
  { key: 'skills', label: '技能线' }
]

function laneInfo(route) {
  const activeNode = firstActiveNode(route)
  if (!activeNode) return null
  const primary = primaryResource(activeNode.id)
  const nextId = (activeNode.next || [])[0]
  const nextNode = nextId ? getNode(nextId) : null
  return { node: activeNode, primary, nextNode }
}

const laneData = computed(() =>
  LANES.map((l) => ({ ...l, info: laneInfo(l.key) }))
)

// 路线图：按 乐理/DAW/技能/汇合后 四组分组
const LINE_DEFS = [
  { key: 'theory', label: '乐理线' },
  { key: 'daw', label: 'DAW 线' },
  { key: 'skills', label: '技能线' },
  { key: 'merge', label: '汇合后' }
]

const MERGE_ROUTES = ['project', 'edm', 'pop', 'arrangement', 'later']

function lineOf(node) {
  const routes = node.routes || []
  // 项目节点与「汇合后」的进阶/拓展内容统一归入「汇合后」
  if (node.type === 'project') return 'merge'
  if (node.type === 'later') return 'merge'
  if (routes.includes('theory')) return 'theory'
  if (routes.includes('daw')) return 'daw'
  if (routes.includes('skills')) return 'skills'
  if (routes.some((r) => MERGE_ROUTES.includes(r))) return 'merge'
  return 'merge'
}

const roadmap = computed(() => {
  const all = nodes()
  return LINE_DEFS.map((line) => ({
    ...line,
    nodes: orderNodes(all.filter((n) => lineOf(n) === line.key))
  })).filter((line) => line.nodes.length > 0)
})

function nodeStatus(node) {
  return getNodeStatus(node.id)
}

const activeIds = computed(
  () =>
    new Set(
      laneData.value
        .map((l) => (l.info ? l.info.node.id : null))
        .filter(Boolean)
    )
)

function isActiveNode(id) {
  return activeIds.value.has(id)
}

// 每日练习：渲染所有 daily: true 的节点，各自独立打卡
const dailies = computed(() =>
  dailyNodes().map((n) => ({
    node: n,
    done: isDailyDoneToday(n.id)
  }))
)

const showRoadmap = ref(false)

// 路线入口
const ROUTES = [
  { id: 'edm', label: 'EDM（默认路线）', highlight: true },
  { id: 'theory', label: '乐理线', highlight: false },
  { id: 'daw', label: 'DAW 线', highlight: false },
  { id: 'skills', label: '技能线', highlight: false },
  { id: 'pop', label: '流行路线', highlight: false }
]
</script>

<template>
  <!-- 三件套：三线并行 -->
  <div class="lane-grid" style="margin-top: 14px">
    <div v-for="lane in laneData" :key="lane.key" class="lane">
      <div class="lane-label">
        {{ lane.label }}
        <span v-if="!lane.info" class="faint" style="font-weight: 400">· 已完成</span>
      </div>

      <template v-if="lane.info">
        <!-- 1. 当前学习 -->
        <div style="font-weight: 600; font-size: 16px">
          <router-link :to="'/node/' + lane.info.node.id">{{ lane.info.node.title }}</router-link>
        </div>
        <p class="muted" style="margin: 4px 0 10px">{{ lane.info.node.goal }}</p>

        <!-- 2. 当前资源 -->
        <div class="section-title" style="margin: 6px 0 4px">当前资源</div>
        <ResourceCard v-if="lane.info.primary" :resource="lane.info.primary" role="primary" />
        <p v-else class="muted">暂无主推资源</p>

        <!-- 3. 下一步预告 -->
        <div class="section-title" style="margin: 6px 0 4px">下一步预告</div>
        <router-link
          v-if="lane.info.nextNode"
          :to="'/node/' + lane.info.nextNode.id"
          class="next-link"
        >
          {{ lane.info.nextNode.title }} →
        </router-link>
        <span v-else class="faint">暂无</span>
      </template>
      <p v-else class="muted" style="margin: 0">这条线已全部完成 🎉</p>
    </div>
  </div>

  <!-- 每日练习：渲染所有 daily 节点，各自独立打卡 -->
  <div class="card" style="margin-top: 14px">
    <h3>每日练习</h3>
    <div
      v-for="d in dailies"
      :key="d.node.id"
      class="daily-box"
      style="margin-top: 10px"
    >
      <router-link :to="'/node/' + d.node.id" style="font-weight: 500">
        {{ d.node.title }}
      </router-link>
      <span class="faint">{{ d.node.goal }}</span>
      <button
        v-if="!d.done"
        class="btn primary-btn small"
        @click="markDailyDone(d.node.id)"
      >
        今天练了吗 · 打卡
      </button>
      <span v-else class="tag primary" style="cursor: pointer" @click="unmarkDailyDone(d.node.id)">
        今日已打卡 ✓
      </span>
    </div>
  </div>

  <!-- 我想做什么 -->
  <div class="card">
    <h3>我想做什么</h3>
    <div class="tags">
      <router-link
        v-for="r in ROUTES"
        :key="r.id"
        :to="'/route/' + r.id"
        class="tag"
        :class="{ skill: r.highlight }"
      >
        {{ r.label }}
      </router-link>
    </div>
  </div>

  <!-- 资源库入口 -->
  <div class="card">
    <h3>资源库</h3>
    <p class="muted" style="margin: 0 0 8px">按类型 / 节点 / 难度 / 语言 / 价格筛选全部学习资源，可增删改。</p>
    <router-link to="/library" class="btn">进入资源库 →</router-link>
  </div>

  <!-- 可折叠路线图 -->
  <div class="card">
    <button class="btn" @click="showRoadmap = !showRoadmap">
      {{ showRoadmap ? '收起路线图' : '展开路线图' }}
    </button>

    <template v-if="showRoadmap">
      <div v-for="line in roadmap" :key="line.key" style="margin-top: 14px">
        <div class="section-title" style="margin: 12px 0 4px">{{ line.label }}</div>
        <router-link
          v-for="(n, i) in line.nodes"
          :key="n.id"
          :to="'/node/' + n.id"
          class="roadmap-node"
          :class="{ done: nodeStatus(n) === 'done', active: isActiveNode(n.id) }"
        >
          <span class="idx">{{ i + 1 }}</span>
          <span class="ttl">{{ n.title }}</span>
          <span v-if="n.daily" class="tag">每日</span>
          <span v-else-if="n.type === 'project'" class="tag primary">项目</span>
          <span v-else-if="n.type === 'later'" class="tag alt">Later</span>
        </router-link>
      </div>
    </template>
  </div>
</template>
