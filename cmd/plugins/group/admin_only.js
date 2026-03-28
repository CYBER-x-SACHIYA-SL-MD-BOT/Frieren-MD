/**
 * @module plugins/group/admin_only
 * @description Toggle Mode Admin Only untuk Grup
 */

import { getGc, saveGc } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const gcData = getGc(m.chat)
    if (!gcData) return m.reply('❌ Database grup belum siap.')

    // Ensure object exists
    gcData.settings = gcData.settings || {}

    const opt = args[0]?.toLowerCase()
    
    if (!opt || !['on', 'off'].includes(opt)) {
        const status = gcData.settings.adminOnly ? 'AKTIF ✅' : 'NONAKTIF ⛔'
        return m.reply(
            `🛡️ *MODE ADMIN ONLY*\n\n` +
            `Status: ${status}\n\n` +
            `Gunakan:\n` +
            `• ${usedPrefix + command} on\n` +
            `• ${usedPrefix + command} off`
        )
    }

    if (opt === 'on') {
        if (gcData.settings.adminOnly) return m.reply('⚠️ Mode Admin Only sudah aktif.')
        gcData.settings.adminOnly = true
        m.reply('✅ *MODE ADMIN ONLY AKTIF*\nHanya admin yang bisa menggunakan bot di grup ini.')
    } else {
        if (!gcData.settings.adminOnly) return m.reply('⚠️ Mode Admin Only sudah mati.')
        gcData.settings.adminOnly = false
        m.reply('✅ *MODE ADMIN ONLY MATI*\nSemua member bisa menggunakan bot.')
    }
    
    saveGc()
}

handler.help = ['adminonly on/off']
handler.tags = ['group', 'admin']
handler.command = ['adminonly', 'modeadmin']
handler.group = true
handler.admin = true
handler.prefix = true

export default handler
