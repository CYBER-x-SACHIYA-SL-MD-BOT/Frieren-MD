import axios from 'axios'
import FormData from 'form-data'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');
import { tmpFiles } from '../../../system/tmpfiles.js'

export default function(ev) {
    // --- REMOVE BACKGROUND ---
    ev.on({
        name: 'removebg',
        cmd: ['removebg', 'rmbg'],
        tags: 'Tools Menu',
        desc: 'Hapus background foto (AI)',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
                const mime = (q.imageMessage || q.stickerMessage || {}).mimetype || ''
                
                if (!mime) return m.reply('❌ Kirim/Reply foto dengan caption .rmbg')
                if (q.stickerMessage?.isAnimated) return m.reply('❌ Sticker GIF tidak didukung.')

                await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                
                const form = new FormData()
                form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

                const { data } = await axios.post('https://removebg.one/api/predict/v2', form, {
                    headers: {
                        ...form.getHeaders(),
                        'user-agent': 'Mozilla/5.0 (Linux; Android 10)',
                        'origin': 'https://removebg.one',
                        'referer': 'https://removebg.one/upload'
                    }
                })

                if (!data?.data?.cutoutUrl) throw new Error('Gagal hapus background.')

                const resImg = await axios.get(data.data.cutoutUrl, { responseType: 'arraybuffer' })
                
                await xp.sendMessage(chat.id, { 
                    image: resImg.data, 
                    caption: '✅ Background Removed' 
                }, { quoted: m })

            } catch (e) {
                console.error(e)
                m.reply('Gagal menghapus background. Coba gambar lain.')
            }
        }
    })

    // --- HD / REMINI ---
    ev.on({
        name: 'hd',
        cmd: ['hd', 'tohd'],
        tags: 'Tools Menu',
        desc: 'Enhance photo quality',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
                const img = q?.imageMessage
                if (!img) return m.reply('Reply gambar dengan .hd')
                
                await xp.sendMessage(chat.id, { react: { text: '🖌️', key: m.key } })
                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                const imgUrl = await tmpFiles(buffer)
                const api = `https://api.deline.web.id/tools/hd?url=${encodeURIComponent(imgUrl)}`
                
                await xp.sendMessage(chat.id, { image: { url: api }, caption: '✨ HD Success' }, { quoted: m })
            } catch (e) { m.reply('Gagal proses HD.') }
        }
    })


    // --- IMAGE TO ASCII ---
    ev.on({
        name: 'imagetoascii',
        cmd: ['imagetoascii', 'imgascii', 'ascii'],
        tags: 'Tools Menu',
        desc: 'Konversi gambar ke teks ASCII (WhatsApp Optimized)',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
                const mime = (q.imageMessage || q.stickerMessage || {}).mimetype || ''
                
                if (!mime || !/image\/(jpe?g|png|webp)/i.test(mime)) return m.reply('❌ Kirim/Reply gambar dengan caption .ascii')
    
                await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
    
                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                
                // WhatsApp friendly width (Max ~30-35 chars per line for mobile)
                let width = 28 
    
                const form = new FormData()
                form.append("format", "ascii")
                form.append("width", String(width))
                form.append("textcolor", "#000000")
                form.append("bgcolor", "#ffffff")
                form.append("invert", "0")
                form.append("contrast", "1")
                form.append("image", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    
                const res = await fetch("https://www.text-image.com/convert/result.cgi", {
                    method: "POST",
                    body: form,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        ...form.getHeaders()
                    }
                })
    
                const html = await res.text()
                const $ = cheerio.load(html)
                const ascii = $("#tiresult").text().trim()
    
                if (!ascii) throw new Error('Gagal konversi (Hasil kosong)')
    
                if (ascii.length > 2000) {
                    await xp.sendMessage(chat.id, { 
                        document: Buffer.from(ascii), 
                        mimetype: 'text/plain', 
                        fileName: 'ascii_art.txt',
                        caption: '🖼️ ASCII Art (Dikirim sebagai file karena terlalu panjang)'
                    }, { quoted: m })
                } else {
                    m.reply(`*✨ ASCII ART ✨*\n\n\`\`\`\n${ascii}\n\`\`\``)
                }
    
            } catch (e) {
                console.error(e)
                m.reply('Gagal mengonversi gambar ke ASCII.')
            }
        }
    })

    // --- EZREMOVE ---
    ev.on({
        name: 'ezremove',
        cmd: ['rmwm', 'watermark'],
        tags: 'Tools Menu',
        desc: 'Hapus watermark gambar',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
                const mime = (q.imageMessage || q.stickerMessage || {}).mimetype || ''
                
                if (!mime || !/image\/(jpe?g|png|webp)/i.test(mime)) return m.reply('❌ Kirim/Reply gambar dengan caption .ezremove')
    
                await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
    
                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                
                const form = new FormData()
                form.append('image_file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    
                const create = await axios.post(
                    'https://api.ezremove.ai/api/ez-remove/watermark-remove/create-job',
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),
                            'User-Agent': 'Mozilla/5.0',
                            origin: 'https://ezremove.ai',
                            'product-serial': 'sr-' + Date.now()
                        }
                    }
                ).then(v => v.data).catch(() => null)
    
                if (!create || !create.result || !create.result.job_id) {
                     return m.reply('Gagal membuat job watermark removal.')
                }
    
                const job = create.result.job_id
                let resultUrl = null
    
                for (let i = 0; i < 15; i++) {
                    await new Promise(r => setTimeout(r, 2000))
    
                    const check = await axios.get(
                        `https://api.ezremove.ai/api/ez-remove/watermark-remove/get-job/${job}`,
                        {
                            headers: {
                                'User-Agent': 'Mozilla/5.0',
                                origin: 'https://ezremove.ai',
                                'product-serial': 'sr-' + Date.now()
                            }
                        }
                    ).then(v => v.data).catch(() => null)
    
                    if (check && check.code === 100000 && check.result && check.result.output) {
                        resultUrl = check.result.output[0]
                        break
                    }
    
                    if (!check || !check.code || check.code !== 300001) break
                }
    
                if (resultUrl) {
                    await xp.sendMessage(chat.id, { image: { url: resultUrl }, caption: '✅ Watermark Removed' }, { quoted: m })
                } else {
                    m.reply('Gagal/Timeout saat menghapus watermark.')
                }
    
            } catch (e) {
                console.error(e)
                m.reply('Terjadi kesalahan.')
            }
        }
    })

    // --- UPSCALE V2 ---
    ev.on({
        name: 'upscale',
        cmd: ['upscalev2', 'hd2', 'remini2'],
        tags: 'Tools Menu',
        desc: 'Upscale gambar (AI Enhancer)',
        prefix: false,
        run: async (xp, m, { chat }) => {
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            try {
                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || "";

                if (!mime.startsWith("image/")) {
                    return m.reply(`*Reply atau kirim gambar yang ingin di-upscale.*`);
                }

                await xp.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

                let buffer = await downloadMediaMessage({ message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message }, 'buffer');
                if (!buffer) {
                    return m.reply(`🍂 *Gagal membaca gambar.*`);
                }

                let base64 = Buffer.from(buffer).toString("base64");

                let create = await fetch("https://aienhancer.ai/api/v1/r/image-enhance/create", {
                    method: "POST",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                        "Content-Type": "application/json",
                        "Origin": "https://aienhancer.ai",
                        "Referer": "https://aienhancer.ai/ai-image-upscaler"
                    },
                    body: JSON.stringify({
                        model: 3,
                        image: `data:image/jpeg;base64,${base64}`,
                        settings: "kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw="
                    })
                });

                let createJson = await create.json();
                let taskId = createJson?.data?.id;

                if (!taskId) {
                    return m.reply(`🍂 *Gagal membuat task upscale.*`);
                }

                let outputUrl;
                for (let i = 0; i < 10; i++) {
                    await sleep(3000);

                    let res = await fetch("https://aienhancer.ai/api/v1/r/image-enhance/result", {
                        method: "POST",
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                            "Content-Type": "application/json",
                            "Origin": "https://aienhancer.ai",
                            "Referer": "https://aienhancer.ai/ai-image-upscaler"
                        },
                        body: JSON.stringify({ task_id: taskId })
                    });

                    let json = await res.json();
                    if (json?.data?.status === "succeeded") {
                        outputUrl = json.data.output;
                        break;
                    }
                }

                if (!outputUrl) {
                    return m.reply(`🍂 *Upscale timeout, server terlalu lama merespons.*`);
                }

                await xp.sendMessage(
                    m.chat,
                    { image: { url: outputUrl }, caption: '✨ *UPSCALE SUCCESS*' },
                    { quoted: m }
                );

            } catch (e) {
                await m.reply(`🍂 *Upscale error:* ${e.message}`);
            } finally {
                // await xp.sendMessage(m.chat, { react: { text: "", key: m.key } });
            }
        }
    })
}
