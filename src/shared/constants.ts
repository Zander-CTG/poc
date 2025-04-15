export const appDatabaseVersion = '1.0.0'

export const appName = 'POC Search'

export const appDescription = `
  This is a proof of concept app for searching inventory data created by an external system.
`

export const displayDateFormat = 'ddd, YYYY MMM Do, h:mm A' // Sun, 2024 Sep 1st, 12:17 PM

export const pickerDateFormat = 'ddd MMM DD YYYY HH:mm:00' // Sun Sep 01 2024 12:17:00

export const systemPrompt =
  'You are an AI that detects and identifies every distinct item in an image for an inventory and cataloging system. Do not summarize or group results. Your output response must always be a stringified JSON object. Dont include any text outside of the JSON.'

export const userPrompt =
  'Analyze this image and return a stringified JSON object with every individual item in a root property called `items` with the following sub properties: `type` (what type of item is it), `brand` (item brand if known, empty string if not), `label` (descriptive label for the item if it was on a store shelf), `description` (description of the item and its appearance), and `categories` (organizational categories and tags that would apply to the item). Also include a `visible_text` root property on the JSON object that contains an array of strings of written text found in the image.'
