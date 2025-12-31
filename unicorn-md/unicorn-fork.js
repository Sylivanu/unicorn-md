import fetch from 'node-fetch';

const handler = async (m, { conn }) => {
  const user = 'Sylivanu';
  const repo = 'unicorn-md';
  const apiUrl = `https://api.github.com/repos/${user}/${repo}`;

  try {
    const res = await fetch(apiUrl);
    const json = await res.json();

    const forks = json.forks_count || 0;
    const stars = json.stargazers_count || 0;

    let message = `🦄 *UNICORN MD GITHUB MILESTONE REPORT*\n\n`;
    message += `🔹 *⭐ Stars:* ${stars}\n`;
    message += `🔹 *🍴 Forks:* ${forks}\n\n`;

    if (forks >= 1000 && forks < 1500) {
      message += `🎉 *Milestone Unlocked:* *1000 forks!*\n💖 Thanks for the magical support! 🌈`;
    } else if (forks >= 1500 && forks < 2000) {
      message += `🔥 *We're blazing through — 1500 forks!*\n🦄 Stay enchanted! ✨`;
    } else if (forks >= 2000) {
      message += `👑 *LEGENDARY!* Over 2000 forks!\n🌟 The Unicorn MD family is unstoppable! 🛡️`;
    } else {
      message += `🛠️ Help us hit the next big milestone!\n📢 Share the repo and spread the Unicorn magic! 🦄`;
    }

    message += `\n\n🔗 GitHub: https://github.com/${user}/${repo}`;

    await conn.sendMessage(m.chat, {
      text: message,
      mentions: [m.sender],
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'Unicorn MD Updates 🦄✨',
          serverMessageId: 143
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('❌ Failed to fetch Unicorn MD GitHub data. Please try again later.');
  }
};

handler.help = ['milestone'];
handler.tags = ['info', 'fun'];
handler.command = ['milestone', 'forks', 'stars', 'repo'];

export default handler;
