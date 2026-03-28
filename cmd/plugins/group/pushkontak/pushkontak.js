/**
 * @module plugins/group/pushkontak/pushkontak
 * @description Push Kontak Massal (Broadcast ke Member Grup) - V2 Optimized
 * @author Har (FRIEREN-MD)
 */

import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validation
    if (!text && !m.quoted) {
        return m.reply(`📢 *𝐏𝐔𝐒𝐇 𝐊𝐎𝐍𝐓𝐀𝐊 𝐕𝟐*

Fitur ini akan mengirim pesan ke seluruh anggota grup secara pribadi.

*Cara Pakai:*
• ${usedPrefix + command} <pesan>
• Reply/Quote pesan (Teks/Gambar/Video) lalu ketik ${usedPrefix + command}

*Tips Anti-Ban:*
Gunakan jeda yang cukup (Min. 5-10 detik).
Atur jeda di: \`.setjeda 8000\``)
    }

    if (global.isPushing) {
        return m.reply(`❌ *𝐆𝐀𝐆𝐀𝐋*

Proses pushkontak sedang berjalan. 
Gunakan \`${usedPrefix}stoppush\` untuk membatalkan proses yang ada.`)
    }

    // 2. Fetch Targets
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    
    try {
        const metadata = await conn.groupMetadata(m.chat)
        const participants = metadata.participants
            .map(p => p.id)
            .filter(id => id !== conn.user.id.split(':')[0] + '@s.whatsapp.net') // Bukan Bot
            .filter(id => id !== m.sender) // Bukan Pengirim

        if (participants.length === 0) return m.reply('❌ Tidak ada member yang ditemukan (selain bot/anda).')

        // 3. Preparation
        const jedaPush = db().settings?.jedaPush || 7000 // Default 7s if not set
        const total = participants.length
        const estimasi = Math.ceil((total * (jedaPush + 1000)) / 60000)

        let msgContent = {}
        if (m.quoted) {
            // Clone quoted message
            const quoted = m.quoted
            const mime = quoted.mimetype || quoted.msg?.mimetype
            
            if (quoted.download) {
                const buffer = await quoted.download()
                const type = quoted.mtype.replace('Message', '')
                msgContent[type.toLowerCase()] = buffer
                if (quoted.caption || text) msgContent.caption = text || quoted.caption
                if (quoted.mimetype) msgContent.mimetype = quoted.mimetype
            } else {
                msgContent.text = text || quoted.text || ''
            }
        } else {
            msgContent.text = text
        }

        // 4. Confirmation UI
        const confirmMsg = `🚀 *𝐏𝐔𝐒𝐇 𝐊𝐎𝐍𝐓𝐀𝐊 𝐈𝐍𝐈𝐓𝐈𝐀𝐓𝐄𝐃*

╭┈┈⬡「 📋 *𝐃𝐄𝐓𝐀𝐈𝐋* 」
┃ 👥 *Target:* ${total} Member
┃ ⏱️ *Jeda:* ${(jedaPush/1000).toFixed(1)} detik
┃ 📊 *Estimasi:* ±${estimasi} menit
┃ 🏢 *Grup:* ${metadata.subject}
╰┈┈┈┈┈┈┈┈⬡

> _Ketik ${usedPrefix}stoppush jika ingin berhenti di tengah jalan._`

        await m.reply(confirmMsg)

        // 5. Execution Loop
        global.isPushing = true
        global.stopPushRequest = false
        
        let success = 0
        let failed = 0

        for (const jid of participants) {
            // Check Stop Signal
            if (global.stopPushRequest) break

            try {
                // Presence Update (Typing simulation)
                await conn.sendPresenceUpdate('composing', jid).catch(() => {})
                await new Promise(r => setTimeout(r, 1000))

                // Append Unique ID to text/caption to avoid spam detection
                const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase()
                let finalContent = { ...msgContent }
                
                if (finalContent.text) finalContent.text += `\n\n_Ref: ${uniqueId}_`
                else if (finalContent.caption) finalContent.caption += `\n\n_Ref: ${uniqueId}_`
                else if (!finalContent.text && !finalContent.caption) finalContent.text = `_Ref: ${uniqueId}_`

                await conn.sendMessage(jid, finalContent)
                success++
            } catch (err) {
                console.error(`[Push Error] ${jid}:`, err.message)
                failed++
            }

            // Interval Delay
            await new Promise(resolve => setTimeout(resolve, jedaPush))
        }

        // 6. Final Report
        const isStopped = global.stopPushRequest
        global.isPushing = false
        global.stopPushRequest = false

        const report = `${isStopped ? '⏹️ *𝐏𝐔𝐒𝐇 𝐃𝐈𝐇𝐄𝐍𝐓𝐈𝐊𝐀𝐍*' : '✅ *𝐏𝐔𝐒𝐇 𝐒𝐄𝐋𝐄𝐒𝐀𝐈*'}

╭┈┈⬡「 📊 *𝐇𝐀𝐒𝐈𝐋* 」
┃ ✅ Berhasil: ${success}
┃ ❌ Gagal: ${failed}
┃ 👥 Total: ${total}
╰┈┈┈┈┈┈┈┈⬡`

        await m.reply(report)
        await conn.sendMessage(m.chat, { react: { text: isStopped ? '⏹️' : '✅', key: m.key } })

    } catch (e) {
        global.isPushing = false
        console.error('Pushkontak Error:', e)
        m.reply(`❌ *𝐄𝐑𝐑𝐎𝐑 𝐒𝐘𝐒𝐓𝐄𝐌*\n\n${e.message}`)
    }
}

handler.help = ['pushkontak <pesan>']
handler.tags = ['owner', 'pushkontak']
handler.command = ['pushkontak', 'push', 'puskontak']
handler.owner = true
handler.group = true

export default handler
