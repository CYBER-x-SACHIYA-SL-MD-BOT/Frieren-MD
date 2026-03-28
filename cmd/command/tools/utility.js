import axios from 'axios'

export default function(ev) {
    // --- TRANSLATE ---
    ev.on({
        name: 'translate',
        cmd: ['tr', 'translate', 'terjemah'],
        tags: 'Tools Menu',
        desc: 'Terjemahkan teks (Google Translate)',
        run: async (xp, m, { args, chat }) => {
            try {
                let lang = args[0]
                let text = args.slice(1).join(' ')

                if (!lang || lang.length !== 2) {
                    lang = 'id'
                    text = args.join(' ')
                }

                if (!text && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage
                    text = quoted.conversation || quoted.extendedTextMessage?.text
                }

                if (!text) return m.reply(`❌ Masukkan teks!\nContoh: .tr id Hello World`)

                await xp.sendMessage(chat.id, { react: { text: '🌐', key: m.key } })

                const url = `https://api.deline.web.id/tools/translate?text=${encodeURIComponent(text)}&target=${lang}`
                const res = await axios.get(url)
                
                if (!res.data.status) throw new Error('API Error')
                
                const result = res.data.data.hasil_terjemahan
                
                m.reply(`🌐 *TRANSLATE (${lang.toUpperCase()})*\n\n${result}`)

            } catch (e) {
                console.error(e)
                m.reply('Gagal menerjemahkan.')
            }
        }
    })

    // --- TEXT TO SPEECH (TTS) ---
    ev.on({
        name: 'tts',
        cmd: ['tts', 'texttospeech', 'suara'],
        tags: 'Tools Menu',
        desc: 'Ubah teks jadi suara (API Zenitsu)',
        run: async (xp, m, { args, chat }) => {
            try {
                let lang = args[0]
                let text = args.slice(1).join(' ')

                if (!lang || lang.length !== 2) {
                    lang = 'id'
                    text = args.join(' ')
                }

                if (!text && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage
                    text = quoted.conversation || quoted.extendedTextMessage?.text
                }

                if (!text) return m.reply(`❌ Masukkan teks!\nContoh: .tts id Halo Semuanya`)
                if (text.length > 500) return m.reply('Teks kepanjangan (Max 500).')

                await xp.sendMessage(chat.id, { react: { text: '🗣️', key: m.key } })

                const url = `https://api.zenitsu.web.id/api/tools/tts?text=${encodeURIComponent(text)}&lang=${lang}`
                
                await xp.sendMessage(chat.id, { 
                    audio: { url: url }, 
                    mimetype: 'audio/mpeg',
                    ptt: true 
                }, { quoted: m })

            } catch (e) {
                console.error(e)
                m.reply('Gagal membuat audio TTS.')
            }
        }
    })

    // --- HILIH ---
    ev.on({
        name: 'hilih',
        cmd: ['hilih'],
        tags: 'Fun Menu',
        desc: 'Ubah teks jadi mode "hilih"',
        run: async (xp, m, { args, chat }) => {
            let text = args.join(' ')
            if (!text && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage
                text = quoted.conversation || quoted.extendedTextMessage?.text
            }
            if (!text) return m.reply('❌ Masukkan teks atau reply pesan!')

            let hilihText = text.replace(/[aiueoAIUEO]/g, (match) => {
                if (['a', 'i', 'u', 'e', 'o'].includes(match.toLowerCase())) {
                    return match === match.toLowerCase() ? 'i' : 'I';
                }
                return match;
            });
            hilihText = hilihText.replace(/[aiueoAIUEO]/g, (match) => { // second pass for consistency
                if (['a', 'i', 'u', 'e', 'o'].includes(match.toLowerCase())) {
                    return match === match.toLowerCase() ? 'i' : 'I';
                }
                return match;
            });

            m.reply(hilihText);
        }
    })

    // --- KEBALIK ---
    ev.on({
        name: 'kebalik',
        cmd: ['kebalik', 'balik'],
        tags: 'Fun Menu',
        desc: 'Balikkan teks',
        run: async (xp, m, { args, chat }) => {
            let text = args.join(' ')
            if (!text && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage
                text = quoted.conversation || quoted.extendedTextMessage?.text
            }
            if (!text) return m.reply('❌ Masukkan teks atau reply pesan!')

            const reversedText = text.split('').reverse().join('');
            m.reply(reversedText);
        }
    })

    // --- EDIT MESSAGE ---
    ev.on({
        name: 'edit',
        cmd: ['edit', 'ubah'],
        tags: 'Tools Menu',
        desc: 'Edit pesan bot (Reply pesan bot)',
        run: async (xp, m, { args, chat }) => {
            if (!m.quoted) return m.reply('❌ Reply pesan bot yang ingin diedit!')
            if (!m.quoted.isBaileys) return m.reply('❌ Hanya bisa mengedit pesan yang dikirim oleh bot ini.')
            
            const newText = args.join(' ')
            if (!newText) return m.reply('❌ Masukkan teks baru!')

            try {
                await xp.sendMessage(chat.id, { 
                    text: newText, 
                    edit: m.quoted.key 
                })
                m.reply('✅ Pesan berhasil diedit.')
            } catch (e) {
                console.error(e)
                m.reply('Gagal mengedit pesan.')
            }
        }
    })
}