import { performance } from 'perf_hooks'
import moment from 'moment-timezone'
import { promisify } from 'util'

let handler = async (m, { conn, usedPrefix, command }) => {
  let user = global.db.data.users[m.sender]
  let name = await conn.getName(m.sender)
  let date = moment.tz('Africa/Nairobi').format('dddd, MMMM Do YYYY')
  let time = moment.tz('Africa/Nairobi').format('hh:mm A')
  let uptime = process.uptime() * 1000
  let muptime = await promisify(setTimeout)(0).then(() => process.uptime() * 1000)

  let mode = global.opts['self'] ? '🌙 Private' : '🌞 Public'
  let ping = performance.now()
  let pp = './media/unicornmenu.jpg' // 🖼 Replace with your custom Unicorn image

  let more = String.fromCharCode(8206)
  let readMore = more.repeat(900)

  let menu = `
╭━━━⟡ 🦄 𝕌ℕ𝕀ℂ𝕆ℝℕ 𝕄𝔻 ⟡━━━╮
┃✨ Hello, *${name}*!
┃📆 Date: *${date}*
┃⏰ Time: *${time}*
┃📡 Ping: *${(performance.now() - ping).toFixed(2)} ms*
┃🔋 Uptime: *${clockString(uptime)}*
┃🧠 Runtime: *${clockString(muptime)}*
┃🔮 Mode: *${mode}*
╰━━━━━━━━━━━━━━━━━━━╯

🦄 *MAIN CATEGORIES* 🦄
╭──❖
│ 🧭 ${usedPrefix}botmenu
│ 👑 ${usedPrefix}ownermenu
│ 👥 ${usedPrefix}groupmenu
│ 📥 ${usedPrefix}dlmenu
│ 🎲 ${usedPrefix}gamemenu
│ 💸 ${usedPrefix}economymenu
│ 🎭 ${usedPrefix}funmenu
│ 🖼️ ${usedPrefix}stickermenu
│ 🔧 ${usedPrefix}toolmenu
│ 🖌️ ${usedPrefix}logomenu
│ 🍑 ${usedPrefix}nsfwmenu
╰──────────────

🧠 *QUICK COMMANDS*
╭──❖
│ 📡 ${usedPrefix}ping
│ 🤖 ${usedPrefix}bot
│ 🔍 ${usedPrefix}infobot
│ ⏱️ ${usedPrefix}uptime
│ 🧭 ${usedPrefix}runtime
│ 💖 ${usedPrefix}donate
│ 👤 ${usedPrefix}owner
╰──────────────

📜 *GROUP MANAGEMENT*
╭──❖
│ 🚷 ${usedPrefix}kick
│ 👑 ${usedPrefix}promote
│ 📉 ${usedPrefix}demote
│ 🔐 ${usedPrefix}group open/close
│ 🖼️ ${usedPrefix}setpp
│ 📣 ${usedPrefix}setwelcome/setbye
╰──────────────

📥 *DOWNLOAD ZONE*
╭──❖
│ 🎧 ${usedPrefix}play
│ 📹 ${usedPrefix}ytv / yta
│ 📘 ${usedPrefix}facebook
│ 🎥 ${usedPrefix}tiktok
│ 📁 ${usedPrefix}mediafire
│ 🐱‍🏍 ${usedPrefix}gitclone
╰──────────────

💰 *ECONOMY SYSTEM*
╭──❖
│ 🪙 ${usedPrefix}daily
│ 🎲 ${usedPrefix}bet / gamble
│ 💼 ${usedPrefix}work
│ 📊 ${usedPrefix}balance
│ 🔁 ${usedPrefix}transfer
╰──────────────

🎉 *FUN & MAGIC*
╭──❖
│ 💬 ${usedPrefix}truth / dare
│ ❤️ ${usedPrefix}ship
│ 🃏 ${usedPrefix}ytcomment
│ 🎴 ${usedPrefix}simpcard / hornycard
╰──────────────

🎨 *STICKER & LOGO*
╭──❖
│ 🌟 ${usedPrefix}attp / ttp
│ 🌀 ${usedPrefix}sticker / smeme
│ 🖌️ ${usedPrefix}stickermeme
│ 💫 ${usedPrefix}logo / glitch / neon
╰──────────────

🔞 *NSFW 18+ ZONE*
╭──❖
│ 🍑 ${usedPrefix}nsfwloli / nsfwgif
│ 🍒 ${usedPrefix}xxx / hentai / xnxx
╰──────────────

🎁 *UNICORN SECRETS*
╭──❖
│ 🪄 ${usedPrefix}easteregg1
│ 🎁 ${usedPrefix}easteregg2
│ ✨ ${usedPrefix}easteregg3
╰──────────────

🦄 *UNICORN MD | POWERED BY MAGIC SINCE 2025*  
🌐 *https://github.com/Sylivanu/unicorn-md*
${readMore}
`

  conn.sendMessage(m.chat, {
    image: { url: pp },
    caption: menu,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '🦄 Unicorn News 🧚',
        serverMessageId: 2025
      }
    }
  }, { quoted: m })
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

handler.help = ['menu']
handler.tags = ['menu']
handler.command = ['menu']

export default handler
