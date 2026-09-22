<script setup>
import { computed } from 'vue'
import { routeNodes } from '../store/data.js'
import { getNodeStatus } from '../store/progress.js'

const props = defineProps({
  id: { type: String, required: true }
})

const ROUTE_LABELS = {
  theory: '乐理线',
  daw: 'DAW 线',
  edm: 'EDM 路线',
  pop: '流行路线'
}

const label = computed(() => ROUTE_LABELS[props.id] || props.id)
const list = computed(() => routeNodes(props.id))

const routeTabs = ['edm', 'theory', 'daw', 'pop']
</script>

<template>
  <div class="card" style="margin-top: 14px">
    <h1>我想做什么 · {{ label }}</h1>
    <div class="tags" style="margin: 8px 0">
      <router-link
        v-for="t in routeTabs"
        :key="t"
        :to="'/route/' + t"
        class="tag"
        :class="{ skill: t === id }"
      >
        {{ ROUTE_LABELS[t] }}
      </router-link>
    </div>
    <p class="muted">按依赖顺序排列的完整节点序列，点击进入节点页。</p>
  </div>

  <div v-if="!list.length" class="card">
    <p class="muted">该路线暂无节点。</p>
  </div>

  <div v-else>
    <router-link
      v-for="(n, i) in list"
      :key="n.id"
      :to="'/node/' + n.id"
      class="roadmap-node"
      :class="{ done: getNodeStatus(n.id) === 'done' }"
    >
      <span class="idx">{{ i + 1 }}</span>
      <span class="ttl">{{ n.title }}</span>
      <span v-if="n.type === 'project'" class="tag primary">项目</span>
      <span v-else-if="n.daily" class="tag">每日</span>
    </router-link>
  </div>
</template>
