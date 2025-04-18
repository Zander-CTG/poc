<script setup lang="ts">
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'
import PageResponsive from '@/components/page/PageResponsive.vue'
import { DB } from '@/services/db'
import { appName, systemPrompt, userPrompt } from '@/shared/constants'
import {
  DurationEnum,
  RouteNameEnum,
  SettingIdEnum,
  TableEnum,
} from '@/shared/enums'
import {
  apiIcon,
  dataTableIcon,
  deleteIcon,
  deleteSweepIcon,
  deleteXIcon,
  keyIcon,
  logsTableIcon,
  optionsIcon,
  personIcon,
  refreshIcon,
  settingsTableIcon,
  voiceIcon,
  warnIcon,
} from '@/shared/icons'
import { useBackend } from '@/stores/backend'
import { useSettingsStore } from '@/stores/settings'
import useLogger from '@/use/useLogger'
import { QSpinnerGears, useMeta, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

useMeta({ title: `${appName} - Settings` })

const $q = useQuasar()
const router = useRouter()
const { log } = useLogger()
const settingsStore = useSettingsStore()
const { initializeClient, loginUser, hasUser, getUserId, getUserEmail } =
  useBackend()

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
 * Resets all settings to their default values.
 */
function onResetSettings() {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all settings?',
      color: 'warning',
      icon: refreshIcon,
      requiresUnlock: true,
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await DB.table(TableEnum.SETTINGS).clear()
      await DB.initializeSettingsOnStartup() // Re-initialize settings immediately
      log.info('Successfully reset settings')
    } catch (error) {
      log.error('Error resetting settings', error as Error)
    } finally {
      $q.loading.hide()
    }
  })
}

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
      requiresUnlock: true,
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await DB.table(TableEnum.LOGS).clear()
      log.info('Successfully deleted Logs')
    } catch (error) {
      log.error(`Error deleting Logs`, error as Error)
    } finally {
      $q.loading.hide()
    }
  })
}

/**
 * Deletes all user data from the database.
 */
