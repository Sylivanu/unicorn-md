process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, unlinkSync, watch, mkdirSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import * as ws from 'ws'
import zlib from 'zlib'
import clearTmp from './lib/tempclear.js'

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
import { JSONFile, Low } from 'lowdb'
import NodeCache from 'node-cache'
import { default as Pino, default as pino } from 'pino'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import yargs from 'yargs'
import CloudDBAdapter from './lib/cloudDBAdapter.js'
import { MongoDB } from './lib/mongoDB.js'
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
        // Check if session is valid before deleting
        const credsData = JSON.parse(readFileSync(credsPath, 'utf8'))
        if (!credsData || !credsData.me) {
          unlinkSync(credsPath)
          botLogger.log('INFO', "♻️ Invalid session removed")
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
    
    if (!process.env.SESSION_ID || typeof process.env.SESSION_ID !== 'string') {
      botLogger.log('WARNING', "SESSION_ID missing, using QR")
      return false
    }
    
    const [header, b64data] = process.env.SESSION_ID.split('~')
    if (header !== "Silva" || !b64data) {
      botLogger.log('ERROR', "Invalid session format")
      return false
    }
    
    const cleanB64 = b64data.replace(/\.\.\./g, '')
    const compressedData = Buffer.from(cleanB64, 'base64')
    const decompressedData = zlib.gunzipSync(compressedData)
    writeFileSync(credsPath, decompressedData, "utf8")
    botLogger.log('SUCCESS', "✅ Session loaded successfully")
    return true
  } catch (e) {
    botLogger.log('ERROR', "Session Error: " + e.message)
    return false
  }
}

