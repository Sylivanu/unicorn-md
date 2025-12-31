let handler = async (m, { conn, participants, usedPrefix, command }) => {
  const usage = `✳️ *Correct Usage:*\n\n🔹 *${usedPrefix + command}* @user — Remove, Delete Msg & Block from Inbox`;

  // 🕵️ Check if a user is mentioned or quoted
  if (!m.mentionedJid[0] && !m.quoted) {
    return m.reply(usage, m.chat, { mentions: conn.parseMention(usage) });
  }

  const user = m.mentionedJid[0] || m.quoted.sender;

  // 🧹 Attempt to delete the triggering or quoted message
  try {
    if (m.message?.extendedTextMessage?.contextInfo) {
      const delet = m.message.extendedTextMessage.contextInfo.participant;
      const bang = m.message.extendedTextMessage.contextInfo.stanzaId;
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: bang,
          participant: delet
        }
      });
    } else if (m.quoted?.vM?.key) {
      await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
    }
  } catch (err) {
    console.error("⚠️ Message deletion error:", err);
  }

  // 🚷 Kick the user
  await conn.groupParticipantsUpdate(m.chat, [user], 'remove');

  // 🔒 Block the user in DM
  await conn.updateBlockStatus(user, 'block');

  // ✅ Confirmation
  m.reply(`✅ *User has been eliminated*\n🗑️ *Message deleted*\n🔒 *Blocked from inbox* 👋🏻`);
};

handler.help = ['kick3 @user', 'kkk @user'];
handler.tags = ['group'];
handler.command = ['kick3', 'expulsar3', 'k3', 'kkk'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
