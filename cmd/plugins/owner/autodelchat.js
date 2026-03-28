/**
 * @module plugins/owner/autodelchat
 * @description Global Auto Delete Chat (Mute User Global)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../../system/db/autodel.json')

// Init DB
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]))

let handler = async (m, { conn, command, args, usedPrefix }) => {
    let data = JSON.parse(fs.readFileSync(dbPath))

    // List Command
    if (command === 'listdelchat') {
        if (!data || data.length === 0) return m.reply('📭 Tidak ada user di daftar auto-delete.')
        
        let txt = `📋 *Daftar Global Auto Delete Chat:*\n\n`
        txt += data.map((u, i) => `${i + 1}. @${u.split('@')[0]}`).join('\n')
        
        return await conn.sendMessage(m.chat, { text: txt, mentions: data }, { quoted: m })
    }

    // Resolve Target
    let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
    if (!target && args[0]) {
        let nomor = args[0].replace(/[^0-9]/g, '')
        if (nomor) target = nomor + '@s.whatsapp.net'
    }

    if (!target) return m.reply(`❌ Tag, reply, atau ketik nomor target!\nContoh: ${usedPrefix + command} @user`)

    if (command === 'adddelchat') {
        if (data.includes(target)) return m.reply('⚠️ User sudah ada di daftar.')
        data.push(target)
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
        
        await conn.sendMessage(m.chat, { 
            text: `✅ Pesan dari @${target.split('@')[0]} akan otomatis dihapus di *semua grup* (Global Mute).`,
            mentions: [target]
        }, { quoted: m })
    }

    if (command === 'deldelchat') {
        if (!data.includes(target)) return m.reply('⚠️ User tidak ada di daftar.')
        data = data.filter(u => u !== target)
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
        
        await conn.sendMessage(m.chat, { 
            text: `🗑️ Pesan dari @${target.split('@')[0]} tidak akan dihapus lagi.`,
            mentions: [target]
        }, { quoted: m })
    }
}

handler.help = ['adddelchat', 'deldelchat', 'listdelchat']
handler.tags = ['owner']
handler.command = ['adddelchat', 'deldelchat', 'listdelchat']
handler.owner = true
handler.prefix = true

export default handler
