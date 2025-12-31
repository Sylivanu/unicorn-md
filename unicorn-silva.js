process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

// Suppress punycode deprecation warning (caused by @whiskeysockets/baileys dependencies)
process.removeAllListeners('warning')
process.on('warning', (warning) => {
  // Ignore punycode deprecation - it's from a dependency, not our code
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return
  }
  // Show other warnings
  console.warn(warning.name + ':', warning.message)
})

import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, unlinkSync, watch, mkdirSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import * as ws from 'ws'
import zlib from 'zlib'
import { EventEmitter } from 'events'
import clearTmp from './lib/tempclear.js'

// Increase EventEmitter limit to prevent warnings
EventEmitter.defaultMaxListeners = 20

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix
    ? /file:\/\/\//.test(pathURL)
      ? fileURLToPath(pathURL)
      : pathURL
    : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

import chalk from 'chalk'
import { spawn } from 'child_process'
import lodash from 'lodash'
import NodeCache from 'node-cache'
import { default as Pino, default as pino } from 'pino'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import yargs from 'yargs'
import { makeWASocket, protoType, serialize } from './lib/simple.js'

const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageRetryMap,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  delay,
  jidNormalizedUser,
  PHONENUMBER_MCC,
} = await (
  await import('@whiskeysockets/baileys')
).default

import readline from 'readline'

dotenv.config()

// ============================== 
// 🔐 SESSION MANAGEMENT 
// ============================== 
const botLogger = {
  log: (type, message) => {
    const timestamp = new Date().toLocaleString()
    console.log(`[${timestamp}] [${type}] ${message}`)
  }
}

async function loadSession() {
  try {
    const credsPath = './session/creds.json'
    
    if (!existsSync('./session')) {
      mkdirSync('./session', { recursive: true })
    }
    
    // Clean old sessions if needed
    if (existsSync(credsPath)) {
      try {
        const credsData = JSON.parse(readFileSync(credsPath, 'utf8'))
        if (!credsData || !credsData.me) {
          unlinkSync(credsPath)
          botLogger.log('INFO', "♻️ Invalid session removed")
        } else {
          botLogger.log('INFO', "✅ Valid session found")
          return true
        }
      } catch (e) {
        try {
          unlinkSync(credsPath)
          botLogger.log('INFO', "♻️ Corrupted session removed")
        } catch (err) {
          // Ignore error
        }
      }
    }
    
    if (!process.env.SESSION_ID || typeof process.env.SESSION_ID !== 'string') {
      botLogger.log('WARNING', "⚠️ SESSION_ID missing, using QR")
      return false
    }
    
    const [header, b64data] = process.env.SESSION_ID.split('~')
    if (header !== "Silva" || !b64data) {
      botLogger.log('ERROR', "❌ Invalid session format. Expected: Silva~base64data")
      return false
    }
    
    const cleanB64 = b64data.replace(/\.\.\./g, '')
    const compressedData = Buffer.from(cleanB64, 'base64')
    const decompressedData = zlib.gunzipSync(compressedData)
    
    // Validate JSON
    const jsonData = JSON.parse(decompressedData.toString('utf8'))
    if (!jsonData.me || !jsonData.me.id) {
      botLogger.log('ERROR', "❌ Session data is invalid (missing 'me' field)")
      return false
    }
    
    writeFileSync(credsPath, decompressedData, "utf8")
    botLogger.log('SUCCESS', "✅ Session loaded successfully")
    return true
  } catch (e) {
    botLogger.log('ERROR', "❌ Session Error: " + e.message)
    botLogger.log('ERROR', "💡 Please generate a NEW session ID")
    return false
  }
}

