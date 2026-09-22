<script setup>
import { computed, ref } from 'vue'
import ResourceCard from '../components/ResourceCard.vue'
import { resources, nodes } from '../store/data.js'
import {
  TYPE_LABELS,
  LANG_LABELS,
  LEVEL_LABELS,
  PRICE_LABELS
} from '../utils/labels.js'

const fType = ref('')
const fNode = ref('')
const fLevel = ref('')
const fLang = ref('')
const fPrice = ref('')

const typeOptions = Object.entries(TYPE_LABELS)
const langOptions = Object.entries(LANG_LABELS)
const levelOptions = Object.entries(LEVEL_LABELS)
const priceOptions = Object.entries(PRICE_LABELS)

const filtered = computed(() => {
  return resources().filter((r) => {
    if (fType.value && r.type !== fType.value) return false
    if (fNode.value && !(r.nodes || []).includes(fNode.value)) return false
    if (fLevel.value && r.level !== fLevel.value) return false
    if (fLang.value && r.lang !== fLang.value) return false
    if (fPrice.value && r.price !== fPrice.value) return false
    return true
  })
})

function reset() {
  fType.value = ''
  fNode.value = ''
  fLevel.value = ''
  fLang.value = ''
  fPrice.value = ''
}
</script>

<template>
  <div class="card" style="margin-top: 14px">
    <h1>资源库</h1>
    <div class="filter-bar">
      <select v-model="fType">
        <option value="">全部类型</option>
        <option v-for="[k, v] in typeOptions" :key="k" :value="k">{{ v }}</option>
      </select>

      <select v-model="fNode">
        <option value="">全部节点</option>
        <option v-for="n in nodes()" :key="n.id" :value="n.id">{{ n.title }}</option>
      </select>

      <select v-model="fLevel">
        <option value="">全部难度</option>
        <option v-for="[k, v] in levelOptions" :key="k" :value="k">{{ v }}</option>
      </select>

      <select v-model="fLang">
        <option value="">全部语言</option>
        <option v-for="[k, v] in langOptions" :key="k" :value="k">{{ v }}</option>
      </select>

      <select v-model="fPrice">
        <option value="">全部价格</option>
        <option v-for="[k, v] in priceOptions" :key="k" :value="k">{{ v }}</option>
      </select>

      <button class="btn small" @click="reset">重置</button>
    </div>
    <p class="faint">共 {{ filtered.length }} 个资源</p>
  </div>

  <ResourceCard
    v-for="r in filtered"
    :key="r.id"
    :resource="r"
    :role="r.role"
  />
</template>
