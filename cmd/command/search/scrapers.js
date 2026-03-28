import fetch from 'node-fetch'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia } = require('@adiwajshing/baileys');
import { sendIAMessage, sendCarouselMessage } from '../../../system/function.js'
import { createUrl } from '../../../system/apis.js'

const {
   kodepos,
   jadwalsholat,
   bioskopNow,
   chord,
   sticker,
   sfilemobi,
   kbbi,
   resep
} = require('@bochilteam/scraper');

export default function search(ev) {
   // --- NPM SEARCH ---
   ev.on({
      name: 'npm',
      cmd: ['npm', 'npmsearch'],
      tags: 'Search Menu',
      desc: 'Cari package NPM',
      run: async (xp, m, { args, chat }) => {
         if (!args[0]) return m.reply('📦 Cari package apa?')
         try {
            const url = createUrl('deline', '/search/npm', { q: args.join(' ') })
            const res = await fetch(url).then(r => r.json())
            if (!res.status || !res.result.length) return m.reply('Package tidak ditemukan.')

            let txt = `📦 *NPM SEARCH*\n`
            res.result.slice(0, 5).forEach(p => {
               txt += `\n🔹 *${p.name}* (v${p.version})
Desc: ${p.description}
Author: ${p.author}
Link: ${p.links.npm}\n`
            })
            m.reply(txt)
         } catch { m.reply('Error searching NPM.') }
      }
   })

   // --- WEBTOON SEARCH ---
   ev.on({
      name: 'webtoon',
      cmd: ['webtoon', 'komik'],
      tags: 'Search Menu',
      desc: 'Cari komik Webtoon',
      run: async (xp, m, { args, chat }) => {
         if (!args[0]) return m.reply('📖 Judul komik?')
         try {
            const url = createUrl('deline', '/search/webtoon', { q: args.join(' ') })
            const res = await fetch(url).then(r => r.json())

            if (!res.status || !res.result.original.length) return m.reply('Tidak ditemukan.')

            const comic = res.result.original[0]
            await xp.sendMessage(chat.id, {
               image: { url: comic.image },
               caption: `📖 *WEBTOON SEARCH*
                
📚 Judul: ${comic.title}
👤 Author: ${comic.author}
👀 Views: ${comic.viewCount}
🔗 Link: ${comic.link}`
            }, { quoted: m })

         } catch { m.reply('Error searching Webtoon.') }
      }
   })

   // --- JADWAL SHOLAT (SEARCH) ---
   ev.on({
      name: 'jadwalsholat',
      cmd: ['jadwalsholat', 'sholat'],
      tags: 'Search Menu',
      desc: 'Cek jadwal sholat kota',
      run: async (xp, m, { args, chat }) => {
         if (!args[0]) return m.reply('Kota?')
         try {
            const res = await jadwalsholat(args.join(' '))
            if (!res || !res.today) return m.reply('Kota tidak ditemukan.')
            const t = res.today
            m.reply(`🕌 *JADWAL SHOLAT: ${args.join(' ').toUpperCase()}*\n📅 ${res.date}\n\nSubuh: ${t.Subuh}\nDzuhur: ${t.Dzuhur}\nAshar: ${t.Ashar}\nMaghrib: ${t.Maghrib}\nIsya: ${t.Isya}`)
         } catch { m.reply('Gagal.') }
      }
   })

   // --- BIOSKOP (Custom Scraper) ---
   ev.on({
      name: 'bioskop',
      cmd: ['bioskop', 'nowplaying'],
      tags: 'Search Menu',
      desc: 'Jadwal film bioskop',
      run: async (xp, m, { chat }) => {
         try {
            await xp.sendMessage(chat.id, { react: { text: '🎬', key: m.key } })
            const { data } = await axios.get('https://jadwalnonton.com/now-playing/')
            const $ = cheerio.load(data)
            const res = []

            $('.row.clearfix .item').each((i, el) => {
               const title = $(el).find('h2 a').text().trim()
               const img = $(el).find('img').attr('src')
               const url = $(el).find('a').attr('href')
               if (title && img) res.push({ title, img, url, genre: 'Film Bioskop' })
            })

            if (!res.length) return m.reply('Data kosong.')

            const cards = []
            for (const f of res.slice(0, 5)) {
               try {
                  const media = await prepareWAMessageMedia({ image: { url: f.img } }, { upload: xp.waUploadToServer })
                  cards.push({
                     body: { text: f.title },
                     footer: { text: f.genre },
                     header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                     nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🌐 Info", url: f.url, merchant_url: f.url }) }] }
                  })
               } catch { }
            }
            await xp.relayMessage(chat.id, { viewOnceMessage: { message: { interactiveMessage: { body: { text: "🎬 *BIOSKOP NOW PLAYING*" }, header: { hasMediaAttachment: false }, carouselMessage: { cards } } } } }, {})
         } catch (e) {
            console.error(e)
            m.reply('Gagal mengambil data bioskop.')
         }
      }
   })





   // --- SFILE SEARCH ---
   ev.on({
      name: 'sfilesearch',
      cmd: ['sfilesearch', 'sfile'],
      tags: 'Search Menu',
      desc: 'Cari file di sfile.mobi',
      run: async (xp, m, { args, chat, usedPrefix, command }) => {
         if (!args[0]) return m.reply(`📝 Masukkan judul file!\nContoh: ${usedPrefix + command} WA Mod`)

         try {
            await xp.sendMessage(chat.id, { react: { text: '📂', key: m.key } })

            const query = encodeURIComponent(args.join(' '))
            const { data } = await axios.get(`https://sfile.mobi/search.php?q=${query}&search=Search`)
            const $ = cheerio.load(data)

            const results = []
            $('div.list').each((i, el) => {
               const title = $(el).find('a').text().trim()
               const link = $(el).find('a').attr('href')
               const sizeText = $(el).text().match(/\((.*?)\)/)
               const size = sizeText ? sizeText[1] : 'Unknown'

               if (title && link) {
                  results.push({ title, link, size })
               }
            })

            if (!results.length) return m.reply('❌ File tidak ditemukan.')

            let txt = `📂 *SFILE MOBI SEARCH* 📂\n`
            txt += `🔎 Query: ${args.join(' ').toUpperCase()}\n`
            txt += `━━━━━━━━━━━━━━━━━━━━\n`

            results.slice(0, 10).forEach((f, i) => {
               txt += `\n*${i + 1}. ${f.title}*\n`
               txt += `💾 *Size:* ${f.size}\n`
               txt += `🔗 *Link:* ${f.link}\n`
            })

            txt += `\n━━━━━━━━━━━━━━━━━━━━\n`
            txt += `💡 _Gunakan link di atas untuk download manual._`

            await m.reply(txt)
            await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

         } catch (e) {
            console.error('Sfile Error:', e)
            m.reply('❌ Gagal melakukan pencarian di Sfile. Server mungkin sedang sibuk.')
         }
      }
   })

   // --- PINTEREST ---
   ev.on({
      name: 'pinterest',
      cmd: ['pin', 'pinterest'],
      tags: 'Search Menu',
      desc: 'Cari gambar Pinterest (Carousel 5)',
      run: async (xp, m, { args, chat }) => {
         if (!args[0]) return m.reply('🎨 Cari gambar apa?')
         try {
            await xp.sendMessage(chat.id, { react: { text: '🎨', key: m.key } })

            // Use Harz API
            const api = `https://api.harzrestapi.web.id/api/pinterest?q=${encodeURIComponent(args.join(' '))}`
            const res = await fetch(api).then(r => r.json())

            if (!res.success || !res.result || !res.result.length) return m.reply('Nihil.')

            // Shuffle results for variety
            let images = res.result;
            for (let i = images.length - 1; i > 0; i--) {
               const j = Math.floor(Math.random() * (i + 1));
               [images[i], images[j]] = [images[j], images[i]];
            }

            const cards = []
            for (const item of images.slice(0, 5)) {
               try {
                  const url = item.images_url
                  const media = await prepareWAMessageMedia({ image: { url } }, { upload: xp.waUploadToServer })
                  cards.push({
                     body: { text: item.grid_title || item.description || args.join(' ').toUpperCase() },
                     footer: { text: `By: ${item.pinner?.full_name || item.pinner?.username || 'Pinterest'}` },
                     header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                     nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🖼️ View", url: item.pin || url, merchant_url: item.pin || url }) }] }
                  })
               } catch { }
            }

            if (cards.length > 0) {
               await xp.relayMessage(chat.id, { viewOnceMessage: { message: { interactiveMessage: { body: { text: `📌 *PINTEREST SEARCH*` }, header: { hasMediaAttachment: false }, carouselMessage: { cards } } } } }, { quoted: m })
            } else {
               m.reply('Gagal memuat carousel.')
            }

         } catch (e) {
            console.error(e)
            m.reply('Gagal.')
         }
      }
   })

   // --- BERITA (CNN NEXRAY) ---
   ev.on({
      name: 'berita',
      cmd: ['berita', 'news', 'cnn'],
      tags: 'Search Menu',
      desc: 'Berita Terkini CNN Indonesia',
      run: async (xp, m, { chat }) => {
         try {
            await xp.sendMessage(chat.id, { react: { text: '📰', key: m.key } })

            const url = 'https://api.nexray.web.id/berita/cnn'
            const { status, result } = await fetch(url).then(r => r.json())

            if (!status || !result || result.length === 0) return m.reply('Gagal mengambil berita.')

            const cards = []
            // Limit 5 berita
            for (const n of result.slice(0, 5)) {
               try {
                  const media = await prepareWAMessageMedia({ image: { url: n.image_thumbnail } }, { upload: xp.waUploadToServer })

                  const t = n.time || ''
                  const dateFormatted = t.length > 10 ? `${t.substring(6, 8)}/${t.substring(4, 6)}/${t.substring(0, 4)}` : t

                  cards.push({
                     body: { text: n.title },
                     footer: { text: `CNN | ${dateFormatted}` },
                     header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                     nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🌐 Baca Selengkapnya", url: n.link, merchant_url: n.link }) }] }
                  })
               } catch (err) {
                  console.error('Error preparing news card:', err)
               }
            }
            await xp.relayMessage(chat.id, { viewOnceMessage: { message: { interactiveMessage: { body: { text: "📰 *BERITA TERKINI CNN*" }, header: { hasMediaAttachment: false }, carouselMessage: { cards } } } } }, {})
         } catch (e) {
            console.error('Berita Error:', e)
            m.reply('Terjadi kesalahan saat mengambil berita.')
         }
      }
   })

   // --- BERITA (MERDEKA NEXRAY) ---
   ev.on({
      name: 'merdeka',
      cmd: ['merdeka', 'beritamerdeka'],
      tags: 'Search Menu',
      desc: 'Berita Terkini Merdeka.com',
      run: async (xp, m, { chat }) => {
         try {
            await xp.sendMessage(chat.id, { react: { text: '📰', key: m.key } })

            const url = 'https://api.nexray.web.id/berita/merdeka'
            const { status, result } = await fetch(url).then(r => r.json())

            if (!status || !result || result.length === 0) return m.reply('Gagal mengambil berita.')

            const cards = []
            // Limit 5 berita
            for (const n of result.slice(0, 5)) {
               try {
                  const media = await prepareWAMessageMedia({ image: { url: n.image_thumbnail } }, { upload: xp.waUploadToServer })

                  const t = n.time || ''
                  // Format waktu mungkin beda, kita ambil aman
                  const dateFormatted = t.length > 10 ? `${t.substring(6, 8)}/${t.substring(4, 6)}/${t.substring(0, 4)}` : t

                  cards.push({
                     body: { text: n.title },
                     footer: { text: `MERDEKA | ${dateFormatted}` },
                     header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                     nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🌐 Baca Selengkapnya", url: n.link, merchant_url: n.link }) }] }
                  })
               } catch (err) {
                  console.error('Error preparing news card:', err)
               }
            }
            await xp.relayMessage(chat.id, { viewOnceMessage: { message: { interactiveMessage: { body: { text: "📰 *BERITA TERKINI MERDEKA*" }, header: { hasMediaAttachment: false }, carouselMessage: { cards } } } } }, {})
         } catch (e) {
            console.error('Merdeka Error:', e)
            m.reply('Terjadi kesalahan saat mengambil berita.')
         }
      }
   })

   // --- GEMPA TERKINI (NEXRAY API) ---
   ev.on({
      name: 'gempa',
      cmd: ['gempa', 'bmkg'],
      tags: 'Search Menu',
      desc: 'Info Gempa Terkini dari BMKG',
      run: async (xp, m, { chat }) => {
         try {
            await xp.sendMessage(chat.id, { react: { text: '🌍', key: m.key } })

            const url = 'https://api.nexray.web.id/information/gempa'
            const res = await fetch(url).then(r => r.json())

            if (!res.status || !res.result) throw new Error('API Error')

            const g = res.result

            let txt = `🌍 *INFO GEMPA TERKINI* 🌍\n\n`
            txt += `📅 *Tanggal:* ${g.Tanggal}\n`
            txt += `⌚ *Waktu:* ${g.Jam}\n`
            txt += `📍 *Wilayah:* ${g.Wilayah}\n`
            txt += `📉 *Magnitude:* ${g.Magnitude} SR\n`
            txt += `🌊 *Kedalaman:* ${g.Kedalaman}\n`
            txt += `📍 *Koordinat:* ${g.Coordinates}\n`
            txt += `⚠️ *Potensi:* ${g.Potensi}\n`
            if (g.Dirasakan && g.Dirasakan !== '-') {
               txt += `🙌 *Dirasakan:* ${g.Dirasakan}\n`
            }
            txt += `\n_Sumber: BMKG via NexRay_`

            if (g.Shakemap) {
               await xp.sendMessage(chat.id, {
                  image: { url: g.Shakemap },
                  caption: txt
               }, { quoted: m })
            } else {
               await m.reply(txt)
            }

         } catch (e) {
            console.error('Gempa Error:', e)
            m.reply('❌ Gagal mengambil data gempa terbaru.')
         }
      }
   })

   // --- PLAYSTORE ---
   ev.on({
      name: 'playstore',
      cmd: ['playstore', 'ps'],
      tags: 'Search Menu',
      desc: 'Cari aplikasi PlayStore',
      run: async (xp, m, { args, chat }) => {
         if (!args[0]) return m.reply('Aplikasi apa?')
         try {
            const { data } = await axios.get(`https://play.google.com/store/search?q=${encodeURIComponent(args.join(' '))}&c=apps&hl=id`)
            const $ = cheerio.load(data)
            const results = []

            $('div.fUEl2e').each((i, el) => {
               if (results.length >= 5) return
               const link = 'https://play.google.com' + $(el).find('a').attr('href')
               const title = $(el).find('.Ub8zBc').text()
               const dev = $(el).find('.wMUdtb').text()
               const img = $(el).find('img').attr('src') || $(el).find('img').attr('srcset')?.split(' ')[0]
               if (title && img) results.push({ title, link, dev, img })
            })

            if (!results.length) {
               $('div.ULeU3b').each((i, el) => {
                  if (results.length >= 5) return
                  const link = 'https://play.google.com' + $(el).find('a').attr('href')
                  const title = $(el).find('.DdYX5').text()
                  const img = $(el).find('img').attr('src')
                  if (title) results.push({ title, link, img, dev: 'App' })
               })
            }

            if (!results.length) return m.reply('Gak nemu.')

            const cards = []
            for (const r of results) {
               try {
                  const media = await prepareWAMessageMedia({ image: { url: r.img } }, { upload: xp.waUploadToServer })
                  cards.push({
                     body: { text: r.title },
                     footer: { text: r.dev },
                     header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                     nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "Install", url: r.link, merchant_url: r.link }) }] }
                  })
               } catch { }
            }
            await xp.relayMessage(chat.id, { viewOnceMessage: { message: { interactiveMessage: { body: { text: `📱 *PLAY STORE: ${args.join(' ')}*` }, header: { hasMediaAttachment: false }, carouselMessage: { cards } } } } }, {})
         } catch { m.reply('Error.') }
      }
   })

   // --- TIKTOK SEARCH V2 (TIKWM) ---
   ev.on({
      name: 'ttsearchv2',
      cmd: ['ttsearchv2', 'tiktoksearchv2', 'ttv2'],
      tags: 'Search Menu',
      desc: 'Cari video TikTok (Sumber V2)',
      run: async (xp, m, { args, chat }) => {
         if (!args[0]) return m.reply('Cari video apa di TikTok?')

         try {
            await xp.sendMessage(chat.id, { react: { text: '🎵', key: m.key } })

            const query = args.join(' ')
            const { data } = await axios("https://tikwm.com/api/feed/search", {
               headers: {
                  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                  cookie: "current_language=en",
                  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
               },
               data: {
                  keywords: query,
                  count: 10,
                  cursor: 0,
                  web: 1,
                  hd: 1,
               },
               method: "POST",
            })

            if (!data.data || !data.data.videos || data.data.videos.length === 0) {
               return m.reply('❌ Video tidak ditemukan (V2).')
            }

            const cards = []
            // Limit to 5 results for carousel
            for (const v of data.data.videos.slice(0, 5)) {
               try {
                  let coverUrl = v.cover
                  if (coverUrl.startsWith('/')) coverUrl = 'https://tikwm.com' + coverUrl

                  const playUrl = `https://tikwm.com${v.play}`
                  const title = v.title || 'No Title'

                  const media = await prepareWAMessageMedia({ image: { url: coverUrl } }, { upload: xp.waUploadToServer })

                  cards.push({
                     body: { text: title.length > 50 ? title.substring(0, 47) + '...' : title },
                     footer: { text: `👤 ${v.author.nickname} | ❤️ ${v.digg_count}` },
                     header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                     nativeFlowMessage: {
                        buttons: [
                           {
                              name: "quick_reply",
                              buttonParamsJson: JSON.stringify({
                                 display_text: "🎥 Download",
                                 id: `.tiktok ${playUrl} -video`
                              })
                           },
                           {
                              name: "cta_url",
                              buttonParamsJson: JSON.stringify({
                                 display_text: "🔗 Link",
                                 url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`,
                                 merchant_url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
                              })
                           }
                        ]
                     }
                  })
               } catch (e) {
                  console.error('Error preparing card:', e)
               }
            }

            await xp.relayMessage(chat.id, {
               viewOnceMessage: {
                  message: {
                     interactiveMessage: {
                        body: { text: `🎵 *TIKTOK SEARCH V2*\n🔎 Query: ${query}` },
                        header: { hasMediaAttachment: false },
                        carouselMessage: { cards }
                     }
                  }
               }
            }, { quoted: m })

         } catch (e) {
            console.error('TTSearch V2 Error:', e)
            m.reply('Gagal mencari video TikTok (V2).')
         }
      }
   })

   // --- CUACA (API) ---
   ev.on({
      name: 'cuaca',
      cmd: ['cuaca'],
      tags: 'Search Menu',
      desc: 'Cek cuaca',
      run: async (xp, m, { args }) => {
         if (!args[0]) return m.reply('Kota?')
         try {
            const { result } = await fetch(`https://api.elrayyxml.web.id/api/search/cuaca?city=${encodeURIComponent(args.join(' '))}`).then(r => r.json())
            if (!result) return m.reply('Kota tidak ditemukan.')
            m.reply(`🌦️ *CUACA: ${result.city_name}*\n\n🌡️ Suhu: ${result.temp}°C\n💧 Lembab: ${result.humidity}%\n🌬️ Angin: ${result.wind_speed} m/s\n☁️ Kondisi: ${result.weather_description}`)
         } catch { m.reply('Error.') }
      }
   })

   // --- JADWAL TV ---
   ev.on({
      name: 'jadwaltv',
      cmd: ['jadwaltv', 'tv', 'acaratv'],
      tags: 'Search Menu',
      desc: 'Cek jadwal acara TV',
      run: async (xp, m, { args, chat }) => {
         const available = ['rcti', 'sctv', 'indosiar', 'gtv', 'transtv', 'trans7', 'mnctv', 'antv', 'rtv', 'kompastv', 'tvone', 'metrotv', 'nettv']

         if (!args[0]) return m.reply(`📺 *JADWAL TV INDONESIA*\n        \nGunakan: .tv <channel>\n\nDaftar Channel:\n${available.map(c => `• ${c.toUpperCase()}`).join('\n')}`)

         try {
            await xp.sendMessage(chat.id, { react: { text: '📺', key: m.key } })

            const channel = args[0].toLowerCase()
            const res = await fetch(`https://api.zenitsu.web.id/api/info/jadwaltv?channel=${channel}`).then(r => r.json())

            if (res.statusCode !== 200 || !res.results || res.results.length === 0) {
               return m.reply('Jadwal tidak ditemukan atau channel salah.')
            }

            let txt = `📺 *JADWAL TV: ${channel.toUpperCase()}*\n━━━━━━━━━━━━━━━━\n`

            res.results.forEach(p => {
               txt += `🕐 ${p.jam.replace('WIB', '').trim()} - ${p.acara}\n`
            })

            m.reply(txt)

         } catch (e) {
            console.error(e)
            m.reply('Gagal mengambil jadwal TV.')
         }
      }
   })

   // --- INFO KOTA (CUACA & JADWAL SHOLAT) ---
   ev.on({
      name: 'kota',
      cmd: ['kota', 'city'],
      tags: 'Search Menu',
      desc: 'Info lengkap kota (Cuaca & Sholat)',
      run: async (xp, m, { args, chat }) => {
         try {
            const kota = args.join(' ')
            if (!kota) return m.reply('Masukkan nama kota! Contoh: .kota Jakarta')

            await xp.sendMessage(chat.id, { react: { text: '🔎', key: m.key } })

            const weatherRes = await fetch(`https://wttr.in/${encodeURIComponent(kota)}?format=j1`).then(r => r.json()).catch(() => null)

            const prayerRes = await fetch(`http://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(kota)}&country=Indonesia&method=11`).then(r => r.json()).catch(() => null)

            if (!weatherRes || !prayerRes) return m.reply('Maaf, data kota tidak ditemukan.')

            const current = weatherRes.current_condition[0]
            const location = weatherRes.nearest_area[0]
            const prayer = prayerRes.data.timings

            const txt = `🏙️ *INFORMASI KOTA: ${location.areaName[0].value.toUpperCase()}*
━━━━━━━━━━━━━━━━
📍 *Lokasi:* ${location.region[0].value}, ${location.country[0].value}
🌡️ *Suhu:* ${current.temp_C}°C (Terasa: ${current.FeelsLikeC}°C)
☁️ *Cuaca:* ${current.weatherDesc[0].value}
💧 *Kelembaban:* ${current.humidity}%
🌬️ *Angin:* ${current.windspeedKmph} km/h

🕌 *JADWAL SHOLAT HARI INI*
━━━━━━━━━━━━━━━━
🌌 *Subuh:* ${prayer.Fajr}
🌞 *Terbit:* ${prayer.Sunrise}
☀️ *Dzuhur:* ${prayer.Dhuhr}
🕒 *Ashar:* ${prayer.Asr}
🌅 *Maghrib:* ${prayer.Maghrib}
🌙 *Isya:* ${prayer.Isha}

_Data by Wttr.in & Aladhan_`

            await xp.sendMessage(chat.id, {
               text: txt,
               contextInfo: {
                  externalAdReply: {
                     title: `Weather & Prayer Times`,
                     body: location.areaName[0].value,
                     thumbnailUrl: global.thumbnail,
                     mediaType: 1,
                     renderLargerThumbnail: true
                  }
               }
            }, { quoted: m })

         } catch (e) {
            console.error(e)
            m.reply('Terjadi kesalahan saat mengambil data kota.')
         }
      }
   })



   // --- ZODIAK (PRIMBON NEXRAY) ---
   ev.on({
      name: 'zodiak',
      cmd: ['zodiak', 'zodiac'],
      tags: 'Fun Menu',
      desc: 'Cek ramalan zodiak harian (Primbon)',
      run: async (xp, m, { args, chat }) => {
         const zodiacSign = args[0]?.toLowerCase();
         const validSigns = ['capricorn', 'aquarius', 'pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius'];

         if (!zodiacSign || !validSigns.includes(zodiacSign)) {
            return m.reply(`Masukkan nama zodiak yang valid!\n\nContoh: .zodiak libra\n\nDaftar Zodiak:\n- ${validSigns.join('\n- ')}`);
         }

         try {
            await xp.sendMessage(chat.id, { react: { text: '✨', key: m.key } });

            // Menggunakan API NexRay
            const api = `https://api.nexray.web.id/primbon/zodiak?zodiak=${zodiacSign}`
            const res = await fetch(api).then(r => r.json());

            if (!res.status || !res.result) throw new Error('Ramalan zodiak tidak ditemukan.');

            const z = res.result;
            let txt = `✨ *RAMALAN ZODIAK - ${zodiacSign.toUpperCase()}*\n\n`;
            txt += `📜 *Deskripsi:*\n${z.zodiak}\n\n`;
            txt += `🔢 *Nomor Keberuntungan:* ${z.nomor_keberuntungan}\n`;
            txt += `🌸 *Aroma:* ${z.aroma_keberuntungan}\n`;
            txt += `🪐 *Planet:* ${z.planet_yang_mengitari}\n`;
            txt += `🌺 *Bunga:* ${z.bunga_keberuntungan}\n`;
            txt += `🎨 *Warna:* ${z.warna_keberuntungan}\n`;
            txt += `💎 *Batu:* ${z.batu_keberuntungan}\n`;
            txt += `🌊 *Elemen:* ${z.elemen_keberuntungan}\n`;
            txt += `❤️ *Pasangan:* ${z.pasangan_zodiak}\n`;

            // Kirim dengan gambar ilustrasi (opsional, ambil dari wikimedia atau static)
            const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Zodiac_woodcut.jpg/1200px-Zodiac_woodcut.jpg';

            await xp.sendMessage(chat.id, {
               text: txt,
               contextInfo: {
                  externalAdReply: {
                     title: "RAMALAN PRIMBON ZODIAK",
                     body: "Powered by NexRay",
                     thumbnailUrl: thumb,
                     mediaType: 1,
                     renderLargerThumbnail: true
                  }
               }
            }, { quoted: m });

         } catch (e) {
            console.error('Zodiak Error:', e);
            m.reply('Gagal mengambil ramalan zodiak.');
         }
      }
   });

   // --- CEK NOMOR HOKI (NEXRAY) ---
   ev.on({
      name: 'nomorhoki',
      cmd: ['nomorhoki', 'ceknomor', 'hoki', 'baguashuzi'],
      tags: 'Fun Menu',
      desc: 'Cek keberuntungan nomor HP (Bagua Shuzi)',
      run: async (xp, m, { args, chat }) => {
         let number = args[0] || m.sender.split('@')[0];
         // Pastikan format 62xxx
         number = number.replace(/\D/g, '');
         if (number.startsWith('08')) number = '62' + number.slice(1);
         if (number.startsWith('8')) number = '62' + number;

         try {
            await xp.sendMessage(chat.id, { react: { text: '🎱', key: m.key } });

            const api = `https://api.nexray.web.id/primbon/nomerhoki?phone_number=${number}`
            const res = await fetch(api).then(r => r.json());

            if (!res.status || !res.result) throw new Error('Data tidak ditemukan.');

            const r = res.result;
            const pos = r.energi_positif;
            const neg = r.energi_negatif;
            const bagua = r.angka_bagua_shuzi;

            let txt = `🎱 *ANALISIS NOMOR HOKI* 🎱\n`
            txt += `📱 *Nomor:* ${r.nomor}\n\n`

            txt += `☯️ *BAGUA SHUZI:* ${bagua.value}%\n`
            txt += `_(${bagua.description})_\n\n`

            txt += `✨ *ENERGI POSITIF:* ${pos.total}%\n`
            txt += `├ 💰 Kekayaan: ${pos.details.kekayaan ? '✅' : '❌'}\n`
            txt += `├ 🩺 Kesehatan: ${pos.details.kesehatan ? '✅' : '❌'}\n`
            txt += `├ ❤️ Cinta: ${pos.details.cinta ? '✅' : '❌'}\n`
            txt += `└ ⚖️ Kestabilan: ${pos.details.kestabilan ? '✅' : '❌'}\n\n`

            txt += `⚠️ *ENERGI NEGATIF:* ${neg.total}%\n`
            txt += `├ 🔥 Perselisihan: ${neg.details.perselisihan ? '⚠️' : '✅'}\n`
            txt += `├ 💨 Kehilangan: ${neg.details.kehilangan ? '⚠️' : '✅'}\n`
            txt += `├ ⛈️ Malapetaka: ${neg.details.malapetaka ? '⚠️' : '✅'}\n`
            txt += `└ 🏚️ Kehancuran: ${neg.details.kehancuran ? '⚠️' : '✅'}\n\n`

            txt += `📜 *KESIMPULAN:*\n${r.analisis.description}`;

            // Kirim pesan
            await xp.sendMessage(chat.id, {
               text: txt,
               contextInfo: {
                  externalAdReply: {
                     title: "NUMEROLOGI HOKI",
                     body: "Powered by NexRay",
                     thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Bagua-name-earlier.svg/1200px-Bagua-name-earlier.svg.png',
                     mediaType: 1,
                     renderLargerThumbnail: true
                  }
               }
            }, { quoted: m });

         } catch (e) {
            console.error('Nomor Hoki Error:', e);
            m.reply('Gagal menganalisis nomor.');
         }
      }
   });

   // --- CEK POTENSI PENYAKIT (NEXRAY) ---
   ev.on({
      name: 'cekpenyakit',
      cmd: ['cekpenyakit', 'potensipenyakit', 'ceksakit', 'kesehatan'],
      tags: 'Fun Menu',
      desc: 'Cek potensi penyakit berdasarkan tanggal lahir (Primbon)',
      run: async (xp, m, { args, chat }) => {
         const input = args.join(' ');
         if (!input) return m.reply(`❌ Masukkan tanggal lahir!\n\nFormat: DD-MM-YYYY\nContoh: .cekpenyakit 12-01-2008`);

         // Parse date (support - / or space)
         const dateMatch = input.match(new RegExp('(\\d{1,2})[/\\-\\s](\\d{1,2})[/\\-\\s](\\d{4})'));
         if (!dateMatch) return m.reply('❌ Format tanggal salah. Gunakan DD-MM-YYYY.');

         const tanggal = dateMatch[1];
         const bulan = dateMatch[2];
         const tahun = dateMatch[3];

         try {
            await xp.sendMessage(chat.id, { react: { text: '🩺', key: m.key } });

            const api = `https://api.nexray.web.id/primbon/penyakit?tanggal=${tanggal}&bulan=${bulan}&tahun=${tahun}`
            const res = await fetch(api).then(r => r.json());

            if (!res.status || !res.result) throw new Error('Data tidak ditemukan.');

            const r = res.result;

            let txt = `🩺 *ANALISA KESEHATAN (PRIMBON)* 🩺\n`
            txt += `📅 Tgl Lahir: ${tanggal}-${bulan}-${tahun}\n\n`;

            txt += `📐 *ANALISA PITAGORAS:*\n${r.analisa}\n\n`;
            txt += `🌳 *SEKTOR ELEMEN:*\n${r.sektor}\n\n`;
            txt += `⚠️ *POTENSI PENYAKIT:*\n${r.elemen}\n\n`;
            txt += `📝 *CATATAN:*\n_${r.catatan}_`;

            await xp.sendMessage(chat.id, {
               text: txt,
               contextInfo: {
                  externalAdReply: {
                     title: "PRIMBON KESEHATAN",
                     body: "Analisa Elemen Tubuh",
                     thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Caduceus.svg/800px-Caduceus.svg.png',
                     mediaType: 1,
                     renderLargerThumbnail: true
                  }
               }
            }, { quoted: m });

         } catch (e) {
            console.error('Cek Penyakit Error:', e);
            m.reply('Gagal mengambil data kesehatan.');
         }
      }
   });

   // --- CEK REJEKI WETON (NEXRAY) ---
   ev.on({
      name: 'cekrejeki',
      cmd: ['cekrejeki', 'rejekiweton', 'weton', 'hoki'],
      tags: 'Fun Menu',
      desc: 'Cek ramalan rejeki berdasarkan weton (Primbon)',
      run: async (xp, m, { args, chat }) => {
         const input = args.join(' ');
         if (!input) return m.reply(`❌ Masukkan tanggal lahir!\n\nFormat: DD-MM-YYYY\nContoh: .cekrejeki 12-01-2008`);

         const dateMatch = input.match(new RegExp('(\\d{1,2})[/\\-\\s](\\d{1,2})[/\\-\\s](\\d{4})'));
         if (!dateMatch) return m.reply('❌ Format tanggal salah. Gunakan DD-MM-YYYY.');

         const tanggal = dateMatch[1];
         const bulan = dateMatch[2];
         const tahun = dateMatch[3];

         try {
            await xp.sendMessage(chat.id, { react: { text: '💰', key: m.key } });

            const api = `https://api.nexray.web.id/primbon/rejekihoki-weton?tanggal=${tanggal}&bulan=${bulan}&tahun=${tahun}`
            const res = await fetch(api).then(r => r.json());

            if (!res.status || !res.result) throw new Error('Data tidak ditemukan.');

            const r = res.result;

            let txt = `💰 *RAMALAN REJEKI WETON* 💰\n`
            txt += `📅 Tgl Lahir: ${tanggal}-${bulan}-${tahun}\n`;
            txt += `🗓️ Weton: *${r.hari_lahir}*\n\n`;

            txt += `🔮 *PREDIKSI REJEKI:*\n${r.rejeki}\n\n`;
            txt += `💡 *CATATAN:*\n_${r.catatan}_`;

            await xp.sendMessage(chat.id, {
               text: txt,
               contextInfo: {
                  externalAdReply: {
                     title: "PRIMBON REJEKI",
                     body: `Weton: ${r.hari_lahir}`,
                     thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Javanese_calendar.svg/1200px-Javanese_calendar.svg.png',
                     mediaType: 1,
                     renderLargerThumbnail: true
                  }
               }
            }, { quoted: m });

         } catch (e) {
            console.error('Cek Rejeki Error:', e);
            m.reply('Gagal mengambil ramalan rejeki.');
         }
      }
   });
}