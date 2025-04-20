import { Prompt } from '@/models/Prompt'
import { DB } from '@/services/db'
import { TableEnum } from '@/shared/enums'
import { SupabaseClient } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { useSettingsStore } from './settings'

export const useBackend = defineStore('backend', () => {
  const settingsStore = useSettingsStore()

  // -----State
  const supabase: Ref<SupabaseClient> = ref(null!)

  // -----Actions
  const initSupabase = () => {
    if (supabase.value) {
      return
    }

    const projectUrl = settingsStore.getProjectUrlSetting()
    const projectAnonApiKey = settingsStore.getProjectAnonApiKeySetting()

    if (!projectUrl) throw new Error('Project URL is required')
    if (!projectAnonApiKey) throw new Error('Project Anon API Key is required')

    supabase.value = new SupabaseClient(projectUrl, projectAnonApiKey)
  }

  const userLoginRequired = async () => {
    initSupabase()

    const { data } = await supabase.value.auth.getUser()

    if (data.user) {
      return {
        isLoginRequired: false,
        user: data.user,
      }
    }
    return {
      isLoginRequired: true,
      user: {},
    }
  }

  const loginUser = async (email: string, password: string) => {
    initSupabase()

    if (!email) throw new Error('Email is required')
    if (!password) throw new Error('Password is required')

    const { error } = await supabase.value.auth.signInWithPassword({
      email,
      password,
    })

    if (error)
      throw new Error(
        `Error logging in user: ${error.message} (${error.status})`,
      )
  }

  const logoutUser = async () => {
    initSupabase()

    const { error } = await supabase.value.auth.signOut()

    if (error) {
      throw new Error(
        `Error logging out user: ${error.message} (${error.status})`,
      )
    }
  }

  const uploadAndProcessImage = async (image: File) => {
    initSupabase()

    if (!image) throw new Error('Image is required')
    if (!settingsStore.getOpenAiApiKeySetting())
      throw new Error('OpenAI API key is required')

    const base64Image = await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        resolve(reader.result?.toString().split(',')[1] || null)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(image)
    })

    // Edit this to change how the API responds to the image
    const openApiJsonPayload = {
      model: settingsStore.getModelNameSetting(),
      messages: [
        {
          role: 'system',
          content: settingsStore.getSystemPromptSetting(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: settingsStore.getUserPromptSetting(),
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${image.type};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: settingsStore.getMaxTokensSetting(),
      temperature: 0,
    }

    const startTime = Date.now()

    const openApiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settingsStore.getOpenAiApiKeySetting()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openApiJsonPayload),
      },
    )

    const data = await openApiResponse.json()
    const responseContent = data?.choices?.[0]?.message?.content
    const startIndex = responseContent.indexOf('{')
    const endIndex = responseContent.lastIndexOf('}')
    const trimmedContent = responseContent.substring(startIndex, endIndex + 1)

    // Save image to database
    const { data: imageMetadataRecords, error: imageMetadataError } =
      await supabase.value.from('mjoy_image_metadata').insert({}).select()

    if (imageMetadataError)
      throw new Error(
        `Error saving image metadata: ${imageMetadataError.message}`,
      )

    const imageMetadataRecord = imageMetadataRecords?.[0]

    // Save image record to storage
    const { error: imageError } = await supabase.value.storage
      .from('mjoy-uploaded-images')
      .upload(
        `${imageMetadataRecord.owner_user_id}/${imageMetadataRecord.id}`,
        image,
      )

    if (imageError)
      throw new Error(`Error uploading image: ${imageError.message}`)

    await DB.table(TableEnum.PROMPTS).add(
      new Prompt({
        image_id: imageMetadataRecord.id,
        model: settingsStore.getModelNameSetting(),
        system_prompt: settingsStore.getSystemPromptSetting(),
        user_prompt: settingsStore.getUserPromptSetting(),
        max_tokens: settingsStore.getMaxTokensSetting(),
        response_time: Date.now() - startTime,
        response_data: data,
        response_content_json: trimmedContent,
      }),
    )

    let parsedContent: Record<string, any> = {}

    try {
      parsedContent = JSON.parse(trimmedContent) as Record<string, any>
    } catch (error) {
      throw new Error(
        `Error parsing JSON response: ${error} (${openApiResponse.status})`,
      )
    }

    const items = parsedContent?.items || []
    const visibleText = parsedContent?.visible_text || []

    console.log('Items:', items) // TEMP
    console.log('Visible Text:', visibleText) // TEMP
    // TODO: Create item records in the database
    // TODO: Remove items and images from local storage considerations
  }

  // -----Getters

  return {
    supabase,
    initSupabase,
    userLoginRequired,
    loginUser,
    logoutUser,
    uploadAndProcessImage,
  }
})
