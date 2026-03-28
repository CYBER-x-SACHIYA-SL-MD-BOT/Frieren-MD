/**
 * @module plugins/internet/wikipedia
 * @description Cari informasi di Wikipedia (NexRay API)
 */

import axios from 'axios'

const tiny = (t) => t.split('').map(c=>{const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};return m[c]||c}).join('')

let handler = async (m, { text, usedPrefix, command, conn }) => {
  text = String(text || '').trim()
  if (!text) return m.reply(`📚 *Contoh:* ${usedPrefix}wikipedia Prabowo`)

  try {
    await conn.sendMessage(m.chat, { react: { text: '📖', key: m.key } })

    const { data } = await axios.get(`https://api.nexray.web.id/search/wikipedia?q=${encodeURIComponent(text)}`)

    if (!data.status || !data.result || data.result.length === 0) {
        throw '⚠️ Artikel tidak ditemukan.'
    }

    const first = data.result[0]
    
    // Bersihkan snippet dari HTML tags jika ada (sederhana)
    const cleanSnippet = first.snippet.replace(/<[^>]*>/g, '')

    let caption = `╭━━━〔 📖 *${tiny('WIKIPEDIA SEARCH')}* 〕━━━┓\n`
    caption += `┃\n`
    caption += `┃ 🏷️ *Judul:* ${first.title}\n`
    caption += `┃ 🆔 *Page ID:* ${first.pageid}\n`
    caption += `┃ 📅 *Update:* ${new Date(first.timestamp).toLocaleDateString()}\n`
    caption += `┃\n`
    caption += `┣━━━〔 📝 *RINGKASAN* 〕\n`
    caption += `┃\n`
    caption += `┃ ${cleanSnippet}\n`
    caption += `┃\n`
    caption += `┃ 🔗 *Baca:* https://en.wikipedia.org/?curid=${first.pageid}\n`
    
    // List artikel lain
    if (data.result.length > 1) {
        caption += `┃\n┣━━━〔 📚 *TERKAIT* 〕\n`
        data.result.slice(1, 6).forEach((item, i) => {
            caption += `┃ ${i+1}. ${item.title}\n`
        })
    }
    
    caption += `┃\n┗━━━━━━━━━━━━━━━━━━━━━━┛`

    await conn.sendMessage(m.chat, {
        text: caption,
        contextInfo: {
            externalAdReply: {
                title: first.title,
                body: 'Wikipedia Encyclopedia',
                thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png',
                sourceUrl: `https://en.wikipedia.org/?curid=${first.pageid}`,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    m.reply('⚠️ Gagal mengambil data Wikipedia.')
  }
}

handler.help = ['wikipedia <query>']
handler.tags = ['internet']
handler.command = ['wikipedia', 'wiki']
handler.prefix = true
handler.limit = true

export default handler