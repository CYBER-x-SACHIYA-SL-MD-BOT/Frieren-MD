/**
 * @module plugins/owner/del_plugin
 * @description Menghapus plugin dengan sistem backup otomatis
 */

import fs from 'fs'
import path from 'path'
import { style } from '#system/style.js'

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) return m.reply(`${style.key('Format')} ${style.val(usedPrefix + command + ' <namafile>')}`)
    
    const filename = text.endsWith('.js') ? text : text + '.js'
    
    // Helper: Search recursively
    const findFile = (dir) => {
        const files = fs.readdirSync(dir)
        for (const file of files) {
            const fullPath = path.join(dir, file)
            if (fs.statSync(fullPath).isDirectory()) {
                const found = findFile(fullPath)
                if (found) return found
            } else if (file === filename) {
                return fullPath
            }
        }
        return null
    }
    
    const filePath = findFile('cmd/plugins')
    if (!filePath) return m.reply(`❌ File ${style.val(filename)} tidak ditemukan.`)
    
    try {
        // Create backup before deletion
        fs.copyFileSync(filePath, filePath + '.bak')
        fs.unlinkSync(filePath)
        
        m.reply(`✅ *𝐏𝐋𝐔𝐆𝐈𝐍 𝐃𝐄𝐋𝐄𝐓𝐄𝐃*\n\nBerhasil menghapus: ${style.val(filename)}
Backup tersimpan sebagai: ${style.val(filename + '.bak')}`)
        
        if (global.reloadPlugins) await global.reloadPlugins()
    } catch (e) {
        m.reply(`❌ Gagal menghapus: ${e.message}`)
    }
}

handler.help = ['delplugin <nama>']
handler.tags = ['owner']
handler.command = ['delplugin', 'delplug', 'delfile']
handler.owner = true
handler.prefix = true

export default handler
