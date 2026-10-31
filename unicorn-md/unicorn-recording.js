const presenceTimers = new Map()

export async function before(message, { conn }) {
  try {
    // Check if AUTO_RECORDING is enabled
    const autoRecording = process.env.AUTO_RECORDING === "true";
    if (!autoRecording) return true;

    // Ignore invalid or irrelevant messages
    const irrelevantTypes = ["protocolMessage", "pollUpdateMessage", "reactionMessage", "stickerMessage"];
    if (irrelevantTypes.includes(message.mtype) || message.isBaileys || message.fromMe) {
      return true;
    }

    // Ensure the message is valid (contains text or meaningful content)
    if (!message.text && !message.caption) {
      return true;
    }

    // Show "Recording" presence in the chat
    await conn.sendPresenceUpdate("recording", message.chat);

    // Reset presence to "typing" after 20 seconds
    clearTimeout(presenceTimers.get(message.chat))
    const timer = setTimeout(() => {
      conn.sendPresenceUpdate("typing", message.chat).catch(error =>
        console.error('[recording] Failed to reset presence:', error.message)
      )
      presenceTimers.delete(message.chat)
    }, 20000);
    presenceTimers.set(message.chat, timer)
  } catch (error) {
    console.error("[recording] Failed:", error.message);
  }

  return true;
}
