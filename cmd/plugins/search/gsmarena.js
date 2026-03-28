/**
 * @module plugins/internet/gsmarena
 * @description Scrape Smartphone Specs from GSMArena
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`📱 Cari HP apa?\nContoh: ${usedPrefix + command} iphone 15`)

    await conn.sendMessage(m.chat, { react: { text: '📱', key: m.key } })

    try {
        // 1. Search
        const searchUrl = `https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(text)}`
        const { data: searchData } = await axios.get(searchUrl)
        const $ = cheerio.load(searchData)

        // Get first result
        const firstResult = $('.makers ul li').first()
        const relativeLink = firstResult.find('a').attr('href')
        const name = firstResult.find('span').html()?.replace(/<br>/g, ' ') || firstResult.text()
        const img = firstResult.find('img').attr('src')

        if (!relativeLink) return m.reply('❌ HP tidak ditemukan.')

        const link = `https://www.gsmarena.com/${relativeLink}`

        await m.reply(`🔍 Menemukan: *${name}*\n⏳ Mengambil spesifikasi...`)

        // 2. Scrape Detail
        const { data: detailData } = await axios.get(link)
        const $$ = cheerio.load(detailData)

        let specs = {}
        let currentCategory = ''

        $$('#specs-list table tr').each((i, el) => {
            const th = $$(el).find('th')
            if (th.length > 0) currentCategory = th.text().trim()
            
            const ttl = $$(el).find('.ttl a').text().trim() || $$(el).find('.ttl').text().trim()
            const nfo = $$(el).find('.nfo').text().trim().replace(/\n/g, ', ')

            if (currentCategory && ttl && nfo) {
                if (!specs[currentCategory]) specs[currentCategory] = []
                specs[currentCategory].push(`${ttl}: ${nfo}`)
            }
        })

        // Formatting Output
        let caption = `📱 *GSMARENA SPECS* 📱\n\n`
        caption += `🏷️ *Nama:* ${name}\n`
        caption += `🔗 *Link:* ${link}\n\n`

        const keyCategories = ['Launch', 'Body', 'Display', 'Platform', 'Memory', 'Main Camera', 'Selfie camera', 'Battery', 'Features']
        
        keyCategories.forEach(cat => {
            if (specs[cat]) {
                caption += `*${cat.toUpperCase()}*\n`
                caption += specs[cat].map(s => `- ${s}`).join('\n')
                caption += '\n\n'
            }
        })

        await conn.sendMessage(m.chat, { 
            image: { url: img }, 
            caption 
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mengambil data GSMArena.')
    }
}

handler.help = ['gsmarena <hp>', 'spek <hp>']
handler.tags = ['internet', 'search']
handler.command = ['gsmarena', 'spek', 'spesifikasi']
handler.limit = true

export default handler