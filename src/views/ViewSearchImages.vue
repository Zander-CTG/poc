<script setup lang="ts">
import DialogInspectImage from '@/components/dialogs/DialogInspectImage.vue'
import type { ParentImage } from '@/models/Image'
import { appName } from '@/shared/constants'
import { closeIcon, itemsIcon } from '@/shared/icons'
import { recordsCount } from '@/shared/utils'
import { useBackend } from '@/stores/backend'
import useLogger from '@/use/useLogger'
import useRouting from '@/use/useRouting'
import { useMeta, useQuasar } from 'quasar'
import { onMounted, ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Data Table` })

const $q = useQuasar()
const { log } = useLogger()
const { goBack } = useRouting()
const { loadImages } = useBackend()

const searchFilter: Ref<string> = ref('')

const imageRecords: Ref<
  {
    id: string
    metadata: Record<string, any>
    url: string
    created_at: string
  }[]
> = ref([])

onMounted(async () => {
  try {
    imageRecords.value = await loadImages()
  } catch (error) {
    log.error('Error loading images', error as Error)
  }
})

function onInspect(row: ParentImage) {
  $q.dialog({
    component: DialogInspectImage,
    componentProps: { record: row },
  })
}
</script>

<template>
  <q-table
    fullscreen
    grid
    :rows="imageRecords"
    :rows-per-page-options="[0]"
    :filter="searchFilter"
    virtual-scroll
    row-key="id"
  >
    <template v-slot:item="props">
      <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat>
          <q-img
            v-if="props.row.url"
            :src="props.row.url"
            alt="Uploaded Image"
            class="uploaded-image cursor-pointer"
            @click="onInspect(props.row)"
          />
        </q-card>
      </div>
    </template>

    <template v-slot:top>
      <div class="row justify-start full-width q-mb-md">
        <div class="col-10 text-h6 text-bold ellipsis">
          <q-icon class="q-pb-xs q-mr-xs" :name="itemsIcon" />
          Images
        </div>

        <q-btn
          round
          flat
          class="absolute-top-right q-mr-sm q-mt-sm"
          :icon="closeIcon"
          @click="goBack()"
        />
      </div>

      <div class="row justify-start full-width">
        <q-input
          :disable="!imageRecords.length"
          outlined
          dense
          clearable
          debounce="300"
          v-model="searchFilter"
          placeholder="Search"
          class="full-width"
        />
      </div>
    </template>

    <template v-slot:bottom>
      {{ recordsCount(imageRecords, 'Item', 'Items') }}
    </template>
  </q-table>
</template>

<style scoped>
.uploaded-image {
  max-width: 100%;
  object-fit: contain;
}
</style>
