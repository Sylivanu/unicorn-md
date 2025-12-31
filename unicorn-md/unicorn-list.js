let handler = async (m, { conn, usedPrefix, command }) => {
  let who = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.fromMe
        ? conn.user.jid
        : m.sender

  if (!(who in global.db.data.users)) throw `✨ User not found in the magical database.`

  let pp = './media/unicorn.jpg' // Make sure this image exists
  let more = String.fromCharCode(8206)
  let readMore = more.repeat(850)

  let lkr
  switch (command) {
    case 'list':
      lkr = `
🦄✨ *Unicorn MD Realm* ✨🦄
${readMore}
Here’s your enchanted menu scroll 📜:

🧩 *${usedPrefix}botmenu* – 🤖 Basic Powers  
👑 *${usedPrefix}ownermenu* – 👨‍💼 Owner Privileges  
👭 *${usedPrefix}groupmenu* – 🌐 Group Spells  
📥 *${usedPrefix}dlmenu* – 📦 Media Summoner  
🎉 *${usedPrefix}funmenu* – 🦋 Fun & Frolic  
💎 *${usedPrefix}economymenu* – 🏦 Coin Kingdom  
🕹️ *${usedPrefix}gamemenu* – 🧩 Minigames  
✨ *${usedPrefix}stickermenu* – 🖼️ Sticker Lab  
🧰 *${usedPrefix}toolmenu* – 🔧 Utility Spells  
🎨 *${usedPrefix}logomenu* – 🪄 Logo Magic  
🌈 *${usedPrefix}nsfwmenu* – 🔞 NSFW Vault

_Type any of the above commands to explore the realm._ 🧚‍♀️`
      break

    case 'botmenu':
      lkr = `
╭━━━⌜ 🦄 𝕌ℕ𝕀ℂ𝕆ℝℕ 𝔹𝕆𝕋 ℳ𝔼ℕ𝕌 ⌟━━━╮
┃📡 _${usedPrefix}gita_ – Git facts!
┃📶 _${usedPrefix}ping_ – Ping status
┃⏱️ _${usedPrefix}uptime_ – Bot uptime
┃🤖 _${usedPrefix}bot_ – Bot info
┃🧙 _${usedPrefix}owner_ – Summon the wizard
┃📜 _${usedPrefix}script_ – View bot code
┃🧭 _${usedPrefix}runtime_ – Run status
┃ℹ️ _${usedPrefix}infobot_ – Unicorn core stats
┃💖 _${usedPrefix}donate_ – Fuel the Unicorn ✨
┃🌐 _${usedPrefix}groups_ – Our community
┃🚫 _${usedPrefix}blocklist_ – Banned folks
┃🏅 _${usedPrefix}listprem_ – Premium users
┃🧠 _Unicorn AI_ – Ask the stars 🌟
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'ownermenu':
      lkr = `
╭━━━⌜ 👑 𝕌𝕟𝕚𝕔𝕠𝕣𝕟 𝕆𝕨𝕟𝕖𝕣 ℳ𝔼ℕ𝕌 ⌟━━━╮
┃🛑 _${usedPrefix}banchat / unbanchat_
┃❌ _${usedPrefix}banuser / unbanuser_
┃📢 _${usedPrefix}broadcast / broadcastgc_
┃🪄 _${usedPrefix}join_ – Magic link join
┃🖼️ _${usedPrefix}setppbot_ – Change bot look
┃🔤 _${usedPrefix}setprefix / resetprefix_
┃📁 _${usedPrefix}getfile / getplugin_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'groupmenu':
      lkr = `
╭━━━⌜ 👥 𝕌𝕟𝕚𝕔𝕠𝕣𝕟 𝔾𝕣𝕠𝕦𝕡 ℳ𝔼ℕ𝕌 ⌟━━━╮
┃🔨 _${usedPrefix}kick @tag_
┃🔼 _${usedPrefix}promote @tag_
┃🔽 _${usedPrefix}demote @tag_
┃📋 _${usedPrefix}infogroup_
┃🔗 _${usedPrefix}link / resetlink_
┃🌅 _${usedPrefix}setpp_
┃📝 _${usedPrefix}setname / setdesc_
┃🎉 _${usedPrefix}setwelcome / setbye_
┃🔇 _${usedPrefix}hidetag_
┃⚠️ _${usedPrefix}warn / unwarn_
┃🔐 _${usedPrefix}group open/close_
┃🛠️ _${usedPrefix}enable / disable_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'dlmenu':
      lkr = `
╭━━━⌜ 📥 𝕌𝕟𝕚𝕔𝕠𝕣𝕟 𝔻𝕠𝕨𝕟𝕝𝕠𝕒𝕕 ℳ𝔼ℕ𝕌 ⌟━━━╮
┃🎵 _${usedPrefix}play / song_
┃🎞️ _${usedPrefix}ytv / ytmp4_
┃🎧 _${usedPrefix}yta / ytmp3_
┃🖼️ _${usedPrefix}gimage / pinterest_
┃📁 _${usedPrefix}mediafire / gdrive_
┃💻 _${usedPrefix}gitclone / github_
┃🐦 _${usedPrefix}twitter_
┃🎶 _${usedPrefix}spotify_
┃📽️ _${usedPrefix}tiktok / instagram_
┃📘 _${usedPrefix}facebook_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'economymenu':
      lkr = `
╭━━━⌜ 💰 𝕌𝕟𝕚𝕔𝕠𝕣𝕟 𝔼𝕔𝕠𝕟𝕠𝕞𝕪 ⌟━━━╮
┃📅 _${usedPrefix}daily / weekly / monthly_
┃🏆 _${usedPrefix}leaderboard_
┃🎲 _${usedPrefix}bet / gamble_
┃🧙 _${usedPrefix}heal / adventure_
┃⛏️ _${usedPrefix}mine / work_
┃🛍️ _${usedPrefix}shop / sell_
┃🔁 _${usedPrefix}transfer / todia / tomoney_
┃🎁 _${usedPrefix}opencrate / claim_
┃⚒️ _${usedPrefix}craft_
┃💳 _${usedPrefix}balance_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    case 'funmenu':
      lkr = `
╭━━━⌜ 🎉 𝕌𝕟𝕚𝕔𝕠𝕣𝕟 𝔽𝕦𝕟 ℳ𝔼ℕ𝕌 ⌟━━━╮
┃🔍 _${usedPrefix}character_
┃🗣️ _${usedPrefix}truth / dare_
┃💌 _${usedPrefix}flirt / ship_
┃🏳️‍🌈 _${usedPrefix}gay_
┃🎤 _${usedPrefix}shayeri / ytcomment_
┃🤣 _${usedPrefix}stupid / lolicon_
┃🃏 _${usedPrefix}simpcard / hornycard_
╰━━━━━━━━━━━━━━━━━━╯`
      break

    default:
      lkr = '❌ Whoops! That menu doesn’t exist in the magical realm.'
      break
  }

  conn.sendMessage(m.chat, {
    image: { url: pp },
    caption: lkr.trim(),
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '🌈 Unicorn MD Bot 🦄',
        serverMessageId: 143
      }
    }
  }, { quoted: m })
}

handler.help = ['list', 'botmenu', 'ownermenu', 'groupmenu', 'dlmenu', 'economymenu', 'funmenu']
handler.tags = ['main']
handler.command = ['list', 'botmenu', 'ownermenu', 'groupmenu', 'dlmenu', 'economymenu', 'funmenu']

export default handler
