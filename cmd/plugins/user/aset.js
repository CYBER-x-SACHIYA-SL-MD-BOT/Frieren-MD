/**
 * @module plugins/user/aset
 * @description Laporan Kekayaan (Manual Style)
 */

import { Inventory } from '#system/inventory.js'

let handler = async (m, { conn }) => {
    const user = Inventory.getUser(m.sender)
    if (!user) return m.reply('❌ Akun belum terdaftar.')
    
    // --- FONT HELPER ---
    const tiny = (t) => t.split('').map(c=>{
        const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};
        return m[c]||c
    }).join('')

    const cfg = Inventory.getCfg()
    const items = cfg.items
    
    // Scan both inventory and assets for safety
    const allItems = { ...(user.inventory || {}), ...(user.assets || {}) }
    
    const wealthCategories = {
        '🏠 PROPERTI': ['rumah', 'apartemen', 'villa', 'island'],
        '🏎️ KENDARAAN': ['mobil_sport', 'jet', 'yacht', 'mobil', 'motor'],
        '💎 MEWAH': ['rolex', 'emas'],
        '📱 TECH': ['iphone', 'laptop']
    }

    let txt = `╭───「 *${tiny('WEALTH REPORT')}* 」───\n`
    txt += `│\n`
    txt += `│ 👤 Nasabah: ${m.pushName || 'User'}\n`
    txt += `│\n`

    let totalVal = 0
    let foundAny = false

    for (const [cat, list] of Object.entries(wealthCategories)) {
        let catText = ''
        list.forEach(id => {
            const qty = allItems[id] || 0
            if (qty > 0) {
                const itemData = items[id] || cfg.recipes[id] || { name: id, icon: '📦', price: 0 }
                catText += `│  ${itemData.icon} ${itemData.name}: *${qty}*\n`
                totalVal += qty * (itemData.price || 0)
                foundAny = true
            }
        })
        if (catText) {
            const catName = cat.split(' ')[1] || cat
            txt += `│ 💠 *${tiny(catName)}*\n${catText}│\n`
        }
    }

    if (!foundAny) {
        txt += `│ (Anda belum memiliki aset berharga)\n│\n`
    }

    txt += `╰────────────────────\n`
    txt += `💰 *ESTIMASI NILAI:* ${Inventory.toRupiah(totalVal)}`

    await conn.sendMessage(m.chat, { 
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: "LUXURY ASSETS",
                body: `Total Net Worth: ${Inventory.toRupiah(totalVal)}`,
                mediaType: 1,
                thumbnailUrl: 'https://c.termai.cc/i130/vuJ7wT.jpg',
                sourceUrl: '',
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.help = ['aset']
handler.tags = ['Economy Menu']
handler.command = ['aset', 'assets']
handler.prefix = true

export default handler