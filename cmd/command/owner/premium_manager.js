import { Inventory } from '../../../system/inventory.js'

export default function(ev) {
    // --- CEK PREM ---
    ev.on({
        name: 'cekprem',
        cmd: ['cekprem', 'cekpremium', 'premium'],
        tags: 'Main Menu',
        desc: 'Cek status premium & benefit',
        run: async (xp, m, { isCreator }) => {
            const user = Inventory.getUser(m.sender)
            if (!user) return m.reply('❌ Daftar dulu.')

            const isPrem = user.premium || isCreator || m.isOwner
            const status = isPrem ? '💎 PREMIUM' : '🆓 FREE USER'
            
            let timeTxt = ''
            if (isPrem) {
                if (isCreator || m.isOwner) {
                    timeTxt = '\n⏳ *Masa Aktif:* UNLIMITED (Owner)'
                } else if (user.premiumTime > 0) {
                    const remaining = user.premiumTime - Date.now()
                    if (remaining > 0) {
                        const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
                        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
                        const date = new Date(user.premiumTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                        timeTxt = `\n⏳ *Masa Aktif:* ${days} Hari ${hours} Jam\n📅 *Expired:* ${date}`
                    } else {
                        timeTxt = '\n⏳ *Masa Aktif:* EXPIRED'
                    }
                } else {
                    timeTxt = '\n⏳ *Masa Aktif:* PERMANEN'
                }
            }

            // Info Benefit
            let txt = `🌟 *STATUS PREMIUM* 🌟
━━━━━━━━━━━━━━━━━━
👤 *User:* ${m.pushName}
🏷️ *Status:* ${status}${timeTxt}

💎 *Keuntungan Premium:*
1. ⚡ *Unlimited Limit* (Batas harian sangat besar)
2. 🔓 *Akses Fitur Khusus* (Premium Only)
3. 🔰 *Prioritas Bot* (Respon lebih stabil)
4. 🤖 *Smart AI Unlimited* (Tanpa cooldown)

${isPrem ? '✅ Kamu adalah user Premium!' : '❌ Kamu bukan user Premium. Hubungi owner untuk upgrade.'}`

            m.reply(txt)
        }
    })

    // --- LIST PREM (OWNER) ---
    ev.on({
        name: 'listprem',
        cmd: ['listprem', 'premlist'],
        tags: 'Owner Menu',
        desc: 'List user premium',
        run: async (xp, m, { isCreator }) => {
            const ownerNumber = global.ownerNumber ? global.ownerNumber[0] : '6282148570591'
            const isOwner = m.sender.includes(ownerNumber) || m.key.fromMe || isCreator
            
            if (!isOwner) return m.reply('❌ Fitur khusus Owner.')

            const users = Inventory.getCfg().users || {} // Access raw DB users if possible, or use db()
            // Using direct db import for listing
            const { db } = await import('../../../system/db/data.js')
            
            const allUsers = db().key || {}
            let premUsers = []

            for (let jid in allUsers) {
                if (allUsers[jid].premium) {
                    premUsers.push({
                        jid: allUsers[jid].jid,
                        name: allUsers[jid].name || 'User'
                    })
                }
            }

            if (premUsers.length === 0) return m.reply('❌ Belum ada user premium.')

            let txt = `💎 *DAFTAR USER PREMIUM* (${premUsers.length})\n\n`
            premUsers.forEach((u, i) => {
                txt += `${i+1}. @${u.jid.split('@')[0]} (${u.name})\n`
            })

            m.reply(txt, { mentions: premUsers.map(u => u.jid) })
        }
    })
}