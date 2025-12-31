export async function all(m) {
  const settings = global.db.data.settings[this.user.jid] || {};

  // 🔒 Check if ANTILINK is enabled via env
  const antilinkEnabled = process.env.ANTILINK === 'true';
  if (!antilinkEnabled) return true;

  const isGroupLink =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link');

  if (isGroupLink && m.isGroup && !m.isBaileys) {
    const groupMetadata = await this.groupMetadata(m.chat);
    const botNumber = this.user.jid;
    const isBotAdmin = groupMetadata.participants
      .find(p => p.id === botNumber)?.admin === 'admin';

    const senderUsername = m.sender?.split('@')[0] || 'user';

    const contextStyle = {
      mentions: [m.sender],
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: '🦄 Unicorn MD Bot',
          serverMessageId: 777,
        }
      }
    };

    if (isBotAdmin) {
      // 🚮 Delete the message
      await this.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.sender
        }
      });

      // ⚠️ Send warning
      await this.sendMessage(m.chat, {
        text: `🚫 @${senderUsername}, posting group links is *not allowed* in this group!\n\n🦄 Respect the Unicorn rules!`,
        ...contextStyle
      });

    } else {
      // 🛑 Bot is not admin
      await this.sendMessage(m.chat, {
        text: `⚠️ @${senderUsername}, I detected a group link.\n\n❌ *But I’m not an admin*, so I can't delete it.\n\n👑 Ask a group admin to promote Unicorn MD for better protection!`,
        ...contextStyle
      });
    }

    await m.react('⚠️');
  }

  return true;
}
