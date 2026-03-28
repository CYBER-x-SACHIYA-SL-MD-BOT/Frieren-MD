import fetch from 'node-fetch'
import os from 'os'
import { performance } from 'perf_hooks'
import moment from 'moment-timezone'
import { db } from '../../../system/db/data.js'
import { fontStyle } from '../../../system/style.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@adiwajshing/baileys');

export default function dashboard(ev) {
  // --- PING COMMAND (DASHBOARD) ---
  ev.on({
    name: 'ping',
    cmd: ['ping', 'p', 'speed'],
    tags: 'Information Menu',
    desc: 'Cek statistik server dan kecepatan respon (Visual)',
    run: async (xp, m, { chat, command }) => {
        // Measure Processing Time (Real Server Speed)
        // Calculate latency based on message timestamp
        const timestamp = m.messageTimestamp ? (typeof m.messageTimestamp === 'number' ? m.messageTimestamp : m.messageTimestamp.low || m.messageTimestamp) * 1000 : Date.now();
        const latensi = Date.now() - timestamp;
        const pingMs = latensi > 0 ? latensi : Math.abs(latensi); // Handle clock drift
        const finalPing = pingMs.toFixed(2);
        
        const uptime = process.uptime()
        const uptimeStr = [Math.floor(uptime / 3600) + 'h', Math.floor((uptime % 3600) / 60) + 'm', Math.floor(uptime % 60) + 's'].join(' ')
        
        // RAM %
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramPercent = ((usedMem / totalMem) * 100).toFixed(0);
        const formatSize = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';

        const cpus = os.cpus();
        const cpuShort = cpus[0]?.model?.trim() || 'Unknown CPU';

        const stats = {
            platform: os.platform(),
            ping: finalPing, 
            ram: ramPercent + '%',
            totalMem: formatSize(totalMem),
            usedMem: formatSize(usedMem),
            cpuShort: cpuShort,
            cores: cpus.length,
            uptime: uptimeStr,
            os: os.type(),
            node: process.version,
            arch: os.arch()
        };

        try {
            const captionText = `⚡ *STATUS SERVER* ⚡
🚀 Speed: ${finalPing} ms
⏱️ Uptime: ${uptimeStr}
🧠 RAM: ${stats.ram} (${stats.usedMem} / ${stats.totalMem})
💻 Platform: ${stats.platform} ${stats.arch}`;
            
            await xp.sendMessage(chat.id, { 
                text: captionText
            }, { quoted: m });
        } catch (e) {
            console.error('Ping Error:', e);
            m.reply(`Pong! ${finalPing} ms`);
        }
    }
  })

  // --- OWNER COMMAND ---
    ev.on({
        name: 'owner',
        cmd: ['owner', 'creator', 'developer'],
        tags: 'Main Menu',
        desc: 'Menampilkan kontak owner',
        run: async (xp, m, { chat }) => {
            try {
                const owners = global.owner || []
                if (owners.length === 0) return m.reply('❌ Data owner belum dikonfigurasi.')

                // 1. Send Info Card (Aesthetic)
                const firstOwner = owners[0]
                const ownerName = firstOwner[1] || 'Developer'
                const ownerNumber = firstOwner[0].replace(/[^0-9]/g, '')
                const ownerJid = ownerNumber + '@s.whatsapp.net'

                let ppUrl = global.thumbnail || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'
                try {
                    ppUrl = await xp.profilePictureUrl(ownerJid, 'image').catch(() => ppUrl)
                } catch {}

                const caption = `👋 Halo! Berikut adalah kontak Developer/Owner bot ini.\n\n` +
                                `Silakan hubungi jika ada kendala, laporan bug, atau pertanyaan seputar bot.`

                await xp.sendMessage(chat.id, {
                    text: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: `👑 OWNER: ${ownerName.toUpperCase()}`,
                            body: `Generation FRIEREN • Interactive AI`,
                            thumbnailUrl: ppUrl,
                            sourceUrl: global.linkCh || '',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m })

                // 2. Send Contact Cards (Multiple Support)
                const contactList = []
                for (let [num, name] of owners) {
                    const cleanNum = num.replace(/[^0-9]/g, '')
                    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:FRIEREN-MD Bot Owner\nTEL;type=CELL;type=VOICE;waid=${cleanNum}:${cleanNum}\nEND:VCARD`
                    contactList.push({ vcard, displayName: name })
                }

                await xp.sendMessage(chat.id, {
                    contacts: {
                        displayName: `${owners.length} Contacts`,
                        contacts: contactList
                    }
                }, { quoted: m })

            } catch (e) {
                console.error('Owner Command Error:', e)
                m.reply('❌ Terjadi kesalahan saat mengambil data owner.')
            }
        }
    })
}