// ✨ Made with 🦄 magic by UnicornTech
import { cpus as _cpus } from 'os'
import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
  const name = m.pushName || conn.getName(m.sender)
  let _muptime

  if (process.send) {
    process.send('uptime')
    _muptime = await new Promise(resolve => {
      process.once('message', resolve)
      setTimeout(resolve, 1000)
    }) * 1000
  }

  const start = performance.now()

  // React with ✨
  await conn.sendMessage(m.chat, {
    react: {
      text: '✨',
      key: m.key,
    },
  })

  const animationFrames = [
    `🔮 Summoning Unicorn MD...`,
    `➤ Harnessing cloud sparkles...`,
    `➠ Syncing star-powered stats...`,
    `➤ Brewing uptime elixir...`,
    `🌈 Done! Here's your Unicorn insight...`,
  ]

  for (let frame of animationFrames) {
    await conn.sendMessage(m.chat, {
      text: `🛠️ *Unicorn Runtime Monitor*\n${frame}`,
    }, { quoted: m })
    await new Promise(res => setTimeout(res, 400)) // 0.4 sec per frame
  }

  const end = performance.now()
  const latency = (end - start).toFixed(2)
  const cpu = _cpus()[0]
  const cpuModel = cpu.model.trim().split(' ').slice(0, 5).join(' ')
  const cores = _cpus().length
  const uptimeText = clockString(_muptime)

  const message = `
🦄 *UNICORN MD MAGIC REPORT* 🌟

⏳ *Uptime:* ${uptimeText}
⚡ *Latency:* ${latency} ms
🧠 *CPU:* ${cpuModel}
🌀 *Cores:* ${cores}
🔧 *Speed:* ${cpu.speed} MHz

✨ Powered by *Unicorn Core Engine* 🧬
`.trim()

  await conn.sendMessage(m.chat, {
    text: message,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: 'UNICORN MD STATS 💫🦄',
        serverMessageId: 143
      }
    }
  }, { quoted: m })
}

handler.help = ['runtime', 'uptime']
handler.tags = ['info']
handler.command = /^(uptime|runtime)$/i

export default handler

function clockString(ms) {
  let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return `🗓️ ${d}d ${h}h ${m}m ${s}s`
}
