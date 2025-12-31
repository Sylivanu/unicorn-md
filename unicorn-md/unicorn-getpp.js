let handler = async (m, { conn, args, command }) => {
  let user;
  if (m.isGroup) {
    user = m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.quoted
        ? m.quoted.sender
        : m.sender;
  } else {
    user = m.chat;
  }

  try {
    const pp = await conn.profilePictureUrl(user, 'image');
    const name = await conn.getName(user);

    await conn.sendMessage(m.chat, {
      image: { url: pp },
      caption: `🦄 *Unicorn MD User Info*\n\n👤 *Profile of:* @${user.split('@')[0]}\n📛 *Name:* ${name}`,
      contextInfo: {
        mentionedJid: [user],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'Unicorn MD ✨ Profile Lookup',
          serverMessageId: 143
        }
      }
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    m.reply(`❌ Sorry! Couldn’t fetch the profile picture of this user. 🫤`);
  }
};

handler.help = ['spp', 'sprofilepic', 'getpp'];
handler.tags = ['tools'];
handler.command = /^(spp|sprofilepic|getpp)$/i;

export default handler;
