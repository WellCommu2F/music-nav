import { ref, computed } from 'vue'
import {
  getNodeStatus,
  getUserResources,
  getHiddenResources
} from './progress.js'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

async function loadData() {
  try {
    const base = import.meta.env.BASE_URL || './'
    const res = await fetch(`${base}data/data.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

// 内置资源（data.json 原始数据，未过滤）
function builtinResources() {
  return data.value ? data.value.resources : []
}

function nodes() {
  return data.value ? data.value.nodes : []
}

// 全部资源 = 内置（剔除已隐藏）+ 自定义，自定义带 isCustom 标记
function resources() {
  const hidden = getHiddenResources()
  const builtin = builtinResources()
    .filter((r) => !hidden.includes(r.id))
    .map((r) => ({ ...r, isCustom: false }))
  const custom = getUserResources().map((r) => ({ ...r, isCustom: true }))
  return [...builtin, ...custom]
}

function getNode(id) {
  return nodes().find((n) => n.id === id)
}

function getResource(id) {
  return resources().find((r) => r.id === id)
}

// 某个节点挂载的全部资源（含 note 说明的例外情况）
function resourcesForNode(nodeId) {
  return resources().filter((r) => (r.nodes || []).includes(nodeId))
}

// 按 role 取该节点的资源
function resourcesByRole(nodeId, role) {
  return resourcesForNode(nodeId).filter((r) => r.role === role)
}

// 该节点的 primary 资源（铁律：每个节点最多 1 个）
function primaryResource(nodeId) {
  return resourcesByRole(nodeId, 'primary')[0] || null
}

// 类型为 tool 的资源
function toolResources(nodeId) {
  return resourcesForNode(nodeId).filter((r) => r.type === 'tool')
}

// 全局拓扑排序（尊重全部 prereq 依赖，含跨路线依赖）
function globalTopoIds() {
  const all = nodes()
  const ids = new Set(all.map((n) => n.id))
  const indegree = {}
  const adj = {}
  all.forEach((n) => {
    indegree[n.id] = 0
    adj[n.id] = []
  })
  all.forEach((n) => {
    ;(n.prereq || []).forEach((p) => {
      if (ids.has(p)) {
        indegree[n.id] += 1
        adj[p].push(n.id)
      }
    })
  })
  const queue = all.filter((n) => indegree[n.id] === 0).map((n) => n.id)
  const order = []
  while (queue.length) {
    const id = queue.shift()
    order.push(id)
    adj[id].forEach((next) => {
      indegree[next] -= 1
      if (indegree[next] === 0) queue.push(next)
    })
  }
  all.forEach((n) => {
    if (!order.includes(n.id)) order.push(n.id)
  })
  return order
}

// 按全局依赖顺序排列任意节点子集
function orderNodes(nodeList) {
  const global = globalTopoIds()
  const index = {}
  global.forEach((id, i) => (index[id] = i))
  return [...nodeList].sort(
    (a, b) => (index[a.id] ?? 9999) - (index[b.id] ?? 9999)
  )
}

// 某条 route 的节点序列（按全局依赖排序）
function routeNodes(route) {
  const list = nodes().filter((n) => (n.routes || []).includes(route))
  return orderNodes(list)
}

// 某条 route 的第一个非 done 节点
// 依赖：data.value.nodes（节点表）+ state.nodes（进度）——两者都是响应式的，
// 所以在 computed 中调用时会自动重算。
function firstActiveNode(route) {
  const list = routeNodes(route)
  return list.find((n) => getNodeStatus(n.id) !== 'done') || null
}

// 供组件使用的响应式版本：三条线的当前节点。
// 显式建立依赖，避免调用方遗漏 computed 包装。
function useLaneActive() {
  return computed(() => ({
    theory: firstActiveNode('theory'),
    daw: firstActiveNode('daw'),
    skills: firstActiveNode('skills')
  }))
}

// 某个节点在「主线序」中的前一个节点（用于节点页返回导航）
// 多路线时取该节点所属路线的第一个（主线序），沿该路线序列取前驱。
// 路线内已是首个节点（含首页起点节点）时返回 null —— 不回退到全局序，
// 避免把与用户认知无关的节点当成「上一站」。
const ROUTE_PRIORITY = ['theory', 'daw', 'skills', 'edm', 'pop', 'project', 'later']

function mainRouteOf(node) {
  const routes = node.routes || []
  return ROUTE_PRIORITY.find((r) => routes.includes(r)) || routes[0] || null
}

function prevNodeOf(nodeId) {
  const node = getNode(nodeId)
  if (!node) return null

  const route = mainRouteOf(node)
  if (!route) return null

  const list = routeNodes(route)
  const i = list.findIndex((n) => n.id === nodeId)
  return i > 0 ? list[i - 1] : null
}

export {
  data,
  loading,
  error,
  loadData,
  nodes,
  resources,
  builtinResources,
  getNode,
  getResource,
  resourcesForNode,
  resourcesByRole,
  primaryResource,
  toolResources,
  orderNodes,
  routeNodes,
  firstActiveNode,
  useLaneActive,
  prevNodeOf,
  dailyNodes
}

// 全部每日练习节点（daily: true），按全局依赖序
function dailyNodes() {
  return orderNodes(nodes().filter((n) => n.daily))
}