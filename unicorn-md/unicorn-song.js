// 🦄 Unicorn MD Plugin: YouTube MP3 Downloader
import axios from "axios";
import ytSearch from "yt-search";

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🎵✨ *Oopsie! Tell me the song you'd like to summon, starwalker.*");

  let loadingMsg = await m.reply("🔍🦄 *Unicorn MD is galloping through the cosmos to fetch your tune...*");

  try {
    const search = await ytSearch(text);
    const video = search.videos[0];

    if (!video) return m.reply("🚫 *No magical echoes found! Try another song name.*");

    const link = video.url;
    const apis = [
      `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
      `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`,
      `https://api.akuari.my.id/downloader/youtubeaudio?link=${link}`
    ];

    let response;
    for (let api of apis) {
      try {
        response = await axios.get(api);
        if (response.data.status === 200 || response.data.success) break;
      } catch (error) {
        console.error(`⚠️ API Error (${api}):`, error.message);
        continue;
      }
    }

    if (!response || !response.data || !(response.data.status === 200 || response.data.success)) {
      return m.reply("⚠️ *All song portals are closed! Please try again later, magical one.*");
    }

    const data = response.data.result || response.data;
    const audioUrl = data.downloadUrl || data.url;
    if (!audioUrl) throw new Error('Audio provider returned no download URL')
    const songData = {
      title: data.title || video.title,
      artist: data.author || video.author.name,
      thumbnail: data.image || video.thumbnail
    };

    // ✨ Remove the loading message
    await conn.sendMessage(m.chat, { delete: loadingMsg.key });

    const caption = `🎧 *Unicorn MD Music Delivery* 🎶

📌 *Title:* ${songData.title}
👤 *Artist:* ${songData.artist}
🎵 *Status:* 🟢 Success
🦄 *Powered by Unicorn MD*`;

    // 🖼️ Send thumbnail and song details
    await conn.sendMessage(m.chat, {
      image: { url: songData.thumbnail },
      caption,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'Unicorn MD • 🎵 Music Magic',
          serverMessageId: 143
        }
      }
    });

    // Download the media first so WhatsApp receives a real audio payload.
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 25 * 1024 * 1024,
    })
    const contentType = String(audioResponse.headers['content-type'] || '').toLowerCase()
    if (contentType.includes('application/json') || contentType.includes('text/html')) {
      throw new Error(`Audio provider returned ${contentType || 'an invalid media response'}`)
    }

    // 🎧 Send one supported audio file instead of an audio URL plus a document copy.
    await conn.sendMessage(m.chat, {
      audio: Buffer.from(audioResponse.data),
      mimetype: contentType.startsWith('audio/') ? contentType.split(';')[0] : 'audio/mpeg',
      ptt: false,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'Unicorn MD • 🎵 Music Magic',
          serverMessageId: 143
        }
      }
    });

    m.reply("✅ *✨ Unicorn MD has delivered your melody. Dance freely, starborn!*");

  } catch (error) {
    console.error("❌ Error:", error.message);
    m.reply("💔 *Oops! Something went wrong in the music dimension. Try again later.*");
  }
};

handler.help = ["song"];
handler.tags = ["downloader"];
handler.command = /^song$/i;

export default handler;
