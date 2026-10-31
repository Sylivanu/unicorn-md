import axios from "axios"
import ytSearch from "yt-search"

let handler = async (m, { conn, text, botname }) => {
  if (!text) return m.reply("🦄✨ What magical song are you summoning today?")

  await m.reply("🔮 *Unicorn MD is searching the enchanted streams... please hold!* 🎶")

  try {
    let search = await ytSearch(text)
    let video = search.videos[0]

    if (!video) return m.reply("😔🦄 No stardust found in that request. Try a different spell!")

    let link = video.url
    let apis = [
      `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
      `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`
    ]

    for (const api of apis) {
      try {
        let { data } = await axios.get(api)

        if (data.status === 200 || data.success) {
          let audioUrl = data.result?.downloadUrl || data.url
          if (!audioUrl) throw new Error('Audio provider returned no download URL')
          let songData = {
            title: data.result?.title || video.title,
            artist: data.result?.author || video.author.name,
            thumbnail: data.result?.image || video.thumbnail,
            videoUrl: link
          }

          await conn.sendMessage(
            m.chat,
            {
              image: { url: songData.thumbnail },
              caption: `🦄✨ *Unicorn Melody Summoned!*
╭━━━━━━⊱🪄⊰━━━━━━╮
🎧 *Track:* ${songData.title}
🎤 *Artist:* ${songData.artist}
📡 *Stream Source:* [Hidden by Fairy Dust]
╰━━━━━━⊱🦄⊰━━━━━━╯
🌟 *Powered by Unicorn MD*`,
            },
            { quoted: m }
          )

          await m.reply("📤✨ Sending enchanted audio...")

          const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 25 * 1024 * 1024,
          })
          const contentType = String(audioResponse.headers['content-type'] || '').toLowerCase()
          if (contentType.includes('application/json') || contentType.includes('text/html')) {
            throw new Error(`Audio provider returned ${contentType || 'an invalid media response'}`)
          }

          await conn.sendMessage(
            m.chat,
            {
              audio: Buffer.from(audioResponse.data),
              mimetype: contentType.startsWith('audio/') ? contentType.split(';')[0] : 'audio/mpeg',
              ptt: false,
            },
            { quoted: m }
          )

          await m.reply("✅🦄 *Unicorn MD just cast the perfect sound spell for you!*")

          return
        }
      } catch (e) {
        console.error(`🦄API Error (${api}):`, e.message)
        continue
      }
    }

    return m.reply("⚠️🌪️ All unicorn channels are currently stormy... try again later.")
  } catch (error) {
    return m.reply("❌🌧️ Failed to conjure the melody\n" + error.message)
  }
}

handler.help = ["play"]
handler.tags = ["downloader"]
handler.command = /^play$/i

export default handler
