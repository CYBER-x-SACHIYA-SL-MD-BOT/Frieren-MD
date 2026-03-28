/**
 * @module plugins/owner/clearsession
 * @description Clear Temp & Log Files (Optimized)
 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, isOwner }) => {
    if (!isOwner) return m.reply('❌ Khusus Owner.')

    await m.reply('🧹 *Cleaning junk files...*')

    try {
        // 1. Clean Temp Folder
        const tempDirs = ['./tmp', './temp', 'temp', 'tmp']
        let tempDeleted = 0
        
        for (const dir of tempDirs) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir)
                for (const file of files) {
                    if (file === '.placeholder') continue
                    try {
                        fs.unlinkSync(path.join(dir, file))
                        tempDeleted++
                    } catch {}
                }
            }
        }

        // 2. Clean Logs
        const logDirs = ['./logs', 'logs']
        let logsDeleted = 0
        for (const dir of logDirs) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir)
                for (const file of files) {
                    if (file.endsWith('.log')) {
                        try {
                            // Instead of deleting, we can truncate large logs or delete old ones
                            // For now, let's just delete them if they are not the current active one (optional)
                            // But usually owner wants to clear them all
                            fs.unlinkSync(path.join(dir, file))
                            logsDeleted++
                        } catch {}
                    }
                }
            }
        }
        
        let msg = `✅ *CLEAN SUCCESS*\n\n`
        msg += `🗑️ Temp Files: ${tempDeleted} files\n`
        msg += `🗑️ Log Files: ${logsDeleted} files\n\n`
        msg += `_Bot performance optimized. Session folder preserved to avoid re-pairing._`
        
        await m.reply(msg)
        
    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal membersihkan sampah.')
    }
}

handler.help = ['clearsession', 'csession']
handler.tags = ['owner']
handler.command = ['clearsession', 'csession', 'clearsessi']
handler.owner = true

export default handler