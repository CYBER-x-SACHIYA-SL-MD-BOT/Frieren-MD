import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { downloadMediaMessage } = require('@adiwajshing/baileys');

export default function(ev) {
    // --- CEK ID (GROUP / CHANNEL) ---
    ev.on({
        name: 'cekid',
        cmd: ['cekid', 'cekidchannel', 'idchannel', 'id', 'idgc'],
        tags: 'Tools Menu',
        desc: 'Cek ID Grup atau ID Channel (Reply pesan channel)',
        run: async (xp, m, { chat, args }) => {
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
            const context = m.message?.extendedTextMessage?.contextInfo
            
            // Helper recursive untuk mencari forwardedNewsletterMessageInfo
            const findNewsletterInfo = (obj) => {
                if (!obj || typeof obj !== 'object') return null
                if (obj.forwardedNewsletterMessageInfo) return obj.forwardedNewsletterMessageInfo
                
                for (const key of Object.keys(obj)) {
                    // Hindari loop yang terlalu dalam atau circular
                    if (key === 'contextInfo' || key === 'message' || key === 'quotedMessage' || 
                        key === 'viewOnceMessage' || key === 'viewOnceMessageV2' || 
                        key === 'viewOnceMessageV2Extension' || 
                        key.endsWith('Message')) {
                        const found = findNewsletterInfo(obj[key])
                        if (found) return found
                    }
                }
                return null
            }

            // Cek langsung di contextInfo pesan saat ini (Jika pesan ini adalah forward dari channel)
            const directInfo = context?.forwardedNewsletterMessageInfo
            
            // Cek di quoted message (Jika user mereply pesan forward channel)
            const quotedContext = quotedMsg?.contextInfo || context?.quotedMessage?.extendedTextMessage?.contextInfo || context?.quotedMessage?.imageMessage?.contextInfo || context?.quotedMessage?.videoMessage?.contextInfo
            const quotedInfo = quotedContext?.forwardedNewsletterMessageInfo

            const newsletterInfo = directInfo || quotedInfo || findNewsletterInfo(m.message)
            
            if (newsletterInfo) {
                const { newsletterJid, newsletterName, serverMessageId } = newsletterInfo
                return m.reply(`📢 *INFO CHANNEL* 📢\n\n📛 *Nama:* ${newsletterName}\n🆔 *ID:* ${newsletterJid}\n🔢 *Msg ID:* ${serverMessageId}`)
            }
    
            // CEK ID DARI LINK (NEW FEATURE)
            if (args[0] && (args[0].includes('whatsapp.com/channel') || args[0].includes('chat.whatsapp.com'))) {
                try {
                    const url = new URL(args[0])
                    let id = ''
                    let type = ''

                    // Group Link
                    if (url.hostname === "chat.whatsapp.com") {
                        const code = url.pathname.replace(/^\/+/, "")
                        const res = await xp.groupGetInviteInfo(code)
                        id = res.id
                        type = 'Group'
                    } 
                    // Channel Link
                    else if (url.hostname === "whatsapp.com" && url.pathname.startsWith("/channel/")) {
                        const code = url.pathname.split("/channel/")[1]?.split("/")[0]
                        const res = await xp.newsletterMetadata("invite", code)
                        id = res.id
                        type = 'Channel'
                    }

                    if (id) {
                        return m.reply(`✅ *LINK DETECTED*\n\n📌 *Type:* ${type}\n🆔 *ID:* ${id}`)
                    }
                } catch (e) {
                    return m.reply('❌ Gagal mengekstrak ID dari link. Pastikan link valid dan bot tidak diblokir.')
                }
            }
    
            let txt = `🆔 *ID INFO*\n\n`
            txt += `📍 Chat ID: ${chat.id}\n`
            
            if (m.isGroup) {
                txt += `👤 Sender ID: ${m.sender}\n`
            }
            
            m.reply(txt)
            }
            })

            // --- GET STATUS (SW) ---
            ev.on({
            name: 'getsw',
            cmd: ['getsw', 'curi', 'colong'],
            tags: 'Tools Menu',
            desc: 'Mengambil status WhatsApp (Reply Status)',
            run: async (xp, m, { chat }) => {
            try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quoted) return m.reply('❌ Reply status orangnya!')

            await xp.sendMessage(chat.id, { forward: m.message.extendedTextMessage.contextInfo.quotedMessage }, { quoted: m })
            } catch (e) {
            console.error(e)
            m.reply('Gagal mengambil status.')
            }
            }
            })
            }
