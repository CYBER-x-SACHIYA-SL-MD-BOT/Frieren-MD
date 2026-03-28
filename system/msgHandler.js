import c from 'chalk'
import { handleCmd } from '../cmd/handle.js'
import { signal } from '../cmd/interactive.js'
import { db, getGc } from './db/data.js'
import { 
    checkToxic, 
    checkAntilink, 
    checkMute, 
    checkAutoDelete 
} from './filter.js'
import { checkAfk } from './afk.js'
import { smsg } from './msg.js'
import { bangc } from './sys.js'
import { 
    getMetadata, 
    replaceLid, 
    saveLidCache, 
    cleanMsg, 
    filterMsg, 
    groupCache 
} from './function.js'
import { rct_key } from './reaction.js'

/**
 * Optimized Message Handler for FRIEREN-MD
 * Extracted from index.js for better maintainability
 */
export async function messageHandler(xp, { messages, type }) {
    if (global.debug) console.log(c.grey(`[EVENT] messages.upsert type: ${type} count: ${messages.length}`))
    
    for (let m of messages) {
        try {
            if (!m.message) continue
            if (m.key.remoteJid.endsWith('@newsletter')) continue
            
            // 1. Pre-Processing (Cleaning & LID)
            m = cleanMsg(m)
            m = replaceLid(m)

            const id = m.key.remoteJid
            const isGroup = id.endsWith('@g.us')
            const sender = isGroup ? (m.key.participant || m.participant) : id
            
            // 2. Specialized Messages (Status & Reactions)
            if (id === 'status@broadcast' && global.autoreadsw) {
                await xp.readMessages([m.key]); continue
            }
            
            if (m.message?.reactionMessage) { 
                await rct_key(xp, m); continue 
            }

            // 3. System Message Parsing
            m = smsg(xp, m)
            if (!m) continue

            const chatData = global.chat(m, global.botName)
            if (!chatData) continue
            const { pushName, channel, group } = chatData
            
            // 4. Content Extraction
            const { text, media } = global.getMessageContent(m)
            if (text) { m.body = text; m.text = text }

            // 5. Logging (Optimized)
            const time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
                  name = pushName || sender.split('@')[0]
            
            const groupMetadata = group ? (groupCache.get(id) || await getMetadata(id, xp) || {}) : {}
            const groupName = group ? groupMetadata.subject || 'Grup' : ''

            console.log(
                c.bgGrey.yellowBright.bold(
                    group ? `[ ${groupName} | ${name} ]` : channel ? `[ ${id} ]` : `[ ${name} ]`
                ) +
                c.white.bold(' | ') +
                c.blueBright.bold(`[ ${time} ]`)
            )

            if (media || text) {
                console.log(
                    c.white.bold(
                        [media && `[ ${media} ]`, text && `[ ${text} ]`].filter(Boolean).join(' ')
                    )
                )
            }

            // 6. Duplicate & Spam Filter
            if (!(await filterMsg(m, chatData, text))) continue

            // --- ACTIVITY TRACKING (NEW) ---
            const user = db().key[sender]
            if (user) {
                user.chatCount = (user.chatCount || 0) + 1
            }
            if (group) {
                const gcData = getGc(id)
                if (gcData) {
                    gcData.stats = gcData.stats || {}
                    gcData.stats[sender] = (gcData.stats[sender] || 0) + 1
                }
            }

            // --- PRESENCE UPDATE (Typing/Recording) ---
            if (global.autotyping) xp.sendPresenceUpdate('composing', id).catch(() => {})
            if (global.autorecording) xp.sendPresenceUpdate('recording', id).catch(() => {})

            // --- REACTION CACHE (Optimized with TTL) ---
            if (xp.reactionCache) {
                xp.reactionCache.set(m.key.id, m)
                setTimeout(() => {
                    if (xp.reactionCache.has(m.key.id)) xp.reactionCache.delete(m.key.id)
                }, 600000) // 10 minutes TTL
            }

            global.msgCache[id] = global.msgCache[id] || []
            if (global.msgCache[id].includes(m.key.id)) continue
            global.msgCache[id] = [...global.msgCache[id], m.key.id].slice(-7)

            if (global.autoread) xp.readMessages([m.key]).catch(() => {})
            
            if (group && Object.keys(groupMetadata).length) { await saveLidCache(groupMetadata) }

            // 7. Security Checks (Banned Groups/Users)
            if (group && bangc({ id, group, sender, pushName, channel })) continue 

            // 8. Auto Response & Signals
            if (text && db().respon && db().respon[text.toLowerCase()]) {
                 await xp.sendMessage(id, { text: db().respon[text.toLowerCase()] }, { quoted: m })
            }

            if (text) {
                signal(text, m, sender, id, xp, global.ev).catch(e => console.error('Signal Error:', e))
            }

            // 9. Parallel Handlers (Non-Blocking)
            Promise.all([
                checkAutoDelete(m, xp).catch(e => console.error('checkAutoDelete error:', e)),
                checkToxic(m, xp).catch(e => console.error('checkToxic error:', e)),
                checkAntilink(m, xp).catch(e => console.error('checkAntilink error:', e)),
                checkMute(m, xp).catch(e => console.error('checkMute error:', e)),
                checkAfk(m, xp).catch(e => console.error('checkAfk error:', e)),
                handleCmd(m, xp, global.store).catch(e => console.error('handleCmd error:', e))
            ]);

        } catch (msgErr) {
            console.error(c.red.bold('Error in messageHandler loop:'), msgErr)
        }
    }
}
