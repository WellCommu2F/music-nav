<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResourceCard from '../components/ResourceCard.vue'
import {
  getNode,
  resourcesForNode,
  primaryResource,
  prevNodeOf
} from '../store/data.js'
import {
  getNodeStatus,
  setNodeStatus,
  STATUSES,
  STATUS_LABELS
} from '../store/progress.js'

const route = useRoute()
const router = useRouter()
const nodeId = computed(() => route.params.id)
const node = computed(() => getNode(nodeId.value))

// 上一站：按该节点所在路线的顺序取前一个节点（多路线时取主线序）。
// 首页首个节点（无前驱）时返回 null，不显示返回导航。
const prevNode = computed(() =>
  node.value ? prevNodeOf(node.value.id) : null
)

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const status = computed(() => getNodeStatus(nodeId.value))

const primary = computed(() =>
  node.value ? primaryResource(node.value.id) : null
)
const alternatives = computed(() =>
  node.value
    ? resourcesForNode(node.value.id).filter(
        (r) => r.role === 'alternative' && r.type !== 'tool'
      )
    : []
)
const tools = computed(() =>
  node.value
    ? resourcesForNode(node.value.id).filter((r) => r.type === 'tool')
    : []
)
const laterRef = computed(() =>
  node.value
    ? resourcesForNode(node.value.id).filter(
        (r) =>
          (r.role === 'later' || r.role === 'reference') && r.type !== 'tool'
      )
    : []
)

const isProject = computed(() => node.value && node.value.type === 'project')

// 项目节点交付物清单：由 skills 字段派生（不作任何扩写）
const deliverables = computed(() =>
  node.value && node.value.skills ? node.value.skills : []
)

const nextNode = computed(() => {
  if (!node.value) return null
  const nextId = (node.value.next || [])[0]
  return nextId ? getNode(nextId) : null
})

function markDone() {
  setNodeStatus(nodeId.value, 'done')
}
</script>

<template>
  <div v-if="!node" class="card">
    <p>未找到该节点。</p>
    <router-link to="/" class="btn">回到首页</router-link>
  </div>

  <div v-else>
    <!-- 顶部导航：浏览器式返回 + 上一站 -->
    <div class="node-nav">
      <button class="btn small" @click="goBack">← 返回</button>
      <router-link
        v-if="prevNode"
        :to="'/node/' + prevNode.id"
        class="prev-link"
      >
        上一站：{{ prevNode.title }}
      </router-link>
      <span v-else class="faint">这是本线的起点</span>
    </div>

    <div class="card">
      <h1>{{ node.title }}</h1>

      <div class="status-control" style="margin: 10px 0">
        <button
          v-for="s in STATUSES"
          :key="s"
          class="st"
          :class="[status === s ? 'active' : '', 'st-' + s]"
          @click="setNodeStatus(nodeId, s)"
        >
          {{ STATUS_LABELS[s] }}
        </button>
      </div>

      <p class="goal" style="font-size: 17px; font-weight: 500">
        {{ node.goal }}
      </p>

      <div class="tags">
        <span v-for="sk in node.skills" :key="sk" class="tag skill">
          {{ sk }}
        </span>
      </div>
    </div>

    <!-- 项目节点：交付物清单 -->
    <template v-if="isProject">
      <div class="card">
        <h2>交付物清单</h2>
        <p class="muted" style="margin-top: 0">
          完成作品即通过该节点，逐项确认你的作品是否包含：
        </p>
        <div
          v-for="d in deliverables"
          :key="d"
          class="deliverable"
        >
          <span class="ttl">{{ d }}</span>
        </div>
      </div>
    </template>

    <!-- 非项目节点：资源区 -->
    <template v-else>
      <div v-if="primary" class="section-title">Recommended · 主推资源</div>
      <ResourceCard v-if="primary" :resource="primary" role="primary" />

      <div v-if="alternatives.length" class="section-title">Alternative · 备选资源</div>
      <ResourceCard
        v-for="r in alternatives"
        :key="r.id"
        :resource="r"
        role="alternative"
      />

      <div v-if="tools.length" class="section-title">工具 · 交互练习</div>
      <ResourceCard v-for="r in tools" :key="r.id" :resource="r" role="tool" />

      <details v-if="laterRef.length">
        <summary>Later / Reference · 稍后与参考（{{ laterRef.length }}）</summary>
        <div class="inner">
          <ResourceCard
            v-for="r in laterRef"
            :key="r.id"
            :resource="r"
            :role="r.role"
          />
        </div>
      </details>

      <p v-if="!primary && !alternatives.length && !tools.length && !laterRef.length" class="muted">
        该节点暂未挂接资源。
      </p>
    </template>

    <!-- 底部固定：下一步 / 交付物完成标记 -->
    <div class="next-box">
      <div class="next-box-inner">
        <template v-if="isProject">
          <button class="btn done-btn" @click="markDone">
            标记项目完成
          </button>
          <span class="muted">当前状态：{{ STATUS_LABELS[status] }}</span>
        </template>

        <template v-else-if="nextNode">
          <button class="btn done-btn" @click="markDone">标记完成</button>
          <router-link
            :to="'/node/' + nextNode.id"
            class="next-link"
          >
            下一步：{{ nextNode.title }} →
          </router-link>
        </template>

        <template v-else>
          <button class="btn done-btn" @click="markDone">标记完成</button>
          <router-link to="/" class="next-link">回到首页 →</router-link>
        </template>
      </div>
    </div>
  </div>
</template>
