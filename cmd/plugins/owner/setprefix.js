/**
 * @module plugins/owner/setprefix
 * @description Ubah prefix bot secara dinamis
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const input = text?.trim().toLowerCase()


    if (!input) {
        return m.reply(
            `🛠️ *SET PREFIX*\n\n` +
            `Pilih mode prefix:\n` +
            `1. *${usedPrefix + command} dot* (Hanya titik .)\n` +
            `2. *${usedPrefix + command} nodot* (Tanpa prefix / No Prefix)\n` +
            `3. *${usedPrefix + command} all* (Multi prefix: . # / !)\n` +
            `\n` +
            `Saat ini: ${global.prefix}`
        )
    }

    if (input === 'dot') {
        global.prefix = '.'
        m.reply('✅ Prefix diubah menjadi: *Titik (.)*')
    } else if (input === 'nodot') {
        global.prefix = '' // No prefix regex logic handled in handle.js usually
        // Or set to regex that matches start of string
        global.prefix = new RegExp('^') 
        m.reply('✅ Prefix diubah menjadi: *No Prefix*')
    } else if (input === 'all' || input === 'multi') {
        global.prefix = ['.', '#', '/', '!']
        m.reply('✅ Prefix diubah menjadi: *Multi Prefix* (. # / !)')
    } else {
        // Custom single char
        if (input.length === 1) {
            global.prefix = input
            m.reply(`✅ Prefix diubah menjadi: *${input}*`)
        } else {
            m.reply('❌ Opsi tidak valid.')
        }
    }
}

handler.help = ['setprefix <mode>']
handler.tags = ['owner']
handler.command = ['setprefix', 'prefix']
handler.owner = true
handler.prefix = true

export default handler
