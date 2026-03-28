/**
 * @module plugins/user/profile
 * @description Profile Management (Name, Age, Gender, etc.)
 */

import { db, saveDb } from '#system/db/data.js'
import { Inventory } from '#system/inventory.js'

let handler = async (m, { conn, text, command, args, isOwner }) => {
    const user = db().key[m.sender]
    if (!user) return m.reply('❌ User data not found.')

    if (command === 'unregister' || command === 'unreg') {
        if (!user.registered) return m.reply('⚠️ Anda belum terdaftar.')
        user.registered = false
        user.noId = '-'
        saveDb()
        return m.reply('✅ Berhasil unregister. Silakan daftar lagi jika ingin menggunakan bot.')
    }

    if (command === 'setname' || command === 'gantinama') {
        if (!text) return m.reply('Masukkan nama baru.\nContoh: .setname Muhar')
        user.name = text.trim()
        
        if ((user.money || 0) < 0) {
            user.money = 0
            user.exp = 0
            user.level = 1
            user.inventory = { potion: 5 } 
            user.rpg_assets = { sword: 0, armor: 0, pickaxe: 0, axe: 0, fishing_rod: 0 }
            saveDb()
            return m.reply(`✅ *IDENTITAS BARU DIBUAT*\n\nNama: ${user.name}\n\n⚠️ *PERINGATAN:*\nSeluruh Aset dan Level telah *DIRESET* karena Anda memiliki hutang (Konsekuensi kabur dari utang).`)
        }
        saveDb()
        return m.reply('✅ Nama berhasil diganti.')
    }

    if (command === 'setage' || command === 'gantiumur') {
        const age = parseInt(args[0])
        if (!age || isNaN(age)) return m.reply('Masukkan umur (angka).\nContoh: .setage 20')
        if (age < 5 || age > 90) return m.reply('Umur tidak valid (5-90).')
        user.age = age
        saveDb()
        return m.reply('✅ Umur berhasil diganti.')
    }

    if (command === 'setgender' || command === 'gantikelamin') {
        if (!args[0]) return m.reply('Pilih gender: Pria / Wanita')
        let gender = ''
        const t = args[0].toLowerCase()
        if (['pria', 'laki', 'cowok', 'l'].includes(t)) gender = 'Pria'
        else if (['wanita', 'perempuan', 'cewek', 'p'].includes(t)) gender = 'Wanita'
        else return m.reply('Pilih gender: Pria / Wanita')
        
        user.gender = gender
        saveDb()
        return m.reply(`✅ Gender berhasil diganti menjadi: ${gender}`)
    }

    if (command === 'daftarkan' || command === 'regtarget') {
        if (!isOwner) return m.reply('❌ Khusus Owner.')
        const targetJid = m.quoted ? m.quoted.sender : 
                          (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                           (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null))

        if (!targetJid) return m.reply('Tag atau reply orang yang mau didaftarkan!')
        
        let targetUser = db().key[targetJid]
        if (targetUser && targetUser.registered) return m.reply('❌ Orang ini sudah terdaftar!')

        if (!targetUser) {
             // Let authUser handle the initial creation if needed, 
             // but here we manually create if it doesn't exist to be safe
             db().key[targetJid] = {
                jid: targetJid,
                name: 'User',
                registered: true,
                age: 18,
                gender: '-',
                money: 200000,
                limit: 50,
                level: 1,
                exp: 0,
                inventory: {},
                rpg_assets: {}
             }
             Inventory.init(db().key[targetJid])
        } else {
            targetUser.registered = true
            targetUser.name = targetUser.name || 'User'
        }
        
        saveDb()
        m.reply(`✅ Berhasil mendaftarkan @${targetJid.split('@')[0]}!`, { mentions: [targetJid] })
    }
}

handler.help = ['setname', 'setage', 'setgender', 'unreg', 'daftarkan']
handler.tags = ['Main Menu']
handler.command = ['setname', 'gantinama', 'setage', 'gantiumur', 'setgender', 'gantikelamin', 'unregister', 'unreg', 'daftarkan', 'regtarget']
handler.prefix = true

export default handler
