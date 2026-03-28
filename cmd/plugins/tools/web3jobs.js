/**
 * @module plugins/tools/web3jobs
 * @description Search Web3 Jobs via Denay API
 */

import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    await m.reply('💼 _Searching Web3 Jobs..._')

    try {
        let url = 'https://api.denayrestapi.xyz/api/v1/search/web3jobs'
        
        const { data } = await axios.get(url)

        if (data.status !== 200 || !data.result || data.result.length === 0) {
            return m.reply('❌ Lowongan pekerjaan tidak ditemukan.')
        }

        let jobs = data.result
        if (text) {
            const q = text.toLowerCase()
            jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.tags && j.tags.some(t => t.includes(q))))
        }

        if (jobs.length === 0) return m.reply(`❌ Tidak ada job dengan kata kunci "${text}".`)

        jobs = jobs.slice(0, 10)

        let txt = `💼 *WEB3 JOBS*\n`
        if (text) txt += `🔎 Query: ${text}\n`
        txt += `━━━━━━━━━━━━━━━━━━━\n\n`

        for (let j of jobs) {
            txt += `📌 *${j.title}*\n`
            txt += `🏢 ${j.company} | 📍 ${j.location}\n`
            txt += `📅 ${j.date}\n`
            txt += `🔗 ${j.apply_url}\n`
            txt += `🏷️ ${j.tags ? j.tags.join(', ') : '-'}\n\n`
        }

        txt += `_Showing ${jobs.length} of ${data.returned} jobs_`

        await m.reply(txt)

    } catch (e) {
        console.error('Web3 Jobs Error:', e)
        m.reply('❌ Terjadi kesalahan saat mencari pekerjaan.')
    }
}

handler.help = ['web3jobs [query]']
handler.tags = ['tools', 'internet']
handler.command = ['web3jobs', 'jobsearch', 'lokerweb3']
handler.prefix = true

export default handler