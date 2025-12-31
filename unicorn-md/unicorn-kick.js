let handler = async (m, { conn, usedPrefix, command }) => {
  // 🧠 Instruction message
  let usageMsg = `✳️ *Correct Usage:*\n\n🔹 *${usedPrefix + command}* @user — to remove someone.`;

  // 🕵️ Check if a user is tagged or quoted
  if (!m.mentionedJid[0] && !m.quoted)
    return m.reply(usageMsg, m.chat, { mentions: conn.parseMention(usageMsg) });

  // 🆔 Get the user to kick
  let user = m.mentionedJid[0] || m.quoted.sender;

  // ❌ Prevent bot self-kick
  if (conn.user.jid.includes(user)) return m.reply(`😅 *Nice try... but I can't kick myself!*`);

  // 🚷 Kick the user
  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
    m.reply(`✅ *User has been kicked by Unicorn MD.* 👢`);
  } catch (err) {
    console.error('❌ Kick failed:', err);
    m.reply(`❌ *Failed to kick the user.*\nMake sure I have admin privileges.`);
  }
};

handler.help = ['kick @user'];
handler.tags = ['group'];
handler.command = ['kick', 'k']; 
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
