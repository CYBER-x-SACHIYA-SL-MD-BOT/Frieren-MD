/**
 * @module plugins/internet/jagatplay
 * @description Scrape Gaming News from JagatPlay
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

let handler = async (m, { conn, text, usedPrefix, command }) => {
   await conn.sendMessage(m.chat, { react: { text: '🎮', key: m.key } })

   try {
      let url = 'https://jagatplay.com/'
      if (text) {
         url = `https://jagatplay.com/?s=${encodeURIComponent(text)}`
      }

      const { data } = await axios.get(url)
      const $ = cheerio.load(data)
      const articles = []

      $('.art').each((i, el) => {
         const title = $(el).find('.art__title').text().trim()
         const link = $(el).find('a').attr('href')
         const img = $(el).find('img').attr('src')
         const date = $(el).find('.art__date').text().trim()
         const excerpt = $(el).find('.art__excerpt').text().trim()

         if (title && link) {
            articles.push({
               title,
               link,
               img,
               date,
               excerpt
            })
         }
      })

      if (articles.length === 0) {
         return m.reply('❌ Tidak ada berita ditemukan.')
      }

      // Send the first (latest) article with image
      const first = articles[0]
      let caption = `🎮 *JAGAT PLAY NEWS* 🎮

`
      caption += `📰 *${first.title}*
`
      caption += `📅 ${first.date}
`
      caption += `📝 ${first.excerpt}
`
      caption += `🔗 ${first.link}

`

      caption += `*Berita Lainnya:*
`
      articles.slice(1, 6).forEach((art, i) => {
         caption += `${i + 1}. *${art.title}*
🔗 ${art.link}

`
      })

      await conn.sendMessage(m.chat, {
         image: { url: first.img },
         caption
      }, { quoted: m })

   } catch (e) {
      console.error(e)
      m.reply('❌ Gagal mengambil berita JagatPlay.')
   }
}

handler.help = ['jagatplay [query]']
handler.tags = ['internet', '']
handler.command = ['jagatplay', 'gamenews']
handler.limit = true
handler.prefix = true

export default handler