import fs from 'fs'
import path from 'path'

const number = (input) => {
  const digits = input.replace(/\D/g, '')
  return digits.startsWith("0") ? "62" + digits.slice(1) : digits
}

const own = (m) => {
  const sender = (m.sender || '').split('@')[0]
  const number = Array.isArray(global.ownerNumber)
          ? global.ownerNumber.map(n => n.replace(/\D/g, ''))
          : [global.ownerNumber?.replace(/\D/g, '')]

  return number.includes(sender)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Safely forward a message to multiple JIDs with a delay between each
 * @param {Object} conn - WASocket instance
 * @param {string[]} jids - List of target JIDs
 * @param {Object} message - Message object with .forward method or raw structure
 * @param {number} delay - Delay in ms between forwards
 */
const safeForward = async (conn, jids, message, delay = 1000) => {
    if (!message || !jids.length) return 0
    let success = 0
    
    // Support message.vM or standard message object
    const msgToForward = message.vM || message

    for (const id of jids) {
        try {
            if (typeof message.forward === 'function') {
                await message.forward(id)
            } else {
                await conn.sendMessage(id, { forward: msgToForward }, { quoted: null })
            }
            success++
            if (delay) await sleep(delay)
        } catch (e) {
            console.error(`[safeForward] Failed to send to ${id}:`, e)
            // Fallback to text if possible
            try {
                const txt = message.text || message.caption || (message.message && (message.message.conversation || message.message.extendedTextMessage?.text)) || ''
                if (txt) {
                    await conn.sendMessage(id, { text: txt })
                    success++
                }
            } catch (e2) {
                console.error(`[safeForward] Fallback failed for ${id}:`, e2)
            }
        }
    }
    return success
}

export {
  number,
  own,
  sleep,
  safeForward
}