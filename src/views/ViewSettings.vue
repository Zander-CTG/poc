<script setup lang="ts">
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'
import PageFabMenu from '@/components/page/PageFabMenu.vue'
import PageResponsive from '@/components/page/PageResponsive.vue'
import { DB } from '@/services/db'
import { LogSI } from '@/services/LogService'
import { SettingSI } from '@/services/SettingService'
import { appName } from '@/shared/constants'
import {
  DurationEnum,
  RouteNameEnum,
  SettingIdEnum,
  TableEnum,
} from '@/shared/enums'
import {
  apiIcon,
  deleteIcon,
  deleteSweepIcon,
  deleteXIcon,
  logsTableIcon,
  optionsIcon,
  settingsTableIcon,
  warnIcon,
} from '@/shared/icons'
import { useSettingsStore } from '@/stores/settings'
import useLogger from '@/use/useLogger'
import { useMeta, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

useMeta({ title: `${appName} - Settings` })

const $q = useQuasar()
const router = useRouter()
const { log } = useLogger()
const settingsStore = useSettingsStore()

const modelOptions = ['gpt-4-turbo']

const logDurationsOptions = [
  DurationEnum['One Week'],
  DurationEnum['One Month'],
  DurationEnum['Three Months'],
  DurationEnum['Six Months'],
  DurationEnum['One Year'],
  DurationEnum.Forever,
]

/**
 * Deletes all app logs from the database.
 */
function onDeleteLogs() {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Delete Logs',
      message: 'Are you sure you want to delete all Logs?',
      color: 'negative',
      icon: deleteIcon,
      useUnlock: 'ALWAYS',
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await LogSI.clearTable()
      log.info('Successfully deleted Logs')
    } catch (error) {
      log.error(`Error deleting Logs`, error as Error)
    } finally {
      $q.loading.hide()
    }
  })
}

/**
 * Deletes all app data including configuration and user data from the database.
 */
function onDeleteData() {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Delete Data',
      message: 'Are you sure you want to delete all of your data?',
      color: 'negative',
      icon: deleteXIcon,
      useUnlock: 'ALWAYS',
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      const tables = Object.values(TableEnum)
      await Promise.all(tables.map(async (table) => DB.table(table).clear()))
      await SettingSI.initialize() // Re-initialize settings immediately
      log.info('Successfully deleted data')
    } catch (error) {
      log.error(`Error deleting data`, error as Error)
    } finally {
      $q.loading.hide()
    }
  })
}

/**
 * Deletes the underlining database and all of its data.
 */
function onDeleteDatabase() {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Delete Database',
      message:
        'Delete the underlining database? All data will be lost. You must reload the website after this action to reinitialize the database.',
      color: 'negative',
      icon: deleteSweepIcon,
      useUnlock: 'ALWAYS',
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await DB.delete()
      $q.notify({
        message: 'Reload the website now',
        icon: warnIcon,
        color: 'warning',
      })
    } catch (error) {
      log.error(`Error deleting database`, error as Error)
    } finally {
      $q.loading.hide()
    }
  })
}
</script>

