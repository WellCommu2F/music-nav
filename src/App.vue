<script setup>
import { ref } from 'vue'
import { clearAllProgress } from './store/progress.js'

const showClear = ref(false)

function handleClear() {
  if (window.confirm('确定清空全部学习进度？此操作不可恢复。')) {
    clearAllProgress()
    showClear.value = false
  }
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <router-link to="/" class="brand">music-nav</router-link>
      <nav class="topnav">
        <router-link to="/">首页</router-link>
        <router-link to="/route/edm">我想做什么</router-link>
        <router-link to="/library">资源库</router-link>
      </nav>
      <button class="btn small" @click="showClear = !showClear">
        清空进度
      </button>
      <button v-if="showClear" class="btn small" @click="handleClear">
        确认清空
      </button>
    </div>
  </header>

  <main>
    <router-view />
  </main>
</template>
