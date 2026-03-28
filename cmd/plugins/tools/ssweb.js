/**
 * @module plugins/tools/ssweb
 * @description Screenshot website using HarzRestAPI
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const frames = ['iphone', 'desktop', 'macbook']
    let args = text?.split(/\s+/) || []
    let frame = 'desktop'
    let url = ''

    if (args.length > 0) {
        if (frames.includes(args[0].toLowerCase())) {
            frame = args[0].toLowerCase()
            url = args.slice(1).join(' ').trim()
        } else {
            url = args.join(' ').trim()
        }
    }

    if (!url) return m.reply(`📸 *SCREENSHOT WEB*\n\nAmbil tangkapan layar website.\n🎮 Format: ${usedPrefix + command} <frame> <url>\n💡 Contoh: ${usedPrefix + command} iphone https://google.com\n🌟 Pilihan Frame: ${frames.join(', ')}`)

    if (!url.startsWith('http')) url = 'https://' + url

    await m.react('📸')

    try {
        const ssUrl = `https://api.harzrestapi.web.id/api/screenshot?url=${encodeURIComponent(url)}&frame=${frame}`
        
        await conn.sendMessage(m.chat, { 
            image: { url: ssUrl }, 
            caption: `📸 *SCREENSHOT RESULT*\n\n🌐 *URL:* ${url}\n📱 *Frame:* ${frame.charAt(0).toUpperCase() + frame.slice(1)}\n\n> _Powered by HarzRestAPI_`
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        console.error('SSWeb Error:', e)
        m.reply("❌ Gagal mengambil screenshot. Pastikan URL valid atau coba lagi nanti.")
        await m.react('❌')
    }
}

handler.help = ['ssweb <url>']
handler.tags = ['tools']
handler.command = ['ssweb', 'ss', 'screenshot']
handler.prefix = true

export default handler
