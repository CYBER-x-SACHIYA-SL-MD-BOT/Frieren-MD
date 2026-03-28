/**
 * @module plugins/group/rpg_setting
 * @description Enable/Disable RPG Features in Group
 */

import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!db().chats) db().chats = {}
    if (!db().chats[m.chat]) db().chats[m.chat] = {}
    
    // Default RPG is ON if not set
    const chat = db().chats[m.chat]
    if (typeof chat.rpg === 'undefined') chat.rpg = true

    if (!args[0]) {
        return m.reply(`Mode RPG saat ini: *${chat.rpg ? 'ON' : 'OFF'}*

Gunakan: *${usedPrefix + command} on/off*`)
    }

    if (args[0].toLowerCase() === 'on') {
        chat.rpg = true
        saveDb()
        m.reply(`✅ *RPG MODE AKTIF*
Member dapat menggunakan fitur RPG di grup ini.`)
    } else if (args[0].toLowerCase() === 'off') {
        chat.rpg = false
        saveDb()
        m.reply(`⛔ *RPG MODE MATI*
Fitur RPG dinonaktifkan di grup ini.`)
    } else {
        m.reply(`Pilih on atau off.
Contoh: *${usedPrefix + command} off*`)
    }
}

handler.help = ['rpgmode on/off']
handler.tags = ['group', 'admin']
handler.command = ['rpgmode', 'rpgset', 'mode-rpg']
handler.group = true
handler.admin = true

export default handler