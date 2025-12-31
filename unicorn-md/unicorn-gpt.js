// 🦄 Unicorn MD Plugin: AI Chat Assistantj
import fetch from 'node-fetch';

let handler = async (m, { text, conn }) => {
  // 🔍 Validate input
  if (!text && !(m.quoted && m.quoted.text)) {
    throw `🌈 *Unicorn AI*: Please provide some text or quote a message.`;
  }

  if (!text && m.quoted?.text) {
    text = m.quoted.text;
  }

  try {
    m.react('🦄'); // Unicorn wait emoji
    conn.sendPresenceUpdate('composing', m.chat);

    const prompt = encodeURIComponent(text);
    const api1 = `https://api.gurusensei.workers.dev/llama?prompt=${prompt}`;

    // 🧠 Call first AI source
    const res1 = await fetch(api1);
    const data1 = await res1.json();
    const result1 = data1.response?.response;

    if (!result1) throw new Error('No response from API 1');

    await conn.sendMessage(
      m.chat,
      {
        text: `💬 *Unicorn AI Says:*\n\n${result1}\n\n✨ _Powered by Unicorn MD_`,
        image: { url: 'https://i.imgur.com/7MclM4K.png' }, // Unicorn-themed image
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'Unicorn MD • 🧠 AI Results',
            serverMessageId: 143,
          },
        },
      },
      { quoted: m }
    );
    m.react('✅');
  } catch (error) {
    console.error('🛑 Primary AI failed:', error);

    // 🔁 Fallback to second API
    try {
      const api2 = `https://ultimetron.guruapi.tech/gpt3?prompt=${encodeURIComponent(text)}`;
      const res2 = await fetch(api2);
      const data2 = await res2.json();
      const result2 = data2.completion;

      await conn.sendMessage(
        m.chat,
        {
          text: `💬 *Unicorn Backup AI Says:*\n\n${result2}\n\n✨ _Powered by Unicorn MD_`,
          image: { url: 'https://i.imgur.com/7MclM4K.png' },
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'Unicorn MD • 🧠 AI Backup',
              serverMessageId: 143,
            },
          },
        },
        { quoted: m }
      );
      m.react('🥳');
    } catch (error) {
      console.error('🛑 Backup AI failed:', error);
      m.react('😭');
      throw `❌ *Unicorn AI: Both sources failed to respond.*`;
    }
  }
};

handler.help = ['chatgpt', 'ai', 'bro', 'gpt'];
handler.tags = ['ai', 'tools'];
handler.command = ['chatgpt', 'ai', 'bro', 'gpt'];

export default handler;
