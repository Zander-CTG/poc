<script setup lang="ts">
import { SettingSI } from '@/services/SettingService'
import { appDescription, appName } from '@/shared/constants'
import { RouteNameEnum, SettingIdEnum } from '@/shared/enums'
import { recommendIcon, settingsPageIcon } from '@/shared/icons'
import { useSettingsStore } from '@/stores/settings'
import { ref, type Ref } from 'vue'

const settingsStore = useSettingsStore()

const showWelcome: Ref<any> = ref(false)

async function onCloseWelcomeOverlay() {
  await SettingSI.putRecord({
    id: SettingIdEnum.INSTRUCTIONS_OVERLAY,
    value: false,
  })
  showWelcome.value = false
}
</script>

<template>
  <q-dialog
    :model-value="Boolean(settingsStore.instructionsOverlay)"
    @update:model-value="
      SettingSI.putRecord({
        id: SettingIdEnum.INSTRUCTIONS_OVERLAY,
        value: $event,
      })
    "
    persistent
    v-on:keyup.enter="onCloseWelcomeOverlay"
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

        <p>
          <q-btn
            :icon="settingsPageIcon"
            label="Settings"
            color="primary"
            size="sm"
            no-caps
            stack
            :to="{ name: RouteNameEnum.SETTINGS }"
          />
        </p>

        <p>Click the button below when you are ready to use the app!</p>

        <q-btn
          no-caps
          label="Get Started"
          class="full-width"
          size="lg"
          color="positive"
          :icon="recommendIcon"
          @click="onCloseWelcomeOverlay"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
