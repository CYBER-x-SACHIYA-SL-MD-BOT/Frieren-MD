import axios from 'axios'
import { prepareWAMessageMedia } from '@adiwajshing/baileys'
import { sendIAMessage } from '../../../system/function.js'
import { jarvis } from '../../../cmd/interactive.js'

export default function(ev) {
    ev.on({
        name: 'pontianak',
        cmd: ['pontianak', 'ptk'],
        tags: 'Search Menu',
        desc: 'Info Kota Pontianak (Cuaca, Jadwal Sholat, Analisis)',
        run: async (xp, m, { args, chat, command, usedPrefix }) => {
            try {
                // --- MODE ANALISIS (AI) ---
                if (args[0] === 'analisis' || args[0] === 'detail') {
                    await xp.sendMessage(chat.id, { react: { text: '🧠', key: m.key } })
                    m.reply('⏳ Sedang menyusun analisis data Kota Pontianak... (Mohon tunggu)')

                    const prompt = `Berikan analisis komprehensif tentang Kota Pontianak, Kalimantan Barat.
Cakup poin-poin berikut secara mendetail namun ringkas dan mudah dibaca (gunakan bullet points):

1. **Demografi**: Tren populasi, komposisi etnis (Melayu, Dayak, Tionghoa), dan indikator sosial.
2. **Ekonomi**: PDRB per kapita, pertumbuhan ekonomi, sektor unggulan (perdagangan/jasa), dan regulasi investasi.
3. **Infrastruktur**: Konektivitas transportasi (Pelabuhan, Bandara, Jembatan Kapuas), aksesibilitas, dan tata kota.
4. **Pariwisata**: Destinasi unggulan (Tugu Khatulistiwa, Sungai Kapuas), kuliner khas, dan daya tarik wisata.
5. **Kebijakan Publik**: Efektivitas kebijakan pemkot terkini dan tantangan pembangunan.

Format output dengan heading tebal dan emoji. Jangan gunakan gaya bicara Jarvis, gunakan gaya laporan formal/analitis.`

                    // Menggunakan AI Jarvis Internal (lebih stabil)
                    const aiRes = await jarvis('Analisis Pontianak', prompt, m, m.sender, xp, chat.id)
                    
                    if (aiRes && aiRes.msg) {
                        return xp.sendMessage(chat.id, { 
                            text: `📊 *ANALISIS KOTA PONTIANAK*\n\n${aiRes.msg}`,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Pontianak City Analysis",
                                    body: "Powered by AI System",
                                    thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Tugu_Khatulistiwa.jpg/800px-Tugu_Khatulistiwa.jpg",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: m })
                    } else {
                        return m.reply('Gagal mengambil data analisis dari AI.')
                    }
                }

                // --- MODE DEFAULT (CUACA & SHOLAT) ---
                await xp.sendMessage(chat.id, { react: { text: '🌉', key: m.key } })

                // 1. Get Weather (Wttr.in)
                const weatherUrl = `https://wttr.in/Pontianak?format=j1`
                const weatherRes = await axios.get(weatherUrl).then(r => r.data).catch(() => null)

                // 2. Get Prayer Times (Aladhan)
                const date = new Date()
                const prayerUrl = `http://api.aladhan.com/v1/timingsByCity?city=Pontianak&country=Indonesia&method=11`
                const prayerRes = await axios.get(prayerUrl).then(r => r.data).catch(() => null)

                if (!weatherRes || !prayerRes) return m.reply('Gagal mengambil data Pontianak.')

                const w = weatherRes.current_condition[0]
                const p = prayerRes.data.timings
                const hijri = prayerRes.data.date.hijri

                const txt = `🌉 *INFO KOTA PONTIANAK* 🌉
_Kota Khatulistiwa_

🌦️ *CUACA SAAT INI*
🌡️ Suhu: ${w.temp_C}°C (Terasa ${w.FeelsLikeC}°C)
💧 Kelembaban: ${w.humidity}%
🌬️ Angin: ${w.windspeedKmph} km/h
☁️ Kondisi: ${w.weatherDesc[0].value}

🕌 *JADWAL SHOLAT HARI INI*
📅 ${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
🌙 ${hijri.day} ${hijri.month.en} ${hijri.year} AH

🌌 Imsak: ${p.Imsak}
🌅 Subuh: ${p.Fajr}
🌞 Terbit: ${p.Sunrise}
🕛 Dzuhur: ${p.Dhuhr}
🕒 Ashar: ${p.Asr}
🌇 Maghrib: ${p.Maghrib}
🌑 Isya: ${p.Isha}`

                // Buttons
                const buttons = [
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "📊 Analisis Lengkap (AI)",
                            id: `${usedPrefix + command} analisis`
                        })
                    }
                ]

                const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Tugu_Khatulistiwa.jpg/800px-Tugu_Khatulistiwa.jpg'

                await sendIAMessage(xp, chat.id, buttons, {
                    media: imageUrl,
                    mediaType: 'image',
                    body: txt,
                    footer: global.botName
                }, { quoted: m })

            } catch (e) {
                console.error('Pontianak Error:', e)
                m.reply('Terjadi kesalahan.')
            }
        }
    })
}
