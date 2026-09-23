<script setup>
import { computed } from 'vue'
import {
  TYPE_LABELS,
  LANG_LABELS,
  LEVEL_LABELS,
  PRICE_LABELS,
  ROLE_LABELS
} from '../utils/labels.js'
import {
  getResourceStatus,
  setResourceStatus,
  removeUserResource,
  hideResource,
  STATUSES,
  STATUS_LABELS
} from '../store/progress.js'

const props = defineProps({
  resource: { type: Object, required: true },
  role: { type: String, default: '' },
  // 是否在资源库（管理场景）显示删除/隐藏操作
  manage: { type: Boolean, default: false }
})

const emit = defineEmits(['removed', 'hidden'])

const status = computed(() => getResourceStatus(props.resource.id))

function onStatusChange(e) {
  setResourceStatus(props.resource.id, e.target.value)
}

const metaTags = computed(() => {
  const r = props.resource
  const t = []
  if (r.lang) t.push(LANG_LABELS[r.lang] || r.lang)
  if (r.level) t.push(LEVEL_LABELS[r.level] || r.level)
  if (r.price) t.push(PRICE_LABELS[r.price] || r.price)
  if (r.type) t.push(TYPE_LABELS[r.type] || r.type)
  return t
})

const roleBadge = computed(() => (props.role ? ROLE_LABELS[props.role] : ''))

function onRemove() {
  if (window.confirm(`删除自定义资源「${props.resource.name}」？`)) {
    removeUserResource(props.resource.id)
    emit('removed', props.resource.id)
  }
}

function onHide() {
  if (window.confirm(`隐藏内置资源「${props.resource.name}」？可在「已隐藏」区恢复。`)) {
    hideResource(props.resource.id)
    emit('hidden', props.resource.id)
  }
}
</script>

<template>
  <div class="res-card">
    <div class="res-head">
      <div>
        <span v-if="roleBadge" class="badge" :class="'role-' + role">{{ roleBadge }}</span>
        <span v-if="resource.isCustom" class="badge custom-badge">自定义</span>
        <div class="res-name">{{ resource.name }}</div>
        <div class="res-author">{{ resource.author }}</div>
      </div>

      <div v-if="manage" class="res-actions">
        <button v-if="resource.isCustom" class="btn small" @click="onRemove">删除</button>
        <button v-else class="btn small" @click="onHide">隐藏</button>
      </div>
    </div>

    <div class="res-meta">
      <span v-for="t in metaTags" :key="t" class="tag">{{ t }}</span>
    </div>

    <div v-if="resource.why" class="res-why">{{ resource.why }}</div>

    <div v-if="resource.note" class="faint" style="margin-top: 6px">{{ resource.note }}</div>

    <div class="res-foot">
      <span v-if="resource.duration_h" class="faint">
        预计 {{ resource.duration_h }} 小时
      </span>

      <label class="faint" style="display: inline-flex; align-items: center; gap: 6px">
        状态
        <select :value="status" @change="onStatusChange">
          <option v-for="s in STATUSES" :key="s" :value="s">
            {{ STATUS_LABELS[s] }}
          </option>
        </select>
      </label>

      <a
        :href="resource.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn primary-btn"
      >
        前往资源 →
      </a>
    </div>
  </div>
</template>

