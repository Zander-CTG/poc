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
      await supabase.value.from('sandbox_image_metadata').insert({}).select()

    if (imageMetadataError)
      throw new Error(
        `Error saving image metadata: ${imageMetadataError.message}`,
      )

    const imageMetadataRecord = imageMetadataRecords?.[0]

    // Save image record to storage
    const { error: imageError } = await supabase.value.storage
      .from('sandbox-uploaded-images')
      .upload(`${imageMetadataRecord.user_id}/${imageMetadataRecord.id}`, image)

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

    // Update the image_metadata record with the visible text array
    const { data: updatedImage, error: updateError } = await supabase.value
      .from('sandbox_image_metadata')
      .update({ visible_text: visibleText })
      .eq('id', imageMetadataRecord.id)
      .select()

    if (updateError)
      throw new Error(`Error updating image metadata: ${updateError.message}`)

    // Create an item record for each
    const preparedItems = items.map((item: Record<string, any>) => ({
      ...item,
      image_metadata_id: imageMetadataRecord.id,
    }))

    const { data: insertedItems, error: insertError } = await supabase.value
      .from('sandbox_items')
      .insert(preparedItems)
      .select()

    if (insertError)
      throw new Error(`Error inserting items: ${insertError.message}`)

    return {
      image: updatedImage,
      items: insertedItems,
    }
  }

  const fetchImages = async () => {
    initSupabase()

    const { data: userData } = await supabase.value.auth.getUser()
    if (!userData?.user) throw new Error('User not authenticated')

    const userId = userData.user.id

    const { data: metadata, error: metadataError } = await supabase.value
      .from('sandbox_image_metadata')
      .select('*')
      .eq('user_id', userId) // Filter by user ID
      .order('created_at', { ascending: false })

    if (metadataError)
      throw new Error(`Error fetching images: ${metadataError.message}`)

    // For each metadata record, get the corresponding image URL
    const imagesWithUrls = await Promise.all(
      metadata.map(async (imageData) => {
        // Get a signed URL for the image that expires in 1 hour (3600 seconds)
        const { data: signedData, error: signedError } =
          await supabase.value.storage
            .from('sandbox-uploaded-images')
            .createSignedUrl(`${userId}/${imageData.id}`, 3600)

        if (signedError) {
          console.error(
            `Error creating signed URL for image ${imageData.id}:`,
            signedError,
          )
          return {
            metadata_record: imageData,
            url: null, // Return null if we couldn't get a URL
          }
        }

        return {
          ...imageData,
          url: signedData.signedUrl,
        }
      }),
    )

    return imagesWithUrls
  }

  const fetchImageItems = async (imageId: string) => {
    initSupabase()

    const { data, error } = await supabase.value
      .from('sandbox_items')
      .select('*')
      .eq('image_metadata_id', imageId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching image items: ${error.message}`)

    return data
  }

  const fetchItems = async () => {
    initSupabase()

    const { data: userData } = await supabase.value.auth.getUser()
    if (!userData?.user) throw new Error('User not authenticated')

    const userId = userData.user.id

    const { data, error } = await supabase.value
      .from('sandbox_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching items: ${error.message}`)

    return data
  }

  const fetchSingleImage = async (imageId: string) => {
    initSupabase()

    const { data: userData } = await supabase.value.auth.getUser()
    if (!userData?.user) throw new Error('User not authenticated')

    const userId = userData.user.id

    const { data: signedData, error: signedError } =
      await supabase.value.storage
        .from('sandbox-uploaded-images')
        .createSignedUrl(`${userId}/${imageId}`, 3600)

    if (signedError) {
      throw new Error(
        `Error creating signed URL for image ${imageId}: ${signedError.message}`,
      )
    }

    return signedData
  }

  const deleteImage = async (imageId: string) => {
    initSupabase()

    const { data: userData } = await supabase.value.auth.getUser()
    if (!userData?.user) throw new Error('User not authenticated')

    const userId = userData.user.id

    const { error: deleteError } = await supabase.value
      .from('sandbox_image_metadata')
      .delete()
      .eq('id', imageId)

    if (deleteError)
      throw new Error(`Error deleting image record: ${deleteError.message}`)

    // Delete image from storage {user_id}/{image_id}
    const { error: deleteItemsError } = await supabase.value.storage
      .from('sandbox-uploaded-images')
      .remove([`${userId}/${imageId}`])

    if (deleteItemsError)
      throw new Error(
        `Error deleting image from storage: ${deleteItemsError.message}`,
      )
  }

  const deleteItem = async (itemId: string) => {
    initSupabase()

    const { error } = await supabase.value
      .from('sandbox_items')
      .delete()
      .eq('id', itemId)

    if (error) throw new Error(`Error deleting item: ${error.message}`)

    return true
  }

  // -----Getters

  return {
    supabase,
    initSupabase,
    userLoginRequired,
    loginUser,
    logoutUser,
    uploadAndProcessImage,
    fetchImages,
    fetchImageItems,
    fetchSingleImage,
    fetchItems,
    deleteImage,
    deleteItem,
  }
})
