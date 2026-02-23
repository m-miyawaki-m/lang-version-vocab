<script setup>
import { computed } from 'vue'
import VersionGroup from './VersionGroup.vue'

const props = defineProps({
  langData: { type: Object, default: null },
  searchQuery: { type: String, default: '' },
  selectedType: { type: String, default: 'all' }
})

const filteredVersions = computed(() => {
  if (!props.langData || !props.langData.versions) return []

  const query = props.searchQuery.toLowerCase()

  return props.langData.versions
    .map(version => {
      const filteredTerms = version.terms.filter(term => {
        const matchesSearch = !props.searchQuery ||
          term.term.toLowerCase().includes(query) ||
          (term.termJa && term.termJa.includes(props.searchQuery)) ||
          term.meaning.includes(props.searchQuery)

        const matchesType = props.selectedType === 'all' ||
          term.type === props.selectedType

        return matchesSearch && matchesType
      })

      return { ...version, terms: filteredTerms }
    })
    .filter(version => version.terms.length > 0)
})

const totalCount = computed(() =>
  filteredVersions.value.reduce((sum, v) => sum + v.terms.length, 0)
)
</script>

<template>
  <div>
    <div class="timeline">
      <VersionGroup
        v-for="version in filteredVersions"
        :key="version.version"
        :version="version.version"
        :releaseDate="version.releaseDate"
        :terms="version.terms"
      />
      <p v-if="filteredVersions.length === 0" class="empty">該当する用語がありません</p>
    </div>
    <div class="stats">
      全 {{ totalCount }}件（{{ filteredVersions.length }} バージョン）
    </div>
  </div>
</template>

<style scoped>
.timeline {
  margin-bottom: 16px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.stats {
  text-align: center;
  color: #888;
  font-size: 0.85rem;
  padding: 12px 0;
  border-top: 1px solid #eee;
}
</style>