function onDeleteUserData() {
  $q.dialog({
    component: DialogConfirm,
    componentProps: {
      title: 'Delete User Data',
      message: 'Are you sure you want to delete all user data?',
      color: 'negative',
      icon: deleteXIcon,
      requiresUnlock: true,
    },
  }).onOk(async () => {
    try {
      $q.loading.show()
      await Promise.all([
        DB.table(TableEnum.IMAGES).clear(),
        DB.table(TableEnum.ITEMS).clear(),
        DB.table(TableEnum.PROMPTS).clear(),
      ])
      log.info('Successfully deleted user data')
    } catch (error) {
      log.error(`Error deleting user data`, error as Error)
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
      requiresUnlock: true,
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

/**
 * Authenticates the user with Supabase with the provided credentials.
 */
async function onAuthenticate() {
  $q.loading.show({
    spinner: QSpinnerGears,
    message: 'Authenticating',
  })

  const projectUrl = settingsStore.projectUrl as string
  const projectApiKey = settingsStore.projectApiKey as string
  const email = settingsStore.userEmail as string
  const password = settingsStore.userPassword as string

  try {
    // All required values for connecting to the backend
    if (!projectUrl) {
      log.error('Project URL is missing')
    } else if (!projectApiKey) {
      log.error('Project API Key is missing')
    } else if (!email) {
      log.error('User email is missing')
    } else if (!password) {
      log.error('User password is missing')
    } else {
      initializeClient(projectUrl, projectApiKey)
      const user = await loginUser(email, password)
      log.info('User authenticated successfully', { user })
    }
  } catch (error) {
    log.error('Error during authentication', error as Error)
  } finally {
    $q.loading.hide()
  }
}
</script>

<template>
  <PageResponsive>
    <q-list padding>
      <q-item-label header>
        <q-icon class="on-left" size="sm" :name="personIcon" />
        Account
      </q-item-label>

      <q-item>
        <q-item-section top>
          <q-item-label>Email</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.userEmail as string"
              @update:model-value="
                DB.table(TableEnum.SETTINGS).put({
                  id: SettingIdEnum.USER_EMAIL,
                  value: $event,
                })
              "
              type="text"
              lazy-rules
              dense
              outlined
              color="primary"
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Password</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.userPassword as string"
              @update:model-value="
                DB.table(TableEnum.SETTINGS).put({
                  id: SettingIdEnum.USER_PASSWORD,
                  value: $event,
                })
              "
              type="password"
              lazy-rules
              dense
              outlined
              color="primary"
            />
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-btn
          class="col"
          label="Authenticate"
          color="primary"
          :icon="keyIcon"
          @click="onAuthenticate"
        />
      </q-item>

      <q-item v-if="hasUser()">
        <q-item-section top>
          <q-item-label>Current User</q-item-label>
          <q-item-label caption>
            {{ getUserId() }}
          </q-item-label>
          <q-item-label caption>
            {{ getUserEmail() }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-separator />

    <q-list padding>
      <q-item-label header>
        <q-icon class="on-left" size="sm" :name="apiIcon" />
        Backend
      </q-item-label>

      <q-item>
        <q-item-section top>
          <q-item-label>Project URL</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.projectUrl as string"
              @update:model-value="
                DB.table(TableEnum.SETTINGS).put({
                  id: SettingIdEnum.PROJECT_URL,
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
          <q-item-label>Project API Key</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.projectApiKey as string"
              @update:model-value="
                DB.table(TableEnum.SETTINGS).put({
                  id: SettingIdEnum.PROJECT_API_KEY,
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
          <q-item-label>AI API Key</q-item-label>
          <q-item-label>
            <q-input
              :model-value="settingsStore.aiApiKey as string"
              @update:model-value="
                DB.table(TableEnum.SETTINGS).put({
                  id: SettingIdEnum.AI_API_KEY,
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
                DB.table(TableEnum.SETTINGS).put({
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
            >
              <template v-slot:append>
                <q-icon
                  @click="
                    DB.table(TableEnum.SETTINGS).put({
                      id: SettingIdEnum.SYSTEM_PROMPT,
                      value: systemPrompt,
                    })
                  "
                  class="cursor-pointer"
                  :name="refreshIcon"
                />
              </template>
            </q-input>
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
                DB.table(TableEnum.SETTINGS).put({
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
            >
              <template v-slot:append>
                <q-icon
                  @click="
                    DB.table(TableEnum.SETTINGS).put({
                      id: SettingIdEnum.USER_PROMPT,
                      value: userPrompt,
                    })
                  "
                  class="cursor-pointer"
                  :name="refreshIcon"
                />
              </template>
            </q-input>
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Max Tokens</q-item-label>
          <q-item-label>
            <q-select
              :model-value="(settingsStore.maxTokens as number) ?? 2048"
              @update:model-value="
                DB.table(TableEnum.SETTINGS).put({
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
                DB.table(TableEnum.SETTINGS).put({
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
    </q-list>

    <q-separator />

    <q-list padding>
      <q-item-label header>
        <q-icon class="on-left" size="sm" :name="optionsIcon" />
        Options
      </q-item-label>

      <q-item tag="label" :disable="$q.loading.isActive">
        <q-item-section top>
          <q-item-label>Show Info Popups</q-item-label>
          <q-item-label caption>
            Show informative popup messages for actions that were completed.
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-toggle
            :model-value="settingsStore.infoMessages"
            @update:model-value="
              DB.table(TableEnum.SETTINGS).put({
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
              DB.table(TableEnum.SETTINGS).put({
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
              DB.table(TableEnum.SETTINGS).put({
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
    </q-list>

    <q-separator />

    <q-list padding>
      <q-item-label header>
        <q-icon class="on-left" size="sm" :name="dataTableIcon" />
        Internal Data Tables
      </q-item-label>

      <q-item>
        <q-btn
          :disable="$q.loading.isActive"
          class="col"
          label="View Logs"
          color="primary"
          :icon="logsTableIcon"
          @click="router.push({ name: RouteNameEnum.VIEW_LOGS })"
        />
      </q-item>

      <q-item>
        <q-btn
          :disable="$q.loading.isActive"
          class="col"
          label="View Settings"
          color="primary"
          :icon="settingsTableIcon"
          @click="router.push({ name: RouteNameEnum.VIEW_SETTINGS })"
        />
      </q-item>

      <q-item>
        <q-btn
          :disable="$q.loading.isActive"
          class="col"
          label="View Prompts"
          color="primary"
          :icon="voiceIcon"
          @click="router.push({ name: RouteNameEnum.VIEW_PROMPTS })"
        />
      </q-item>
    </q-list>

    <q-separator />

    <q-list padding>
      <q-item-label header class="text-negative">
        <q-icon class="on-left" size="sm" :name="warnIcon" />
        Danger Zone
      </q-item-label>

      <q-item>
        <q-item-section top>
          <q-item-label>Reset Settings</q-item-label>
          <q-item-label caption>
            Resets all settings to their default values. This will clear the API
            keys.
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-btn
          :icon="refreshIcon"
          :disable="$q.loading.isActive"
          color="warning"
          @click="onResetSettings()"
        />
      </q-item>

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
          <q-item-label>Delete User Data</q-item-label>
          <q-item-label caption>
            Permanently delete all user data from the app (images, items,
            prompts). This does not delete any settings or logs.
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-mb-sm">
        <q-btn
          :icon="deleteXIcon"
          :disable="$q.loading.isActive"
          color="negative"
          @click="onDeleteUserData()"
        />
      </q-item>

      <q-item>
        <q-item-section top>
          <q-item-label>Delete Database</q-item-label>
          <q-item-label caption>
            Delete the underlining browser database and all of its data
            (requires app reload). Only required when making modifications to
            the local database configuration (primarly the indexes).
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
