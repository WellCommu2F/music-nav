<script setup>
import { computed, reactive, ref } from 'vue'
import ResourceCard from '../components/ResourceCard.vue'
import { resources, nodes } from '../store/data.js'
import {
  addUserResource,
  setUserResources,
  getUserResources,
  getHiddenResources,
  unhideResource
} from '../store/progress.js'
import {
  TYPE_LABELS,
  LANG_LABELS,
  LEVEL_LABELS,
  PRICE_LABELS
} from '../utils/labels.js'

// —— 筛选 ——
const fType = ref('')
const fNode = ref('')
const fLevel = ref('')
const fLang = ref('')
const fPrice = ref('')
const fSource = ref('') // '' | 'custom' | 'builtin'

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
    if (fSource.value === 'custom' && !r.isCustom) return false
    if (fSource.value === 'builtin' && r.isCustom) return false
    return true
  })
})

function reset() {
  fType.value = ''
  fNode.value = ''
  fLevel.value = ''
  fLang.value = ''
  fPrice.value = ''
  fSource.value = ''
}

// —— 管理面板可见性 ——
const showManage = ref(false)

// —— 添加自定义资源 ——
const showForm = ref(false)
const formError = ref('')

const blankForm = () => ({
  name: '',
  url: '',
  type: 'article',
  author: '',
  lang: 'zh',
  price: 'free',
  level: 'beginner',
  why: '',
  nodes: []
})

const form = reactive(blankForm())

function toggleNode(id) {
  const i = form.nodes.indexOf(id)
  if (i >= 0) form.nodes.splice(i, 1)
  else form.nodes.push(id)
}

function submitForm() {
  const required = ['name', 'url', 'type', 'author', 'lang', 'price', 'level', 'why']
  const missing = required.filter((k) => !String(form[k] || '').trim())
  if (missing.length) {
    formError.value = '请填写全部必填字段（名称/链接/类型/作者/语言/价格/难度/推荐理由）。'
    return
  }
  if (!/^https?:\/\//i.test(form.url.trim())) {
    formError.value = '链接需以 http:// 或 https:// 开头。'
    return
  }
  if (!form.nodes.length) {
    formError.value = '请至少勾选一个关联节点。'
    return
  }
  formError.value = ''

  addUserResource({
    id: 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: form.name.trim(),
    url: form.url.trim(),
    type: form.type,
    author: form.author.trim(),
    lang: form.lang,
    price: form.price,
    level: form.level,
    why: form.why.trim(),
    nodes: [...form.nodes],
    role: 'alternative',
    duration_h: null,
    verified_at: new Date().toISOString().slice(0, 10),
    isCustom: true
  })

  Object.assign(form, blankForm())
  showForm.value = false
}

function cancelForm() {
  Object.assign(form, blankForm())
  formError.value = ''
  showForm.value = false
}

// —— 已隐藏资源 ——
const hiddenList = computed(() => getHiddenResources())

