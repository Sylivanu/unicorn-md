conn.ev.on("call", async (calls) => {
  const rejectCalls = process.env.REJECTSCALLS;
  const warningMessage = process.env.CALLMSG || 
    "📵 *ANTI-CALL PROTECTION ENABLED!*\n\n🦄 Please do not call the Unicorn MD bot.\n🔕 Repeated calls may lead to blocking.";

  for (let call of calls) {
    if (call.status !== 'offer') continue;

    try {
      // 🔴 Automatically reject incoming call
      await conn.rejectCall(call.id, call.from);

      // ⚠️ Send warning message if setting is enabled
      if (rejectCalls === "truemsg") {
        await conn.sendMessage(call.from, { text: warningMessage });
      }

      console.log(`🚫 Call rejected from: ${call.from}`);
    } catch (error) {
      console.error(`❌ Error handling call from ${call.from}:`, error);
    }
  }
});