async function main() {
  const txt = process.env.SESSION_ID

  if (!txt) {
    console.error('❌ SESSION_ID environment variable not found.')
    console.error('💡 Set SESSION_ID in your environment variables')
    return
  }

  try {
    const loaded = await loadSession()
    if (!loaded) {
      console.error('❌ Failed to load session. Please check SESSION_ID format.')
      process.exit(1)
    }
    console.log('✅ Session loading completed.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

await delay(1000 * 10)

// ============================== 
// 🔐 AUTHOR VERIFICATION 
// ============================== 
async function verifyAuthor() {
  try {
    const packageJson = readFileSync('package.json', 'utf8')
    const packageData = JSON.parse(packageJson)
    const authorName = packageData.author && packageData.author.name

    if (!authorName) {
      console.log(chalk.red('❌ Author information missing in package.json'))
      process.exit(1)
    }

    const expectedAuthor = Buffer.from('c2lsdmE=', 'base64').toString()
    const unauthorizedMessage = Buffer.from(
      'VW5hdXRob3JpemVkIGNvcHkgb2YgVW5pY29ybiBNRCBkZXRlY3RlZC4gUGxlYXNlIHVzZSB0aGUgb2ZmaWNpYWwgdmVyc2lvbiBmcm9tIFNpbHZhIFRlY2ggSW5jLg==',
      'base64'
    ).toString()
    const authorizedMessage = Buffer.from(
      'U2VjdXJpdHkgY2hlY2sgcGFzc2VkIC0gVW5pY29ybiBNRCBieSBTaWx2YSBUZWNoIEluYw==',
      'base64'
    ).toString()

    if (authorName && authorName.trim().toLowerCase() !== expectedAuthor.toLowerCase()) {
      console.log(chalk.red('\n' + '='.repeat(60)))
      console.log(chalk.red(unauthorizedMessage))
      console.log(chalk.red('='.repeat(60) + '\n'))
      process.exit(1)
    } else {
      console.log(chalk.green('\n✅ ' + authorizedMessage))
      console.log(chalk.bgBlack(chalk.cyan('🦄 Starting Unicorn MD Bot...\n')))
    }
  } catch (error) {
    console.error(chalk.red('Error during author verification:'), error)
    process.exit(1)
  }
}

verifyAuthor()

const pairingCode = !!global.pairingNumber || process.argv.includes('--pairing-code')
const useQr = process.argv.includes('--qr')
const useStore = true

const MAIN_LOGGER = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` })
const logger = MAIN_LOGGER.child({})
logger.level = 'fatal'

const store = useStore ? makeInMemoryStore({ logger }) : undefined
store?.readFromFile('./session.json')

let storeInterval = setInterval(() => {
  store?.writeToFile('./session.json')
}, 10000 * 6)

const msgRetryCounterCache = new NodeCache()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const question = text => new Promise(resolve => rl.question(text, resolve))

const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.API = (name, path = '/', query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? '?' +
      new URLSearchParams(
        Object.entries({
          ...query,
          ...(apikeyqueryname
            ? {
                [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name],
              }
            : {}),
        })
      )
    : '')

global.timestamp = {
  start: new Date(),
}

const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp(
  '^[' +
    (process.env.PREFIX || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(
      /[|\\{}()[\]^$+*?.\-\^]/g,
      '\\$&'
    ) +
    ']'
)

// ============================== 
// 🗄️ SIMPLIFIED IN-MEMORY DATABASE
// ============================== 
global.db = {
  data: {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
  },
  chain: null,
  READ: false,
  write: async function() {
    // Optional: implement file-based persistence if needed
    return Promise.resolve()
  },
  read: async function() {
    // Optional: implement file-based persistence if needed
    return Promise.resolve()
  }
}

global.db.chain = chain(global.db.data)
global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.data !== null) return global.db.data
  return global.db.data
}

loadDatabase()

global.authFolder = `session`
const { state, saveCreds } = await useMultiFileAuthState(global.authFolder)

const connectionOptions = {
  version: [2, 3000, 1015901307],
  logger: Pino({
    level: 'fatal',
  }),
  printQRInTerminal: !pairingCode,
  browser: ['chrome (linux)', '', ''],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      Pino().child({
        level: 'fatal',
        stream: 'store',
      })
    ),
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async key => {
    let jid = jidNormalizedUser(key.remoteJid)
    let msg = await store.loadMessage(jid, key.id)
    return msg?.message || ''
  },
  patchMessageBeforeSending: message => {
    const requiresPatch = !!(
      message.buttonsMessage ||
      message.templateMessage ||
      message.listMessage
    )
    if (requiresPatch) {
      message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      }
    }
    return message
  },
  msgRetryCounterCache,
  defaultQueryTimeoutMs: undefined,
  syncFullHistory: false,
}

global.conn = makeWASocket(connectionOptions)
conn.isInit = false
store?.bind(conn.ev)

if (pairingCode && !conn.authState.creds.registered) {
  let phoneNumber
  if (!!global.pairingNumber) {
    phoneNumber = global.pairingNumber.replace(/[^0-9]/g, '')

    if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
      console.log(
        chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 254xxx"))
      )
      process.exit(0)
    }
  } else {
    phoneNumber = await question(
      chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `))
    )
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

    if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
      console.log(
        chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 254xxx"))
      )

      phoneNumber = await question(
        chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `))
      )
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
      rl.close()
    }
  }

  setTimeout(async () => {
    let code = await conn.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join('-') || code
    const pairingCode =
      chalk.bold.greenBright('Your Pairing Code:') + ' ' + chalk.bgGreenBright(chalk.black(code))
    console.log(pairingCode)
  }, 3000)
}

conn.logger.info('\n🦄 Unicorn is waiting for Login\n')

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

let cleanupTimeout
function runCleanup() {
  clearTmp()
    .then(() => {
      console.log('✅ Unicorn Temporary file cleanup completed.')
    })
    .catch(error => {
      console.error('⚠️ Cleanup error:', error.message)
    })
    .finally(() => {
      cleanupTimeout = setTimeout(runCleanup, 1000 * 60 * 2)
    })
}

runCleanup()

function clearsession() {
  try {
    const directorio = readdirSync('./session')
    const filesFolderPreKeys = directorio.filter(file => file.startsWith('pre-key-'))
    filesFolderPreKeys.forEach(files => {
      unlinkSync(`./session/${files}`)
    })
  } catch (error) {
    // Ignore errors during cleanup
  }
}

// Track reconnection attempts
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
let reconnectTimeout = null

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const code =
    lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
  
  const reason = lastDisconnect?.error?.message || 'Unknown'

  if (!pairingCode && useQr && qr !== 0 && qr !== undefined) {
    conn.logger.info(chalk.yellow('🔐 QR Code ready for scanning...'))
  }

  if (connection === 'open') {
    reconnectAttempts = 0
    const { jid, name } = conn.user
    const msg = `🦄 *Unicorn MD is Live!*\n\nHello ${name}, am Unicorn thank you for summoning me✅\n\n> THIS IS A SILVA TECH INC BOT\n\n📅 Launched: 1st May 2025\n🔧 Org: Silva Tech Inc.\n\n📢 Updates:\nhttps://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v\n\n— Sylivanus Momanyi`

    try {
      await conn.sendMessage(jid, { text: msg, mentions: [jid] }, { quoted: null })
      conn.logger.info(chalk.green('\n✅ UNICORN 🦄 IS ONLINE AND READY!\n'))
    } catch (error) {
      conn.logger.error('Error sending welcome message:', error.message)
    }
  }

  if (connection === 'close') {
    console.log(chalk.yellow(`\n⚠️ Connection closed. Code: ${code}, Reason: ${reason}`))
    
    // Handle different disconnect reasons
    if (code === DisconnectReason.loggedOut) {
      console.error(chalk.red('\n❌ DEVICE LOGGED OUT!'))
      console.error(chalk.red('📱 Go to WhatsApp → Linked Devices → Remove this bot'))
      console.error(chalk.red('🔑 Generate a COMPLETELY NEW session ID'))
      console.error(chalk.red('⚠️ DO NOT reuse the old session!\n'))
      return // Don't reconnect
    }
    
    if (code === DisconnectReason.badSession) {
      console.error(chalk.red('\n❌ BAD SESSION!'))
      console.error(chalk.red('🔑 Your session ID is corrupted or invalid'))
      console.error(chalk.red('💡 Solution: Generate a NEW session ID'))
      console.error(chalk.red('📱 Remove old devices from WhatsApp first\n'))
      return // Don't reconnect
    }

    if (code === DisconnectReason.connectionReplaced) {
      console.error(chalk.red('\n❌ CONNECTION REPLACED!'))
      console.error(chalk.red('⚠️ Same session is being used elsewhere'))
      console.error(chalk.red('💡 Only use one session per deployment\n'))
      return // Don't reconnect
    }
    
    if (code === DisconnectReason.restartRequired) {
      console.log(chalk.yellow('🔄 Restart required... Reconnecting in 3s'))
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      reconnectTimeout = setTimeout(async () => {
        await global.reloadHandler(true)
      }, 3000)
      return
    }

    if (code === DisconnectReason.connectionClosed || code === DisconnectReason.connectionLost) {
      reconnectAttempts++
      if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        const backoff = 3000 * reconnectAttempts
        console.log(chalk.yellow(`🔄 Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${backoff/1000}s`))
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(async () => {
          await global.reloadHandler(true)
        }, backoff)
        return
      } else {
        console.error(chalk.red('\n❌ Max reconnection attempts reached'))
        console.error(chalk.red('💡 If this persists, generate a NEW session ID\n'))
        return
      }
    }

    if (code === DisconnectReason.timedOut) {
      console.log(chalk.yellow('⏱️ Connection timed out. Reconnecting in 2s...'))
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      reconnectTimeout = setTimeout(async () => {
        await global.reloadHandler(true)
      }, 2000)
      return
    }

    // For 403/401 or unknown errors - likely bad session
    if (code === 401 || code === 403 || !code) {
      console.error(chalk.red('\n❌ AUTHENTICATION FAILED!'))
      console.error(chalk.red('🔑 Session is invalid, expired, or revoked'))
      console.error(chalk.red('💡 Generate a NEW session ID'))
      console.error(chalk.red('📱 Steps:'))
      console.error(chalk.red('   1. Open WhatsApp → Settings → Linked Devices'))
      console.error(chalk.red('   2. Remove ALL old bot connections'))
      console.error(chalk.red('   3. Generate fresh session ID'))
      console.error(chalk.red('   4. Update SESSION_ID variable'))
      console.error(chalk.red('   5. Restart bot\n'))
      return // Don't reconnect
    }

    console.error(chalk.yellow(`⚠️ Unexpected disconnect (code: ${code})`))
  }
}

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message)
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.stack)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason)
})

