import { createRequire } from "module";
import fetch from 'node-fetch';
import crypto from 'crypto';
const require = createRequire(import.meta.url);
const { downloadMediaMessage, generateWAMessageFromContent, generateWAMessageContent, proto } = require('@adiwajshing/baileys');
import { normalizeJid } from '#system/msg.js';

// Helper function to create Group Status message (FallEzz style)
async function groupSatus(xp, jid, content, statusJidList) {
  const inside = await generateWAMessageContent(content, {
    upload: xp.waUploadToServer
  });
  const messageSecret = crypto.randomBytes(32);
  const m = generateWAMessageFromContent(jid, {
    messageContextInfo: {
      messageSecret 
    },
    groupStatusMessageV2: {
      message: {
        ...inside,
        messageContextInfo: {
          messageSecret
        }
      }
    }
  }, { userJid: xp.user.id });
  
  await xp.relayMessage(jid, m.message, {
    messageId: m.key.id,
    statusJidList: statusJidList // Pass audience list
  });
  return m;
}

export default function ownerBroadcast(ev) {
  ev.on({
    name: 'broadcast',
    cmd: ['broadcast', 'bc', 'bcgc'],
    tags: 'Owner Menu',
    desc: 'Broadcast pesan ke semua grup',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        const text = args.join(' ')
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        
        if (!text && !quoted) return xp.sendMessage(chat.id, { text: 'Masukkan pesan broadcast atau reply media' }, { quoted: m })

        const groups = await xp.groupFetchAllParticipating()
        const list = Object.keys(groups)
        
        xp.sendMessage(chat.id, { text: `Mengirim broadcast ke ${list.length} grup...` }, { quoted: m })

        for (const id of list) {
            await new Promise(r => setTimeout(r, 1500)) 
            
            if (quoted) {
                await xp.sendMessage(id, { forward: { key: { remoteJid: m.chat, fromMe: false }, message: quoted } })
            } else {
                await xp.sendMessage(id, { text: `📢 *BROADCAST*\n\n${text}` })
            }
        }
        
        xp.sendMessage(chat.id, { text: '✅ Broadcast selesai' }, { quoted: m })
      } catch (e) {
        console.error('error pada broadcast', e)
        m.reply('Gagal melakukan broadcast.')
      }
    }
  })

  ev.on({
    name: 'setppbot',
    cmd: ['setppbot', 'setbotpp', 'seticonbot', 'setboticon'],
    tags: 'Owner Menu',
    desc: 'Ganti foto profil bot',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { chat }) => {
      let buffer;
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const message = m.message?.ephemeralMessage?.message || m.message || {}
        const content = quoted || message
        
        const image = content.imageMessage || 
                      content.viewOnceMessage?.message?.imageMessage || 
                      content.viewOnceMessageV2?.message?.imageMessage

        if (!image) return xp.sendMessage(chat.id, { text: '❌ Kirim atau Reply gambar dengan caption .setppbot' }, { quoted: m })

        buffer = await downloadMediaMessage({ message: content }, 'buffer')
      } catch (e) {
        console.error('Error downloading media for setppbot:', e)
        return xp.sendMessage(chat.id, { text: '❌ Gagal mendownload gambar. Coba gambar lain.' }, { quoted: m })
      }

      try {
        const botJid = normalizeJid(xp.user.id);
        await xp.updateProfilePicture(botJid, buffer);
        xp.sendMessage(chat.id, { text: '✅ Foto profil bot berhasil diganti' }, { quoted: m });
      } catch (e) {
        console.error('Error updating profile picture:', e);
        xp.sendMessage(chat.id, { text: '❌ Gagal mengganti foto profil. Pastikan format gambar benar.' }, { quoted: m });
      }
    }
  })

  // --- DELETE STATUS ---
  ev.on({
      name: 'delsw',
      cmd: ['delsw', 'deletestatus'],
      tags: 'Owner Menu',
      desc: 'Hapus status yang dikirim bot (Reply pesan status atau masukkan ID)',
      owner: false, 
      admin: true,
      run: async (xp, m, { args }) => {
          let keyId = args[0]
          // Check reply
          if (!keyId && m.quoted) {
               const qText = m.quoted.text || ''
               const match = qText.match(/ID:\s*([A-Za-z0-9]+)/)
               if (match) keyId = match[1]
          }
          
          if (!keyId) return m.reply('❌ Masukkan ID status atau reply pesan konfirmasi upload status.\nContoh: .delsw 3EB0...')

          try {
              const statusJid = 'status@broadcast'
              const key = {
                  remoteJid: statusJid,
                  id: keyId,
                  fromMe: true 
              }
              
              await xp.sendMessage(statusJid, { delete: key })
              m.reply('✅ Status berhasil dihapus.')
          } catch (e) {
              console.error('delsw error:', e)
              m.reply('❌ Gagal menghapus status. ID mungkin salah atau sudah terhapus.')
          }
      }
  })

  // --- UPLOAD STATUS (Public/Group/Owner) ---
  ev.on({
    name: 'upsw',
    cmd: ['upsw', 'upswgc', 'upswowner', 'upstatus'],
    tags: 'Owner Menu',
    desc: 'Buat status WA (.upsw = Publik, .upswgc = Member Grup, .upswowner = Khusus Owner)',
    owner: false,
    admin: true,
    group: false, 
    run: async (xp, m, { args, chat, command, isAdmin, isBotAdmin, isOwner, usedPrefix }) => {
        try {
            const isGroupMode = command === 'upswgc'
            const isOwnerMode = command === 'upswowner'
            
            // --- VALIDASI AWAL ---
            if (isGroupMode) {
                if (!m.isGroup) return m.reply('❌ Command .upswgc hanya bisa digunakan di dalam grup!')
               /* if (!isAdmin) return m.reply('❌ Perintah ini khusus Admin Grup!')
                if (!isBotAdmin) return m.reply('❌ Bot harus jadi Admin agar bisa menggunakan perintah ini!') */
            } else if (isOwnerMode) {
                 const senderNum = m.sender.replace(/\D/g, '')
                 const owners = global.ownerNumber || []
                 const checkIsOwner = owners.some(o => o.replace(/\D/g, '') === senderNum)
                 if (!checkIsOwner) return m.reply('❌ Command ini hanya untuk Owner Bot!')
                 m.reply('⏳ Mengirim status Khusus Owner...')
            }

            // --- EKSTRAKSI INPUT ---
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
            let teks = args.join(' ')
            let mediaBuffer;
            let mimeType = '';

            let targetGc = m.chat; // Default target adalah chat saat ini

            // Logic untuk Owner kirim ke grup lain
            if (isOwner && isGroupMode && teks.includes("|")) {
                const parts = teks.split("|");
                targetGc = parts[0].trim(); // JID grup target
                teks = parts.slice(1).join("|").trim(); // Sisa teks jadi caption
                if (!targetGc.endsWith('@g.us')) return m.reply('❌ Format JID grup tidak valid (contoh: 12345@g.us)')
            }
            
            // --- MEDIA HANDLING ---
            let msgOptions = {};
            if (quoted) {
                const type = Object.keys(quoted)[0]
                mimeType = quoted[type]?.mimetype
                
                if (mimeType && /image|video|audio/.test(mimeType)) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, 'buffer')
                    // Fix: ONLY use provided text, IGNORE quoted caption
                    const caption = teks || ''; 
                    
                    if (/image/.test(mimeType)) msgOptions = { image: mediaBuffer, caption }
                    else if (/video/.test(mimeType)) msgOptions = { video: mediaBuffer, caption }
                    else if (/audio/.test(mimeType)) msgOptions = { audio: mediaBuffer, mimetype: "audio/mpeg", ptt: false }; 
                } else {
                    return m.reply("❌ Hanya bisa gambar, video, audio atau teks untuk status grup!");
                }
            } else if (teks) {
                msgOptions = { text: teks };
            } else {
                return m.reply(`Balas gambar/video/audio atau kasih teks!\nContoh: ${usedPrefix + command} hallo`);
            }

            // --- KONSTRUKSI STATUS ---
            let sendTargetJid = 'status@broadcast';
            let sendOpts = {};
            let statusJidList = [];

            // Helper untuk list owner + bot
            const getOwnerList = () => {
                const owners = global.ownerNumber || [];
                const list = owners.map(o => o.replace(/\D/g, '') + '@s.whatsapp.net');
                list.push(normalizeJid(xp.user.id));
                list.push(m.sender); // Sender (Owner)
                return [...new Set(list)];
            };

            if (isGroupMode) {
                // .upswgc: Target Group Members
                sendTargetJid = targetGc; // JID Grup
                
                // Ambil peserta grup
                const metadata = await xp.groupMetadata(sendTargetJid);
                const participants = metadata.participants.map(p => p.id);
                
                // Gabung peserta + owner
                statusJidList = [...new Set(participants.concat(getOwnerList()))];
                
                sendOpts.statusJidList = statusJidList;
                
                // Kirim pakai groupSatus (Visual Status Grup)
                const sentMsg = await groupSatus(xp, sendTargetJid, msgOptions, statusJidList);
                
                let id = sentMsg?.key?.id || '?';
                let successMsg = `✅ Status Grup berhasil diupload.\n🆔 ID: ${id}\n\nBalas pesan ini dengan .delsw untuk menghapus.`;
                xp.sendMessage(m.chat, { text: successMsg }, { quoted: m });
                
                if (m.isGroup) {
                    await xp.sendMessage(m.chat, { text: '📢 *Info Grup*\nStatus baru telah diposting untuk grup ini! Cek tab status.' });
                }
                return; // Selesai

            } else if (isOwnerMode) {
                // .upswowner: Status Kolaborasi (Publik) dengan Visual Grup
                // statusJidList DIBIARKAN KOSONG/UNDEFINED AGAR PUBLIK
                
                if (m.isGroup) {
                    // Gunakan visual grup (2 profil) tapi broadcast ke semua
                    sendTargetJid = m.chat;
                    
                    // Kirim pakai groupSatus (Visual Status Grup)
                    // Pass statusJidList = undefined agar dikirim ke semua kontak (Publik)
                    const sentMsg = await groupSatus(xp, sendTargetJid, msgOptions, undefined);
                    
                    let id = sentMsg?.key?.id || '?';
                    xp.sendMessage(m.chat, { text: `✅ Status Collab Owner (Publik) berhasil diupload.\n🆔 ID: ${id}` }, { quoted: m });
                    return;
                } else {
                    // Jika di PC, kirim sebagai status biasa (Publik)
                    // Lanjut ke logika default di bawah
                }
            } 
            
            // --- Logic Default (.upsw / .upswowner di PC) ---
            if (!teks && !mediaBuffer) return m.reply('❌ Masukkan teks atau reply media!');
            
            // Add background color for text status
            if (msgOptions.text) {
                const colors = [0xFF7ACBA5, 0xFFCB7A7A, 0xFF7A9CCB, 0xFFC2CB7A, 0xFF8C7ACB, 0xFF000000, 0xFFFFFFFF];
                msgOptions.backgroundArgb = colors[Math.floor(Math.random() * colors.length)];
                msgOptions.font = 3; // Serif font
            }
            
            // POPULATE ALL CONTACTS FOR PUBLIC STATUS (.upsw)
            if (!isGroupMode && !isOwnerMode) {
                m.reply('⏳ Sedang memproses dan menyebarkan status ke seluruh kontak...');
                let allJids = getOwnerList();
                
                try {
                    // Ambil dari semua grup yang bot ikuti
                    const groups = await xp.groupFetchAllParticipating().catch(() => ({}));
                    for (const gid in groups) {
                        if (groups[gid].participants) {
                            allJids.push(...groups[gid].participants.map(p => p.id));
                        }
                    }
                    
                    // Ambil dari database (user yang pernah interaksi)
                    const dbUsers = Object.values(await import('#system/db/data.js').then(m => m.db().key || {})).map(u => u.jid).filter(j => j && j.endsWith('@s.whatsapp.net'));
                    allJids.push(...dbUsers);
                } catch (err) {
                    console.error('Failed to fetch all contacts for upsw:', err);
                }
                
                sendOpts.statusJidList = [...new Set(allJids)];
            }
            
            // Kirim ke status@broadcast
            const sentMsg = await xp.sendMessage('status@broadcast', msgOptions, sendOpts);
            
            let id = sentMsg?.key?.id || '?';
            let typeLabel = isOwnerMode ? 'Privat Owner' : 'Publik';
            let successMsg = `✅ Status ${typeLabel} berhasil diupload.\n🆔 ID: ${id}\n\nBalas pesan ini dengan .delsw untuk menghapus.`;
            
            xp.sendMessage(m.chat, { text: successMsg }, { quoted: m });

        } catch (e) {
            console.error('upsw error:', e)
            m.reply('❌ Gagal upload status. Cek konsol atau pastikan Bot adalah Admin Grup.')
        }
    }
  })
}