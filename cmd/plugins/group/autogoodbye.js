/**
 * @module plugins/group/autogoodbye
 * @description Toggle Auto Goodbye Message
 */

import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!db().chats) db().chats = {}
    if (!db().chats[m.chat]) db().chats[m.chat] = {}
    const chat = db().chats[m.chat]

    // Ensure structure exists
    if (!chat.welcome) chat.welcome = { status: false, goodbye: false }

    if (args[0] === 'on') {
        chat.welcome.goodbye = true
        saveDb()
        m.reply('✅ *AUTO GOODBYE AKTIF*\nBot akan mengucapkan selamat tinggal saat member keluar.')
    } else if (args[0] === 'off') {
        chat.welcome.goodbye = false
        saveDb()
        m.reply('⛔ *AUTO GOODBYE MATI*')
    } else {
        const status = chat.welcome.goodbye ? 'ON' : 'OFF'
        m.reply(`Status Saat Ini: *${status}*\n\nGunakan: ${usedPrefix + command} on/off`)
    }
}

handler.help = ['autogoodbye on/off']
handler.tags = ['group']
handler.command = ['autogoodbye', 'goodbye', 'setgoodbye']
handler.group = true
handler.admin = true

export default handler