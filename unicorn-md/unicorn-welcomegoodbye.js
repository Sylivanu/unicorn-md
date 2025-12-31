// 🦄 Unicorn MD Plugin: Group Participant Updates (Welcome & Goodbye)

import fetch from 'node-fetch';

let handler = async (m, { conn }) => {}; // Core plugin handler
handler.all = async function () {}; // Keep plugin active (even if not directly triggered)

// Group participant updates: join/leave
global.conn.ev.on('group-participants.update', async (update) => {
  try {
    const metadata = await conn.groupMetadata(update.id); // Get group metadata
    const participants = update.participants; // Get affected participants

    for (const user of participants) {
      const groupMemberCount = metadata.participants.length;
      const username = await conn.getName(user);
      const profilePic = await conn.profilePictureUrl(user, 'image')
        .catch(() => 'https://i.imgur.com/unicorn_default.jpg');

      // 🧚‍♀️ Welcome Message
      if (update.action === 'add' && process.env.WELCOME_MSG === 'true') {
        const welcomeMessage = `
🦄 *Unicorn Alert!* 🦄

✨ @${user.split('@')[0]} just arrived in *${metadata.subject}*! 🌟
Roll out the sparkle carpet, fam! 💫💖

👥 We’re now *${groupMemberCount}* enchanted beings in this realm!
        `.trim();

        await conn.sendMessage(update.id, {
          image: { url: profilePic },
          caption: welcomeMessage,
          contextInfo: {
            mentionedJid: [user],
            forwardingScore: 1000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'Unicorn MD: ✨WELCOME✨',
              serverMessageId: 143
            }
          }
        });
      }

      // 🌌 Goodbye Message
      if (update.action === 'remove' && process.env.GOODBYE_MSG === 'true') {
        const goodbyeMessage = `
🌪️ *Farewell, Starwalker!* 🌌

@${user.split('@')[0]} just left *${metadata.subject}* 🕊️
Their journey continues beyond the magical gate. 🌠

👥 Remaining legends: *${groupMemberCount - 1}*
        `.trim();

        await conn.sendMessage(update.id, {
          image: { url: profilePic },
          caption: goodbyeMessage,
          contextInfo: {
            mentionedJid: [user],
            forwardingScore: 1000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'Unicorn MD: 💔GOODBYE💔',
              serverMessageId: 143
            }
          }
        });
      }
    }
  } catch (err) {
    console.error('[Unicorn MD] Error handling group update:', err);
  }
});

export default handler;
