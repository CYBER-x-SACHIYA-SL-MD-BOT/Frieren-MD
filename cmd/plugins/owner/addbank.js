/**
 * @module plugins/owner/addbank
 * @description Tambah saldo bank user (Owner Only)
 */

import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // 1. Resolve Target & Amount
    let who
    let amount = 0

    if (m.isGroup) {
        // Cek mentioned
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            who = m.mentionedJid[0]
            amount = args[1]
        } 
        // Cek quoted
        else if (m.quoted) {
            who = m.quoted.sender
            amount = args[0]
        }
        // Cek input nomor manual
        else if (args[0]) {
            who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            amount = args[1]
        }
    } else {
        who = m.sender
        amount = args[0]
    }

    if (!who || !amount) {
        return m.reply(
            `⚠️ *ADD BANK*\n\n` +
            `Format: ${usedPrefix + command} @user <jumlah>\n` +
            `Atau reply pesan user: ${usedPrefix + command} <jumlah>`
        )
    }

    // 2. Validate Amount
    amount = parseInt(amount)
    if (isNaN(amount) || amount <= 0) return m.reply('❌ Jumlah harus angka positif!')

    const userKey = Object.keys(db().key).find(k => db().key[k].jid === who)
    if (!userKey) return m.reply('❌ User tidak ditemukan di database.')

    // 4. Add Money
    const user = db().key[userKey]
    
    // Inisialisasi jika belum ada
    if (typeof user.bank !== 'number') user.bank = 0
    if (typeof user.money !== 'number') user.money = 0 

    user.bank += amount
    saveDb()

    const balance = user.bank.toLocaleString('id-ID')
    const added = amount.toLocaleString('id-ID')
    
    await conn.sendMessage(m.chat, {
        text: `✅ *TRANSAKSI SUKSES*\n\n` +
              `👤 User: @${who.split('@')[0]}\n` +
              `➕ Tambah: Rp ${added}\n` +
              `🏦 Total Bank: Rp ${balance}`,
        mentions: [who]
    }, { quoted: m })
}

handler.help = ['addbank @user <jumlah>']
handler.tags = ['owner']
handler.command = ['addbank', 'tambahbank']
handler.owner = true
handler.prefix = true

export default handler
