// 🦄 Unicorn MD Plugin: Save Contact

let handler = async (m, { conn, args }) => {
  // 🧙 Determine the user to save
  let who = m.mentionedJid && m.mentionedJid[0] 
    ? m.mentionedJid[0] 
    : m.fromMe 
      ? conn.user.jid 
      : m.sender;

  let username = await conn.getName(who);

  // 🌟 Send the magical contact card
  await conn.sendContact(
    m.chat,
    [[`${who.split`@`[0]}@s.whatsapp.net`, `${username}`]],
    m,
    {
      quoted: m,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: '🦄 Unicorn MD Contact Wizard',
          body: '✨ Save enchanted companions in your contacts!',
          thumbnailUrl: 'https://i.imgur.com/xl744J1.jpeg',
          mediaType: 1,
          renderLargerThumbnail: true,
          sourceUrl: 'https://github.com/Sylivanu/unicorn-md'
        }
      }
    }
  );
};

handler.help = ['savecontact *@tag*'];
handler.tags = ['tools'];
handler.command = ['savecontact', 'save'];

export default handler;
