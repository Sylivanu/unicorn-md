import axios from 'axios';

let handler = async (message, { conn, text, usedPrefix, command }) => {
  let senderName = message.pushName || await conn.getName(message.sender);
  let aliveData;

  // 🔄 Fetch custom alive data from GitHub
  try {
    const response = await axios.get("https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/Alive.json");
    aliveData = response.data;
  } catch (error) {
    console.error("Error fetching UnicornMD Alive.json:", error);
    return conn.sendMessage(message.chat, "🦄 Sorry, I couldn't fetch the audio link right now.", {
      quoted: message
    });
  }

  // 🎵 Pick a random audio URL or use the default one
  let audioUrl = (aliveData?.urls?.length > 0)
    ? aliveData.urls[Math.floor(Math.random() * aliveData.urls.length)]
    : "https://cdn.jsdelivr.net/gh/SilvaTechB/silva-md-bot@main/media/Alive.mp3";

  // 📇 Contact Card Context
  let contactMessage = {
    key: {
      fromMe: false,
      participant: message.sender.split('@')[0] + "@s.whatsapp.net",
      remoteJid: message.chat ? "254700143167@s.whatsapp.net" : undefined
    },
    message: {
      contactMessage: {
        displayName: senderName,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Unicorn🦄;;;\nFN:${senderName}\nitem1.TEL;waid=${message.sender.split('@')[0]}:${message.sender.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
      }
    }
  };

  // 🔊 Audio reply with branding
  let audioMessage = {
    audio: { url: audioUrl },
    mimetype: "audio/mpeg",
    ptt: true,
    waveform: [90, 30, 90, 30, 90, 30, 90],
    fileName: "unicorn",
    contextInfo: {
      mentionedJid: [message.sender],
      externalAdReply: {
        title: "🦄 UNICORN MD IS ONLINE!",
        body: "✨ Powered by Unicorn MD Team\n🔧 Developed with care and sparkles 🦄",
        thumbnailUrl: "https://i.imgur.com/y143zMC.jpeg",
        sourceUrl: "https://github.com/UnicornMD-Team/unicorn-md",
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  };

  // 🚀 Send the final audio message
  await conn.sendMessage(message.chat, audioMessage, { quoted: contactMessage });
};

// 📌 Command Metadata
handler.help = ["alive"];
handler.tags = ["info", "status"];
handler.command = ["alive"];

export default handler;
