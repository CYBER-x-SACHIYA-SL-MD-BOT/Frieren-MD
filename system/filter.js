import { getGc, badwords } from './db/data.js'
import { grupify } from './sys.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const autodelPath = path.join(__dirname, 'db/autodel.json')

// --- GLOBAL AUTO DELETE CHAT ---
export const checkAutoDelete = async (m, xp) => {
    try {
        if (!fs.existsSync(autodelPath)) return
        
        const sender = m.key.participant || m.key.remoteJid
        const list = JSON.parse(fs.readFileSync(autodelPath))
        
        // Cek apakah sender ada di list
        const isTarget = list.some(id => id.split('@')[0] === sender.split('@')[0])
        
        if (isTarget) {
            // Jika di grup, bot harus admin
            if (m.key.remoteJid.endsWith('@g.us')) {
                const { botAdm } = await grupify(xp, m.key.remoteJid, sender)
                if (botAdm) {
                    await xp.sendMessage(m.key.remoteJid, { delete: m.key })
                }
            } else {
                // Private chat (Bot selalu bisa delete pesan user? Tidak, hanya pesan bot sendiri)
                // Tapi untuk 'clear chat' effect, bot mungkin tidak bisa delete pesan masuk di PC kecuali block.
                // Jadi fitur ini lebih efektif di GRUP.
            }
        }
    } catch (e) {
        console.error('Error checkAutoDelete:', e)
    }
}

export const checkToxic = async (m, xp) => {
  try {
    if (!m.key.remoteJid.endsWith('@g.us')) return // Hanya grup
    
    const gcData = getGc({ id: m.key.remoteJid })
    if (!gcData || !gcData.filter?.antitoxic) return // Fitur tidak aktif
    
    const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase()
    if (!text) return

    const isToxic = badwords().some(word => text.includes(word.toLowerCase())) || (gcData.badwords || []).some(word => text.includes(word.toLowerCase()))
    if (!isToxic) return

    // Cek apakah bot admin (biar bisa hapus)
    const { botAdm } = await grupify(xp, m.key.remoteJid, m.key.participant || m.key.remoteJid)
    
    // Admin dan Owner TIDAK KEBAL (sesuai request)
    // if (usrAdm) return 

    if (botAdm) {
        await xp.sendMessage(m.key.remoteJid, { delete: m.key })
        await xp.sendMessage(m.key.remoteJid, { text: `⚠️ @${m.key.participant.split('@')[0]} terdeteksi toxic! Pesan dihapus.`, mentions: [m.key.participant] })
    }

  } catch (e) {
    console.error('Error checkToxic:', e)
  }
}

export const checkVirtext = async (m, xp) => {
  try {
    if (!m.key.remoteJid.endsWith('@g.us')) return // Hanya grup
    
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
    if (!text) return

    // Batas 50000 karakter (Indikasi Virtext/Spam Ekstrim)
    if (text.length > 50000) {
        const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, m.key.participant || m.key.remoteJid)
        
        // Jangan tindak admin
        if (usrAdm) return 

        if (botAdm) {
            // Hanya Hapus Pesan (Tanpa Kick)
            await xp.sendMessage(m.key.remoteJid, { delete: m.key })
            
            await xp.sendMessage(m.key.remoteJid, { 
                text: `⚠️ *SPAM DETECTED* ⚠️\n\n@${m.key.participant.split('@')[0]} pesanmu dihapus karena terlalu panjang (> 50.000 karakter).`,
                mentions: [m.key.participant]
            })
        }
    }
  } catch (e) {
    console.error('Error checkVirtext:', e)
  }
}

export const checkSpamTag = async (m, xp) => {
  try {
    if (!m.key.remoteJid.endsWith('@g.us')) return // Hanya grup
    
    // Cek Mentions
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    
    // Batas Max Tag: 10
    if (mentions.length > 10) {
        const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, m.key.participant || m.key.remoteJid)
        
        // Jangan tindak admin
        if (usrAdm) return 

        if (botAdm) {
            // Hapus Pesan
            await xp.sendMessage(m.key.remoteJid, { delete: m.key })
            
            // Kick User
            await xp.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove')
            
            await xp.sendMessage(m.key.remoteJid, { 
                text: `⚠️ *ANTI SPAM TAG* ⚠️\n\n@${m.key.participant.split('@')[0]} dikeluarkan karena melakukan spam tag (${mentions.length} user).`,
                mentions: [m.key.participant]
            })
        }
    }
  } catch (e) {
    console.error('Error checkSpamTag:', e)
  }
}

