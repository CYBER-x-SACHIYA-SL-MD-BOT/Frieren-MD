import { startJadibot, stopJadibot, getJadibots } from '#system/jadibot.js'

let handler = async (m, { conn, args, isOwner, usedPrefix, command }) => {
    if (command === 'listjadibot') {
        const list = getJadibots()
        if (list.length === 0) return m.reply('❌ Tidak ada Jadibot yang aktif saat ini.')
        
        let txt = `🤖 *DAFTAR JADIBOT AKTIF* 🤖\n\nTotal: ${list.length} Bot\n\n`
        list.forEach((bot, i) => {
            const expireDate = bot.expire ? new Date(bot.expire).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Permanen'
            txt += `${i + 1}. *${bot.id}*\n`
            txt += `   └ Tipe: ${bot.isPremium ? '🌟 Premium (Owner/Sewa)' : '🆓 Gratis (2 Hari)'}\n`
            txt += `   └ Expire: ${expireDate}\n\n`
        })
        return m.reply(txt)
    }

    if (command === 'stopjadibot') {
        if (!isOwner) return m.reply('❌ Hanya owner yang bisa mematikan Jadibot user lain.')
        const target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
        if (!target) return m.reply(`🔍 Masukkan nomor Jadibot yang ingin dimatikan.\nContoh: ${usedPrefix}stopjadibot 628xxx`)
        
        const success = await stopJadibot(target)
        if (success) {
            return m.reply(`✅ Berhasil mematikan dan menghapus sesi Jadibot untuk nomor ${target}.`)
        } else {
            return m.reply(`❌ Jadibot dengan nomor ${target} tidak ditemukan atau sudah mati.`)
        }
    }

    // Default Command: .jadibot
    const number = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    
    if (!number) {
        return m.reply(`🤖 *J A D I B O T   S Y S T E M* 🤖\n\nFitur ini memungkinkan nomor Anda menjadi bot sementara.\n\n*Cara Penggunaan:*\nKetik *${usedPrefix}jadibot <nomor_wa>*\nContoh: *${usedPrefix}jadibot 6281234567890*\n\n*Khusus Owner (Atur Waktu):*\n*${usedPrefix}jadibot <nomor_wa> <jumlah_hari>*\nContoh: *${usedPrefix}jadibot 628xxx 30* (Aktif 30 Hari)\nContoh: *${usedPrefix}jadibot 628xxx permanen* (Aktif Selamanya)\n\n*Syarat & Ketentuan:*\n1. User Gratis: Aktif 2 Hari.\n2. Bot harus dalam keadaan aktif di perangkat Anda untuk menerima pairing code.`)
    }

    if (number.length < 10) return m.reply('❌ Nomor tidak valid. Gunakan format 628xxx')

    let customExpireDays = null // Jika null, berarti menggunakan default di system (2 hari untuk gratis, atau biarkan timer lama jika reconnect)
    let typeTxt = '(🆓 Mode Gratis - 2 Hari)'

    // Jika owner yang mengeksekusi, bisa set hari khusus atau permanen
    if (isOwner && args[1]) {
        if (args[1].toLowerCase() === 'permanen') {
            customExpireDays = 'permanen'
            typeTxt = '(🌟 Mode Premium - Permanen)'
        } else if (!isNaN(args[1])) {
            customExpireDays = parseInt(args[1])
            typeTxt = `(🌟 Mode Sewa - ${customExpireDays} Hari)`
        }
    } else if (isOwner) {
        // Jika owner memakai tanpa parameter tambahan, jadikan permanen by default?
        // Kita biarkan saja mengikuti argumen, atau default ke permanen untuk owner
        customExpireDays = 'permanen'
        typeTxt = '(🌟 Mode Premium - Permanen)'
    } else {
        // Untuk user biasa, kita kirimkan `2` untuk hari, atau biarkan `null` (di system.js defaultnya 2 hari)
        customExpireDays = 2
    }

    await m.reply(`⏳ Sedang memproses Jadibot untuk nomor *${number}*...\n${typeTxt}\n\nTunggu sebentar, bot akan mengirimkan kode pairing...`)
    
    await startJadibot(conn, m, number, customExpireDays)
}

handler.help = ['jadibot <nomor>', 'stopjadibot <nomor>', 'listjadibot']
handler.tags = ['owner', 'tools']
handler.command = ['jadibot', 'stopjadibot', 'listjadibot']
handler.prefix = true
// Note: handler.owner is NOT true for .jadibot because we want users to use it (limit 2 days).
// The command inside handles owner checks for stopjadibot and premium flag.

export default handler