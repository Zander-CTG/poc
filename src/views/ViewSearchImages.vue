<script setup lang="ts">
import DialogInspectImage from '@/components/dialogs/DialogInspectImage.vue'
import type { ParentImage } from '@/models/Image'
import { DB } from '@/services/db'
import { appName } from '@/shared/constants'
import { TableEnum } from '@/shared/enums'
import { closeIcon, itemsIcon } from '@/shared/icons'
import { recordsCount, truncateText } from '@/shared/utils'
import useLogger from '@/use/useLogger'
import useRouting from '@/use/useRouting'
import { useMeta, useQuasar } from 'quasar'
import { onUnmounted, ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Data Table` })

const $q = useQuasar()
const { log } = useLogger()
const { goBack } = useRouting()

const searchFilter: Ref<string> = ref('')

const liveData: Ref<ParentImage[]> = ref([])

const subscription = DB.liveImages().subscribe({
  next: (data: ParentImage[]) => (liveData.value = data),
  error: (error) => log.error('Error fetching live Images', error),
})

onUnmounted(() => {
  subscription.unsubscribe()
})

const imageUrls: Ref<Record<string, string>> = ref({})

async function fetchImage(imageId: string) {
  const image = await DB.table(TableEnum.IMAGES).get(imageId)
  imageUrls.value[imageId] = URL.createObjectURL(image.file)
}

function onImageClick(row: ParentImage) {
  $q.dialog({
    component: DialogInspectImage,
    componentProps: { id: row.id },
  })
}
</script>

<template>
  <q-table
    fullscreen
    grid
    :rows="liveData"
    :rows-per-page-options="[0]"
    :filter="searchFilter"
    virtual-scroll
    row-key="id"
  >
    <template v-slot:item="props">
      <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3">
        <q-card
          bordered
          flat
          class="cursor-pointer"
          @click="onImageClick(props.row)"
        >
          <img
            v-if="props.row.id"
            :src="imageUrls[props.row.id] || (fetchImage(props.row.id) as any)"
            alt="Image"
            class="image"
          />

          <q-item>
            <q-item-section top>
              <q-item-label>Visible Text</q-item-label>
              <q-item-label caption>{{
                truncateText(props.row.visible_text.join(', '), 500, '...')
              }}</q-item-label>
            </q-item-section>
          </q-item>
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
          @click="goBack"
        />
      </div>

      <div class="row justify-start full-width">
        <q-input
          :disable="!liveData.length"
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
      {{ recordsCount(liveData, 'Item', 'Items') }}
    </template>
  </q-table>
</template>

<style scoped>
.image {
  max-width: 100%;
  object-fit: contain;
}
</style>
