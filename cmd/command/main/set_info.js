import { saveDb } from '../../../system/db/data.js'
import { Inventory } from '../../../system/inventory.js'

export default function setInfo(ev) {
    // --- SET INSTAGRAM ---
    ev.on({
        name: 'setig',
        cmd: ['setig', 'setinstagram'],
        tags: 'Main Menu',
        desc: 'Set username Instagram di profil',
        run: async (xp, m, { args }) => {
            const user = Inventory.getUser(m.sender)
            if (!user) return m.reply('Daftar dulu.')
            
            if (!args[0]) return m.reply('Masukkan username Instagram Anda.\nContoh: .setig username_67')
            user.instagram = args[0].replace('@', '')
            saveDb()
            m.reply(`✅ Instagram berhasil diatur ke: @${user.instagram}`)
        }
    })

    // --- SET TIKTOK ---
    ev.on({
        name: 'settiktok',
        cmd: ['settiktok', 'settt'],
        tags: 'Main Menu',
        desc: 'Set username TikTok di profil',
        run: async (xp, m, { args }) => {
            const user = Inventory.getUser(m.sender)
            if (!user) return m.reply('Daftar dulu.')
            
            if (!args[0]) return m.reply('Masukkan username TikTok Anda.\nContoh: .settiktok username_67')
            user.tiktok = args[0].replace('@', '')
            saveDb()
            m.reply(`✅ TikTok berhasil diatur ke: @${user.tiktok}`)
        }
    })

    // --- SET HOBBY ---
    ev.on({
        name: 'sethobby',
        cmd: ['sethobby', 'sethobi'],
        tags: 'Main Menu',
        desc: 'Set hobi di profil',
        run: async (xp, m, { args }) => {
            const user = Inventory.getUser(m.sender)
            if (!user) return m.reply('Daftar dulu.')
            
            if (!args[0]) return m.reply('Masukkan hobi Anda.\nContoh: .sethobby Coding')
            user.hobby = args.join(' ')
            saveDb()
            m.reply(`✅ Hobi berhasil diatur ke: ${user.hobby}`)
        }
    })

    // --- SET MENU ---
    ev.on({
        name: 'set',
        cmd: ['set'],
        tags: 'Main Menu',
        desc: 'Menampilkan daftar pengaturan profil',
        run: async (xp, m) => {
            const menu = `
🛠️ *PENGATURAN PROFIL*
━━━━━━━━━━━━━━━━━━

Gunakan perintah di bawah untuk mengatur informasi profil Anda:

📝 *IDENTITAS*
├ .setname <nama>
├ .setage <umur>
└ .setgender <pria/wanita>

📱 *SOCIAL MEDIA*
├ .setig <username>
└ .settiktok <username>

🎨 *PERSONAL*
└ .sethobby <hobi>

🚀 *Contoh:*
.setig gans.js
.sethobby Turu

💡 *Tips:* Data ini akan muncul di perintah *.profile*
`.trim()
            m.reply(menu)
        }
    })
}
