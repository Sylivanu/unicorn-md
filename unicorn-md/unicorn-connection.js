import moment from 'moment-timezone';

let connectionNotified = false;
let lock = false; // 🛑 Lock to prevent race condition

let handler = m => m;

handler.before = async function (m) {
  if (connectionNotified || lock) return; // 🚫 If already done or in progress, exit

  lock = true; // 🧷 Lock it right away to prevent overlaps

  try {
    const setting = global.db.data.settings[this.user.jid] || {};
    const alertJid = '254743706010@s.whatsapp.net'; // 🦄 Unicorn's alert JID
    const currentTime = moment.tz('Africa/Nairobi').format('dddd, MMMM Do YYYY - h:mm A'); // ⏰ Time formatting for Kenya

    const botInfo = {
      name: this.user.name || 'Unicorn MD Bot', // 🦄 Unicorn-themed bot name
      jid: this.user.jid,
      prefix: setting.prefix || '.',
      mode: setting.self ? 'PRIVATE 🔒' : 'PUBLIC 🌍',
    };

    const message = `
🎉 *UNIQUE UNICORN MD IS ONLINE!*

🕘 *Time:* ${currentTime}
👤 *Bot Name:* ${botInfo.name}
🆔 *JID:* ${botInfo.jid}
🌐 *Mode:* ${botInfo.mode}
💡 *Prefix:* ${botInfo.prefix}

✅ _Unicorn MD Bot connected successfully!_
`.trim();

    // 🎧 Send audio welcome (with Unicorn theme)
    const audioUrl = 'https://github.com/Silva-World/SPARK-DATA/raw/refs/heads/main/unicorntheme.mp3'; // 🦄 New magic audio file
    await this.sendMessage(alertJid, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      ptt: true, // 🦄 Send audio message
    }).catch(console.error);

    // 📩 Send main message with Unicorn flair
    await this.sendMessage(alertJid, {
      text: message,
      contextInfo: {
        mentionedJid: [alertJid],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'UNIQUE UNICORN MD CONNECTION ⚡️',
          serverMessageId: 143,
        },
      },
    }).catch(console.error);

    // 📝 Update status with Unicorn-themed message
    await this.updateProfileStatus(`🤖 Unicorn MD Bot | Connected: ${currentTime}`).catch(console.error);

    // ⏱️ Uptime report with Unicorn sparkle
    const uptime = process.uptime();
    const formatUptime = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`; // 🦄 Sparkle the time format!
    };

    await this.sendMessage(alertJid, {
      text: `🔋◢◤ Unicorn MD Bot ◢◤\n*Uptime:* ${formatUptime(uptime)}\n📡 *Running smoothly...*\n✨ Silva Tech Incorporated.`,
    }).catch(console.error);

    connectionNotified = true; // ✅ Notification successfully sent
  } catch (err) {
    console.error('Unicorn MD Startup alert error:', err);
  } finally {
    lock = false; // 🔓 Release lock just in case
  }
};

export default handler;
