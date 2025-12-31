import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

let handler = async (m, { conn, text, participants }) => {
  try {
    const groupMembers = participants.map(u => conn.decodeJid(u.id));
    const quotedMsg = m.quoted || m;
    const rawContent = m.quoted?.msg || m.msg;

    const contentType = rawContent.toJSON ? quotedMsg.mtype : 'extendedTextMessage';
    const contentData = rawContent.toJSON ? rawContent.toJSON() : { text: rawContent || '' };

    const generatedMessage = conn.cMod(
      m.chat,
      generateWAMessageFromContent(m.chat, {
        [contentType]: contentData
      }, {
        quoted: m,
        userJid: conn.user.id
      }),
      text || quotedMsg.text,
      conn.user.jid,
      { mentions: groupMembers }
    );

    await conn.relayMessage(m.chat, generatedMessage.message, { messageId: generatedMessage.key.id });
  } catch (error) {
    console.error('❌ Error in hidetag command:', error);
    m.reply('⚠️ *Failed to send hidden tag message. Make sure you replied to a message or included text.*');
  }
};

handler.help = ['hidetag', 'notify'];
handler.tags = ['group'];
handler.command = ['hidetag', 'notify'];
handler.group = true;
handler.admin = false;

export default handler;
