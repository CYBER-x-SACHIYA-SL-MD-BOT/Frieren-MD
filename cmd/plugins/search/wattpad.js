/**
 * @module plugins/internet/wattpad
 * @description Cari cerita di Wattpad
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

const tiny = (t) => t.split('').map(c=>{const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};return m[c]||c}).join('')

async function WattPad(judul) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get('https://www.wattpad.com/search/' + encodeURIComponent(judul), {
        headers: {
          cookie: 'wp_id=d92aecaa-7822-4f56-b189-f8c4cc32825c; sn__time=j%3Anull; fs__exp=1; adMetrics=0;',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0'
        }
      })

      const $ = cheerio.load(data)
      const limk = 'https://www.wattpad.com'
      const _data = []

      $('.story-card-container > ul.list-group.new-list-group > li.list-group-item').each(function () {
        let link = limk + $(this).find('a').attr('href')
        let judul = $(this).find('a > div > div.story-info > div.title').text().trim()
        let img = $(this).find('a > div > div.cover > img').attr('src')
        let desc = $(this).find('a > div > div.story-info > .description').text().replace(/\s+/g, ' ')
        let _doto = []
        $(this).find('a > div > div.story-info > .new-story-stats > .stats-item').each((_, el) => {
          _doto.push($(el).find('.icon-container > .tool-tip > .sr-only').text())
        })
        
        if (judul && link) {
            _data.push({
              title: judul,
              thumb: img,
              desc: desc,
              reads: _doto[0] || '0',
              vote: _doto[1] || '0',
              chapter: _doto[2] || '0',
              link: link,
            })
        }
      })

      resolve(_data)
    } catch (err) {
      reject('❌ Gagal mengambil data dari Wattpad.')
    }
  })
}

let handler = async (m, { text, conn, usedPrefix, command }) => {
  if (!text) return m.reply(`📖 Cari cerita apa?
Contoh: ${usedPrefix + command} Naruto`)

  await conn.sendMessage(m.chat, { react: { text: '📖', key: m.key } })

  try {
    const result = await WattPad(text)
    if (!result.length) return m.reply('❌ Cerita tidak ditemukan.')

    // Format Output
    let caption = `╭━━━〔 📖 *${tiny('WATTPAD SEARCH')}* 〕━━━┓
`
    caption += `┃ 🔎 Query: ${text.toUpperCase()}
`
    caption += `┃ 📊 Total: ${result.length} Cerita
`
    caption += `┣━━━━━━━━━━━━━━━━━━━
`

    result.slice(0, 5).forEach((v, i) => {
        caption += `┃
`
        caption += `┃ *${i+1}. ${v.title}*
`
        caption += `┃ 📝 ${v.desc.substring(0, 100)}...
`
        caption += `┃ 👁️ ${v.reads}  ❤️ ${v.vote}  📚 ${v.chapter}
`
        caption += `┃ 🔗 ${v.link}
`
    })
    
    caption += `┃
┗━━━━━━━━━━━━━━━━━━━━━━┛`

    await conn.sendMessage(m.chat, {
      image: { url: result[0].thumb || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg' },
      caption: caption
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply(typeof e === 'string' ? e : '❌ Terjadi kesalahan.')
  }
}

handler.help = ['wattpad <judul>']
handler.tags = ['internet']
handler.command = ['wattpad']
handler.prefix = true
handler.limit = true

export default handler