export async function before(message) {
  const conn = this
  if (process.env.AUTO_STATUS_LIKE !== 'true') return false
  if (!message?.key || message.key.remoteJid !== 'status@broadcast') return false

  const sender = message.sender || message.key.participant
  try {
    const likeEmoji = process.env.AUTO_STATUS_LIKE_EMOJI || '💚'
    const botJid = conn.decodeJid(conn.user.id)

    await conn.sendMessage(
      message.key.remoteJid,
      { react: { key: message.key, text: likeEmoji } },
      { statusJidList: [sender, botJid].filter(Boolean) }
    )

    if (process.env.Status_Saver !== 'true' || !sender) return true

    conn.story = conn.story || []
    const type = message.mtype
    const name = await conn.getName(sender).catch(() => 'Unknown')
    const header = Buffer.from('QVVUTyBTVEFUVVMgU0FWRVI=', 'base64').toString()
    let text = ''

    if (type === 'imageMessage' || type === 'videoMessage') {
      text = `${header}\n*🩵Status:* ${name}\n*🩵Caption:* ${message.caption || ''}`
      await conn.copyNForward(botJid, message, true)
      await message.reply(text, { mentions: [sender] })
    } else if (type === 'extendedTextMessage') {
      text = `${header}\n\n${message.text || ''}`
      await message.reply(text, { mentions: [sender] })
    } else if (type === 'audioMessage') {
      await conn.copyNForward(botJid, message, true)
      await message.reply(`${header}\n\n*🩵Status:* ${name}`, { mimetype: message.mimetype })
    } else {
      return true
    }

    conn.story.push({ type, sender, caption: text, buffer: message })

    if (process.env.STATUS_REPLY === 'true') {
      const statusText = process.env.STATUS_MSG || 'SILVA BOT SUCCESSFULLY VIEWED YOUR STATUS'
      await conn.sendMessage(sender, { text: statusText })
    }
  } catch (error) {
    console.error('[auto-status] Failed:', error.message)
  }

  return true
}
