<script setup>
import { computed, ref } from 'vue'
import ResourceCard from '../components/ResourceCard.vue'
import {
  getNode,
  primaryResource,
  orderNodes,
  routeNodes,
  firstActiveNode,
  nodes
} from '../store/data.js'
import {
  getNodeStatus,
  isDailyDoneToday,
  markDailyDone
} from '../store/progress.js'

// 两条并行线（硬性要求：不合并）
const THEORY = 'theory'
const DAW = 'daw'

const theoryActive = computed(() => firstActiveNode(THEORY))
const dawActive = computed(() => firstActiveNode(DAW))

function laneInfo(route, activeNode) {
  if (!activeNode) return null
  const primary = primaryResource(activeNode.id)
  const nextId = (activeNode.next || [])[0]
  const nextNode = nextId ? getNode(nextId) : null
  return { node: activeNode, primary, nextNode }
}

const theoryLane = computed(() => laneInfo(THEORY, theoryActive.value))
const dawLane = computed(() => laneInfo(DAW, dawActive.value))

// 路线图：全部节点按线分组
const LINE_DEFS = [
  { key: 'theory', label: '乐理线' },
  { key: 'daw', label: 'DAW 线' },
  { key: 'project', label: '项目节点' },
  { key: 'ear', label: '每日练习' },
  { key: 'advanced', label: '进阶制作' },
  { key: 'later', label: '拓展（Later）' }
]

function lineOf(node) {
  if (node.type === 'project') return 'project'
  if (node.daily) return 'ear'
  if (node.type === 'later') return 'later'
  if ((node.routes || []).includes('theory')) return 'theory'
  if ((node.routes || []).includes('daw')) return 'daw'
  return 'advanced'
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

function isActiveNode(id) {
  return (
    (theoryActive.value && theoryActive.value.id === id) ||
    (dawActive.value && dawActive.value.id === id)
  )
}

// 每日练习
const dailyDone = computed(() => isDailyDoneToday())
const earNode = computed(() => getNode('ear'))

const showRoadmap = ref(false)

// 路线入口
const ROUTES = [
  { id: 'edm', label: 'EDM（默认路线）', highlight: true },
  { id: 'theory', label: '乐理线', highlight: false },
  { id: 'daw', label: 'DAW 线', highlight: false },
  { id: 'pop', label: '流行路线', highlight: false }
]
</script>

<template>
  <!-- 三件套：两线并行 -->
  <div class="lane-grid" style="margin-top: 14px">
    <div v-for="(lane, name) in { theory: theoryLane, daw: dawLane }" :key="name" class="lane">
      <div class="lane-label">
        {{ name === 'theory' ? '乐理线' : 'DAW 线' }}
        <span v-if="!lane" class="faint" style="font-weight: 400">· 已完成</span>
      </div>

      <template v-if="lane">
        <!-- 1. 当前学习 -->
        <div style="font-weight: 600; font-size: 16px">
          <router-link :to="'/node/' + lane.node.id">{{ lane.node.title }}</router-link>
        </div>
        <p class="muted" style="margin: 4px 0 10px">{{ lane.node.goal }}</p>

        <!-- 2. 当前资源 -->
        <div class="section-title" style="margin: 6px 0 4px">当前资源</div>
        <ResourceCard v-if="lane.primary" :resource="lane.primary" role="primary" />
        <p v-else class="muted">暂无主推资源</p>

        <!-- 3. 下一步预告 -->
        <div class="section-title" style="margin: 6px 0 4px">下一步预告</div>
        <router-link
          v-if="lane.nextNode"
          :to="'/node/' + lane.nextNode.id"
          class="next-link"
        >
          {{ lane.nextNode.title }} →
        </router-link>
        <span v-else class="faint">暂无</span>
      </template>
      <p v-else class="muted" style="margin: 0">这条线已全部完成 🎉</p>
    </div>
  </div>

  <!-- 每日练习 -->
  <div class="card" style="margin-top: 14px">
    <h3>每日练习 · 听力训练</h3>
    <div class="daily-box">
      <router-link :to="earNode ? '/node/' + earNode.id : '/node/ear'">
        今天练了吗
      </router-link>
      <button
        v-if="!dailyDone"
        class="btn primary-btn small"
        @click="markDailyDone"
      >
        打卡
      </button>
      <span v-else class="tag primary">今日已打卡 ✓</span>
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
    <p class="muted" style="margin: 0 0 8px">按类型 / 节点 / 难度 / 语言 / 价格筛选全部学习资源。</p>
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
        </router-link>
      </div>
    </template>
  </div>
</template>
