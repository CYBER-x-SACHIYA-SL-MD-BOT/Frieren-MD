/**
 * @module plugins/owner/settokengh
 * @description Set GitHub Personal Access Token to .env
 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) return m.reply(`⚠️ Masukkan Token GitHub!\nContoh: ${usedPrefix + command} ghp_xxxxxxxxxxxx`)
    
    const envPath = path.join(process.cwd(), '.env')
    let envContent = ''

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8')
    }

    const tokenLine = `GITHUB_TOKEN=${text}`
    
    if (envContent.includes('GITHUB_TOKEN=')) {
        envContent = envContent.replace(/GITHUB_TOKEN=.*/, tokenLine)
    } else {
        envContent += `\n${tokenLine}`
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n')
    
    // Update process.env immediately for current session
    process.env.GITHUB_TOKEN = text

    m.reply(`✅ *GitHub Token Berhasil Disimpan!*\nToken telah disimpan ke dalam file .env dan siap digunakan.\n\n_Note: Jangan sebarkan token ini kepada siapapun!_`)
}

handler.help = ['settokengh <token>']
handler.tags = ['owner']
handler.command = ['settokengh', 'setgh']
handler.owner = true

export default handler