let handler = async (m, { conn, isROwner, text }) => {
    // Utility to delay between messages
    const delay = time => new Promise(res => setTimeout(res, time));

    // Get all groups where the bot is a participant
    let getGroups = await conn.groupFetchAllParticipating();
    let groups = Object.values(getGroups);
    let groupIds = groups.map(group => group.id);

    // Get the message to broadcast, either from quoted message or text input
    let message = m.quoted?.text || text;
    if (!message) throw '*ENTER THE MESSAGE YOU WANT TO BROADCAST*';

    // Send the message to each group
    for (let groupId of groupIds) {
        await delay(500); // Delay to prevent flood/spam detection
        conn.relayMessage(groupId, {
            liveLocationMessage: {
                degreesLatitude: 35.685506276233525,
                degreesLongitude: 139.75270667105852,
                accuracyInMeters: 0,
                degreesClockwiseFromMagneticNorth: 2,
                caption: '[ATTENTION]\n\n' + message + '\n\nTHIS IS AN OFFICIAL STATEMENT',
                sequenceNumber: 2,
                timeOffset: 3,
                contextInfo: m,
            }
        }, {}).catch(_ => _); // Catch errors silently
    }

    // Send confirmation to the owner
    m.reply(`*MESSAGE SENT TO ${groupIds.length} GROUP/S*\n\n*NOTE: THIS COMMAND MAY FAIL AND NOT BE SENT TO ALL CHATS, SORRY FOR THE TIME BEING*`);
};

handler.help = ['broadcastgroup', 'bcgc'].map(v => v + ' <text>');
handler.tags = ['owner'];
handler.command = /^(broadcast|bc)(group|grup|gc)$/i;
handler.owner = true;

export default handler;