let isInit = true
let handler = await import('./handler.js')

global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (error) {
    console.error('Handler reload error:', error)
  }
  
  if (restatConn) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws.close()
    } catch {}
    
    conn.ev.removeAllListeners()
    
    global.conn = makeWASocket(connectionOptions, {
      chats: oldChats,
    })
    isInit = true
  }
  
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('messages.update', conn.pollUpdate)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('message.delete', conn.onDelete)
    conn.ev.off('presence.update', conn.presenceUpdate)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.welcome = `🦄✨ Welcome @user!\n🎉 You've entered *@group*! Get ready for the magic!\n📜 Check the group scroll: @desc`
  conn.bye = `💨 @user has left the realm.\n👋 May the unicorns guide you!`
  conn.spromote = `🛡️✨ *@user* has been crowned as *Admin*!\nUnicorn power granted! 🦄`
  conn.sdemote = `⚔️ *@user* has stepped down from the admin throne.`
  conn.sDesc = `📝✨ Group prophecy updated:\n@desc`
  conn.sSubject = `🔮✨ The group's new identity is:\n@group`
  conn.sIcon = `🖼️✨ A fresh new sigil (icon) has been placed! 🦄`
  conn.sRevoke = `🔗✨ New portal opened:\n@revoke`
  conn.sAnnounceOn = `🚪✨ The gates are *CLOSED*!\nOnly the guardians (admins) may speak.`
  conn.sAnnounceOff = `🎊✨ The gates are *OPEN*!\nLet the magic flow from everyone!`
  conn.sRestrictOn = `🛠️✨ Only unicorn masters (admins) can edit the group scroll now.`
  conn.sRestrictOff = `🛠️✨ All members may now shape the group destiny!`

  conn.handler = handler.handler.bind(global.conn)
  conn.pollUpdate = handler.pollUpdate.bind(global.conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  conn.onDelete = handler.deleteUpdate.bind(global.conn)
  conn.presenceUpdate = handler.presenceUpdate.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('messages.update', conn.pollUpdate)
  conn.ev.on('group-participants.update', conn.participantsUpdate)
  conn.ev.on('groups.update', conn.groupsUpdate)
  conn.ev.on('message.delete', conn.onDelete)
  conn.ev.on('presence.update', conn.presenceUpdate)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  isInit = false
  return true
}

