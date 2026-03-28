/**
 * @module plugins/owner/gold_manager
 * @description Kelola saldo Emas user (Owner Only)
 */

import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // 1. Resolve Target
    let who
    let amount = 0

    if (m.isGroup) {
        if (m.mentionedJid && m.mentionedJid.length > 0) who = m.mentionedJid[0]
        else if (m.quoted) who = m.quoted.sender
        else if (args[0]) who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else {
        who = m.sender
    }

    if (!who) return m.reply(`⚠️ Tag user atau masukkan nomor!\nContoh: ${usedPrefix + command} @user 10`)

    // 2. Resolve Amount
    // Jika args[0] adalah nomor/tag, maka amount ada di args[1]
    // Jika reply, amount ada di args[0]
    if (args[0] && (args[0].includes('@') || args[0].length > 5)) {
        amount = parseInt(args[1])
    } else {
        amount = parseInt(args[0])
    }

    if (isNaN(amount)) return m.reply('❌ Jumlah harus angka!')

    // 3. Database Check
    const userKey = Object.keys(db().key).find(k => db().key[k].jid === who)
    if (!userKey) return m.reply('❌ User belum terdaftar.')
    
    const user = db().key[userKey]
    if (typeof user.tokens !== 'number') user.tokens = 0

    // 4. Execute
    if (command === 'addtokens' || command === 'addtoken') {
        user.tokens += amount
        saveDb()
        m.reply(`✅ Berhasil menambahkan *${amount} Tokens* ke @${who.split('@')[0]}\n💰 Total Tokens: ${user.tokens}`, { mentions: [who] })
    } else if (command === 'removetokens' || command === 'removetoken') {
        user.tokens -= amount
        if (user.tokens < 0) user.tokens = 0
        saveDb()
        m.reply(`✅ Berhasil mengurangi *${amount} Tokens* dari @${who.split('@')[0]}\n💰 Total Tokens: ${user.tokens}`, { mentions: [who] })
    }
}

handler.help = ['addtokens @user <jumlah>', 'removetokens @user <jumlah>']
handler.tags = ['owner']
handler.command = ['addtokens', 'addtoken', 'removetokens', 'removetoken']
handler.owner = true
handler.prefix = true

export default handler
