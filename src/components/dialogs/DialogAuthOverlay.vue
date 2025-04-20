<script setup lang="ts">
import { DB } from '@/services/db'
import { appName } from '@/shared/constants'
import { SettingIdEnum, TableEnum } from '@/shared/enums'
import { useBackend } from '@/stores/backend'
import { useSettingsStore } from '@/stores/settings'
import useLogger from '@/use/useLogger'
import { QSpinnerGears, useQuasar } from 'quasar'
import { onUpdated, ref, type Ref } from 'vue'

const $q = useQuasar()
const { log } = useLogger()
const { getLoginOverlaySetting, getProjectUrlSetting, getUserEmailSetting } =
  useSettingsStore()
const { userLoginRequired, loginUser, logoutUser } = useBackend()

const loginRequired: Ref<boolean> = ref(false)
const currentUser: Ref<Record<string, any>> = ref({})
const password: Ref<string> = ref('')

onUpdated(async () => {
  try {
    const { isLoginRequired, user } = await userLoginRequired()
    loginRequired.value = isLoginRequired
    currentUser.value = user
  } catch (error) {
    log.error('Error checking login status', error as Error)
  }
})

async function onLogin() {
  try {
    $q.loading.show({
      spinner: QSpinnerGears,
      message: 'Authenticating...',
    })
    await loginUser(getUserEmailSetting(), password.value)
    DB.table(TableEnum.SETTINGS).put({
      id: SettingIdEnum.LOGIN_OVERLAY,
      value: false,
    })
  } catch (error) {
    log.error('Error authenticating', error as Error)
  } finally {
    $q.loading.hide()
  }
}

async function onLogout() {
  try {
    $q.loading.show({
      spinner: QSpinnerGears,
      message: 'Logging out...',
    })
    await logoutUser()
  } catch (error) {
    log.error('Error during logout', error as Error)
  } finally {
    $q.loading.hide()
    DB.table(TableEnum.SETTINGS).put({
      id: SettingIdEnum.LOGIN_OVERLAY,
      value: false,
    })
  }
}

function onClose() {
  DB.table(TableEnum.SETTINGS).put({
    id: SettingIdEnum.LOGIN_OVERLAY,
    value: false,
  })
}
</script>

<template>
  <q-dialog
    :model-value="getLoginOverlaySetting()"
    @update:model-value="
      DB.table(TableEnum.SETTINGS).put({
        id: SettingIdEnum.LOGIN_OVERLAY,
        value: $event,
      })
    "
    persistent
  >
    <q-card flat square style="width: 500px">
      <q-card-section>
        <q-list v-if="loginRequired" padding>
          <q-item class="text-h6"> Login to {{ appName }} </q-item>

          <q-item>
            <q-item-section top>
              <q-item-label>Project URL</q-item-label>
              <q-item-label>
                <q-input
                  :model-value="getProjectUrlSetting()"
                  @update:model-value="
                    DB.table(TableEnum.SETTINGS).put({
                      id: SettingIdEnum.PROJECT_URL,
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
              <q-item-label>Email</q-item-label>
              <q-item-label>
                <q-input
                  :model-value="getUserEmailSetting()"
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
                  v-model="password"
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
              no-caps
              label="Login"
              class="full-width"
              size="lg"
              color="positive"
              @click="onLogin()"
            />
          </q-item>

          <q-item>
            <q-btn
              no-caps
              label="Cancel"
              class="full-width"
              size="lg"
              color="primary"
              @click="onClose()"
            />
          </q-item>
        </q-list>

        <q-list v-else padding>
          <q-item class="text-h6"> Current User </q-item>

          <q-item>
            <q-item-section top>
              <q-item-label>Email</q-item-label>
              <q-item-label caption> {{ currentUser?.email }} </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section top>
              <q-item-label>Id</q-item-label>
              <q-item-label caption> {{ currentUser?.id }} </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-btn
              no-caps
              label="Logout"
              class="full-width"
              size="lg"
              color="negative"
              @click="onLogout()"
            />
          </q-item>

          <q-item>
            <q-btn
              no-caps
              label="Cancel"
              class="full-width"
              size="lg"
              color="primary"
              @click="onClose()"
            />
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