const pluginFolder = global.__dirname(join(__dirname, './unicorn-md/index'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}

filesInit()
  .then(_ => Object.keys(global.plugins))
  .catch(console.error)

let pluginWatcher
global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`\n🦄 Updated plugin - '${filename}'`)
      else {
        conn.logger.warn(`\n🦄 Deleted plugin - '${filename}'`)
        return delete global.plugins[filename]
      }
    } else conn.logger.info(`\n🦄 New plugin - '${filename}'`)
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) conn.logger.error(`\n🦄 Syntax error while loading '${filename}'\n${format(err)}`)
    else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`\n🦄 Error require plugin '${filename}\n${format(e)}'`)
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        )
      }
    }
  }
}

Object.freeze(global.reload)
pluginWatcher = watch(pluginFolder, global.reload)
await global.reloadHandler()

async function _quickTest() {
  const test = await Promise.all(
    [
      spawn('ffmpeg'),
      spawn('ffprobe'),
      spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
      spawn('convert'),
      spawn('magick'),
      spawn('gm'),
      spawn('find', ['--version']),
    ].map(p => {
      return Promise.race([
        new Promise(resolve => p.on('close', code => resolve(code !== 127))),
        new Promise(resolve => p.on('error', _ => resolve(false))),
      ])
    })
  )
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find }
  Object.freeze(global.support)
}

let sessionCleanupInterval
async function saafsafai() {
  if (global.stopped === 'close' || !conn || !conn.user) return
  clearsession()
  console.log(chalk.cyanBright('♻️ Unicorn session pre-keys cleared'))
}

sessionCleanupInterval = setInterval(saafsafai, 10 * 60 * 1000)

_quickTest().catch(console.error)

async function gracefulShutdown() {
  console.log('\n🦄 Shutting down gracefully...')
  
  if (storeInterval) clearInterval(storeInterval)
  if (sessionCleanupInterval) clearInterval(sessionCleanupInterval)
  if (cleanupTimeout) clearTimeout(cleanupTimeout)
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  if (pluginWatcher) pluginWatcher.close()
  if (rl) rl.close()
  
  if (global.conn?.ws) {
    try {
      global.conn.ws.close()
    } catch (e) {}
  }
  
  if (global.conn?.ev) {
    global.conn.ev.removeAllListeners()
  }
  
  console.log('✅ Cleanup complete')
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
