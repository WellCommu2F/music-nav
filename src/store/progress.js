import { reactive } from 'vue'

const NODE_PREFIX = 'node:'
const RES_PREFIX = 'res:'
const DAILY_PREFIX = 'daily:'

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
  daily: loadMap(DAILY_PREFIX)
})

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

export function isDailyDoneToday() {
  return state.daily[localDateStr()] === 'done'
}

export function markDailyDone() {
  const today = localDateStr()
  state.daily[today] = 'done'
  localStorage.setItem(DAILY_PREFIX + today, 'done')
}

export function clearAllProgress() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (
      k &&
      (k.startsWith(NODE_PREFIX) ||
        k.startsWith(RES_PREFIX) ||
        k.startsWith(DAILY_PREFIX))
    ) {
      keys.push(k)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
  Object.keys(state.nodes).forEach((k) => delete state.nodes[k])
  Object.keys(state.resources).forEach((k) => delete state.resources[k])
  Object.keys(state.daily).forEach((k) => delete state.daily[k])
}

export default state
