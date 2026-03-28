/**
 * @module plugins/group/botmode
 * @description Mute/Unmute bot di grup ini (Interactive Global Toggle added)
 */

import { db, saveDb, getGc, gc } from "#system/db/data.js"; 

let handler = async (m, { conn, args, usedPrefix, command, isOwner, text }) => {
    // --- 1. PROSES PILIHAN GRUP DARI LIST ATAU DIRECT ANSWER (TOGC) ---
    conn.botmodetogc = conn.botmodetogc || {}
    const session = conn.botmodetogc[m.chat]
    
    const isReplyList = session && m.quoted && m.quoted.id === session.key.id
    const isDirectAnswer = session && m.sender === session.sender && text && text.match(/^[0-9, ]+$/)

    if (isReplyList || isDirectAnswer) {
        if (!isOwner) return m.reply('❌ Hanya owner yang bisa mengatur untuk grup lain.')
        
        const inputs = text.split(',').map(s => s.trim())
        const { groups, state } = session // state: 'on' or 'off'
        
        let targetIds = []
        for (let input of inputs) {
            if (input.endsWith('@g.us')) targetIds.push(input)
            else if (!isNaN(input) && input.trim() !== '') {
                const idx = parseInt(input) - 1
                if (groups[idx]) targetIds.push(groups[idx].id)
            }
        }
        
        if (targetIds.length === 0) return m.reply('❌ Nomor/ID tidak valid.')
        
        await m.reply(`⏳ Menyetel Mute Bot menjadi *${state === 'off' ? 'MUTED 🔇' : 'UNMUTED 🔊'}* ke ${targetIds.length} grup...`)
        
        let success = 0
        const allGroups = gc().key || {}
        
        for (let id of targetIds) {
            let g = allGroups[id]
            if (!g) {
                allGroups[id] = { id: id }
                g = allGroups[id]
            }
            
            if (state === 'off') {
                g.mute = true
            } else {
                g.mute = false
            }
            success++
        }
        
        saveGc()
        delete conn.botmodetogc[m.chat]
        return m.reply(`✅ Berhasil menyetel status bot di ${success} grup.`)
    }


    // --- 2. FITUR NORMAL & AWALAN TOGC ---
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (target && (command === 'mutebot' || command === 'unmutebot')) return 

    let mode = ''
    if (command === 'mutebot') mode = 'off'
    else if (command === 'unmutebot') mode = 'on'
    else if (args[0]) mode = args[0].toLowerCase()

    // --- GLOBAL TOGGLE (TOGC MODE) ---
    if ((mode === 'on' || mode === 'off') && args[1] === 'togc' || (command === 'mutebot' && args[0] === 'togc') || (command === 'unmutebot' && args[0] === 'togc')) {
        if (!isOwner) return m.reply('❌ Hanya owner yang bisa menggunakan fitur togc.')
        
        let state = mode
        if (command === 'mutebot') state = 'off'
        if (command === 'unmutebot') state = 'on'
        
        const allChats = Object.values(await conn.groupFetchAllParticipating())
        const groups = allChats.map(g => ({ id: g.id, subject: g.subject }))
        
        if (groups.length === 0) return m.reply('❌ Bot belum masuk ke grup manapun.')

        // 1. INLINE MODE (e.g., .bot off togc 4 ATAU .mutebot togc 4)
        const inlineArgs = (command === 'mutebot' || command === 'unmutebot') ? args[1] : args[2]
        if (inlineArgs) {
            const inputs = args.slice((command === 'mutebot' || command === 'unmutebot') ? 1 : 2).join('').split(',')
            let targetIds = []
            for (let input of inputs) {
                if (input.endsWith('@g.us')) targetIds.push(input)
                else if (!isNaN(input)) {
                    const idx = parseInt(input) - 1
                    if (groups[idx]) targetIds.push(groups[idx].id)
                }
            }
            if (targetIds.length === 0) return m.reply('❌ Nomor/ID tidak valid.')
            
            await m.reply(`⏳ Menyetel Mute Bot menjadi *${state === 'off' ? 'MUTED 🔇' : 'UNMUTED 🔊'}* ke ${targetIds.length} grup...`)
            let success = 0
            const allGroups = gc().key || {}
            for (let id of targetIds) {
                let g = allGroups[id]
                if (!g) { allGroups[id] = { id: id }; g = allGroups[id]; }
                if (state === 'off') g.mute = true
                else g.mute = false
                success++
            }
            saveGc()
            return m.reply(`✅ Berhasil menyetel status bot di ${success} grup.`)
        }

        // 2. REPLY MODE (SHOW LIST)
        let txt = `📢 *PILIH TARGET GRUP UNTUK MUTE BOT ${state.toUpperCase()}* 📢\n\n`
        txt += `_(Pilih grup yang ingin di ${state === 'off' ? 'MUTE 🔇' : 'UNMUTE 🔊'})_\n\n`
        groups.forEach((g, i) => {
            txt += `${i + 1}. *${g.subject}*\n`
            txt += `   🆔 \`${g.id}\`\n`
        })
        txt += `\nReply pesan ini dengan *Nomor Urut* atau *ID Grup*.\nBisa pilih banyak (pisahkan dengan koma).`

        const msg = await m.reply(txt)
        
        conn.botmodetogc[m.chat] = {
            key: msg.key,
            groups: groups,
            state: state,
            sender: m.sender // Simpan siapa yang minta
        }
        return; 
    }

    // --- NORMAL MODE CHECKS ---
    if (!m.isGroup) return m.reply('❌ Perintah ini khusus untuk grup!')
    if (!m.isAdmin && !isOwner) return m.reply('❌ Perintah ini khusus Admin Grup!')

    let gcData = getGc(m.chat)
    if (!gcData) return m.reply('❌ Database grup tidak ditemukan.')

    if (!mode) {
        const status = gcData.mute ? 'MUTE 🔇' : 'ON 🔊'
        return m.reply(`🤖 *STATUS BOT*\n\nStatus: ${status}\n\nGunakan:\n• ${usedPrefix}mutebot (Matikan Bot)\n• ${usedPrefix}unmutebot (Nyalakan Bot)\n• ${usedPrefix}mutebot togc (Pilih Grup)`)
    }

    if (['off', 'mati'].includes(mode)) {
        if (gcData.mute) return m.reply('⚠️ Bot sudah mute di grup ini.')
        gcData.mute = true
        saveGc()
        m.reply('🔇 *BOT MUTED*\nBot sekarang HANYA merespon Owner di grup ini.')
    } else if (['on', 'hidup'].includes(mode)) {
        if (!gcData.mute) return m.reply('⚠️ Bot sudah aktif di grup ini.')
        gcData.mute = false
        saveGc()
        m.reply('🔊 *BOT UNMUTED*\nBot kembali aktif untuk semua member.')
    }
};

handler.before = async (m, { conn, isOwner }) => {
    conn.botmodetogc = conn.botmodetogc || {}
    const session = conn.botmodetogc[m.chat]
    
    // Bisa lewat reply bot, atau langsung ketik angka jika masih ada session
    const isReplyList = session && m.quoted && m.quoted.id === session.key.id
    const isDirectAnswer = session && m.sender === session.sender && m.text && !m.isCommand && m.text.match(/^[0-9, ]+$/)

    if (isReplyList || isDirectAnswer) {
        // Panggil ulang handler utama dengan m.text murni jika direply
        await handler(m, { conn, text: m.text, args: [], usedPrefix: '', command: 'bot', isOwner: isOwner || global.ownerNumber.includes(m.sender.split('@')[0]) })
        return true; // Stop propagate
    }
}

handler.help = ["bot on/off", "mutebot", "unmutebot"];
handler.tags = ["group", "owner"];
// MENGHINDARI BENTROK DENGAN MUTE USER
handler.command = ["bot", "mutebot", "unmutebot"];
handler.prefix = true;

export default handler;