async function main() {
  const txt = process.env.SESSION_ID

  if (!txt) {
    console.error('Environment variable not found.')
    return
  }

  try {
    await loadSession()
    console.log('Session loading completed.')
  } catch (error) {
    console.error('Error:', error)
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

    // Expected author name (silva)
    const expectedAuthor = Buffer.from('c2lsdmE=', 'base64').toString()
    
    // Warning message for unauthorized copies
    const unauthorizedMessage = Buffer.from(
      'VW5hdXRob3JpemVkIGNvcHkgb2YgVW5pY29ybiBNRCBkZXRlY3RlZC4gUGxlYXNlIHVzZSB0aGUgb2ZmaWNpYWwgdmVyc2lvbiBmcm9tIFNpbHZhIFRlY2ggSW5jLg==',
      'base64'
    ).toString()
    
    // Success message
    const authorizedMessage = Buffer.from(
      'U2VjdXJpdHkgY2hlY2sgcGFzc2VkIC0gVW5pY29ybiBNRCBieSBTaWx2YSBUZWNoIEluYw==',
      'base64'
    ).toString()

    // Check if author matches
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

// FIX: Clear interval reference for cleanup
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
global.opts['db'] = process.env.DATABASE_URL

global.db = new Low(
  /https?:\/\//.test(opts['db'] || '')
    ? new CloudDBAdapter(opts['db'])
    : /mongodb(\+srv)?:\/\//i.test(opts['db'])
      ? new MongoDB(opts['db'])
      : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`)
)

global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ)
    return new Promise(resolve => {
      const checkInterval = setInterval(async function () {
        if (!global.db.READ) {
          clearInterval(checkInterval)
          resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
        }
      }, 1 * 1000)
    })
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  }
  global.db.chain = chain(global.db.data)
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

conn.logger.info('\nUnicorn is waiting Waiting For Login\n')

// FIX: Store interval reference for cleanup
let dbInterval
if (!opts['test']) {
  if (global.db) {
    dbInterval = setInterval(async () => {
      if (global.db.data) await global.db.write()
      if (opts['autocleartmp'] && (global.support || {}).find) {
        const tmp = [require('os').tmpdir(), 'tmp']
        tmp.forEach(filename =>
          require('child_process').spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])
        )
      }
    }, 30 * 1000)
  }
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

// FIX: Store cleanup timeout reference
let cleanupTimeout
function runCleanup() {
  clearTmp()
    .then(() => {
      console.log('Unicorn Temporary file cleanup completed.')
    })
    .catch(error => {
      console.error('unicorn 🦄 An error occurred during temporary file cleanup:', error)
    })
    .finally(() => {
      // 2 minutes
      cleanupTimeout = setTimeout(runCleanup, 1000 * 60 * 2)
    })
}

runCleanup()

function clearsession() {
  let prekey = []
  const directorio = readdirSync('./session')
  const filesFolderPreKeys = directorio.filter(file => {
    return file.startsWith('pre-key-')
  })
  prekey = [...prekey, ...filesFolderPreKeys]
  filesFolderPreKeys.forEach(files => {
    unlinkSync(`./session/${files}`)
  })
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const code =
    lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    try {
      conn.logger.info(await global.reloadHandler(true))
    } catch (error) {
      console.error('Error reloading handler:', error)
    }
  }

  if (code && (code === DisconnectReason.restartRequired || code === 428)) {
    conn.logger.info(chalk.yellow('\nUnicorn 🦄 Restart Required... Restarting'))
    process.send('reset')
  }

  if (global.db.data == null) loadDatabase()

  if (!pairingCode && useQr && qr !== 0 && qr !== undefined) {
    conn.logger.info(chalk.yellow('\nUnicorn is Logging in....'))
  }

  if (connection === 'open') {
    const { jid, name } = conn.user
    const msg = `🦄 *Unicorn MD is Live!*\n\nHello ${name}, am Unicorn thank you for summoning me✅\n\n> THIS IS A SILVA TECH INC BOT\n\n📅 Launched: 1st May 2025\n🔧 Org: Silva Tech Inc.\n\n📢 Updates:\nhttps://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v\n\n— Sylivanus Momanyi`

    await conn.sendMessage(jid, { text: msg, mentions: [jid] }, { quoted: null })

    conn.logger.info(chalk.yellow('\n UNICORN 🦄 𝖶𝖮𝖱𝖪'))
  }

  if (connection === 'close') {
    conn.logger.error(chalk.yellow(`\nUnicorn Connection closed... Get a new unicorn session`))
  }
}

// FIX: Add proper error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
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

// FIX: Store watcher reference for cleanup
let pluginWatcher
global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`\n🦄Updated plugin - '${filename}'`)
      else {
        conn.logger.warn(`\n🦄Deleted plugin - '${filename}'`)
        return delete global.plugins[filename]
      }
    } else conn.logger.info(`\nNew plugin - '${filename}'`)
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) conn.logger.error(`\n🦄Syntax error while loading '${filename}'\n${format(err)}`)
    else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`\n🦄Error require plugin '${filename}\n${format(e)}'`)
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
      spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-filter_complex',
        'color',
        '-frames:v',
        '1',
        '-f',
        'webp',
        '-',
      ]),
      spawn('convert'),
      spawn('magick'),
      spawn('gm'),
      spawn('find', ['--version']),
    ].map(p => {
      return Promise.race([
        new Promise(resolve => {
          p.on('close', code => {
            resolve(code !== 127)
          })
        }),
        new Promise(resolve => {
          p.on('error', _ => resolve(false))
        }),
      ])
    })
  )
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  const s = (global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert,
    magick,
    gm,
    find,
  })
  Object.freeze(global.support)
}

// FIX: Store session cleanup interval reference
let sessionCleanupInterval
async function saafsafai() {
  if (global.stopped === 'close' || !conn || !conn.user) return
  clearsession()
  console.log(chalk.cyanBright('\nUnicorn 🦄 Stored Sessions Cleared'))
}

sessionCleanupInterval = setInterval(saafsafai, 10 * 60 * 1000)

_quickTest().catch(console.error)

// FIX: Add graceful shutdown handler
async function gracefulShutdown() {
  console.log('\n🦄 Shutting down gracefully...')
  
  // Clear all intervals
  if (storeInterval) clearInterval(storeInterval)
  if (dbInterval) clearInterval(dbInterval)
  if (sessionCleanupInterval) clearInterval(sessionCleanupInterval)
  if (cleanupTimeout) clearTimeout(cleanupTimeout)
  
  // Close watcher
  if (pluginWatcher) pluginWatcher.close()
  
  // Close readline
  if (rl) rl.close()
  
  // Close database connection
  if (global.db) {
    try {
      await global.db.write()
    } catch (e) {
      console.error('Error saving database:', e)
    }
  }
  
  // Close WebSocket connection
  if (global.conn?.ws) {
    try {
      global.conn.ws.close()
    } catch (e) {
      console.error('Error closing connection:', e)
    }
  }
  
  // Remove all event listeners
  if (global.conn?.ev) {
    global.conn.ev.removeAllListeners()
  }
  
  console.log('✅ Cleanup complete')
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
