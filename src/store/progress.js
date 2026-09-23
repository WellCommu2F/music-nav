import { reactive } from 'vue'

const NODE_PREFIX = 'node:'
const RES_PREFIX = 'res:'
const DAILY_PREFIX = 'daily:'
const USER_RES_KEY = 'user_resources'
const HIDDEN_RES_KEY = 'hidden_resources'

export const STATUSES = ['todo', 'learning', 'done', 'skipped']

export const STATUS_LABELS = {
  todo: '未开始',
  learning: '学习中',
  done: '已完成',
  skipped: '已跳过'
}

function loadMap(prefix) {
  const map = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) {
      map[k.slice(prefix.length)] = localStorage.getItem(k)
    }
  }
  return map
}

function localDateStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const state = reactive({
  nodes: loadMap(NODE_PREFIX),
  resources: loadMap(RES_PREFIX),
  daily: loadMap(DAILY_PREFIX),
  userResources: loadJSONList(USER_RES_KEY),
  hiddenResources: loadJSONList(HIDDEN_RES_KEY)
})

function loadJSONList(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

function persistJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    /* 存储不可用时静默降级，仅内存生效 */
  }
}

function setStatus(prefix, bucket, id, status) {
  if (!STATUSES.includes(status)) return
  bucket[id] = status
  localStorage.setItem(prefix + id, status)
}

export function getNodeStatus(id) {
  return state.nodes[id] || 'todo'
}

export function setNodeStatus(id, status) {
  setStatus(NODE_PREFIX, state.nodes, id, status)
}

export function getResourceStatus(id) {
  return state.resources[id] || 'todo'
}

export function setResourceStatus(id, status) {
  setStatus(RES_PREFIX, state.resources, id, status)
}

// 每日打卡 key：daily:<日期>:<节点 id>
// 仅记录「今天是否练过」这一天，不统计连续天数/不断天数
function dailyKey(nodeId) {
  return `${DAILY_PREFIX}${localDateStr()}:${nodeId}`
}

export function isDailyDoneToday(nodeId) {
  if (!nodeId) return false
  return state.daily[dailyKey(nodeId)] === 'done' || false
}

export function markDailyDone(nodeId) {
  if (!nodeId) return
  const k = dailyKey(nodeId)
  state.daily[k] = 'done'
  localStorage.setItem(k, 'done')
}

export function unmarkDailyDone(nodeId) {
  if (!nodeId) return
  const k = dailyKey(nodeId)
  delete state.daily[k]
  localStorage.removeItem(k)
}

// —— 自定义资源（user_resources）——
export function getUserResources() {
  return state.userResources
}

export function addUserResource(res) {
  state.userResources.push(res)
  persistJSON(USER_RES_KEY, state.userResources)
}

export function removeUserResource(id) {
  const i = state.userResources.findIndex((r) => r.id === id)
  if (i >= 0) {
    state.userResources.splice(i, 1)
    persistJSON(USER_RES_KEY, state.userResources)
  }
}

export function setUserResources(list) {
  state.userResources.splice(0, state.userResources.length, ...(list || []))
  persistJSON(USER_RES_KEY, state.userResources)
}

// —— 隐藏资源（内置资源不可删，只能隐藏）——
export function getHiddenResources() {
  return state.hiddenResources
}

export function isResourceHidden(id) {
  return state.hiddenResources.includes(id)
}

export function hideResource(id) {
  if (!state.hiddenResources.includes(id)) {
    state.hiddenResources.push(id)
    persistJSON(HIDDEN_RES_KEY, state.hiddenResources)
  }
}

export function unhideResource(id) {
  const i = state.hiddenResources.indexOf(id)
  if (i >= 0) {
    state.hiddenResources.splice(i, 1)
    persistJSON(HIDDEN_RES_KEY, state.hiddenResources)
  }
}

export function setHiddenResources(list) {
  state.hiddenResources.splice(0, state.hiddenResources.length, ...(list || []))
  persistJSON(HIDDEN_RES_KEY, state.hiddenResources)
}

export function clearAllProgress() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (
      k &&
      (k.startsWith(NODE_PREFIX) ||
        k.startsWith(RES_PREFIX) ||
        k.startsWith(DAILY_PREFIX) ||
        k === USER_RES_KEY ||
        k === HIDDEN_RES_KEY)
    ) {
      keys.push(k)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
  Object.keys(state.nodes).forEach((k) => delete state.nodes[k])
  Object.keys(state.resources).forEach((k) => delete state.resources[k])
  Object.keys(state.daily).forEach((k) => delete state.daily[k])
  state.userResources.splice(0, state.userResources.length)
  state.hiddenResources.splice(0, state.hiddenResources.length)
}

export default state
