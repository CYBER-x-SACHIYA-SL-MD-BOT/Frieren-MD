import { addReminder, getReminders, deleteReminder, clearReminders } from '../../../system/reminder.js'
import moment from 'moment-timezone'

function formatMs(ms) {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000))
    let daysms = ms % (24 * 60 * 60 * 1000)
    let hours = Math.floor(daysms / (60 * 60 * 1000))
    let hoursms = ms % (60 * 60 * 1000)
    let minutes = Math.floor(hoursms / (60 * 1000))
    let minutesms = ms % (60 * 1000)
    let sec = Math.floor(minutesms / 1000)
    
    let res = []
    if (days) res.push(days + 'd')
    if (hours) res.push(hours + 'h')
    if (minutes) res.push(minutes + 'm')
    if (sec) res.push(sec + 's')
    
    return res.join(' ') || '0s'
}

export default function(ev) {
    // --- ZAKAT ---
    ev.on({
        name: 'zakat',
        cmd: ['zakat'],
        tags: 'Tools Menu',
        desc: 'Hitung zakat mal',
        run: async (xp, m, { args, chat }) => {
            const harta = parseInt(args[0]?.replace(/\./g, ''))
            if (isNaN(harta)) return m.reply('Contoh: .zakat 10000000')
            const zakat = harta * 0.025
            const format = (n) => 'Rp ' + n.toLocaleString('id-ID')
            m.reply(`🕌 *KALKULATOR ZAKAT* 🕌\n\n💰 Total Harta: ${format(harta)}\n⚖️ Zakat (2.5%): ${format(zakat)}\n\n_Semoga berkah!_`)
        }
    })

    // --- BMI ---
    ev.on({
        name: 'bmi',
        cmd: ['bmi'],
        tags: 'Tools Menu',
        desc: 'Hitung Body Mass Index',
        run: async (xp, m, { args, chat }) => {
            const berat = parseFloat(args[0]), tinggi = parseFloat(args[1])
            if (!berat || !tinggi) return m.reply('Format: .bmi <berat_kg> <tinggi_cm>')
            
            const bmi = berat / ((tinggi/100) ** 2)
            let status = bmi < 18.5 ? 'Kurus' : bmi < 24.9 ? 'Ideal ✅' : bmi < 29.9 ? 'Gemuk' : 'Obesitas 🚨'
            
            m.reply(`⚖️ *BMI CALCULATOR*\n\n📊 Score: ${bmi.toFixed(1)}\n🏷️ Status: ${status}`)
        }
    })

    // --- REMINDER ---
    ev.on({
        name: 'reminder',
        cmd: ['reminder', 'ingatkan', 'alarm'],
        tags: 'Tools Menu',
        desc: 'Set, list, or delete reminders',
        run: async (xp, m, { args, chat, prefix, command }) => {
            try {
                const sub = args[0]?.toLowerCase()

                // 1. LIST REMINDERS
                if (sub === 'list' || sub === 'cek') {
                    const list = getReminders(m.sender)
                    if (!list.length) return m.reply('📭 Kamu tidak memiliki reminder aktif.')
                    
                    let txt = `📅 *DAFTAR REMINDER KAMU* 📅\n\n`
                    list.forEach((rem, i) => {
                        const remaining = rem.targetTime - Date.now()
                        const timeStr = remaining > 0 ? formatMs(remaining) : 'Sedang diproses...'
                        txt += `${i + 1}. *"${rem.message}"*\n   ⏳ ${timeStr} lagi\n   🆔 \`${rem.id}\`\n\n`
                    })
                    txt += `_Gunakan "${prefix}${command} del <id>" untuk menghapus._`
                    return m.reply(txt)
                }

                // 2. DELETE REMINDER
                if (sub === 'del' || sub === 'delete' || sub === 'hapus') {
                    const id = args[1]
                    if (!id) return m.reply(`Format: ${prefix}${command} del <id>`)
                    
                    const list = getReminders(m.sender)
                    let targetId = id
                    if (!isNaN(id)) {
                        const idx = parseInt(id) - 1
                        if (list[idx]) targetId = list[idx].id
                    }

                    if (deleteReminder(targetId)) {
                        return m.reply('✅ Reminder berhasil dihapus.')
                    } else {
                        return m.reply('❌ ID Reminder tidak ditemukan.')
                    }
                }

                // 3. CLEAR ALL
                if (sub === 'clear' || sub === 'reset') {
                    clearReminders(m.sender)
                    return m.reply('✅ Semua reminder kamu telah dihapus.')
                }

                // 4. ADD REMINDER (DEFAULT)
                if (!args[0] || !args[1]) {
                    return xp.sendMessage(chat.id, { 
                        text: `⏰ *REMINDER & ALARM SYSTEM* ⏰\n\n` +
                              `*1. Tambah Reminder (Durasi):*\n` +
                              `> ${prefix}${command} <waktu> <pesan>\n` +
                              `> Contoh: \`${prefix}${command} 10m Masak Air\`\n\n` +
                              `*2. Tambah Alarm (Jam Spesifik):*\n` +
                              `> ${prefix}${command} <jam.menit> <pesan>\n` +
                              `> Contoh: \`${prefix}${command} 05.50 Sholat Subuh\`\n` +
                              `> Contoh: \`${prefix}${command} 17:00 Pulang Kerja\`\n\n` +
                              `*3. List Reminder:*\n` +
                              `> ${prefix}${command} list\n\n` +
                              `*4. Hapus Reminder:*\n` +
                              `> ${prefix}${command} del <id/index>\n\n` +
                              `*Satuan Waktu:* s (detik), m (menit), h (jam), d (hari).`
                    }, { quoted: m })
                }

                const timeArg = args[0]
                const msg = args.slice(1).join(' ')
                let duration = 0
                let displayTime = ''

                // Check for Clock Format (HH.mm or HH:mm)
                const clockMatch = timeArg.match(/^(\d{1,2})[.:](\d{2})$/)
                
                if (clockMatch) {
                    const hh = parseInt(clockMatch[1])
                    const mm = parseInt(clockMatch[2])
                    if (hh >= 24 || mm >= 60) return m.reply('❌ Waktu tidak valid! (Maks 23:59)')
                    
                    const now = moment().tz('Asia/Jakarta')
                    const target = now.clone().hour(hh).minute(mm).second(0).millisecond(0)
                    
                    // If time has passed today, set for tomorrow
                    if (target.isBefore(now)) {
                        target.add(1, 'day')
                    }
                    
                    duration = target.diff(now)
                    displayTime = target.format('HH:mm') + ' WIB'
                    if (target.date() !== now.date()) displayTime += ' (Besok)'
                } else {
                    // Standard Duration Format (10m, 1h, etc)
                    const unit = timeArg.slice(-1).toLowerCase()
                    const value = parseInt(timeArg.slice(0, -1))
                    
                    if (isNaN(value) || value <= 0) return m.reply('❌ Waktu tidak valid! Contoh: 10m atau 05.30')
        
                    let multiplier = 1000 
                    let unitName = 'Detik'
                    switch(unit) {
                        case 's': multiplier = 1000; unitName = 'Detik'; break;
                        case 'm': multiplier = 60000; unitName = 'Menit'; break;
                        case 'h': multiplier = 3600000; unitName = 'Jam'; break;
                        case 'd': multiplier = 86400000; unitName = 'Hari'; break;
                        default: return m.reply('❌ Satuan tidak dikenal! Gunakan s/m/h/d atau format jam 00.00')
                    }
                    duration = value * multiplier
                    displayTime = `${value} ${unitName}`
                }
    
                if (duration > 86400000 * 30) return m.reply('❌ Maksimal pengingat adalah 30 hari.')

                const data = addReminder(m.sender, chat.id, msg, duration)
                m.reply(`✅ *ALARM/REMINDER DIATUR*\n\n🔔 Alarm: *${displayTime}*\n📝 Pesan: "${msg}"\n🆔 ID: \`${data.id}\``)
            } catch (e) { console.error(e) }
        }
    })
}
