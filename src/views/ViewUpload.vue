<script setup lang="ts">
import PageResponsive from '@/components/page/PageResponsive.vue'
import { appName } from '@/shared/constants'
import { importFileIcon } from '@/shared/icons'
import { useBackend } from '@/stores/backend'
import useLogger from '@/use/useLogger'
import { QSpinnerGears, useMeta, useQuasar } from 'quasar'
import { ref, type Ref } from 'vue'

useMeta({ title: `${appName} - Upload` })

const $q = useQuasar()
const { log } = useLogger()
const { uploadAndProcessImage } = useBackend()

const importImage: Ref<File> = ref(null!)
const imageUrl: Ref<string | null> = ref(null)

/**
 * Handles rejected files during import and logs a warning.
 */
function onRejectedFile(entries: any) {
  const name = entries?.[0]?.file?.name
  const size = entries?.[0]?.file?.size
  const type = entries?.[0]?.file?.type
  log.warn(`Cannot import ${name}`, { name, size, type })
  importImage.value = null! // Clear input
}

/**
 * Processes the uploaded image and saves the resulting records to the database.
 */
async function onUploadImage() {
  try {
    $q.loading.show({
      spinner: QSpinnerGears,
      message: 'Processing Image',
    })

    const reader = new FileReader()
    reader.readAsDataURL(importImage.value)
    reader.onload = () => {
      imageUrl.value = reader.result as string
    }
    reader.onerror = (error) => {
      log.error('Error reading file', error)
    }

    const { image, items } = await uploadAndProcessImage(importImage.value)

    log.info('Image Processed', { image, items })
  } catch (error) {
    log.error('Error processing image', error as Error)
  } finally {
    importImage.value = null!
    $q.loading.hide()
  }
}
</script>

<template>
  <PageResponsive>
    <q-list padding>
      <q-item class="q-mb-sm">
        <q-item-section top>
          <q-item-label>Image Uploader</q-item-label>
          <q-item-label caption>
            Add items by choosing an image to upload and have the contents
            processed by the AI. The following fields will be populated based on
            the image content:
            <ul>
              <li>Type</li>
              <li>Brand</li>
              <li>Label</li>
              <li>Description</li>
              <li>Categories</li>
            </ul>
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-item-section top>
          <q-file
            v-model="importImage"
            :disable="$q.loading.isActive"
            label="Image File"
            clearable
            dense
            outlined
            accept="image/*"
            @rejected="onRejectedFile"
          >
            <template v-slot:before>
              <q-btn
                :disable="!importImage || $q.loading.isActive"
                :icon="importFileIcon"
                color="primary"
                @click="onUploadImage()"
              />
            </template>
          </q-file>
        </q-item-section>
      </q-item>

      <q-item v-if="imageUrl" class="q-mb-sm">
        <q-item-section top>
          <q-item-label>
            <img :src="imageUrl" alt="Uploaded Image" style="max-width: 100%" />
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </PageResponsive>
</template>
