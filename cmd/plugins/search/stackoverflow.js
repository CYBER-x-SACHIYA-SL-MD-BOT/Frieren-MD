import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Mencari pertanyaan di StackOverflow.
Contoh: *${usedPrefix + command}* javascript array reduce`)

    try {
        await m.reply('_Searching StackOverflow..._')
        
        const params = {
            order: 'desc',
            sort: 'relevance',
            site: 'stackoverflow',
            intitle: text,
            pagesize: 5 // Limit to top 5 results
        }
        
        // Use the official public API
        // https://api.stackexchange.com/docs/search
        const { data } = await axios.get('https://api.stackexchange.com/2.3/search', { params })

        if (!data.items || data.items.length === 0) {
            return m.reply('❌ Tidak ditemukan hasil di StackOverflow.')
        }

        let txt = `💻 *STACKOVERFLOW SEARCH* 💻

`

        for (let item of data.items) {
            // Decode HTML entities in title (e.g. &quot; -> ")
            const title = item.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
            const date = new Date(item.creation_date * 1000).toLocaleDateString()
            
            txt += `🔹 *${title}*
`
            txt += `   👀 Views: ${item.view_count} | ✅ Answers: ${item.answer_count}
`
            txt += `   🏷️ Tags: ${item.tags.join(', ')}
`
            txt += `   🔗 Link: ${item.link}

`
        }

        txt += `_Powered by Stack Exchange API_`

        await m.reply(txt)

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mencari di StackOverflow.')
    }
}

handler.help = ['stackoverflow <query>', 'stack <query>']
handler.tags = ['search', 'tools']
handler.command =  ['stack', 'stackoverflow']


export default handler