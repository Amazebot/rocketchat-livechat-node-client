import 'dotenv/config'
import { logger } from './util'
import * as livechat from './livechat'
const lc = livechat.use()

/**
 * Demo implementation of Livechat class.
 * Livechat connects to Rocket.Chat and subscribes to all incoming messages.
 * `registerGuest` creates a new livechat guest, returning the room ID to use.
 * The given callback will be called with any message stream events for the new
 * guest's room, other than those originating from the guest themselves.
 * `sendMessage` Sends the given text into the room from the guest in that.
 */
async function start () {
  await lc.connect()
  const callback = (err: Error | null, message: any, meta: any) => {
    logger.warn(`[livechat] msg for guest from ${message.u.username}: ${message.msg}`)
  }
  const rId = await lc.registerGuest({ name: 'test guest' }, callback)
  await lc.sendMessage(rId, 'hello test')
}

start()
