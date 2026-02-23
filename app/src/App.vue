<script setup>
import { ref, watch } from 'vue'
import SearchFilter from './components/SearchFilter.vue'
import TermList from './components/TermList.vue'

import javascriptData from '@data/javascript.json'
import javaData from '@data/java.json'
import jqueryData from '@data/jquery.json'

const dataMap = {
  javascript: javascriptData,
  java: javaData,
  jquery: jqueryData
}

const languages = Object.entries(dataMap).map(([key, data]) => ({
  value: key,
  label: data.displayName
}))

const searchQuery = ref('')
const selectedType = ref('all')
const selectedLang = ref('javascript')
const langData = ref(dataMap['javascript'])

watch(selectedLang, (newLang) => {
  langData.value = dataMap[newLang]
  searchQuery.value = ''
  selectedType.value = 'all'
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Lang Version Vocab</h1>
    </header>
    <main class="main-content">
      <SearchFilter
        v-model:searchQuery="searchQuery"
        v-model:selectedLang="selectedLang"
        v-model:selectedType="selectedType"
        :languages="languages"
      />
      <TermList
        :langData="langData"
        :searchQuery="searchQuery"
        :selectedType="selectedType"
      />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  padding: 24px 16px;
  max-width: 720px;
  margin: 0 auto;
}

.app-header h1 {
  font-size: 1.5rem;
  color: #1a1a1a;
}

.main-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 32px;
}
</style>
