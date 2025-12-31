import { fileURLToPath } from 'url'
import path from 'path'
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs'
import zlib from 'zlib'

const botLogger = {
  log: (type, message) => {
    const timestamp = new Date().toLocaleString()
    console.log(`[${timestamp}] [${type}] ${message}`)
  }
}

/**
 * Process Silva session ID and save credentials
 * @param {string} txt - Session ID in format "Silva~base64data"
 * @returns {Promise<boolean>} - Success status
 */
async function processTxtAndSaveCredentials(txt) {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const credsPath = path.join(__dirname, '..', 'session', 'creds.json')
    
    // Create session directory if it doesn't exist
    const sessionDir = path.join(__dirname, '..', 'session')
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true })
    }
    
    // Clean old sessions if needed
    if (existsSync(credsPath)) {
      try {
        // Check if session is valid before deleting
        const credsData = JSON.parse(readFileSync(credsPath, 'utf8'))
        if (!credsData || !credsData.me) {
          unlinkSync(credsPath)
          botLogger.log('INFO', "♻️ Invalid session removed")
        } else {
          botLogger.log('INFO', "✅ Valid session already exists")
          return true
        }
      } catch (e) {
        // If can't parse, remove it
        try {
          unlinkSync(credsPath)
          botLogger.log('INFO', "♻️ Corrupted session removed")
        } catch (err) {
          // Ignore error
        }
      }
    }
    
    if (!txt || typeof txt !== 'string') {
      botLogger.log('ERROR', "Invalid session ID format")
      return false
    }
    
    // Parse session ID
    const [header, b64data] = txt.split('~')
    
    if (header !== "Silva" || !b64data) {
      botLogger.log('ERROR', "Invalid session format. Expected 'Silva~base64data'")
      return false
    }
    
    // Clean and decode base64
    const cleanB64 = b64data.replace(/\.\.\./g, '')
    const compressedData = Buffer.from(cleanB64, 'base64')
    
    // Decompress the data
    const decompressedData = zlib.gunzipSync(compressedData)
    
    // Validate JSON structure
    try {
      const jsonData = JSON.parse(decompressedData.toString('utf8'))
      if (!jsonData || typeof jsonData !== 'object') {
        botLogger.log('ERROR', "Invalid session data structure")
        return false
      }
    } catch (e) {
      botLogger.log('ERROR', "Session data is not valid JSON")
      return false
    }
    
    // Write credentials to file
    writeFileSync(credsPath, decompressedData, "utf8")
    
    botLogger.log('SUCCESS', `✅ Session loaded successfully to ${credsPath}`)
    return true
    
  } catch (error) {
    botLogger.log('ERROR', `Session Error: ${error.message}`)
    console.error('Full error:', error)
    return false
  }
}

export default processTxtAndSaveCredentials
