import { createRequire } from "module";
import axios from "axios";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');
import { sendIAMessage } from '../../../system/function.js'
import { convertToOpus, processMedia } from '../../../system/ffmpeg.js'
import { webpToVideo } from '../../../system/lib/converter.js'

export default function(ev) {
    // --- TO VN (PTT) ---
    ev.on({
        name: 'tovn',
        cmd: ['tovn', 'toptt'],
        tags: 'Tools Menu',
        desc: 'Konversi Audio/Video ke Voice Note (PTT)',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
                const mime = (q.audioMessage || q.videoMessage || {}).mimetype || ''
                
                if (!/audio|video/.test(mime)) return m.reply('❌ Reply Audio/Video dengan caption .tovn')
    
                await xp.sendMessage(chat.id, { react: { text: '🎤', key: m.key } })
    
                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                const audioBuffer = await convertToOpus(buffer)
                
                await xp.sendMessage(chat.id, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mpeg', 
                    ptt: true 
                }, { quoted: m })
    
            } catch (e) {
                console.error(e)
                m.reply('Gagal konversi ke VN.')
            }
        }
    })

    // --- TO MP3 (AUDIO) ---
    ev.on({
        name: 'toaudio',
        cmd: ['toaudio', 'tomp3', 'mp3'],
        tags: 'Tools Menu',
        desc: 'Konversi Video ke Audio (MP3)',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
                const mime = (q.audioMessage || q.videoMessage || {}).mimetype || ''
                
                if (!/audio|video/.test(mime)) return m.reply('❌ Reply Video dengan caption .tomp3')
    
                await xp.sendMessage(chat.id, { react: { text: '🎵', key: m.key } })
    
                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                const audioBuffer = await processMedia(buffer, ['-vn', '-acodec', 'libmp3lame', '-b:a', '128k'], 'mp3')
                
                await xp.sendMessage(chat.id, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mpeg', 
                    ptt: false 
                }, { quoted: m })
    
            } catch (e) {
                console.error(e)
                m.reply('Gagal konversi ke MP3.')
            }
        }
    })

    // --- STICKER TO IMG ---
    ev.on({
        name: 'toimg',
        cmd: ['toimg', 'img', 'sticker2img'],
        tags: 'Tools Menu',
        desc: 'Konversi stiker ke gambar',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                const sticker = q?.stickerMessage
                
                if (!sticker) return m.reply('❌ Reply stiker dengan caption .toimg')
                if (sticker.isAnimated) return m.reply('❌ Stiker gerak belum didukung (Gunakan .tovid)')
    
                await xp.sendMessage(chat.id, { react: { text: '🖼️', key: m.key } })
    
                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                await xp.sendMessage(chat.id, { image: buffer, caption: '✅ Sticker to Image Success' }, { quoted: m })
    
            } catch (e) {
                console.error(e)
                m.reply('Gagal konversi stiker.')
            }
        }
    })

    // --- STICKER TO GIF (VIDEO) ---
    ev.on({
        name: 'togif',
        cmd: ['togif', 'tovideo', 'tomp4', 'tovid'],
        tags: 'Tools Menu',
        desc: 'Konversi stiker (animated) ke Video/GIF',
        run: async (xp, m, { chat }) => {
            try {
                const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                const sticker = q?.stickerMessage
                
                if (!sticker) return m.reply('❌ Reply stiker dengan caption .togif')

                await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

                const buffer = await downloadMediaMessage({ message: q }, 'buffer')
                
                // Use Local Converter
                const resultBuffer = await webpToVideo(buffer)
                
                await xp.sendMessage(chat.id, { 
                    video: resultBuffer, 
                    caption: '✅ Sticker to GIF Success',
                    gifPlayback: true 
                }, { quoted: m })

            } catch (e) {
                console.error(e)
                m.reply('Gagal konversi stiker ke GIF/Video.')
            }
        }
    })

    // --- TEXT TO PDF ---
    ev.on({
        name: 'topdf',
        cmd: ['topdf', 'makepdf'],
        tags: 'Tools Menu',
        desc: 'Konversi teks ke dokumen PDF',
        run: async (xp, m, { args }) => {
            const pdfkit = await import('pdfkit');
            const PDFDocument = pdfkit.default || pdfkit;
            
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let text = args.join(' ');

            if (!text && quoted) {
                text = quoted.conversation || quoted.extendedTextMessage?.text || '';
            }

            if (!text) return m.reply('Masukkan teks atau reply pesan yang ingin dijadikan PDF.');

            try {
                await xp.sendMessage(m.chat, { react: { text: '📄', key: m.key } });

                const doc = new PDFDocument({ size: 'A4', margin: 50 });
                
                // Stream the PDF to a buffer
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', async () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    
                    await xp.sendMessage(m.chat, {
                        document: pdfBuffer,
                        mimetype: 'application/pdf',
                        fileName: 'converted.pdf',
                        caption: '✅ Teks berhasil dikonversi ke PDF.'
                    }, { quoted: m });
                });

                // Add content to the PDF
                doc.fontSize(12).font('Helvetica').text(text, {
                    align: 'left'
                });

                // Finalize the PDF and end the stream
                doc.end();

            } catch (e) {
                console.error("toPDF Error:", e);
                m.reply("Gagal membuat file PDF.");
            }
        }
    });
}