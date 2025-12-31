export async function all(m) {
  const settings = global.db.data.settings[this.user.jid] || {};

  // Identify group invite attempts in private chats
  const isGroupInvite =
    m.mtype === 'groupInviteMessage' ||
    m.text?.startsWith?.('https://chat') ||
    m.text?.toLowerCase?.().includes('open this link');

  if (isGroupInvite && !m.isBaileys && !m.isGroup) {
    const username = m.sender?.split('@')[0] || 'user';

    const warningMessage = {
      text: `🚫 *Group Invite Detected!*\n\nHey @${username}, sharing group links in private chats is *not allowed*.\n\n🦄 *Want to add Unicorn MD to your group?*\n📩 Type \`\`\`.owner\`\`\` to contact the bot owner.\n\n💼 _Bot rental & partnerships available!_`,
      mentions: [m.sender],
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: '🦄 Unicorn News 🧚',
          serverMessageId: 2025
        }
      }
    };

    await this.sendMessage(m.chat, warningMessage, { quoted: m });
    await m.react('🚫');
  }

  return true;
}
