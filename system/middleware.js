import { db, saveDb, saveDbDebounced, authUser, authGc, getGc } from './db/data.js'
import { normalizeJid } from './msg.js'
import { groupCache } from './function.js'
import moment from 'moment-timezone'

/**
 * Middleware Fixed: Mengatasi bug "Bukan Admin" akibat beda Device ID
 */
export default async function middleware(xp, m, cmd, eventData) {
    const result = { next: true, data: {} }
    
    // --- 1. PREPARE DATA ---
    const botIdRaw = xp.user.id.includes(':') ? xp.user.id.split(':')[0] + '@s.whatsapp.net' : xp.user.id
    const botId = normalizeJid(botIdRaw)
    
    // STRICT DETECTION
    const remoteJid = m.key.remoteJid
    const isGroup = remoteJid.endsWith('@g.us')
    const isPrivate = remoteJid.endsWith('@s.whatsapp.net')
    
    let sender = isGroup ? (m.key.participant || m.participant) : remoteJid
    sender = normalizeJid(sender || '')
    
    // DEBUG LOG
    if (isPrivate) console.log(`[MW] PC Message from: ${sender} | Cmd: ${cmd}`)

    // Owner Check (Early)
    const senderNum = sender.split('@')[0]
    const ownerNum = Array.isArray(global.ownerNumber)
        ? global.ownerNumber.map(n => n.replace(/[^0-9]/g, ''))
        : [global.ownerNumber?.replace(/[^0-9]/g, '')]
    const isOwner = ownerNum.includes(senderNum)
    const isCreator = senderNum === ownerNum[0]

    // --- 1.1 IGNORE OTHER BOTS (Anti-Loop & Anti-Spam) ---
    const isBotMsg = m.key.id.startsWith('BAE5') || m.key.id.startsWith('AR')
    if (isBotMsg && !isOwner && !m.key.fromMe) {
        if (isPrivate) console.log('[MW] Blocked: Bot Msg')
        return { next: false }
    }
    
    // Ignore message from self ONLY if it's from the bot script itself (Loop protection)
    if (m.key.fromMe && m.key.id.startsWith('BAE5')) {
        if (isPrivate) console.log('[MW] Blocked: Self Bot Loop')
        return { next: false }
    }

    // --- 1.2 MODE CHECK (GC/PC ONLY) ---
    if (!isOwner) {
        if (global.gconly && !isGroup) {
            console.log('[MW] Blocked: Group Only Mode')
            return { next: false } 
        }
        if (global.pconly && !isPrivate) {
            return { next: false }
        }
    }

    // --- RESOLVE TARGET JID ---
    let targetJid = null
    const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo
    if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) targetJid = ctx.mentionedJid[0]
    else if (ctx?.participant) targetJid = ctx.participant
    
    if (targetJid) targetJid = normalizeJid(targetJid)
    m.targetJid = targetJid

    // Declare here to be safe across all scopes
    let isAdmin = false
    let isBotAdmin = false

    // Data Awal
    result.data = {
        chat: global.chat(m),
        text: m.text || '',
        command: cmd,
        isGroup,
        isPrivate,
        sender,
        isOwner,
        isCreator,
        isAdmin: false,
        isBotAdmin: false
    }

    // --- 2. GROUP METADATA (HANYA JIKA GRUP) ---
    if (isGroup) {
        try {
            let groupMetadata = null
            const forceRefresh = eventData?.admin || eventData?.group
            const cached = groupCache.get(m.key.remoteJid)
            
            if (!forceRefresh && cached) {
                groupMetadata = cached
            } else {
                // Improved Fetch with better timeout and retry
                const fetchMetadata = async () => {
                    let err;
                    for (let i = 0; i < 2; i++) {
                        try {
                            return await xp.groupMetadata(m.key.remoteJid)
                        } catch (e) {
                            err = e
                            await new Promise(r => setTimeout(r, 1500))
                        }
                    }
                    throw err
                }

                groupMetadata = await Promise.race([
                    fetchMetadata(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Metadata')), 5000))
                ]).catch((e) => {
                    console.error(`[MW] Metadata Error for ${m.key.remoteJid}:`, e.message)
                    return null
                })
            }
            
            if (groupMetadata) {
                if (!groupCache.has(m.key.remoteJid) || forceRefresh) {
                    groupCache.set(m.key.remoteJid, groupMetadata)
                    setTimeout(() => groupCache.delete(m.key.remoteJid), 60000)
                }

                const participants = groupMetadata.participants || []
                const checkAdmin = (id) => {
                    if (!id) return false
                    const normalizedId = normalizeJid(id).split('@')[0]
                    return participants.some(p => {
                        const pId = normalizeJid(p.id || p.jid).split('@')[0]
                        return pId === normalizedId && (p.admin === 'admin' || p.admin === 'superadmin')
                    })
                }

                isAdmin = checkAdmin(sender)
                isBotAdmin = checkAdmin(botId)

                result.data.groupMetadata = groupMetadata
                result.data.participants = participants
                result.data.groupName = groupMetadata.subject
                result.data.isAdmin = isAdmin || isOwner // Owner is always admin
                result.data.isBotAdmin = isBotAdmin
            } else {
                // Fallback: If metadata fails, we still want to allow basic commands
                // but strictly admin commands will fail unless sender is owner
                result.data.isAdmin = isOwner 
                result.data.isBotAdmin = false
                result.data.groupName = 'Unknown Group'
            }
            
            // --- VALIDASI AKSES COMMAND ---
            if (eventData?.group && !isGroup) {
                if (!eventData.owner) await m.reply('❌ Perintah ini khusus untuk grup!')
                return { next: false }
            }
            
            if (eventData?.admin && !isAdmin) {
                if (!isOwner) {
                    if (!groupMetadata) {
                        await m.reply('⚠️ Gagal memverifikasi status Admin (Gangguan Koneksi). Coba lagi nanti.')
                    } else {
                        await m.reply(`❌ Perintah *${cmd}* ini khusus Admin Grup!`)
                    }
                    return { next: false }
                }
            }
            
            // --- 4. GROUP FEATURE TOGGLE CHECK ---
            const gcData = getGc(m.key.remoteJid)
            
            if (gcData?.staySchedule && isBotAdmin) {
                const now = moment().tz('Asia/Jakarta')
                const currentTime = now.format('HH:mm')
                const { close, open } = gcData.staySchedule
                
                const isBetween = (time, start, end) => {
                    const format = 'HH:mm'
                    const cur = moment(time, format)
                    const s = moment(start, format)
                    const e = moment(end, format)
                    if (s.isAfter(e)) return cur.isSameOrAfter(s) || cur.isSameOrBefore(e)
                    else return cur.isBetween(s, e, null, '[]')
                }

                const shouldBeClosed = isBetween(currentTime, close, open)
                const isClosed = groupMetadata?.announce

                if (shouldBeClosed && !isClosed) {
                    try {
                        await xp.groupSettingUpdate(m.key.remoteJid, 'announcement')
                        await xp.sendMessage(m.key.remoteJid, { text: `🌙 *JAM MALAM AKTIF*\n\nSudah jam ${close} WIB, grup ditutup otomatis.\nBuka kembali jam ${open} WIB.` })
                    } catch {}
                } else if (!shouldBeClosed && isClosed) {
                    try {
                        await xp.groupSettingUpdate(m.key.remoteJid, 'not_announcement')
                        await xp.sendMessage(m.key.remoteJid, { text: `☀️ *JAM OPERASIONAL DIMULAI*\n\nSudah jam ${open} WIB, grup dibuka kembali.` })
                    } catch {}
                }
            }

            if (gcData?.settings?.adminOnly && !isAdmin && !isOwner) return { next: false }

            if (gcData?.filter?.disabled) {
                const disabledList = gcData.filter.disabled
                const tag = eventData?.tags ? (Array.isArray(eventData.tags) ? eventData.tags[0] : eventData.tags).toLowerCase() : ''
                const isBlocked = disabledList.some(blocked => cmd === blocked || (tag && tag.includes(blocked)))
                if (isBlocked && !isAdmin && !isOwner) {
                    await m.reply(`⛔ Fitur *${cmd.toUpperCase()}* dimatikan di grup ini oleh Admin.`)
                    return { next: false }
                }
            }

            const tags = eventData?.tags
            let isRpgCmd = false
            if (Array.isArray(tags)) isRpgCmd = tags.some(t => t.toLowerCase() === 'rpg' || t.toLowerCase() === 'rpg crime')
            else if (typeof tags === 'string') isRpgCmd = tags.toLowerCase().includes('rpg')

            if (gcData && typeof gcData.rpg !== 'undefined' && !gcData.rpg && isRpgCmd) {
                await m.reply('⛔ *Fitur RPG Dinonaktifkan di Grup Ini.*')
                return { next: false }
            }

        } catch (e) {
            console.error('Middleware Group Error:', e)
            result.data.isAdmin = isOwner
            result.data.isBotAdmin = false
        }
    } else if (isPrivate) {
        // --- JALUR KHUSUS PRIVATE CHAT ---
        if (eventData?.group && !isOwner) {
            await m.reply('❌ Fitur ini khusus untuk Grup!')
            return { next: false }
        }
    }

    // --- AUTH & REGISTER ---
    if (!db().key[sender]) {
        await authUser(m, result.data.chat)
    }
    if (isGroup && !getGc(m.key.remoteJid)) {
        await authGc(xp, result.data.chat)
    }
    
    // Pastikan data user diambil ulang setelah pendaftaran (Sync Memory)
    const user = db().key[sender]
    if (!user) {
        // Fallback darurat jika DB gagal tulis agar bot tetap respon
        result.data.user = { jid: sender, level: 1, limit: 20, money: 200000, exp: 0 }
    } else {
        result.data.user = user
    }

    // --- PREMIUM EXPIRATION CHECK ---
    if (user?.premium && user.premiumTime && user.premiumTime > 0) {
        if (Date.now() >= user.premiumTime) {
            user.premium = false
            user.premiumTime = 0
            user.limit = 20
            saveDb()
            try {
                await xp.sendMessage(sender, { text: '✨ *PREMIUM EXPIRED* ✨\n\nMasa berlaku premium Anda telah habis. Terima kasih telah menggunakan layanan premium kami!' })
            } catch (e) {
                console.error('Failed to send premium expiry notice:', e)
            }
        }
    }

    // --- RESTING SYSTEM (Auto Wakeup) ---
    if (user?.isResting) {
        const now = Date.now()
        const durationMs = now - (user.startRest || now)
        const minutes = Math.floor(durationMs / 60000)

        if (minutes >= 1) {
            const hpGain = minutes * 5
            const stamGain = minutes * 10
            user.health = Math.min(user.max_health, (user.health || 0) + hpGain)
            user.stamina = Math.min(user.max_stamina, (user.stamina || 0) + stamGain)
            
            await m.reply(`🌅 *BANGUN TIDUR!*\nAnda telah beristirahat selama *${minutes} menit*.\n❤️ HP Pulih: +${hpGain}\n⚡ Stamina Pulih: +${stamGain}`)
        }
        user.isResting = false
        user.startRest = 0
        saveDbDebounced()
    }
    
    // Validasi Limit (TANPA MENGURANGI DI SINI)
    // Pastikan ini command valid sebelum cek limit
    const isCommandValid = eventData && (eventData.cmd || eventData.command)

    // --- CHECK BANNED STATUS (ONLY IF COMMAND) ---
    if (isCommandValid && user?.ban && !isOwner) {
        await m.reply('⛔ Maaf, Akun Anda telah di-banned oleh Owner.')
        return { next: false }
    }

    // --- JAIL CHECK (ONLY IF COMMAND) ---
    if (isCommandValid && user?.jailExpired && user.jailExpired > Date.now()) {
        const remaining = user.jailExpired - Date.now()
        const min = Math.ceil(remaining / 60000)
        
        // Allow escape commands
        if (!['kabur', 'cekpenjara', 'suap'].includes(cmd)) {
            await m.reply(`⛓️ *ANDA DI PENJARA* ⛓️\n\nSisa Hukuman: ${min} Menit`)
            return { next: false }
        }
    } else if (user?.jailExpired && user.jailExpired <= Date.now() && user.jailExpired !== 0) {
        // Auto release if expired
        user.jailExpired = 0
        saveDbDebounced()
        await m.reply('🔓 Anda telah bebas dari penjara!')
    }

    // --- KIDNAP CHECK (ONLY IF COMMAND) ---
    if (isCommandValid && user?.kidnapped && user.kidnapped > Date.now()) {
        const remaining = user.kidnapped - Date.now()
        const min = Math.ceil(remaining / 60000)
        
        if (!['tebus', 'cekstatus', 'me', 'profile'].includes(cmd)) {
            await m.reply(`🆘 *ANDA DICULIK!* 🆘\n\nSisa Waktu: ${min} Menit`)
            return { next: false }
        }
    } else if (user?.kidnapped && user.kidnapped <= Date.now() && user.kidnapped !== 0) {
        user.kidnapped = 0
        user.kidnapper = null
        saveDbDebounced()
        await m.reply('🔓 Penculik melepaskan anda karena bosan. Anda bebas!')
    }
    
    // --- 3.5 DISABLED COMMAND CHECK ---
    const disabledCmds = db().settings?.disabledCmd || []
    if (isCommandValid && disabledCmds.includes(cmd) && !isOwner) {
        await m.reply(`⚠️ Fitur *${cmd}* sedang dinonaktifkan oleh Owner.`)
        return { next: false }
    }
    
    // --- 4. OWNER CHECK ---
    if (isCommandValid && (!global.public || eventData?.owner) && !isOwner) {
        return { next: false }
    }

    if (isCommandValid && global.maintenance && !isOwner) {
        await m.reply('🚧 Bot sedang dalam perbaikan (Maintenance).')
        return { next: false }
    }

    // --- AUTO INFLATION CHECK (GLOBAL DAILY) ---
    const settings = db().settings || {}
    if (settings.inflasiMode === 'auto') {
        const today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
        if (settings.lastInflationDate !== today) {
            const cfg = JSON.parse(fs.readFileSync('./system/db/rpg_items.json', 'utf-8'))
            const logic = cfg.logic || {}
            
            // Drifts by -10% to +10% from current multiplier
            const currentMult = settings.rpgPriceMultiplier || 1.0
            const drift = (Math.floor(Math.random() * 21) - 10) / 100 // -0.1 to 0.1
            let newMult = currentMult + drift
            
            // Clamp within bounds
            const maxInf = logic.maxInflation || 3.0
            const minInf = logic.minInflation || 0.5
            newMult = Math.min(maxInf, Math.max(minInf, newMult))
            
            settings.rpgPriceMultiplier = parseFloat(newMult.toFixed(2))
            settings.lastInflationDate = today
            saveDb()
            console.log(`[INFLASI] Market Shift: ${(drift * 100).toFixed(0)}% | Current: ${settings.rpgPriceMultiplier}x`)
        }
    }

    // --- 6. LIMIT SYSTEM (FLAGGING ONLY) ---
    const freeCmd = ['menu', 'help', 'verify', 'daftar', 'claim', 'daily', 'me', 'ceklimit', 'buy', 'shop', 'toko', 'bank', 'atm', 'saldo'] 
    const isFree = freeCmd.includes(cmd)
    const isPrem = user?.premium || false

    // Reset Limit Harian
    if (user) {
        const today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
        if (user.lastLimitReset !== today) {
            const defaultLimit = 20
            if (user.limit < defaultLimit) user.limit = defaultLimit
            user.lastLimitReset = today
            saveDbDebounced()
        }
    }

    if (isCommandValid && !isFree && !isOwner && !isPrem && user) {
        // Cek jika limit habis, tandai untuk dicek di handle.js setelah validasi prefix
        if (user.limit < 1) {
            result.data.limitExceeded = true
        } else {
            // Tandai untuk dikurangi nanti di handle.js setelah validasi prefix sukses
            result.data.consumeLimit = true
        }
    }

    // --- 7. XP & LEVEL SYSTEM ---
    if (user) {
        user.lastSeen = Date.now()

        try {
            if (typeof user.level !== 'number' || user.level < 1) user.level = 1
            if (typeof user.exp !== 'number') user.exp = 0

            const xpAdd = Math.floor(Math.random() * 11) + 5
            user.exp += xpAdd

            let levelUp = false
            const oldLevel = user.level

            while (user.exp >= (user.level * 1000)) {
                user.exp -= (user.level * 1000)
                user.level++
                levelUp = true
            }

            if (levelUp) {
                const moneyReward = (user.level - oldLevel) * 5000
                user.money = (user.money || 0) + moneyReward
                user.max_health += 10
                user.max_stamina += 5
                user.health = user.max_health 

                const txt = `
    🎉  𝐋 𝐄 𝐕 𝐄 𝐋  𝐔 𝐏  🎉

    👤 Name : @${sender.split('@')[0]}
    🆙 Level : ${oldLevel} ➔ ${user.level}
    ✨ XP : ${user.exp} / ${user.level * 1000}

    🎁 *REWARDS:*
    💰 Money: +Rp ${moneyReward.toLocaleString('id-ID')}
    ❤️ Max HP: +10
    ⚡ Max Stamina: +5`

                await xp.sendMessage(result.data.chat.id, { 
                    text: txt, 
                    mentions: [sender] 
                }).catch(e => console.error('LevelUp Send Error:', e))
                saveDb() // Critical save on level up
            } else {
                saveDbDebounced() // Optimized save for normal XP gain
            }
        } catch (e) {
            console.error('Middleware XP Error:', e)
        }
    }

    result.data.user = user
    return result
}