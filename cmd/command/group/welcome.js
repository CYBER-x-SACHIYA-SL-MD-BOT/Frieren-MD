import { getGc, saveGc } from '../../../system/db/data.js'
import { groupCache, getMetadata } from '../../../system/function.js'

export default function(ev) {
    // --- WELCOME/LEAVE TOGGLE ---
    ev.on({
        name: 'group_welcome_toggle',
        cmd: ['welcome', 'leave'],
        tags: 'Group Menu',
        desc: 'Aktifkan/Matikan pesan sambutan atau perpisahan',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command }) => {
            const gcData = getGc(chat.id)
            const opt = args[0]?.toLowerCase()
            
            gcData.filter = gcData.filter || {}
            gcData.filter.welcome = gcData.filter.welcome || { welcomeGc: false, welcomeText: '' }
            gcData.filter.left = gcData.filter.left || { leftGc: false, leftText: '' }

            if (!opt || !['on', 'off'].includes(opt)) {
                const status = gcData.filter.welcome.welcomeGc ? 'ON ✅' : 'OFF ⛔'
                return m.reply(`📢 *WELCOME & LEAVE* saat ini: ${status}\n\nCara pakai: .${command} on/off`)
            }

            const isOn = opt === 'on'
            gcData.filter.welcome.welcomeGc = isOn
            gcData.filter.left.leftGc = isOn
            saveGc()
            
            m.reply(`✅ Fitur *Welcome & Leave* berhasil di-${isOn ? 'aktifkan' : 'matikan'}.`)
        }
    })

    // --- SET MESSAGE ---
    ev.on({
        name: 'group_welcome_msg_set',
        cmd: ['setwelcome', 'setleave'],
        tags: 'Group Menu',
        desc: 'Atur isi pesan sambutan atau perpisahan',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { args, chat, command }) => {
            const gcData = getGc(chat.id)
            const isWelcome = command === 'setwelcome'
            const text = args.join(' ')

            if (!text) return m.reply(`❌ Masukkan teks pesan!\n\n*Variabel Tersedia:*
@user : Tag member
@subject : Nama Grup
@desc : Deskripsi Grup
@member : Jumlah Member
@date : Tanggal
@time : Waktu

*Contoh:*
.${command} Selamat datang @user di @subject!`)

            gcData.filter = gcData.filter || {}

            if (isWelcome) {
                gcData.filter.welcome = gcData.filter.welcome || {}
                gcData.filter.welcome.welcomeText = text
                m.reply('✅ Pesan *Welcome* berhasil diperbarui.')
            } else {
                gcData.filter.left = gcData.filter.left || {}
                gcData.filter.left.leftText = text
                m.reply('✅ Pesan *Leave* berhasil diperbarui.')
            }
            saveGc()
        }
    })

    // --- PREVIEW MESSAGE ---
    ev.on({
        name: 'group_welcome_preview',
        cmd: ['pwelcome', 'pleave'],
        tags: 'Group Menu',
        desc: 'Preview pesan sambutan atau perpisahan',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { chat, command }) => {
            const gcData = getGc(chat.id)
            const isWelcome = command === 'pwelcome'
            
            const rawText = isWelcome 
                ? (gcData.filter?.welcome?.welcomeText || 'Selamat datang @user!')
                : (gcData.filter?.left?.leftText || 'Selamat jalan @user!')

            const meta = groupCache.get(chat.id) || await getMetadata(chat.id, xp) || {}
            
            const time = global.time.timeIndo('Asia/Jakarta', 'HH:mm')
            const date = global.time.timeIndo('Asia/Jakarta', 'DD/MM/YYYY')
            const memberCount = meta.participants?.length || '?'

            const formattedText = rawText
                .replace(/@user/g, `@${m.sender.split('@')[0]}`)
                .replace(/@subject/g, meta.subject || 'Grup')
                .replace(/@desc/g, meta.desc || 'Tidak ada deskripsi')
                .replace(/@member/g, memberCount)
                .replace(/@date/g, date)
                .replace(/@time/g, time)

            m.reply(`👀 *PREVIEW ${isWelcome ? 'WELCOME' : 'LEAVE'}:*\n\n${formattedText}`, { mentions: [m.sender] })
        }
    })

    // --- RESET MESSAGE ---
    ev.on({
        name: 'group_welcome_reset',
        cmd: ['delwelcome', 'delleave'],
        tags: 'Group Menu',
        desc: 'Reset pesan sambutan atau perpisahan ke default',
        group: true,
        admin: true,
        prefix: true,
        run: async (xp, m, { chat, command }) => {
            const gcData = getGc(chat.id)
            const isWelcome = command === 'delwelcome'

            if (isWelcome) {
                if (gcData.filter?.welcome) gcData.filter.welcome.welcomeText = ''
                m.reply('✅ Pesan *Welcome* direset ke default.')
            } else {
                if (gcData.filter?.left) gcData.filter.left.leftText = ''
                m.reply('✅ Pesan *Leave* direset ke default.')
            }
            saveGc()
        }
    })
}