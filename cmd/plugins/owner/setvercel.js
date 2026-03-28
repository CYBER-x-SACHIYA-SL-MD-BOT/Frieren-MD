/**
 * @module plugins/owner/setvercel
 * @description Set Vercel Token to .env
 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) return m.reply(`⚠️ Masukkan Token Vercel!\nContoh: ${usedPrefix + command} A8s9d7f...\n\nDapatkan di: https://vercel.com/account/tokens`)
    
    const envPath = path.join(process.cwd(), '.env')
    let envContent = ''

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8')
    }

    const tokenLine = `VERCEL_TOKEN=${text}`
    
    if (envContent.includes('VERCEL_TOKEN=')) {
        envContent = envContent.replace(/VERCEL_TOKEN=.*/, tokenLine)
    } else {
        envContent += `\n${tokenLine}`
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n')
    
    // Update process.env & global immediately
    process.env.VERCEL_TOKEN = text
    global.vercelToken = text

    m.reply(`✅ *Vercel Token Berhasil Disimpan!*\nToken telah disimpan ke dalam file .env dan siap digunakan untuk .deploy.\n\n_Note: Jangan sebarkan token ini!_`)
}

handler.help = ['setvercel <token>']
handler.tags = ['owner']
handler.command = ['setvercel']
handler.owner = true

export default handler