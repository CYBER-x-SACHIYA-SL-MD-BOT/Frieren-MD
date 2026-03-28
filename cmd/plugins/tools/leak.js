/**
 * @module plugins/tools/leak
 * @description Check if email is leaked using ProxyNova COMB API (with strict filtering)
 */

import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`⚠️ Masukkan email untuk diperiksa.\nContoh: *${usedPrefix + command}* example@gmail.com`)

    const email = text.trim()
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return m.reply('❌ Format email tidak valid.')
    }

    try {
        await m.reply('_🔎 Checking COMB database..._')
        
        // Using ProxyNova COMB API with pagination limits
        const { data } = await axios.get(`https://api.proxynova.com/comb?query=${encodeURIComponent(email)}&start=0&limit=100`)

        if (!data || !data.lines || data.lines.length === 0) {
            return m.reply(`✅ *Aman!* Email ${email} tidak ditemukan dalam database COMB (Sample 100).`)
        }

        // Strict filtering: Only keep lines starting with "email:"
        // Note: The API output format is usually email:password or email:hash
        const exactMatches = data.lines.filter(line => {
            const parts = line.split(':')
            return parts.length >= 2 && parts[0].trim().toLowerCase() === email.toLowerCase()
        })

        if (exactMatches.length === 0) {
            return m.reply(`✅ *Aman!* Email ${email} tidak ditemukan dalam database COMB yang kami periksa.`)
        }

        const count = exactMatches.length
        const limit = 5
        let caption = `⚠️ *DATA BREACH ALERT* ⚠️\n`
        caption += `Fitur ini mendeteksi kebocoran data Anda dalam database *COMB* (Compilation of Many Breaches).\n\n`
        caption += `📧 *Email:* ${email}\n`
        caption += `🔢 *Total Temuan:* ${count} entri\n\n`
        caption += `🔎 *Password Terkait (Disensor):*\n`

        // Show sample passwords masked
        exactMatches.slice(0, limit).forEach(line => {
            const parts = line.split(':')
            // Rejoin the rest as password (in case password contains :)
            const pass = parts.slice(1).join(':').trim()
            
            let maskedPass = ''
            if (pass.length > 2) {
                 // Show first 2 chars, mask the rest
                 maskedPass = pass.substring(0, 2) + '*'.repeat(pass.length - 2)
            } else {
                 // Too short, mask all
                 maskedPass = '*'.repeat(pass.length)
            }
            
            caption += `- ${maskedPass}\n`
        })

        if (exactMatches.length > limit) {
            caption += `\n_...dan ${exactMatches.length - limit} entri lainnya._`
        }

        caption += `\n\n❗ *SARAN KEAMANAN:*\n`
        caption += `1. Segera ganti password email Anda.\n`
        caption += `2. Aktifkan 2FA (Two-Factor Authentication).\n`
        caption += `3. Jangan gunakan password yang sama di layanan berbeda.`

        await m.reply(caption)

    } catch (e) {
        console.error('Leak Check Error:', e)
        m.reply('❌ Terjadi kesalahan saat memeriksa database kebocoran.')
    }
}

handler.help = ['leak <email>', 'checkmail <email>']
handler.tags = ['tools', 'internet']
handler.command = ['leak', 'checkmail', 'pwned']
handler.prefix = true

export default handler