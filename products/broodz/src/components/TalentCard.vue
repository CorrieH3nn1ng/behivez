<template>
  <q-card flat bordered class="talent-card cursor-pointer" @click="$router.push('/' + talent.slug)">
    <q-img
      v-if="talent.cover_image"
      :src="talent.cover_image"
      :ratio="16/9"
      :alt="talent.name + ' cover'"
      class="talent-card-cover"
    />
    <div v-else class="talent-card-cover-placeholder" />

    <q-card-section class="row items-center q-pb-none" style="margin-top: -36px;">
      <q-avatar size="56px" class="shadow-2" style="border: 3px solid white;">
        <img v-if="talent.profile_image" :src="talent.profile_image" :alt="talent.name" />
        <q-icon v-else name="person" size="28px" color="grey-5" />
      </q-avatar>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle1 text-weight-bold ellipsis" style="color: #2d2013;">{{ talent.name }}</div>
      <div v-if="talent.tagline" class="text-caption ellipsis-2-lines" style="color: #6b5c4e;">{{ talent.tagline }}</div>
      <div class="q-mt-xs">
        <q-badge v-if="talent.category_name" outline color="deep-orange-8" :label="talent.category_name" class="q-mr-xs" />
        <q-badge v-if="talent.location" outline color="grey-7" :label="talent.location" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Talent } from 'src/stores/talent'

defineProps<{ talent: Talent }>()
</script>

<style lang="scss" scoped>
.talent-card {
  border-radius: 12px;
  border-color: #e8ddd0;
  background: #fff;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.talent-card-cover-placeholder {
  height: 120px;
  background: linear-gradient(135deg, #2a1e30, #3a2520);
}
</style>
