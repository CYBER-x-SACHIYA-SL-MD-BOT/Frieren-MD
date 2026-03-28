/**
 * @module plugins/user/manage_user
 * @description Kelola data user (Unreg, Set Name, Set Age)
 */

import { db, saveDb } from '#system/db/data.js'

// Helper Font
const mono = (t) => '`' + t + '`'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const userKey = Object.keys(db().key).find(k => db().key[k].jid === m.sender)
    if (!userKey) return m.reply('❌ Anda belum terdaftar.')
    
    const user = db().key[userKey]

    // --- UNREG ---
    if (command === 'unreg' || command === 'unregister') {
        user.registered = false
        user.noId = '-'
        user.verifyStep = null // Reset verify step just in case
        saveDb()
        
        return m.reply(`✅ Berhasil unreg. Data profil telah direset.\nSilakan ketik ${mono('.verify')} untuk mendaftar kembali.`)
    }

    // --- SET NAME ---
    if (command === 'setname' || command === 'gantinama') {
        if (!args[0]) return m.reply(`⚠️ Masukkan nama baru.\nContoh: ${usedPrefix + command} Frieren`)
        
        user.name = args.join(' ')
        saveDb()
        return m.reply(`✅ Nama berhasil diubah menjadi: *${user.name}*`)
    }

    // --- SET AGE ---
    if (command === 'setage' || command === 'gantiumur') {
        const umur = parseInt(args[0])
        if (!umur || isNaN(umur)) return m.reply(`⚠️ Masukkan umur (angka).\nContoh: ${usedPrefix + command} 20`)
        
        user.age = umur
        saveDb()
        return m.reply(`✅ Umur berhasil diubah menjadi: *${user.age} Tahun*`)
    }
}

handler.help = ['unreg', 'setname <nama>', 'setage <umur>']
handler.tags = ['Main Menu']
handler.command = ['unreg', 'unregister', 'setname', 'gantinama', 'setage', 'gantiumur']
handler.prefix = true

export default handler
