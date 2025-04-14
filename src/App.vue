<script setup lang="ts">
import { appDescription } from '@/shared/constants'
import { errorIcon } from '@/shared/icons'
import { useSettingsStore } from '@/stores/settings'
import useLogger from '@/use/useLogger'
import { colors, useMeta, useQuasar } from 'quasar'
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { DB } from './services/db'

/**
 * Do NOT overwrite these specific properties in another useMeta call.
 */
useMeta({
  meta: {
    description: { name: 'description', content: appDescription },
    charset: { charset: 'UTF-8' },
    viewport: {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    themeColor: {
      name: 'theme-color',
      content: `${colors.getPaletteColor('primary')}`,
    },
  },
  link: {
    manifest: {
      rel: 'manifest',
      href: `${import.meta.env.BASE_URL}site.webmanifest`,
    },
    appleTouchIcon: {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: `${import.meta.env.BASE_URL}apple-touch-icon.png`,
    },
    favicon96: {
      rel: 'icon',
      type: 'image/png',
      sizes: '96x96',
      href: `${import.meta.env.BASE_URL}favicon-96x96.png`,
    },
  },
  noscript: {
    default:
      'Your browser does not support JavaScript or has it disabled. Please enable JavaScript in your web browser settings or white-list our domain in your JavaScript blocker for the best experience.',
  },
})

const notify = useQuasar().notify
const { log } = useLogger()
const settingsStore = useSettingsStore()

// Loading live Settings into the store on startup for use throughout the app.
const subscription = DB.liveSettings().subscribe({
  next: (records) => (settingsStore.settings = records),
  error: (error) => log.error(`Error loading live Settings`, error as Error),
})

onMounted(async () => {
  try {
    await DB.initializeSettingsOnStartup()
  } catch (error) {
    // Output the error and notify user since it could be a database or logger failure
    notify({
      message: 'Error initializing settings',
      icon: errorIcon,
      color: 'negative',
    })
    console.error(error)
  }

  try {
    const logsDeleted = await DB.deleteExpiredLogsOnStartup()
    log.silentDebug('Expired logs deleted', { logsDeleted })
  } catch (error) {
    log.error('Error deleting expired logs', error as Error)
  }
})

onUnmounted(() => {
  subscription.unsubscribe()
})
</script>

<template>
  <RouterView />
</template>
