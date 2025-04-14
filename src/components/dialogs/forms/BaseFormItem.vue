<script setup lang="ts">
defineProps<{
  label: string
  description: string
}>()
</script>

<template>
  <q-item class="q-mb-md">
    <q-item-section>
      <q-item-label class="text-bold">{{ label }}</q-item-label>

      <q-item-label>
        {{ description }}
      </q-item-label>

      <slot />
    </q-item-section>
  </q-item>
</template>
