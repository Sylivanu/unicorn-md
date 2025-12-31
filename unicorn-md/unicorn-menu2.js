import { createHash } from 'crypto'
import PhoneNumber from 'awesome-phonenumber'
import { canLevelUp, xpRange } from '../lib/levelling.js'
import fetch from 'node-fetch'
import fs from 'fs'
const { levelling } = '../lib/levelling.js'
import moment from 'moment-timezone'
import { promises } from 'fs'
import { join } from 'path'
const time = moment.tz('Africa/Nairobi').format('HH')
let wib = moment.tz('Africa/Nairobi').format('HH:mm:ss')

let handler = async (m, { conn, usedPrefix, command }) => {
    let d = new Date(new Date + 3600000)
    let locale = 'en'
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    if (!(who in global.db.data.users)) throw `🦄 User not found in Unicorn database`
    let pp = './media/unicorn.jpg'
    let user = global.db.data.users[who]
    let { name, exp, diamond, lastclaim, registered, regTime, age, level, role, warn } = user
    let { min, xp, max } = xpRange(user.level, global.multiplier)
    let username = conn.getName(who)
    let math = max - xp
    let prem = global.prems.includes(who.split`@`[0])
    let sn = createHash('md5').update(who).digest('hex')
    let totaluser = Object.values(global.db.data.users).length 
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length 
    let more = String.fromCharCode(8206)
    let readMore = more.repeat(850) 
    let greeting = ucapan()
    let quote = quotes[Math.floor(Math.random() * quotes.length)]
    let taguser = '@' + m.sender.split("@s.whatsapp.net")[0]

    let str = `
🦄 *_Hey ${name}, ${greeting}!*_ 🌈✨

📜 *_Unicorn Quote of the Day:_* 
*"${quote}"* 🪄

╔═══ 🌟 *Your Magical Info* 🌟 ═══╗
║ 🧚‍♂️ *Username:* ${taguser}
║ 🎀 *Display Name:* ${name}
║ 💎 *Diamonds:* ${diamond}
║ 🧙 *Role:* ${role}
║ 📈 *XP:* ${exp}
║ 🪄 *Unicorn Code:* 𝐔𝐍𝐈𝐂𝐎𝐑𝐍
╚═════════════════════════════╝

╔════ 📆 *Today’s Sprinkle* 📆 ════╗
║ 📅 *Date:* ${date}
║ 🕒 *Time:* ${wib}
╚═══════════════════════════════╝

╔════ 🤖 *Bot Status - Unicorn MD* 🤖 ════╗
║ 🧠 *Bot Name:* ${botname}
║ 🖥️ *Platform:* Linux
║ 💡 *Prefix:* ${usedPrefix}
║ ⏱️ *Uptime:* ${uptime}
║ 📚 *Registered:* ${rtotalreg} / ${totaluser}
╚════════════════════════════════════╝

🌟 *_Need help?_ Use ${usedPrefix}list or ${usedPrefix}help2 to open your magical spellbook!_*
`

    conn.sendFile(m.chat, pp, './media/shizo.jpg', str, m, null, rpyt)
    m.react(done)
}

handler.help = ['main']
handler.tags = ['group']
handler.command = ['menu2', 'help2'] 

export default handler

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function ucapan() {
    const time = moment.tz('Africa/Nairobi').format('HH')
    let res = "riding early in the starlit sky 🌠"
    if (time >= 4) res = "Good Morning 🌅"
    if (time >= 10) res = "Good Afternoon ☀️"
    if (time >= 15) res = "Twilight Blessings 🌇"
    if (time >= 18) res = "Enchanted Evening 🌙"
    return res
}

const quotes = [
    "Sparkle like you mean it.",
    "Stay magical, stay weird.",
    "Don’t quit your daydream.",
    "Unicorns don’t believe in the word ‘impossible’.",
    "Be a unicorn in a field of horses.",
    "Rainbows are proof that beauty comes after storms.",
    "You are someone’s reason to smile—be that magic!",
    "Believe in yourself, even when no one else does.",
    "Wings are not always visible. Yours are made of dreams.",
    "Every day is a glitter opportunity.",
    "Your vibe attracts your tribe—make it sparkly.",
    "Unicorns don’t follow paths, they create them.",
    "The world needs more glitter and kindness.",
    "Shine like the universe is yours.",
    "You weren’t born to blend in. You were born to dazzle.",
    "Life’s too short to be ordinary—add sparkle!",
    "Magic is real—you’re looking at it in the mirror.",
    "Being different is your superpower.",
    "Let your dreams gallop wild like unicorns in a starlit meadow.",
    "Keep calm and ride a unicorn.",
    "Even stars get tired. Rest, recharge, return brighter.",
    "Sparkles, sass, and a bit of badass—that’s Unicorn style.",
    "You don’t need permission to be legendary.",
    "The sky is not the limit, it’s just the beginning.",
    "In a world of trends, be timeless.",
    "Smile big, dream bold, shine loud!"
];
