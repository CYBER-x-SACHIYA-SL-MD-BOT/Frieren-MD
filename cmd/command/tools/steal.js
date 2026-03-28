import { createRequire } from "module";
const require = createRequire(import.meta.url);

export default function(ev) {
    ev.on({
        name: 'stealpp',
        cmd: ['stealpp', 'getpp', 'pp', 'colongpp'],
        tags: 'Tools',
        desc: 'Ambil foto profil orang lain (HD)',
        run: async (xp, m, { args }) => {
            try {
                let targetJid

                // 1. Cek Reply
                if (m.quoted) {
                    targetJid = m.quoted.sender
                } 
                // 2. Cek Mention/Tag
                else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                    targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
                } 
                // 3. Cek Input Nomor (Args)
                else if (args.length > 0) {
                    targetJid = args[0].replace(/\D/g, '') + '@s.whatsapp.net'
                } 
                // 4. Default: Ambil PP Sendiri (jika tidak ada target)
                else {
                    targetJid = m.sender
                }

                m.reply('🔍 Sedang mengambil foto profil...')

                try {
                    // Coba ambil resolusi tinggi ('image')
                    // Jika gagal (privasi/tidak ada foto), akan throw error
                    const ppUrl = await xp.profilePictureUrl(targetJid, 'image')
                    
                    await xp.sendMessage(m.chat, { 
                        image: { url: ppUrl }, 
                        caption: `📸 *Profile Picture*\n👤 Target: @${targetJid.split('@')[0]}`, 
                        mentions: [targetJid]
                    }, { quoted: m })

                } catch (e) {
                    // Fallback: Coba ambil thumbnail/low res jika high res gagal
                    try {
                        const ppUrlLow = await xp.profilePictureUrl(targetJid) // default low res
                        await xp.sendMessage(m.chat, { 
                            image: { url: ppUrlLow }, 
                            caption: `📸 *Profile Picture (Low Res)*\n⚠️ Tidak bisa ambil HD (Privasi/Tidak ada).\n👤 Target: @${targetJid.split('@')[0]}`, 
                            mentions: [targetJid]
                        }, { quoted: m })
                    } catch (err) {
                        m.reply('❌ Gagal mengambil foto profil. Mungkin user tidak memasang foto atau privasi "Nobody".')
                    }
                }

            } catch (e) {
                console.error('Error stealpp:', e)
                m.reply('Terjadi kesalahan.')
            }
        }
    })
}
