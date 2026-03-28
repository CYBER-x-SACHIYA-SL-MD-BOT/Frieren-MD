import { safeForward } from "#system/helper.js"

/**
 * @module plugins/owner/togc
 * @description Kirim pesan ke grup tertentu (Broadcast/Forward) - Refactored
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.togc = conn.togc || {}
    const isReplyList = m.quoted && conn.togc[m.chat] && m.quoted.id === conn.togc[m.chat].key.id

    // --- 1. PROSES PILIHAN DARI LIST (REPLY SESSION) ---
    if (isReplyList) {
        const inputs = text.split(',').map(s => s.trim())
        const session = conn.togc[m.chat]
        const { groups, content } = session
        
        if (!content) return m.reply('❌ Konten pesan tidak ditemukan dalam sesi.')

        let targetIds = []
        for (let input of inputs) {
            if (input.endsWith('@g.us')) targetIds.push(input)
            else if (!isNaN(input)) {
                const idx = parseInt(input) - 1
                if (groups[idx]) targetIds.push(groups[idx].id)
            }
        }
        
        if (targetIds.length === 0) return m.reply('❌ Nomor/ID tidak valid.')
        
        await m.reply(`⏳ Mengirim sesi ke ${targetIds.length} grup...`)
        const success = await safeForward(conn, targetIds, content)
        
        delete conn.togc[m.chat]
        return m.reply(`✅ Berhasil kirim ke ${success} grup.`)
    }

    // --- 2. DIRECT SEND (ARGUMEN) ---
    if (text && m.quoted) {
        const quoted = m.quoted
        const allChats = Object.values(await conn.groupFetchAllParticipating())
        const groups = allChats.map(g => ({ id: g.id, subject: g.subject }))
        
        const inputs = text.split(',').map(s => s.trim())
        let targetIds = []
        for (let input of inputs) {
            if (input.endsWith('@g.us')) targetIds.push(input)
            else if (!isNaN(input)) {
                const idx = parseInt(input) - 1
                if (groups[idx]) targetIds.push(groups[idx].id)
            }
        }

        if (targetIds.length > 0) {
            await m.reply(`⏳ Mengirim pesan ke ${targetIds.length} grup...`)
            const success = await safeForward(conn, targetIds, quoted)
            return m.reply(`✅ Berhasil kirim ke ${success} grup.`)
        }
    }

    // --- 3. SHOW LIST (DEFAULT) ---
    if (!m.quoted) return m.reply('❌ Reply pesan yang ingin dikirim!')

    const allChats = Object.values(await conn.groupFetchAllParticipating())
    const groups = allChats.map(g => ({ id: g.id, subject: g.subject }))
    
    if (groups.length === 0) return m.reply('❌ Bot belum masuk ke grup manapun.')

    let txt = `📢 *PILIH TARGET GRUP* 📢\n\n`
    groups.forEach((g, i) => {
        txt += `${i + 1}. *${g.subject}*\n`
        txt += `   🆔 \`${g.id}\`\n`
    })
    txt += `\nReply pesan ini dengan *Nomor Urut* atau *ID Grup*.\nBisa banyak (pisahkan koma).`

    const msg = await m.reply(txt)
    
    conn.togc[m.chat] = {
        key: msg.key,
        groups: groups,
        content: m.quoted // Simpan m.quoted asli (custom object dari handle.js)
    }
}

handler.help = ['togc (reply pesan)']
handler.tags = ['owner']
handler.command = ['togc', 'torg', 'bcgc', 'pushgc', 'kirimgc']
handler.owner = true

handler.prefix = true
export default handler