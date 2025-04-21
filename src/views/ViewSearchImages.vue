<script setup lang="ts">
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'
import DialogInspectImage from '@/components/dialogs/DialogInspectImage.vue'
import { appName } from '@/shared/constants'
import { closeIcon, deleteIcon, itemsIcon } from '@/shared/icons'
import { recordsCount, truncateText } from '@/shared/utils'
import { useBackend } from '@/stores/backend'
import useLogger from '@/use/useLogger'
import useRouting from '@/use/useRouting'
import { useMeta, useQuasar } from 'quasar'
import { onMounted, ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Search Images` })

const $q = useQuasar()
const { log } = useLogger()
const { goBack } = useRouting()
const { fetchImages, deleteImage } = useBackend()

const searchFilter: Ref<string> = ref('')

const imageRecords: Ref<
  {
    id: string
    user_id: string
    visible_text: string[]
    created_at: string
    url: string
  }[]
> = ref([])

onMounted(async () => {
  try {
    imageRecords.value = await fetchImages()
  } catch (error) {
    log.error('Error loading images', error as Error)
  }
})

function onInspect(row: Record<string, any>) {
  $q.dialog({
    component: DialogInspectImage,
    componentProps: { record: row },
  })
}

async function onDeleteImage(row: Record<string, any>) {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Delete Image',
      message:
        'Are you sure you want to delete this image and its associated items?',
      color: 'negative',
      icon: deleteIcon,
      requiresUnlock: false,
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await deleteImage(row.id)
      imageRecords.value = imageRecords.value.filter(
        (image) => image.id !== row.id,
      )
      log.info('Successfully deleted image')
    } catch (error) {
      log.error(`Error deleting image`, error as Error)
    } finally {
      $q.loading.hide()
    }
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
        <q-card>
          <q-card-section class="q-px-none q-pt-none q-pb-sm">
            <q-img
              v-if="props.row.url"
              :src="props.row.url"
              alt="Uploaded Image"
              class="uploaded-image cursor-pointer"
              @click="onInspect(props.row)"
            />
          </q-card-section>

          <q-card-section
            v-if="props.row?.visible_text?.length"
            class="q-pa-sm"
          >
            <div class="text-caption">
              {{ truncateText(props.row.visible_text?.join(', '), 250, '...') }}
            </div>
          </q-card-section>

          <q-card-actions vertical class="q-pa-sm">
            <q-btn
              color="negative"
              label="Delete"
              :icon="deleteIcon"
              @click="onDeleteImage(props.row)"
            />
          </q-card-actions>
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
