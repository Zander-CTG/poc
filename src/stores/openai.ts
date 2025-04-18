import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useOpenAiStore = defineStore('openai', () => {
  // -----State
  const aiApiKey: Ref<string> = ref('')
  const systemPrompt: Ref<string> = ref(
    'You are an AI that detects and identifies every distinct item in an image for an inventory and cataloging system. Do not summarize or group results. Your output response must always be a stringified JSON object. Dont include any text outside of the JSON.',
  )
  const userPrompt: Ref<string> = ref(
    'Analyze this image and return a stringified JSON object with every individual item in a root property called `items` with the following sub properties: `type` (what type of item is it), `brand` (item brand if known, empty string if not), `label` (descriptive label for the item if it was on a store shelf), `description` (description of the item and its appearance), and `categories` (organizational categories and tags that would apply to the item). Also include a `visible_text` root property on the JSON object that contains an array of strings of written text found in the image.',
  )
  const maxTokens: Ref<number> = ref(2048)
  const modelName: Ref<string> = ref('gpt-4-turbo')

  // -----Actions
  const processImage = async (file: File) => {
    if (!file) throw new Error('Image is missing')
    if (!aiApiKey.value) throw new Error('API Key is missing')
    if (!systemPrompt.value) throw new Error('System Prompt is missing')
    if (!userPrompt.value) throw new Error('User Prompt is missing')
    if (!maxTokens.value) throw new Error('Max Tokens is missing')
    if (!modelName.value) throw new Error('Model Name is missing')

    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Extract the base64 part (remove the "data:image/jpeg;base64," prefix)
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

    // Create JSON payload
    const jsonPayload = {
      model: modelName.value,
      messages: [
        {
          role: 'system',
          content: systemPrompt.value,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt.value,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: maxTokens.value,
      temperature: 0,
    }

    // Measure the time taken for the API call
    const startTime = Date.now()

    // Call the API with the payload
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiApiKey.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload),
    })

    const data = await response.json()
    const responseTime = Date.now() - startTime

    // Return the response data
    return { data, responseTime }
  }

  // -----Getters
  const getAiApiKey = () => {
    if (!aiApiKey.value) throw new Error('API Key is missing')
    return aiApiKey.value
  }
  const getSystemPrompt = () => {
    if (!systemPrompt.value) throw new Error('System Prompt is missing')
    return systemPrompt.value
  }
  const getUserPrompt = () => {
    if (!userPrompt.value) throw new Error('User Prompt is missing')
    return userPrompt.value
  }
  const getMaxTokens = () => {
    if (!maxTokens.value) throw new Error('Max Tokens is missing')
    return maxTokens.value
  }
  const getModelName = () => {
    if (!modelName.value) throw new Error('Model Name is missing')
    return modelName.value
  }

  return {
    processImage,
    getAiApiKey,
    getSystemPrompt,
    getUserPrompt,
    getMaxTokens,
    getModelName,
  }
})
