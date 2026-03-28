/**
 * @module plugins/tools/countdown
 * @description Hitung Mundur Tanggal (Manual Style)
 */

import axios from 'axios'
import moment from 'moment-timezone'

const API_KEY = 'KxUCMqPK'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const tiny = (t) => t.split('').map(c=>{
        const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};
        return m[c]||c
    }).join('')
    
    if (!text) {
        return m.reply(
            `╭───「 *${tiny('COUNTDOWN')}* 」───\n` +
            `│\n` +
            `│ 🕒 Hitung mundur ke tanggal tertentu.\n` +
            `│ 🎮 Format: ${usedPrefix + command} tanggal,bulan,tahun\n` +
            `│ 📝 Contoh: ${usedPrefix + command} 17,agustus,2045\n` +
            `│\n` +
            `╰────────────────────`
        )
    }

    try {
        let [tanggal, bulan, tahun] = text.split(',').map(s => s.trim())
        if (!tanggal || !bulan || !tahun) return m.reply(`❌ Format salah! Gunakan koma sebagai pemisah.\nContoh: 1,januari,2026`)

        // Normalize month
        const months = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
            'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
        }
        const monthNum = months[bulan.toLowerCase()] || bulan
        
        // Check date validity locally first
        const targetDate = moment(`${tahun}-${monthNum}-${tanggal}`, 'YYYY-MM-DD')
        const now = moment()
        
        if (!targetDate.isValid()) return m.reply('❌ Tanggal tidak valid.')
        if (targetDate.isBefore(now, 'day')) return m.reply('⚠️ Tanggal sudah lewat!')

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

        const apiUrl = `https://api.betabotz.eu.org/api/tools/countdown?tanggal=${tanggal}&bulan=${bulan}&tahun=${tahun}&apikey=${API_KEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })

        if (!data.status || !data.result) throw new Error('API Error')

        const result = data.result.result1 || data.result // Adjust based on actual response structure
        
        let txt = `╭───「 *${tiny('COUNTDOWN')}* 」───\n`
        txt += `│\n`
        txt += `│ 📅 Target: ${tanggal} ${bulan.toUpperCase()} ${tahun}\n`
        txt += `│ ⏳ Sisa: ${result}\n`
        txt += `│\n`
        txt += `╰────────────────────`

        await m.reply(txt)
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        console.error(e)
        m.reply("❌ Gagal menghitung waktu.")
    }
}

handler.help = ['hitungmundur']
handler.tags = ['tools']
handler.command = ['hitungmundur', 'countdown', 'cd']
handler.prefix = true

export default handler
