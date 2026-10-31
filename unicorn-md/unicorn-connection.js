import moment from 'moment-timezone'

let connectionNotified = false

// Keep this hook silent: connection events must not send unsolicited messages.
let handler = m => m
handler.before = async function () {
  if (connectionNotified) return
  connectionNotified = true

  try {
    const currentTime = moment.tz('Africa/Nairobi').format('dddd, MMMM Do YYYY - h:mm A')
    await this.updateProfileStatus(`🤖 Silva Bot | Connected: ${currentTime}`)
  } catch (error) {
    console.error('[connection] Failed to update profile status:', error.message)
  }
}

export default handler
