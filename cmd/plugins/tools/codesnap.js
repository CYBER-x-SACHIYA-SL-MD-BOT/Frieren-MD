/**
 * @module plugins/tools/codesnap
 * @description Generate CodeSnap image from text via FAA API
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Kirim teks code atau reply pesan code.\nContoh: *${usedPrefix + command}* console.log("Hello World")`)

    await m.reply('🎨 _Generating CodeSnap..._')

    try {
        const url = `https://api-faa.my.id/faa/codesnap?text=${encodeURIComponent(text)}`
        
        await conn.sendMessage(m.chat, { 
            image: { url: url }, 
            caption: '🎨 *CodeSnap Generator*' 
        }, { quoted: m })

    } catch (e) {
        console.error('CodeSnap Error:', e)
        m.reply('❌ Gagal membuat gambar code.')
    }
}

handler.help = ['codesnap <code>', 'carbon <code>']
handler.tags = ['tools']
handler.command = ['codesnap', 'carbon']

export default handler