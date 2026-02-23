<script setup>
import CharacteristicCard from './CharacteristicCard.vue'
import ConceptCard from './ConceptCard.vue'

const props = defineProps({
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] }
})

const emit = defineEmits(['jump-to-term'])

function scrollToConcept(conceptId) {
  const el = document.getElementById(`concept-${conceptId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}
</script>

<template>
  <div v-if="overview" class="overview-tab">
    <p v-if="overview.description" class="overview-desc">{{ overview.description }}</p>

    <section v-if="overview.characteristics?.length" class="section">
      <h3 class="section-title">言語特性</h3>
      <CharacteristicCard
        v-for="char in overview.characteristics"
        :key="char.id"
        :item="char"
        :concepts="overview.concepts || []"
        @scroll-to-concept="scrollToConcept"
      />
    </section>

    <section v-if="overview.concepts?.length" class="section">
      <h3 class="section-title">概念</h3>
      <div
        v-for="concept in overview.concepts"
        :key="concept.id"
        :id="`concept-${concept.id}`"
        class="concept-wrapper"
      >
        <ConceptCard
          :item="concept"
          :characteristics="overview.characteristics || []"
          :allTerms="allTerms"
          @jump-to-term="emit('jump-to-term', $event)"
        />
      </div>
    </section>

    <p v-if="!overview.characteristics?.length && !overview.concepts?.length" class="empty">
      概要データがありません
    </p>
  </div>
  <div v-else class="empty">
    <p>この言語の概要データはまだありません</p>
  </div>
</template>

<style scoped>
.overview-tab {
  padding-top: 8px;
}

.overview-desc {
  color: #555;
  margin-bottom: 20px;
  line-height: 1.6;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #555;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.concept-wrapper {
  transition: background 0.3s;
  border-radius: 8px;
}

.concept-wrapper.highlight {
  background: #fff9c4;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>
