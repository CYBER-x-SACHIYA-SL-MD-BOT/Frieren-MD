/**
 * @module plugins/internet/dongeng
 * @description Cari dan baca dongeng dari 1000dongeng.com
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

const tiny = (t) => t.split('').map(c=>{const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};return m[c]||c}).join('')

const dongeng = {
  search: async (query) => {
    try {
        const url = `https://www.1000dongeng.com/search?q=${encodeURIComponent(query)}`
        const { data } = await axios.get(url)
        const $ = cheerio.load(data)
        const posts = []

        $('.date-outer .date-posts .post-outer').each((index, element) => {
            const title = $(element).find('.post-title a').text().trim()
            const link = $(element).find('.post-title a').attr('href')
            const author = $(element).find('.post-author .fn').text().trim()
            const date = $(element).find('.post-timestamp .published').text().trim()
            
            // Fix Image
            let image = $(element).find('.post-thumbnail amp-img').attr('src') || 
                        $(element).find('.post-thumbnail img').attr('src')
            
            if (image && !image.startsWith('http')) image = 'https:' + image

            if (title && link) {
                posts.push({ title, link, author, date, image })
            }
        })

        return posts
    } catch (error) {
        console.error('Error searching dongeng:', error)
        return []
    }
  },
  
  getDongeng: async (url) => {
    try {
        const { data } = await axios.get(url)
        const $ = cheerio.load(data)
        
        const title = $('h1.post-title.entry-title').text().trim()
        const author = $('.post-author .fn').text().trim()
        
        // Clean Content
        let storyContent = ''
        $('.post-body').find('div, p, span').each((i, el) => {
            const text = $(el).text().trim()
            if (text) storyContent += text + '\n\n'
        })

        return { title, author, storyContent: storyContent.trim() }
    } catch (error) {
        console.error('Error reading dongeng:', error)
        return null
    }
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`📚 Cari dongeng apa?\nContoh: ${usedPrefix + command} kancil`)

    try {
        await conn.sendMessage(m.chat, { react: { text: '📖', key: m.key } })
        
        // 1. SEARCH
        const results = await dongeng.search(text)
        if (!results.length) return m.reply('Dongeng tidak ditemukan.')

        // Ambil hasil pertama (paling relevan)
        const target = results[0]
        
        // 2. GET CONTENT
        const details = await dongeng.getDongeng(target.link)
        if (!details) return m.reply('Gagal mengambil isi dongeng.')

        // 3. SEND RESULT
        const caption = `╭━━━〔 📖 *${tiny('DONGENG ONLINE')}* 〕━━━┓
┃
┃ 📚 *Judul:* ${details.title}
┃ ✍️ *Penulis:* ${details.author || 'Admin'}
┃ 📅 *Tanggal:* ${target.date}
┃
┣━━━〔 📜 *CERITA* 〕
┃
${details.storyContent.substring(0, 3000)} ${details.storyContent.length > 3000 ? '...' : ''}
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛`

        await conn.sendMessage(m.chat, {
            image: { url: target.image || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg' },
            caption: caption
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('Terjadi kesalahan pada sistem dongeng.')
    }
}

handler.help = ['dongeng <judul>']
handler.tags = ['internet']
handler.command = ['dongeng']
handler.limit = true

export default handler