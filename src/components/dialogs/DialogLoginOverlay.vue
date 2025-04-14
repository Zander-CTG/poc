<script setup lang="ts">
import { SettingSI } from '@/services/SettingService'
import { appDescription, appName } from '@/shared/constants'
import { SettingIdEnum } from '@/shared/enums'
import { recommendIcon } from '@/shared/icons'
import { useSettingsStore } from '@/stores/settings'
import { ref, type Ref } from 'vue'

const settingsStore = useSettingsStore()

const showOverlay: Ref<any> = ref(false)

async function onCloseLoginOverlay() {
  await SettingSI.putRecord({
    id: SettingIdEnum.LOGIN_OVERLAY,
    value: false,
  })
  showOverlay.value = false
}
</script>

<template>
  <q-dialog
    :model-value="Boolean(settingsStore.loginOverlay)"
    @update:model-value="
      SettingSI.putRecord({
        id: SettingIdEnum.LOGIN_OVERLAY,
        value: $event,
      })
    "
    persistent
    v-on:keyup.enter="onCloseLoginOverlay"
  >
    <q-card flat square>
      <q-card-section>
        <p class="text-h6">Welcome to {{ appName }}</p>

        <p>{{ appDescription }}</p>

        <p>
          You must add an API key on the settings page to use this app. You can
          find the settings page in the app header, or click this shortcut
          below.
        </p>

        <q-btn
          no-caps
          label="Get Started"
          class="full-width"
          size="lg"
          color="positive"
          :icon="recommendIcon"
          @click="onCloseLoginOverlay"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
