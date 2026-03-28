import fetch from 'node-fetch'
import { db, saveDb } from './db/data.js'

async function rct_key(xp, m) {
  try {
    const react = m.message?.reactionMessage,
          emoji = react?.text,
          keyId = react?.key?.id

    if (!emoji || !keyId) return false

    const target = xp.reactionCache?.get(keyId)
    if (!target) return false

    const chat = global.chat(m),
          botNum = `${xp.user.id.split(':')[0]}@s.whatsapp.net`,
          fromBot = target.key.participant === botNum || target.key.fromMe

    // Logic for Group Admin actions
    if (chat.group) {
      // Need admin check for some emojis
      const sender = m.sender || m.key.participant || m.key.remoteJid
      const { botAdm, usrAdm } = await global.grupify(xp, chat.id, sender)
      
      switch (emoji) {
        case '❌':
          if (fromBot || usrAdm) {
              await xp.sendMessage(chat.id, {
                delete: {
                  remoteJid: chat.id,
                  fromMe: fromBot,
                  id: target.key.id,
                  participant: target.key.participant || target.key.remoteJid
                }
              })
              xp.reactionCache.delete(keyId)
          }
          return true

        case '👑':
          if (usrAdm && botAdm) {
              await xp.groupParticipantsUpdate(chat.id, [target.key.participant || target.key.remoteJid], 'promote')
          }
          return true

        case '🦵':
          if (usrAdm && botAdm) {
              await xp.groupParticipantsUpdate(chat.id, [target.key.participant || target.key.remoteJid], 'remove')
          }
          return true

        case '💨':
          if (usrAdm && botAdm) {
              await xp.groupParticipantsUpdate(chat.id, [target.key.participant || target.key.remoteJid], 'demote')
          }
          return true
      }
    }

    return false
  } catch (e) {
    console.error('Reaction Error:', e)
    return false
  }
}

export { rct_key }