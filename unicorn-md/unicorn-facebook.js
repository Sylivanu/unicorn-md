import fg from 'api-dylux';
import fetch from 'node-fetch'; // ensure this is available

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    throw `🦄 *Please provide a Facebook video link!*\n\n📌 *Example:*\n${usedPrefix + command} https://fb.watch/abcd1234`;
  }

  const urlRegex =
    /^(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
  if (!urlRegex.test(args[0])) {
    throw '⚠️ *Invalid link.* Please enter a valid Facebook video URL.';
  }

  m.react('🕐'); // Unicorn wait reaction

  try {
    const result = await fg.fbdl(args[0]);

    const caption = `
🦄 *UNICORN MD - FACEBOOK VIDEO DOWNLOADER* 🦄

🎬 *Title:* ${result.title}
📥 *Status:* Downloading...

✨ Thank you for using *Unicorn MD*!
`.trim();

    const response = await fetch(result.videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    await conn.sendFile(m.chat, videoBuffer, 'unicorn_fb_video.mp4', caption, m);
    m.react('✅'); // Done
  } catch (error) {
    console.error(error);
    m.reply('❌ *Oops!* Something went wrong while fetching the video. Please try again later.');
  }
};

handler.help = ['facebook <url>'];
handler.tags = ['downloader'];
handler.command = /^((facebook|fb)(downloader|dl)?)$/i;
handler.diamond = true;

export default handler;
