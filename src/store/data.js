import { ref } from 'vue'
import { getNodeStatus } from './progress.js'

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

function nodes() {
  return data.value ? data.value.nodes : []
}

function resources() {
  return data.value ? data.value.resources : []
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
function firstActiveNode(route) {
  const list = routeNodes(route)
  return list.find((n) => getNodeStatus(n.id) !== 'done') || null
}

export {
  data,
  loading,
  error,
  loadData,
  nodes,
  resources,
  getNode,
  getResource,
  resourcesForNode,
  resourcesByRole,
  primaryResource,
  toolResources,
  orderNodes,
  routeNodes,
  firstActiveNode
}