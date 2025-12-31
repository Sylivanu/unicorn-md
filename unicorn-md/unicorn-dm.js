let handler = async (m, { conn, isROwner, text }) => {
  const delay = (time) => new Promise((res) => setTimeout(res, time));

  if (!m.isGroup) throw '🧚 *Oops! This spell only works in groups.*\n\nTry again in a magical circle (group chat).';

  let groupMetadata = await conn.groupMetadata(m.chat);
  let participants = groupMetadata.participants.map(p => p.id);

  let message = m.quoted && m.quoted.text ? m.quoted.text : text;
  if (!message) throw '🦄 *Whisper the message you want to send to the realm.*\nUse this command with a message or quote one.';

  let media = m.quoted ? await m.quoted.download() : null;
  let mediaType = m.quoted ? m.quoted.mtype : null;

  let fallbackImage = 'https://i.imgur.com/ihwVldr.png'; // Unicorn MD fallback image

  let successCount = 0;
  let failureCount = 0;
  let sent = new Set();

  for (let participant of participants) {
    if (sent.has(participant)) continue;
    sent.add(participant);

    try {
      await delay(500);

      const contextInfo = {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: '🦄 Unicorn Broadcast ✨',
          serverMessageId: 2025
        }
      };

      if (media) {
        let options = {
          caption: `🌟 *Unicorn Broadcast Spell*\n\n${message}`,
          contextInfo
        };

        switch (mediaType) {
          case 'imageMessage':
            options.image = media;
            break;
          case 'videoMessage':
            options.video = media;
            break;
          case 'audioMessage':
            options.audio = media;
            options.ptt = true;
            break;
          case 'documentMessage':
            options.document = media;
            options.mimetype = m.quoted.mimetype || 'application/pdf';
            break;
          default:
            throw new Error('Unicorn MD cannot handle this media type 🧿');
        }

        await conn.sendMessage(participant, options);
      } else {
        await conn.sendMessage(participant, {
          image: { url: fallbackImage },
          caption: `🦄 *Unicorn Whisper*\n\n${message}`,
          contextInfo
        });
      }

      successCount++;
    } catch (e) {
      console.error(`❌ Failed to enchant ${participant}:`, e);
      failureCount++;
    }
  }

  m.reply(
    `✨ *Unicorn Broadcast Complete!*\n\n✅ *Delivered:* ${successCount} users\n❌ *Failed:* ${failureCount} users\n\n📢 Use responsibly — the magic has limits!\n\n🌈 _Brought to you by Unicorn MD, powered by Silva Tech Inc._`
  );
};

handler.help = ['members', 'dm', 'msg'].map(v => v + ' <text>');
handler.tags = ['group', 'owner'];
handler.command = /^(members|dm|msg)$/i;
handler.owner = true;

export default handler;
