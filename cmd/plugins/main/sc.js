/**
 * @module plugins/main/sc
 * @description Source Code Information
 */

let handler = async (m, { conn }) => {
    const ownerNum = global.ownerNumber[0].split('@')[0]
    
    const txt = `📂 *SCRIPT BOT INFO* 📂

💰 *Harga:* Rp 40.000
✨ *Fitur:* Full Features (RPG, AI, Game, Tools)
🔄 *Update:* No Updates

Minat? Hubungi Owner:
wa.me/${ownerNum}

_Note: Harga dapat berubah sewaktu-waktu. Dapatkan sekarang juga!_`

    await conn.sendMessage(m.chat, { 
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: "BUY SOURCE CODE",
                body: "Rp 40.000 - Full Features",
                thumbnailUrl: "https://telegra.ph/file/241d7180c0fa827916b44.jpg",
                sourceUrl: `https://wa.me/${ownerNum}`,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.help = ['sc', 'sourcecode']
handler.tags = ['main']
handler.command = ['sc', 'script', 'sourcecode']

export default handler