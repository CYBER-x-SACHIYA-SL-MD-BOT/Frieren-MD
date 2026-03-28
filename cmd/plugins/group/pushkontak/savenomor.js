/**
 * @module plugins/group/pushkontak/savenomor
 * @description Simpan nomor spesifik (Single Contact)
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let targetNumber = ''
    let nama = ''
    
    // 1. Resolve Target & Name
    if (m.isGroup) {
        if (m.quoted) {
            targetNumber = m.quoted.sender
            nama = text?.trim() || m.quoted.pushName || 'User'
        } else if (m.mentionedJid?.length) {
            targetNumber = m.mentionedJid[0]
            const input = text?.trim()
            // Try to extract name from input (e.g. .sv @tag|Nama)
            nama = input?.split('|')[1]?.trim() || input?.replace(/@\d+/g, '').trim() || 'User'
        } else if (text?.includes('|')) {
            const [num, nm] = text.split('|').map(s => s.trim())
            targetNumber = num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            nama = nm
        }
    } else {
        // Private Chat (Save Bot Number usually?) Or save user number
        // Let's assume user wants to save the current chat
        targetNumber = m.chat
        nama = text?.trim() || m.pushName || 'User'
    }
    
    if (!targetNumber) {
        return m.reply(
            `📱 *𝐒𝐀𝐕𝐄 𝐍𝐎𝐌𝐎𝐑*\n\n` +
            `Gunakan fitur ini untuk menyimpan nomor seseorang.\n\n` +
            `🔹 *Cara Pakai:*
` +
            `Reply pesan orangnya, lalu ketik:
` +
            `\`${usedPrefix + command} NamaKontak\`\n\n` +
            `Atau tag:
` +
            `\`${usedPrefix + command} @tag|NamaKontak\``
        )
    }
    
    if (!nama) nama = 'Contact'

    await conn.sendMessage(m.chat, { react: { text: '📱', key: m.key } })
    
    try {
        const phone = targetNumber.split('@')[0]
        
        // Generate vCard
        const vcard = 'BEGIN:VCARD\n' + 
                      'VERSION:3.0\n' + 
                      `FN:${nama}\n` + 
                      `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\n` + 
                      'END:VCARD'
        
        // Send Contact Message
        await conn.sendMessage(m.chat, { 
            contacts: { 
                displayName: nama, 
                contacts: [{ vcard }] 
            }
        }, { quoted: m })
        
        // Optional: Try to add to bot's internal store if supported
        // await conn.addOrEditContact(...) // Seringkali tidak work di MD Web, jadi skip untuk stabilitas
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        
    } catch (error) {
        console.error(error)
        m.reply(`❌ *𝐄𝐑𝐑𝐎𝐑*\n\n> ${error.message}`)
    }
}

handler.help = ['savenomor <nama>']
handler.tags = ['pushkontak', 'tools']
handler.command = ['savenomor', 'sv', 'save', 'addcontact']
handler.owner = true
handler.prefix = true

export default handler
