<script setup lang="ts">
import PageResponsive from '@/components/page/PageResponsive.vue'
import { appName } from '@/shared/constants'
import { RouteNameEnum } from '@/shared/enums'
import { imageSearchIcon, inspectIcon } from '@/shared/icons'
import { useMeta } from 'quasar'

useMeta({ title: `${appName} - Search` })
</script>

<template>
  <PageResponsive>
    <q-list padding>
      <q-item class="q-mb-md">
        <q-item-section top>
          <q-item-label>Search Images and Items</q-item-label>
          <q-item-label caption>
            Choose from the search options below.
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-md row">
        <div class="col" />
        <q-btn
          class="col-5"
          :icon="imageSearchIcon"
          label="Images"
          noCaps
          stack
          glossy
          size="xl"
          color="primary"
          :to="{ name: RouteNameEnum.SEARCH_IMAGES }"
        />
        <div class="col" />
        <q-btn
          class="col-5"
          :icon="inspectIcon"
          label="Items"
          noCaps
          stack
          glossy
          size="xl"
          color="primary"
          :to="{ name: RouteNameEnum.SEARCH_ITEMS }"
        />
        <div class="col" />
      </q-item>
    </q-list>
  </PageResponsive>
</template>
