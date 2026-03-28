/**
 * @module plugins/owner/listapi
 * @description List all configured APIs (Real-time reload)
 */

import path from 'path'

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        const apisModule = await import(`#system/apis.js?update=${Date.now()}`)
        const apis = apisModule.listUrl()
        const apiKeys = Object.keys(apis).sort()
        
        let caption = `◢◤ *FRIEREN_MD API_MANAGER* ◥◣\n`
        caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
        
        apiKeys.forEach((key, index) => {
            const num = (index + 1).toString().padStart(2, '0')
            caption += `〔 *${num}* 〕*NAME:* ${key.toUpperCase()}\n`
            caption += `        *URL:* ${apis[key].baseURL.replace('https://', '').replace('http://', '')}\n\n`
        })
        
        caption += `━━━━━━━━━━━━━━━━━━━━━━\n`
        caption += `*TOTAL:* ${apiKeys.length} APIs DETECTED\n`
        
        
        m.reply(caption)
    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal memuat daftar API: ' + e.message)
    }
}

handler.help = ['listapi']
handler.tags = ['owner']
handler.command = ['listapi', 'apis']
handler.owner = true

export default handler
