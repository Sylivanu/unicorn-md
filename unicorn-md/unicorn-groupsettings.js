let handler = async (m, { conn, args, usedPrefix, command }) => {
  const groupModes = {
    open: 'not_announcement',
    unmute: 'not_announcement',
    close: 'announcement',
    mute: 'announcement'
  };

  let mode = groupModes[command];

  if (!mode) {
    return m.reply(`
🔧 *Group Settings Menu*

🛡️ *${usedPrefix}close / ${usedPrefix}mute* - Restrict group to *admins only*
💬 *${usedPrefix}open / ${usedPrefix}unmute* - Allow *all members* to send messages
    `.trim());
  }

  try {
    await conn.groupSettingUpdate(m.chat, mode);
    m.reply(`✅ Group has been successfully set to *${command.toUpperCase()}* mode.`);
  } catch (err) {
    m.reply(`❌ Failed to update group settings.\nEnsure I'm an *admin* with permission to manage settings.`);
  }
};

handler.help = ['mute', 'close', 'unmute', 'open'];
handler.tags = ['group'];
handler.command = ['mute', 'close', 'unmute', 'open'];
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
