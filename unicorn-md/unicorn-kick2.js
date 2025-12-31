let handler = async (m, { conn, participants, usedPrefix, command }) => {
  let kickUsage = `✳️ *Correct Usage:*\n\n🔹 *${usedPrefix + command}* @user — Remove by mention\n🔹 *${usedPrefix + command}* (reply to user) — Remove + Delete their message`;

  let user = m.mentionedJid[0] || (m.quoted && m.quoted.sender);
  if (!user) return m.reply(kickUsage, m.chat, { mentions: conn.parseMention(kickUsage) });

  try {
    // Attempt to delete the quoted message if available
    if (m.quoted && m.quoted.vM?.key) {
      await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
    } else if (m.message?.extendedTextMessage?.contextInfo?.stanzaId) {
      let delet = m.message.extendedTextMessage.contextInfo.participant;
      let bang = m.message.extendedTextMessage.contextInfo.stanzaId;
      await conn.sendMessage(m.chat, {
        delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }
      });
    }
  } catch (e) {
    console.error('⚠️ Error deleting message:', e);
  }

  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
    await m.reply(`✅ *User removed successfully by Unicorn MD.*\n🧹 Message cleaned up! 👋`);
  } catch (e) {
    console.error('⚠️ Error removing user:', e);
    await m.reply('❌ Failed to remove user. Make sure I have admin rights!');
  }
};

handler.help = ['kick2 @user', 'kk @user'];
handler.tags = ['group'];
handler.command = ['kick2', 'expulsar32', 'k2', 'kk'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
