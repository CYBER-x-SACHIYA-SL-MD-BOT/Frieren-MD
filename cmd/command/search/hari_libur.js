import { createRequire } from "module";
import fetch from 'node-fetch';
const require = createRequire(import.meta.url);

export default function(ev) {
    ev.on({
        name: 'harilibur',
        cmd: ['harilibur', 'libur', 'kalender', 'nationaldays'],
        tags: 'Search Menu',
        desc: 'Cek daftar hari libur dan peringatan nasional',
        run: async (xp, m, { args, usedPrefix, command }) => {
            const apiUrl = 'https://api.nexray.web.id/information/hari-libur'
            
            try {
                m.reply('⏳ Mengambil data hari libur...')
                
                const res = await fetch(apiUrl)
                const json = await res.json()

                if (!json.status || !json.result) {
                    return m.reply('❌ Gagal mengambil data hari libur.')
                }

                const data = json.result
                const today = data.hari_ini
                const upcoming = data.mendatang
                
                // Helper to format date "MM-DD" -> "DD Month" (Simplified)
                const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
                const formatDate = (dateStr) => {
                    const [month, day] = dateStr.split('-')
                    return `${day} ${months[parseInt(month)]}`
                }

                let txt = `📅 *KALENDER HARI LIBUR & PERINGATAN* 📅\n`
               

                // HARI INI
                if (today.events && today.events.length > 0) {
                    txt += `🌟 *HARI INI (${formatDate(today.tanggal)})*\n`
                    today.events.forEach(e => {
                        txt += `• ${e}\n`
                    })
                    txt += `\n`
                }

                // LIBUR NASIONAL MENDATANG
                if (upcoming.hari_libur && upcoming.hari_libur.length > 0) {
                    txt += `🔴 *LIBUR NASIONAL MENDATANG*\n`
                    upcoming.hari_libur.slice(0, 5).forEach(e => {
                        txt += `• ${formatDate(e.date)}: ${e.event} _(${e.daysUntil} hari lagi)_\n`
                    })
                    txt += `\n`
                }

                // PERINGATAN NASIONAL MENDATANG
                if (upcoming.event_nasional && upcoming.event_nasional.length > 0) {
                    txt += `🟢 *PERINGATAN NASIONAL MENDATANG*\n`
                    upcoming.event_nasional.slice(0, 5).forEach(e => {
                        txt += `• ${formatDate(e.date)}: ${e.event} _(${e.daysUntil} hari lagi)_\n`
                    })
                }

                await xp.sendMessage(m.chat, { 
                    text: txt,
                    contextInfo: {
                        externalAdReply: {
                            title: "INFO HARI LIBUR",
                            body: "Jangan lupa istirahat!",
                            mediaType: 1,
                            thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Calendar_font_awesome.svg/1200px-Calendar_font_awesome.svg.png",
                            renderLargerThumbnail: false,
                            sourceUrl: "https://publicholidays.co.id/"
                        }
                    }
                }, { quoted: m })

            } catch (e) {
                console.error('Error harilibur:', e)
                m.reply('❌ Terjadi kesalahan pada server API.')
            }
        }
    })
}
