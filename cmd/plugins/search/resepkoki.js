/**
 * @module plugins/internet/resepkoki
 * @description Scrape Resep Masakan from ResepKoki.id
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`🍳 Cari resep apa?\nContoh: ${usedPrefix + command} nasi goreng`)

    await conn.sendMessage(m.chat, { react: { text: '🍳', key: m.key } })

    try {
        // 1. Search
        const searchUrl = `https://resepkoki.id/?s=${encodeURIComponent(text)}`
        const { data: searchData } = await axios.get(searchUrl)
        const $ = cheerio.load(searchData)

        // Get first result
        const firstResult = $('.archive-posts .masonry-item').first()
        const link = firstResult.find('.entry-title a').attr('href')
        const title = firstResult.find('.entry-title a').text().trim()

        if (!link) return m.reply('❌ Resep tidak ditemukan.')

        await m.reply(`🔍 Menemukan: *${title}*\n⏳ Mengambil detail resep...`)

        // 2. Scrape Detail
        const { data: detailData } = await axios.get(link)
        const $$ = cheerio.load(detailData)

        // Meta Info
        const time = $$('.single-meta-cooking-time span').text().trim() || '-'
        const servings = $$('.single-meta-serves span').text().replace('Hasil:', '').trim() || '-'
        const difficulty = $$('.single-meta-difficulty span').text().replace('Tingkat kesulitan:', '').trim() || '-'
        const image = $$('.single-main-media img').attr('src')

        // Ingredients
        let ingredients = []
        $$('.ingredients-table tr').each((i, el) => {
            const heading = $$(el).find('.ingredient-heading').text().trim()
            if (heading) {
                ingredients.push(`\n*${heading}*`)
            } else {
                const name = $$(el).find('.ingredient-name').text().trim()
                const amount = $$(el).find('.ingredient-amount').text().trim()
                if (name) ingredients.push(`- ${name} ${amount ? `(${amount})` : ''}`)
            }
        })

        // Steps
        let steps = []
        $$('.single-steps table.recipe-steps-table tr.single-step').each((i, el) => {
            const desc = $$(el).find('.single-step-description-i p').text().trim()
            if (desc) steps.push(`${i + 1}. ${desc}`)
        })

        let caption = `🍳 *RESEP KOKI* 🍳\n\n`
        caption += `🍲 *Judul:* ${title}\n`
        caption += `⏱️ *Waktu:* ${time}\n`
        caption += `🍽️ *Porsi:* ${servings}\n`
        caption += `📊 *Kesulitan:* ${difficulty}\n`
        caption += `🔗 *Link:* ${link}\n\n`
        
        caption += `🥬 *Bahan-bahan:*\n${ingredients.join('\n')}\n\n`
        caption += `👨‍🍳 *Cara Membuat:*\n${steps.join('\n\n')}`

        await conn.sendMessage(m.chat, { 
            image: { url: image }, 
            caption 
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mengambil resep.')
    }
}

handler.help = ['resep <masakan>']
handler.tags = ['internet', 'search']
handler.command = ['resep', 'resepkoki', 'masak']
handler.limit = true

export default handler