// —— 导出 / 导入 ——
function exportJSON() {
  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    user_resources: getUserResources().map((r) => {
      const { isCustom, ...rest } = r
      return rest
    }),
    hidden_resources: getHiddenResources()
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'music-nav-resources.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const fileInput = ref(null)
const importMsg = ref('')

function pickFile() {
  importMsg.value = ''
  if (fileInput.value) fileInput.value.click()
}

function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      const incoming = Array.isArray(parsed.user_resources)
        ? parsed.user_resources
        : Array.isArray(parsed)
          ? parsed
          : null
      if (!incoming) throw new Error('格式不正确')

      // 合并：按 id 去重，导入的覆盖同 id
      const merged = [...getUserResources()]
      let added = 0
      incoming.forEach((r) => {
        if (!r || !r.id || !r.name || !r.url) return
        const i = merged.findIndex((x) => x.id === r.id)
        const clean = { ...r, isCustom: true }
        if (i >= 0) merged[i] = clean
        else {
          merged.push(clean)
          added += 1
        }
      })
      setUserResources(merged)
      importMsg.value = `导入成功：新增 ${added} 条，合计 ${merged.length} 条自定义资源。`
    } catch (err) {
      importMsg.value = '导入失败：文件不是有效的 music-nav 资源备份。'
    }
    e.target.value = ''
  }
  reader.readAsText(file)
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

      <select v-model="fSource">
        <option value="">全部来源</option>
        <option value="builtin">内置</option>
        <option value="custom">自定义</option>
      </select>

      <button class="btn small" @click="reset">重置</button>
    </div>
    <p class="faint">
      共 {{ filtered.length }} 个资源（内置 {{ resources().filter((r) => !r.isCustom).length }}，自定义
      {{ resources().filter((r) => r.isCustom).length }}）
    </p>

    <div class="tags" style="margin-top: 10px">
      <button class="btn small" @click="showManage = !showManage">
        {{ showManage ? '收起管理' : '管理资源' }}
      </button>
    </div>
  </div>

  <!-- 管理面板 -->
  <div v-if="showManage" class="card">
    <h3>管理资源</h3>

    <div class="tags">
      <button class="btn small primary-btn" @click="showForm = !showForm">
        {{ showForm ? '取消添加' : '+ 添加自定义资源' }}
      </button>
      <button class="btn small" @click="exportJSON">导出我的资源</button>
      <button class="btn small" @click="pickFile">导入</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onFileChange"
      />
    </div>

    <p v-if="importMsg" class="faint" style="margin-top: 8px">{{ importMsg }}</p>

    <!-- 添加表单 -->
    <div v-if="showForm" style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px">
      <div class="form-grid">
        <label class="full">
          名称 *
          <input v-model="form.name" placeholder="例如：某中文教程" />
        </label>

        <label class="full">
          链接 *（以 http:// 或 https:// 开头）
          <input v-model="form.url" placeholder="https://..." />
        </label>

        <label>
          类型 *
          <select v-model="form.type">
            <option v-for="[k, v] in typeOptions" :key="k" :value="k">{{ v }}</option>
          </select>
        </label>

        <label>
          作者 *
          <input v-model="form.author" placeholder="作者 / 机构" />
        </label>

        <label>
          语言 *
          <select v-model="form.lang">
            <option v-for="[k, v] in langOptions" :key="k" :value="k">{{ v }}</option>
          </select>
        </label>

        <label>
          价格 *
          <select v-model="form.price">
            <option v-for="[k, v] in priceOptions" :key="k" :value="k">{{ v }}</option>
          </select>
        </label>

        <label>
          难度 *
          <select v-model="form.level">
            <option v-for="[k, v] in levelOptions" :key="k" :value="k">{{ v }}</option>
          </select>
        </label>

        <label class="full">
          推荐理由 *
          <textarea v-model="form.why" placeholder="为什么推荐它？"></textarea>
        </label>

        <div class="full">
          <div class="faint" style="margin-bottom: 6px">关联节点 *（可多选）</div>
          <div class="node-check-list">
            <label v-for="n in nodes()" :key="n.id">
              <input
                type="checkbox"
                :checked="form.nodes.includes(n.id)"
                @change="toggleNode(n.id)"
              />
              {{ n.title }}
            </label>
          </div>
        </div>
      </div>

      <p v-if="formError" class="form-error" style="margin-top: 10px">{{ formError }}</p>

      <div class="tags" style="margin-top: 12px">
        <button class="btn small primary-btn" @click="submitForm">保存</button>
        <button class="btn small" @click="cancelForm">取消</button>
      </div>
    </div>

    <!-- 已隐藏内置资源 -->
    <div v-if="hiddenList.length" style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px">
      <div class="section-title" style="margin-top: 0">已隐藏的内置资源（{{ hiddenList.length }}）</div>
      <div v-for="id in hiddenList" :key="id" class="daily-box" style="margin-top: 6px">
        <span>{{ id }}</span>
        <button class="btn small" @click="unhideResource(id)">恢复显示</button>
      </div>
    </div>
  </div>

  <ResourceCard
    v-for="r in filtered"
    :key="r.id"
    :resource="r"
    :role="r.role"
    manage
  />
</template>