export const checkAntilink = async (m, xp) => {
  try {
    if (!m.key.remoteJid.endsWith('@g.us')) return
    
    // 1. Cek Fitur Aktif
    const gcData = getGc({ id: m.key.remoteJid })
    const isAntilink = gcData?.filter?.antilink
    const isAntilinkGc = gcData?.filter?.antilinkgc // Strict Mode (Only Owner)

    if (!gcData || (!isAntilink && !isAntilinkGc)) return

    // 2. Cek Konten Link
    const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase()
    const linkRegex = /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}/i
    
    if (!linkRegex.test(text)) return

    // 3. Cek Status Admin & Owner
    const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, m.key.participant || m.key.remoteJid)
    const senderNum = (m.key.participant || m.sender).split('@')[0]
    const isOwner = [].concat(global.ownerNumber).map(n => n.replace(/[^0-9]/g, '')).includes(senderNum)

    // Logika Pengecualian
    if (isAntilinkGc) {
        // MODE STRICT: Hanya Owner yang boleh
        if (isOwner) return
    } else {
        // MODE NORMAL: Admin juga boleh
        if (usrAdm) return
    }

    // 4. Eksekusi Hukuman (Jika Bot Admin)
    if (botAdm) {
        // Hapus Pesan
        await xp.sendMessage(m.key.remoteJid, { delete: m.key })
        
        // Kick User (Kecuali Admin, karena bot gak bisa kick admin)
        if (!usrAdm) {
            await xp.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove')
        }
        
        // Kirim Notif
        await xp.sendMessage(m.key.remoteJid, { 
            text: `⛔ *LINK TERDETEKSI* ⛔\n\nMaaf @${senderNum}, mengirim link grup lain dilarang di sini.`,
            mentions: [m.key.participant]
        })
    } else {
        // Jika bot bukan admin, cuma bisa reply
        await xp.sendMessage(m.key.remoteJid, { 
            text: `⚠️ @${senderNum} Jangan kirim link grup!\n(Jadikan bot admin untuk auto-kick)`,
            mentions: [m.key.participant]
        }, { quoted: m })
    }

  } catch (e) {
    console.error('Error checkAntilink:', e)
  }
}

export const checkMute = async (m, xp) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) return
        
        const gcData = getGc({ id: m.key.remoteJid })
        if (!gcData || !gcData.muteList || gcData.muteList.length === 0) return

        // Normalisasi JID
        const sender = m.key.participant || m.key.remoteJid
        const isMuted = gcData.muteList.some(id => id.split('@')[0] === sender.split('@')[0])
        
        if (isMuted) {
            const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, sender)
            
            // Admin kebal mute
            if (usrAdm) return

            if (botAdm) {
                // Hapus pesan
                await xp.sendMessage(m.key.remoteJid, { delete: m.key })
            }
        }
    } catch (e) {
        console.error('Error checkMute:', e)
    }
}

export const checkAntibot = async (m, xp) => {
  try {
    if (!m.key.remoteJid.endsWith('@g.us')) return
    
    const gcData = getGc({ id: m.key.remoteJid })
    if (!gcData || !gcData.filter?.antibot) return

    if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) {
        const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, m.key.participant)
        if (usrAdm) return // Admin bots are safe

        if (botAdm) {
             await xp.sendMessage(m.key.remoteJid, { delete: m.key })
             await xp.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove')
             await xp.sendMessage(m.key.remoteJid, { text: `🤖 *ANTIBOT DETECTED* 🤖\n\nMaaf, bot lain dilarang disini.` })
        }
    }
  } catch (e) {
      console.error('Error checkAntibot:', e)
  }
}

export const checkAntisticker = async (m, xp) => {
  try {
      if (!m.key.remoteJid.endsWith('@g.us')) return
      
      const gcData = getGc({ id: m.key.remoteJid })
      if (!gcData || !gcData.filter?.antisticker) return
      
      if (m.mtype === 'stickerMessage') {
          const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, m.key.participant)
          if (usrAdm) return // Admin allowed
          
          if (botAdm) {
              await xp.sendMessage(m.key.remoteJid, { delete: m.key })
          }
      }
  } catch (e) {
      console.error('Error checkAntisticker:', e)
  }
}

export const checkAntiwame = async (m, xp) => {
  try {
    if (!m.key.remoteJid.endsWith('@g.us')) return
    
    const gcData = getGc({ id: m.key.remoteJid })
    if (!gcData || !gcData.filter?.antiwame) return

    const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase()
    const linkRegex = /wa\.me\/\d+/i
    
    if (linkRegex.test(text)) {
        const { botAdm, usrAdm } = await grupify(xp, m.key.remoteJid, m.key.participant)
        if (usrAdm) return // Admin allowed

        if (botAdm) {
            await xp.sendMessage(m.key.remoteJid, { delete: m.key })
            await xp.sendMessage(m.key.remoteJid, { text: `⚠️ @${m.key.participant.split('@')[0]} Link wa.me dilarang!`, mentions: [m.key.participant] })
        }
    }
  } catch (e) {
      console.error('Error checkAntiwame:', e)
  }
}