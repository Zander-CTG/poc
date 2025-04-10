<script setup lang="ts">
import PageResponsive from '@/components/page/PageResponsive.vue'
import { appName } from '@/shared/constants'
import { RouteNameEnum } from '@/shared/enums'
import { dataTableIcon, imageSearchIcon, inspectIcon } from '@/shared/icons'
import { useSettingsStore } from '@/stores/settings'
import useLogger from '@/use/useLogger'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useMeta } from 'quasar'
import { ref } from 'vue'

useMeta({ title: `${appName} - Search` })

const { log } = useLogger()
const settingsStore = useSettingsStore()

const records: any = ref({})

/**
 * Test using Supabase
 */
async function insertTest() {
  let supabase: SupabaseClient = null!

  // Connect to Supabase
  try {
    supabase = createClient(
      settingsStore.projectUrl as string,
      settingsStore.projectApiKey as string,
    )
  } catch (error) {
    log.error('Supabase settings missing', error as Error)
  }

  // Insert record and select created result
  const { data, error } = await supabase
    .from('image_metadata')
    .insert([{ bytes: 'test' }, { bytes: 'hello world' }])
    .select()

  if (error) {
    log.error('Error inserting test record', error)
  } else {
    log.info('Inserted test record', { data })
    records.value = data
  }

  // Close Supabase connection
  supabase.removeAllChannels()
  supabase.auth.signOut()
}
</script>

<template>
  <PageResponsive>
    <q-list padding>
      <q-item class="q-mb-md">
        <q-item-section top>
          <q-item-label>Search Inventory</q-item-label>
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
          :to="{ name: RouteNameEnum.IMAGE_SEARCH }"
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
          :to="{ name: RouteNameEnum.TABULAR_SEARCH }"
        />
        <div class="col" />
      </q-item>

      <q-item class="q-mb-md row">
        <div class="col" />
        <q-btn
          class="col-5"
          :icon="dataTableIcon"
          label="Test Supabase"
          noCaps
          stack
          glossy
          size="xl"
          color="primary"
          @click="insertTest"
        />
        <div class="col" />
      </q-item>

      <q-item class="q-mb-md">
        <q-item-section top>
          <q-item-label>Test Records</q-item-label>
          <q-item-label caption v-for="record in records" :key="record.id">
            {{ record }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </PageResponsive>
</template>
