import { db, saveDb } from '../../../system/db/data.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@adiwajshing/baileys');

export default function(ev) {
    ev.on({
        name: 'setmenu',
        cmd: ['setmenu', 'typemenu', 'stylemenu'],
        tags: 'Setbot Menu',
        desc: 'Kustomisasi tampilan menu bot (Style, Dekorasi, Thumbnail)',
        owner: true,
        run: async (xp, m, { args, prefix }) => {
            const data = db()
            data.settings = data.settings || {}
            
            // Initialize defaults if not set
            data.settings.menuStyle = data.settings.menuStyle || {
                head: '╭───',
                body: '│',
                foot: '╰──────────────',
                arrow: '•',
                line: '───────────────··'
            }
            
            const type = args[0]?.toLowerCase()
            const value = args.slice(1).join(' ')
            
            // --- 1. HANDLE ACTION (If arguments exist) ---
            if (type) {
                const types = ['simple', 'image', 'button', 'doc', 'grid', 'retro', 'cute', 'aesthetic', 'ramadhan', 'lebaran', 'professional', 'modern']
                const typeMap = { '1': 'simple', '2': 'image', '3': 'button', '4': 'doc', '5': 'grid', '6': 'retro', '7': 'cute', '8': 'aesthetic', '9': 'ramadhan', '10': 'lebaran', '11': 'professional', '12': 'modern' }
                
                switch (type) {
                    case 'head':
                    case 'header':
                        if (!value) return m.reply(`Contoh: ${prefix}setmenu head ┏───•`)
                        data.settings.menuStyle.head = value
                        saveDb()
                        return m.reply('✅ Header kategori diubah menjadi: "' + value + '"')
                    
                    case 'body':
                        if (!value) return m.reply(`Contoh: ${prefix}setmenu body │`)
                        data.settings.menuStyle.body = value
                        saveDb()
                        return m.reply('✅ Body/Border diubah menjadi: "' + value + '"')

                    case 'foot':
                    case 'footer':
                        if (!value) return m.reply(`Contoh: ${prefix}setmenu foot ┗─`)
                        data.settings.menuStyle.foot = value
                        saveDb()
                        return m.reply('✅ Footer kategori diubah menjadi: "' + value + '"')

                    case 'arrow':
                    case 'btn':
                    case 'pointer':
                        if (!value) return m.reply(`Contoh: ${prefix}setmenu arrow ➤`)
                        data.settings.menuStyle.arrow = value
                        saveDb()
                        return m.reply('✅ Pointer command diubah menjadi: "' + value + '"')

                    case 'thumb':
                    case 'thumbnail':
                        if (!value) return m.reply(`Contoh: ${prefix}setmenu thumb https://url.com/image.jpg`)
                        global.thumbnail = value 
                        // Note: Global var update is temporary, usually should be saved to DB too if you use DB for thumbnail
                        return m.reply(`✅ Thumbnail menu diubah!`)

                    case 'hidename':
                        // Toggle if no value, or set specific
                        if (!value) {
                             data.settings.hideBotName = !data.settings.hideBotName
                        } else {
                             data.settings.hideBotName = (value === 'on' || value === 'true')
                        }
                        saveDb()
                        return m.reply(`✅ Sembunyikan Nama Bot: *${data.settings.hideBotName ? 'ON' : 'OFF'}*`)
                    
                    case 'reset':
                        data.settings.menuStyle = {
                            head: '╭───',
                            body: '│',
                            foot: '╰──────────────',
                            arrow: '•',
                            line: '───────────────··'
                        }
                        data.settings.menuType = 'button'
                        data.settings.hideBotName = false
                        saveDb()
                        return m.reply('✅ Pengaturan menu dikembalikan ke default.')
                }

                // Handle Menu Type Change
                let selectedType = typeMap[type] || type
                if (types.includes(selectedType)) {
                    data.settings.menuType = selectedType
                    saveDb()
                    return m.reply(`✅ Tampilan menu berhasil diubah ke: *${selectedType.toUpperCase()}*`)
                }
            }

            // --- 2. SHOW DASHBOARD (No Arguments) ---
            try {
                const s = data.settings.menuStyle
                const currentType = data.settings.menuType || 'button'
                const isHide = data.settings.hideBotName ? '✅ ON' : '❌ OFF'
                
                let txt = `🎨 *MENU STYLE DASHBOARD* 🎨\n\n`
                txt += `🔧 *CURRENT SETTINGS:*
`
                txt += `┌  ◦ Type: *${currentType.toUpperCase()}*
`
                txt += `│  ◦ Hide Name: *${isHide}*
`
                txt += `│  ◦ Header: ${s.head}
`
                txt += `│  ◦ Body: ${s.body}
`
                txt += `│  ◦ Arrow: ${s.arrow}
`
                txt += `└  ◦ Footer: ${s.foot}

`
                
                txt += `📸 *PREVIEW COMPONENT:*
`
                txt += `${s.head} [ CATEGORY ]
`
                txt += `${s.body} ${s.arrow} ${prefix}command
`
                txt += `${s.foot}

`
                txt += `_Gunakan tombol di bawah untuk mengubah tampilan_`

                const thumbUrl = global.thumbnail || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'
                const headerMedia = await prepareWAMessageMedia({ image: { url: thumbUrl } }, { upload: xp.waUploadToServer })

                const msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({ text: txt }),
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${global.botName || 'Bot'}` }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    title: "SET MENU",
                                    subtitle: "Dashboard",
                                    hasMediaAttachment: true,
                                    ...headerMedia
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [
                                        {
                                            name: "single_select",
                                            buttonParamsJson: JSON.stringify({
                                                title: "🎨 PILIH TAMPILAN",
                                                sections: [{
                                                    title: "AVAILABLE STYLES",
                                                    rows: [
                                                        { title: "BUTTON (Default)", description: "Tampilan Default dengan Tombol", id: `${prefix}setmenu button` },
                                                        { title: "SIMPLE", description: "Tampilan Teks Sederhana & Bersih", id: `${prefix}setmenu simple` },
                                                        { title: "IMAGE", description: "Gambar Standar dengan List", id: `${prefix}setmenu image` },
                                                        { title: "GRID", description: "Tampilan Grid 2 Kolom", id: `${prefix}setmenu grid` },
                                                        { title: "RETRO", description: "Gaya Terminal / Console", id: `${prefix}setmenu retro` },
                                                        { title: "CUTE", description: "Gaya Soft & Aesthetic", id: `${prefix}setmenu cute` },
                                                        { title: "AESTHETIC", description: "Gaya Simbol Estetik", id: `${prefix}setmenu aesthetic` },
                                                        { title: "RAMADHAN", description: "Tema Spesial Ramadhan (Stars)", id: `${prefix}setmenu ramadhan` },
                                                        { title: "LEBARAN", description: "Tema Spesial Idul Fitri", id: `${prefix}setmenu lebaran` },
                                                        { title: "PROFESSIONAL", description: "Tampilan Korporat / Bersih", id: `${prefix}setmenu professional` },
                                                        { title: "MODERN", description: "Tampilan Modern & Rapi", id: `${prefix}setmenu modern` },
                                                        { title: "DOCUMENT", description: "Tampilan Dokumen (PDF)", id: `${prefix}setmenu doc` }
                                                    ]
                                                }]
                                            })
                                        },
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: data.settings.hideBotName ? "👁️ SHOW BOT NAME" : "🙈 HIDE BOT NAME",
                                                id: `${prefix}setmenu hidename`
                                            })
                                        },
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "🔄 RESET SETTINGS",
                                                id: `${prefix}setmenu reset`
                                            })
                                        }
                                    ]
                                })
                            })
                        }
                    }
                }, { userJid: m.sender, quoted: m })

                await xp.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

            } catch (e) {
                console.error('Error sending setmenu dashboard:', e)
                m.reply('Gagal memuat dashboard.')
            }
        }
    })
}