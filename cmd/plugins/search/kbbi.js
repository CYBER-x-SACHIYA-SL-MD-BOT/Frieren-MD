/**
 * @module plugins/internet/kbbi
 * @description KBBI Daring Scraper (kbbi.web.id) - Improved Formatting
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`📚 Cari arti kata apa?\nContoh: ${usedPrefix + command} makan`)

    await conn.sendMessage(m.chat, { react: { text: '📚', key: m.key } })

    try {
        const url = `https://kbbi.web.id/${encodeURIComponent(text)}`
        const { data } = await axios.get(url)
        const $ = cheerio.load(data)

        // Cek apakah ditemukan
        if ($('#d1').text().includes('Maaf, tidak ditemukan kata yang dicari')) {
            let saran = []
            $('.popular-words a').each((i, el) => {
                if (i < 5) saran.push($(el).text())
            })
            
            let msg = `❌ Kata *"${text}"* tidak ditemukan di KBBI.`
            if (saran.length > 0) msg += `\n\nKata populer:\n${saran.map(s => `- ${s}`).join('\n')}`
            
            return m.reply(msg)
        }

        // Ambil konten raw HTML
        let rawHtml = $('#d1').html() || ''

        // 1. Pisahkan Kata Dasar vs Kata Turunan (biasanya dipisah <br><br> atau <br/><br/>)
        let parts = rawHtml.split(/<br\s*\/?>\s*<br\s*\/?>/i)
        let mainBlock = parts[0]
        let derivedBlocks = parts.slice(1)

        // 2. Proses Kata Dasar (Main Entry)
        // Pisahkan definisi utama dari kata majemuk (biasanya -- kata)
        let mainParts = mainBlock.split(/<br\s*\/?>\s*<b>--/i)
        let definitionRaw = mainParts[0]
        let compoundsRaw = mainParts.slice(1) // Array of compound definitions

        // Bersihkan Definisi Utama
        let definition = cleanText(definitionRaw)
        
        // 3. Format Output
        let txt = `📚 *KAMUS BESAR BAHASA INDONESIA* 📚\n\n`
        txt += `🔤 *Kata:* ${text}\n`
        txt += `🔗 *Link:* ${url}\n\n`
        
        txt += `📝 *Definisi:*\n${definition}\n`

        // 4. Kata Majemuk (jika ada)
        if (compoundsRaw.length > 0) {
            txt += `\n🔗 *Kata Majemuk (${compoundsRaw.length}):*\n`
            // Tampilkan max 5 agar tidak spam
            compoundsRaw.slice(0, 5).forEach(c => {
                // Tambahkan kembali '--' yang hilang saat split
                let clean = cleanText('<b>--' + c)
                // Ambil kata pertamanya saja untuk ringkas (opsional, tapi full text lebih informatif)
                // Kita ambil satu baris pertama jika panjang
                let firstLine = clean.split('\n')[0]
                txt += `${firstLine}\n`
            })
            if (compoundsRaw.length > 5) txt += `_...dan ${compoundsRaw.length - 5} lainnya._\n`
        }

        // 5. Kata Turunan (jika ada)
        if (derivedBlocks.length > 0) {
            let derivedWords = []
            derivedBlocks.forEach(block => {
                // Ekstrak kata di dalam <b>...</b>
                let match = block.match(/<b>(.*?)<\/b>/)
                if (match) {
                    let word = match[1].replace(/&#183;/g, '').trim() // Hapus titik pemenggalan
                    derivedWords.push(word)
                }
            })
            
            if (derivedWords.length > 0) {
                txt += `\n🔠 *Kata Turunan:*\n${derivedWords.join(', ')}\n`
            }
        }

        await m.reply(txt)
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mengakses KBBI.')
    }
}

// Fungsi pembersih HTML tag
function cleanText(html) {
    if (!html) return ''
    let text = html
        .replace(/<br\s*\/?>/gi, '\n') // br to newline
        .replace(/<b>(\d+)<\/b>/g, '\n$1. ') // bold numbers to list
        .replace(/<em>(.*?)<\/em>/g, ' _($1)_ ') // italic type info (n, v, etc)
        .replace(/<b>(.*?)<\/b>/g, '*$1*') // bold words
        .replace(/&#183;/g, '') // remove middle dots
        .replace(/&#150;/g, '-') // dash
        .replace(/<[^>]*>/g, '') // remove other tags
    
    // Rapikan spasi berlebih
    return text.split('\n').map(l => l.trim()).filter(l => l).join('\n')
}

handler.help = ['kbbi <kata>']
handler.tags = ['internet', 'search']
handler.command = ['kbbi', 'kamus', 'arti']
handler.limit = true

export default handler