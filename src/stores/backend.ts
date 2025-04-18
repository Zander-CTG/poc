import { SupabaseClient } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useBackend = defineStore('backend', () => {
  // -----State
  const supabase: Ref<SupabaseClient> = ref(null!)
  const user: Ref<Record<string, any>> = ref(null!)

  // -----Actions
  /**
   * Initialize the Supabase client with the provided project URL and API key.
   */
  const initializeClient = (projectUrl: string, projectApiKey: string) => {
    if (!projectUrl) throw new Error('Project URL is missing')
    if (!projectApiKey) throw new Error('Project API Key is missing')

    // Initialize Supabase client
    supabase.value = new SupabaseClient(projectUrl, projectApiKey)
  }

  /**
   * Log in a user with the provided email and password. Logs out any existing user.
   */
  const loginUser = async (email: string, password: string) => {
    if (!email) throw new Error('Email is missing')
    if (!password) throw new Error('Password is missing')

    // Sign out any existing user
    await supabase.value.auth.signOut()
    const { data, error } = await supabase.value.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    user.value = data.user

    return data.user
  }

  /**
   * Upload an image file to Supabase storage and create a metadata record.
   */
  const uploadImage = async (file: File) => {
    // Create initial metadata record to get id
    const { data: imageMetadataRecords, error: metadataError } =
      await supabase.value
        .from('mjoy_image_metadata')
        .insert({
          owner_user_id: user.value?.id,
        })
        .select()

    if (metadataError) throw metadataError
    const imageMetadataRecord = imageMetadataRecords?.[0]

    // Upload file to storage
    const { data: fileData, error: fileError } = await supabase.value.storage
      .from('mjoy-uploaded-images')
      .upload(
        `${imageMetadataRecord.owner_user_id}/${imageMetadataRecord.id}`,
        file,
      )

    if (fileError) throw fileError
    return { imageMetadataRecord, fileData }
  }

  /**
   * Returns a list of combined image and metadata records for the current user.
   */
  const loadImages = async () => {
    const imageRecords: {
      id: string
      metadata: Record<string, any>
      url: string
      created_at: string
    }[] = []

    // Get metadata records for the current user
    const { data: imageMetadataRecords, error: imageMetadataError } =
      await supabase.value
        .from('mjoy_image_metadata')
        .select('*')
        .eq('owner_user_id', user.value?.id)

    if (imageMetadataError) throw imageMetadataError
    if (!imageMetadataRecords || imageMetadataRecords.length === 0) {
      return []
    }

    // For each metadata record, get the image from storage
    for (const record of imageMetadataRecords) {
      const filePath = `${record.owner_user_id}/${record.id}`

      // Create a signed URL with expiration (e.g., 60 minutes)
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.value.storage
          .from('mjoy-uploaded-images')
          .createSignedUrl(filePath, 60 * 60) // Expires in 1 hour (3600 seconds)

      if (signedUrlError) throw signedUrlError
      if (signedUrlData?.signedUrl) {
        // Create an image object with metadata and URL
        const imageObj = {
          id: record.id,
          metadata: record,
          url: signedUrlData.signedUrl,
          created_at: record.created_at,
        }

        imageRecords.push(imageObj)
      }
    }

    return imageRecords
  }

  // -----Getters
  const hasUser = () => {
    return !!user.value && !!user.value?.id && !!user.value?.email
  }
  const getUserEmail = () => {
    return user.value?.email || 'ERROR'
  }
  const getUserId = () => {
    return user.value?.id || 'ERROR'
  }

  return {
    initializeClient,
    loginUser,
    uploadImage,
    loadImages,
    hasUser,
    getUserEmail,
    getUserId,
  }
})
