// 🦄 Unicorn MD - Add Member Command
// This command lets group admins add a member by number: .add 254700143167

let handler = async (m, { conn, args }) => {
  try {
    if (!m.isGroup) throw '🧚 *This magical spell only works in group chats!*';

    const groupMetadata = await conn.groupMetadata(m.chat);
    const participants = groupMetadata.participants;

    const botIsAdmin = participants.some(p => p.id === conn.user.jid && p.admin);
    if (!botIsAdmin) throw '🔐 *Unicorn MD must be an admin to summon someone!*';

    const senderIsAdmin = participants.some(p => p.id === m.sender && p.admin);
    if (!senderIsAdmin) throw '🧙‍♂️ *Only group elders (admins) can cast this spell.*';

    if (!args[0]) throw '📞 *Please enter a phone number to summon!*';
    let target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    if (participants.some(p => p.id === target)) {
      throw '✨ *That soul is already in this magical circle (group).*';
    }

    await conn.groupParticipantsUpdate(m.chat, [target], 'add');

    await m.reply(`🦄 *Summoning complete!*\n\n@${target.split('@')[0]} has been added to the enchanted realm ✨`, null, {
      mentions: [target]
    });

  } catch (e) {
    console.error(e);
    m.reply(`❌ *Summoning failed!*\n\n📝 Reason: ${e.message || e}`);
  }
};

handler.help = ['add <number>'];
handler.tags = ['group'];
handler.command = /^add$/i;

handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
