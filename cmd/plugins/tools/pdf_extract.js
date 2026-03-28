/**
 * @module plugins/tools/pdf_extract
 * @description Extract Text from PDF using OCR Space API
 */

import uploadImage from '#lib/uploadImage.js'
import axios from 'axios'

let handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!mime || !mime.includes('pdf')) return m.reply(`❌ Reply file PDF dengan caption *${usedPrefix + command}*`)

    await m.react('⏳')
    
    try {
        let media = await q.download()
        let url = await uploadImage(media)
        
        if (!url) return m.reply('❌ Gagal upload file.')

        const { data } = await axios.get(`https://api.ocr.space/parse/imageurl?apikey=helloworld&url=${url}&language=eng`)
        
        if (data.IsErroredOnProcessing) {
            return m.reply(`❌ Gagal membaca PDF: ${data.ErrorMessage}`)
        }
        
        if (!data.ParsedResults || data.ParsedResults.length === 0) {
            return m.reply('❌ Tidak ada teks yang terbaca (Mungkin PDF berisi gambar tanpa teks).')
        }

        const text = data.ParsedResults.map(r => r.ParsedText).join('\n\n--- PAGE BREAK ---\n\n')
        
        if (!text.trim()) return m.reply('❌ Teks kosong.')

        await m.reply(`📄 *PDF TEXT RESULT*\n\n${text.trim()}`)

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan sistem.')
    }
}

handler.help = ['pdftotext']
handler.tags = ['tools']
handler.command = ['pdftotext', 'pdf2text', 'readpdf']
handler.limit = true

export default handler