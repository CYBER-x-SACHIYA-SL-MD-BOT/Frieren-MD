/**
 * @module plugins/owner/rpg_admin
 * @description Admin Tools untuk RPG (Set Harga Manual)
 */

import { db, saveDb } from '#system/db/data.js'
import { Inventory } from '#system/inventory.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const itemsPath = path.join(__dirname, '../../../system/db/rpg_items.json')

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // --- CEK HARGA ---
    if (command === 'rpgprice' || command === 'cekprice') {
        const item = args[0]
        if (!item) return m.reply('Masukkan nama item (kode).')
        
        const config = Inventory.getCfg()
        const data = config.items[item]
        
        if (!data) return m.reply('❌ Item tidak ditemukan.')
        
        m.reply(`📦 *${data.name}*\n💰 Beli: ${data.price}\n🤝 Jual: ${data.sell}\n🪙 Currency: ${data.currency || 'money'}`)
    }

    // --- SET HARGA ---
    if (command === 'setprice' || command === 'aturharga') {
        const [item, price, sell] = args
        if (!item || !price) return m.reply(`Format: ${usedPrefix}setprice <item> <harga_beli> [harga_jual]`)
        
        const raw = JSON.parse(fs.readFileSync(itemsPath))
        
        if (!raw.items[item]) return m.reply('❌ Item tidak ada di database asli.')
        
        raw.items[item].price = parseInt(price)
        if (sell) raw.items[item].sell = parseInt(sell)
        
        fs.writeFileSync(itemsPath, JSON.stringify(raw, null, 2))
        m.reply(`✅ Harga ${item} berhasil diupdate!\nBeli: ${price}\nJual: ${sell || raw.items[item].sell}`)
    }
}

handler.help = ['setprice <item> <beli> <jual>', 'rpgprice <item>']
handler.tags = ['owner', 'rpg']
handler.command = ['setprice', 'aturharga', 'rpgprice', 'cekprice']
handler.owner = true
handler.prefix = true

export default handler