<template>
  <PageResponsive>
    <PageFabMenu
      :isLoading="$q.loading.isActive"
      :subButtons="[
        {
          label: 'Logs Data',
          color: 'secondary',
          icon: logsTableIcon,
          handleClick: () =>
            router.push({
              name: RouteNameEnum.TABLE,
              params: { table: TableEnum.LOGS },
            }),
        },
        {
          label: 'Settings Data',
          color: 'secondary',
          icon: settingsTableIcon,
          handleClick: () =>
            router.push({
              name: RouteNameEnum.TABLE,
              params: { table: TableEnum.SETTINGS },
            }),
        },
      ]"
    />

    <q-list padding>
      <q-item-label header>
        <q-icon class="on-left" size="sm" :name="apiIcon" />
        API
      </q-item-label>

      <q-item>
        <q-item-section top>
          <q-item-label>API Key</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.apiKey as string"
              @update:model-value="
                SettingSI.putRecord({
                  id: SettingIdEnum.API_KEY,
                  value: $event,
                })
              "
              type="textarea"
              lazy-rules
              autogrow
              dense
              outlined
              color="primary"
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>System Prompt</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.systemPrompt as string"
              @update:model-value="
                SettingSI.putRecord({
                  id: SettingIdEnum.SYSTEM_PROMPT,
                  value: $event,
                })
              "
              type="textarea"
              lazy-rules
              autogrow
              dense
              outlined
              color="primary"
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>User Prompt</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.userPrompt as string"
              @update:model-value="
                SettingSI.putRecord({
                  id: SettingIdEnum.USER_PROMPT,
                  value: $event,
                })
              "
              type="textarea"
              lazy-rules
              autogrow
              dense
              outlined
              color="primary"
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Max Tokens</q-item-label>
          <q-item-label>
            <q-select
              :model-value="(settingsStore.maxTokens as number) ?? 1024"
              @update:model-value="
                SettingSI.putRecord({
                  id: SettingIdEnum.MAX_TOKENS,
                  value: Number($event),
                })
              "
              :options="[
                1,
                ...Array.from({ length: 32 }, (_, i) => (i + 1) * 128),
              ]"
              dense
              outlined
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Model Name</q-item-label>
          <q-item-label>
            <q-select
              :model-value="
                (settingsStore.modelName as string) ?? 'gpt-4-turbo'
              "
              @update:model-value="
                SettingSI.putRecord({
                  id: SettingIdEnum.MODEL_NAME,
                  value: Number($event),
                })
              "
              :options="modelOptions"
              dense
              outlined
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator class="q-my-md" />

      <q-item-label header>
        <q-icon class="on-left" size="sm" :name="optionsIcon" />
        Options
      </q-item-label>

      <q-item tag="label" :disable="$q.loading.isActive">
        <q-item-section top>
          <q-item-label>Show Instructions</q-item-label>
          <q-item-label caption>
            Redisplays the welcome message and app usage instructions.
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-toggle
            :model-value="settingsStore.instructionsOverlay"
            @update:model-value="
              SettingSI.putRecord({
                id: SettingIdEnum.INSTRUCTIONS_OVERLAY,
                value: $event,
              })
            "
            :disable="$q.loading.isActive"
            size="lg"
          />
        </q-item-section>
      </q-item>

      <q-item tag="label" :disable="$q.loading.isActive">
        <q-item-section top>
          <q-item-label>Show Info Messages</q-item-label>
          <q-item-label caption>
            Show popup messages for actions that were completed.
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-toggle
            :model-value="settingsStore.infoMessages"
            @update:model-value="
              SettingSI.putRecord({
                id: SettingIdEnum.INFO_MESSAGES,
                value: $event,
              })
            "
            :disable="$q.loading.isActive"
            size="lg"
          />
        </q-item-section>
      </q-item>

      <q-item tag="label" :disable="$q.loading.isActive">
        <q-item-section top>
          <q-item-label>Show Console Logs</q-item-label>
          <q-item-label caption>
            Show all log messages in the browser console.
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-toggle
            :model-value="settingsStore.consoleLogs"
            @update:model-value="
              SettingSI.putRecord({
                id: SettingIdEnum.CONSOLE_LOGS,
                value: $event,
              })
            "
            :disable="$q.loading.isActive"
            size="lg"
          />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Log Retention</q-item-label>
          <q-item-label caption>
            Duration that logs remain stored until being removed automatically.
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-select
            :model-value="settingsStore.logRetentionDuration"
            @update:model-value="
              SettingSI.putRecord({
                id: SettingIdEnum.LOG_RETENTION_DURATION,
                value: $event,
              })
            "
            :disable="$q.loading.isActive"
            :options="logDurationsOptions"
            dense
            outlined
            label="Duration"
            class="duration-width"
          />
        </q-item-section>
      </q-item>

      <q-separator class="q-my-md" />

      <q-item-label header class="text-negative">
        <q-icon class="on-left" size="sm" :name="warnIcon" />
        Danger Zone
      </q-item-label>

      <q-item-label header>
        The following operations cannot be undone. Consider exporting your data
        before proceeding.
      </q-item-label>

      <q-item>
        <q-item-section top>
          <q-item-label>Delete Logs</q-item-label>
          <q-item-label caption>
            Delete all logging data from the app.
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-btn
          :icon="deleteIcon"
          :disable="$q.loading.isActive"
          color="negative"
          @click="onDeleteLogs()"
        />
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Delete Data</q-item-label>
          <q-item-label caption>
            Permanently delete all configuration and user data from the app.
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-btn
          :icon="deleteXIcon"
          :disable="$q.loading.isActive"
          color="negative"
          @click="onDeleteData()"
        />
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Delete Database</q-item-label>
          <q-item-label caption>
            Delete the underlining browser database and all of its data
            (requires app reload). This may be required if your app is having
            database issues.
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-btn
          :icon="deleteSweepIcon"
          :disable="$q.loading.isActive"
          color="negative"
          @click="onDeleteDatabase()"
        />
      </q-item>
    </q-list>
  </PageResponsive>
</template>

<style scoped>
.duration-width {
  width: 150px;
}
</style>
