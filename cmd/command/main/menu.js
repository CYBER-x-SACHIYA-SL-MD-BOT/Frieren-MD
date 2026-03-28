import fs from 'fs'
import path from 'path'
import moment from 'moment-timezone'
import similarity from 'similarity'
import { db } from '../../../system/db/data.js' // Added db import
import { fontStyle, style, tinyStyle, monoStyle } from '../../../system/style.js'
import { getHijriDate } from '../../../system/function.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@adiwajshing/baileys');
const axios = require('axios'); // Added axios for doc menu thumb

// --- HELPER FUNCTIONS ---
const getGreeting = (time) => {
    const hour = moment(time, "HH:mm:ss").hour();
    if (hour >= 3 && hour < 11) return "Selamat Pagi 🌅";
    if (hour >= 11 && hour < 15) return "Selamat Siang ☀️";
    if (hour >= 15 && hour < 18) return "Selamat Sore 🌇";
    if (hour >= 18 && hour < 24) return "Selamat Malam 🌙";
    return "Halo👋";
}

const CATEGORY_EMOJIS = {
    'Main Menu': '⎙',
    'User Menu': '⚇',
    'Download Menu': '📥',
    'Tools Menu': '⚙',
    'Fun Menu': '⏻',
    'Game Menu': '⌨',
    'RPG Menu': '⚔',
    'Group Menu': '👥',
    'Ai Menu': '⌬',
    'Owner Menu': '♔',
    'Religion Menu': '🕌',
    'Anime Menu': '⛩',
    'Sticker Menu': '⎙',
    'Internet Menu': '🌐',
    'Other Menu': '⧉',

    // Fallback Keys
    'main': '⎙', 'info': '⎙',
    'user': '⚇', 'profile': '⚇',
    'download': '📥',
    'tools': '⚙', 'utility': '⚙',
    'fun': '⏻', 'meme': '⏻',
    'game': '⌨', 'games': '⌨',
    'rpg': '⚔', 'economy': '⚔',
    'group': '👥', 'admin': '👥',
    'ai': '⌬', 'openai': '⌬',
    'owner': '♔', 'creator': '♔',
    'religion': '🕌', 'islam': '🕌',
    'anime': '⛩', 'wibu': '⛩',
    'sticker': '⎙', 'stiker': '⎙',
    'internet': '🌐', 'search': '🌐',
    'other': '⧉'
}

function formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    result += `${secs}s`;
    return result.trim();
}

// --- DATA BUILDER ---
const buildMenuData = (ev, m, prefix) => {
    const cmds = ev.cmd || []
    const commands = {}
    const uniqueCheck = new Set()
    
    const tagMapping = {
        'main': 'Main Menu', 'info': 'Main Menu', 'menu': 'Main Menu', 'system': 'Main Menu','user': 'Main Menu', 'information': 'Main Menu',
        'download': 'Download Menu', 'downloader': 'Download Menu',
        'asupan': 'Download Menu', 'music': 'Download Menu', 'video': 'Download Menu',
        'tiktok': 'Download Menu', 'instagram': 'Download Menu', 'youtube': 'Download Menu',
        'tools': 'Tools Menu', 'utility': 'Tools Menu', 'convert': 'Tools Menu',
        'search': 'Search Menu', 'internet': 'Search Menu', 'qrcode': 'Tools Menu',
        'sticker': 'Sticker Menu', 'maker': 'Maker Menu', 'image': 'Tools Menu', 'editor': 'Maker Menu',
        'fun': 'Fun Menu', 'game': 'Game Menu', 'rpg': 'RPG Menu', 'economy': 'RPG Menu', 'gambling': 'Game Menu',
        'meme': 'Fun Menu', 'quotes': 'Fun Menu', 'primbon': 'Fun Menu', 'simulation': 'Fun Menu',
        'group': 'Group Menu', 'admin': 'Group Menu', 'pushkontak': 'Group Menu',
        'channel': 'Group Menu', 'community': 'Group Menu', 'privacy': 'Group Menu',
        'ai': 'Ai Menu', 'bot': 'Ai Menu', 'openai': 'Ai Menu', 'gpt': 'Ai Menu', 'AI Menu': 'Ai Menu',
        'owner': 'Owner Menu', 'creator': 'Owner Menu', 'panel': 'Owner Menu',
        'database': 'Owner Menu', 'host': 'Owner Menu', 'setbot': 'Owner Menu',
        'anime': 'Anime Menu', 'wibu': 'Anime Menu', 'animemenu': 'Anime Menu',
        'religion': 'Religion Menu', 'islam': 'Religion Menu', 'islamic': 'Religion Menu', 'religionmenu': 'Religion Menu',
        'other': 'Other Menu', 'lainnya': 'Other Menu'
    }

    let totalCommands = 0
    for (const c of cmds) {
        let tag = c.tags || c.category || 'Lainnya'
        if (Array.isArray(tag)) tag = tag[0]
        
        let tagLower = typeof tag === 'string' ? tag.toLowerCase() : 'lainnya'
        let mappedTag = tagMapping[tagLower] || tagMapping[tag] || tag
        
        if (tagLower.includes('rpg') || tagLower.includes('economy')) mappedTag = 'RPG Menu'
        if (tagLower.includes('anime')) mappedTag = 'Anime Menu'
        if (tagLower.includes('islam') || tagLower.includes('agama') || tagLower.includes('religion')) mappedTag = 'Religion Menu'
        if (tagLower.includes('sticker') || tagLower.includes('stiker')) mappedTag = 'Sticker Menu'
        if (tagLower.includes('tool') || tagLower.includes('utility')) mappedTag = 'Tools Menu'
        if (tagLower.includes('main') || tagLower.includes('info')) mappedTag = 'Main Menu'
        
        let tagFinal = mappedTag

        let mainCmd = (Array.isArray(c.cmd) ? c.cmd[0] : c.cmd)
        
        if (mainCmd instanceof RegExp) {
            if (c.help && Array.isArray(c.help)) {
                mainCmd = c.help[0].split(' ')[0]
            } else {
                mainCmd = String(mainCmd).replace(/[\^$()\[\]{}|\\\/]/g, '').replace(/i$/, '').replace(/_/g, '')
            }
        }
        
        if (mainCmd && !uniqueCheck.has(mainCmd)) {
            commands[tagFinal] = commands[tagFinal] || []
            commands[tagFinal].push(c)
            uniqueCheck.add(mainCmd)
            totalCommands++
        }
    }

    const availableCategories = Object.keys(commands).sort()
    
    for (const cat of availableCategories) {
        commands[cat].sort((a, b) => {
            let nA = (Array.isArray(a.cmd) ? a.cmd[0] : a.cmd)
            let nB = (Array.isArray(b.cmd) ? b.cmd[0] : b.cmd)
            if (nA instanceof RegExp) nA = String(nA)
            if (nB instanceof RegExp) nB = String(nB)
            return String(nA).localeCompare(String(nB))
        })
    }

    return { commands, availableCategories, totalCommands }
}

// --- MENU BUILDERS (IMPROVED - CATEGORY ONLY) ---

const buildSimpleMenu = (header, data, p) => {
    let txt = `${header}\n`
    txt += `┌─[-] [ LIST MENU ]\n`
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `│ > ${p}menu ${catName}\n`
    }
    txt += `│ > ${p}menu all\n`
    txt += `└─────────────────`
    return txt
}

const buildGridMenu = (header, data, p) => {
    let txt = `${header}\n\n`
    txt += `╭─── [ LIST MENU ] ───╮\n`
    
    for (let i = 0; i < data.availableCategories.length; i += 2) {
        const cat1 = data.availableCategories[i].toUpperCase().replace(' MENU', '')
        const cat2 = data.availableCategories[i+1] ? data.availableCategories[i+1].toUpperCase().replace(' MENU', '') : ''
        
        const cmd1 = `${p}menu ${cat1}`
        const cmd2 = cat2 ? `${p}menu ${cat2}` : ''
        
        if (cat2) {
             txt += `│ ${cmd1.padEnd(14)} ${cmd2}\n`
        } else {
             txt += `│ ${cmd1}\n`
        }
    }
    txt += `│ ${p}menu all\n`
    txt += `╰─────────────────────╯`
    return txt
}

const buildCuteMenu = (header, data, p) => {
    let txt = `  . . . ┄┄┄┄┄┄┄┄┄┄ . . .\n${header}\n  . . . ┄┄┄┄┄┄┄┄┄┄ . . .\n`
    txt += `╭─── [ CATEGORY ] ───╮\n`
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `  ⊹ ${p}menu ${catName}\n`
    }
    txt += `  ⊹ ${p}menu all\n`
    txt += `╰─── [ CATEGORY ] ───╯`
    return txt
}

const buildAestheticMenu = (header, data, p) => {
    let txt = `${header}\n`
    txt += `── ✧ ── ✧ ── ✧ ── ✧ ──\n\n`
    txt += `┌─── [ LIST MENU ]\n`
    
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `│ ◦ ${p}menu ${catName}\n`
    }
    txt += `│ ◦ ${p}menu all\n`
    txt += `└──────────────────`
    return txt
}

const buildRetroMenu = (header, data, p) => {
    let txt = `[ system.init ]\n`
    txt += `[ load.modules ] -> [ ok ]\n`
    txt += `${header}\n\n`
    
    txt += `[ /root/menu/ ]\n`
    txt += `[--------------------]\n`
    
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `$ ls ${p}menu ${catName.toLowerCase()}\n`
    }
    txt += `$ ls ${p}menu all\n`
    txt += `[ end.process ]`
    return txt
}

const buildProfessionalMenu = (header, data, p) => {
    let txt = `${header}\n\n`
    txt += `| [ CATEGORY OVERVIEW ] |\n`
    txt += `|-----------------------|\n`
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `| - ${p}menu ${catName.padEnd(13)} |\n`
    }
    txt += `| - ${p}menu ALL${' '.repeat(10)} |\n`
    txt += `|-----------------------|`
    return txt
}

const buildModernMenu = (header, data, p) => {
    let txt = `${header}\n\n`
    txt += `───  LIST  CATEGORIES  ───\n\n`
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `[ ${catName} ] → ${p}menu ${catName.toLowerCase()}\n`
    }
    txt += `[ ALL ] → ${p}menu all\n`
    txt += `\n──────────────────────────`
    return txt
}

// --- DYNAMIC HEADER BUILDER ---
const buildDynamicHeader = (style, m, uptime, totalUser, botName) => {
    const userTag = `@${m.sender.split('@')[0]}`
    const time = moment().tz('Asia/Jakarta').format('HH:mm')
    const displayBotName = db().settings?.hideBotName ? 'SYSTEM' : botName.toUpperCase()
    
    switch(style) {
        case 'professional':
            return `╭─── [ ${displayBotName} ] ───╮
│
│ [ user ]   : ${userTag}
│ [ system ] : v${global.botVersion || '2.6.7'}
│ [ mode ]   : ${global.public ? 'PUBLIC' : 'SELF'}
│ [ uptime ] : ${uptime}
│ [ users ]  : ${totalUser.toLocaleString()}
│ [ time ]   : ${time} WIB
│
╰─────────────────────╯`

        case 'retro':
            return `[ BOOT_SEQUENCE ] -> [ OK ]
[ USER_ID ] : ${m.sender.split('@')[0]}
[ TIMESTAMP ] : ${time}
[ UPTIME ] : ${uptime}
[ SERVER ] : ${displayBotName}
[====================]
`
        case 'cute':
            return `  . . . [ hello ${userTag} ] . . .
  welcome to ${displayBotName}
            
  - user : ${totalUser}
  - time : ${time}
  - run  : ${uptime}
`
        case 'aesthetic':
            return `── ✧ ${displayBotName} ✧ ──
            
┌  [ name ] : ${displayBotName}
│  [ user ] : ${totalUser}
└  [ time ] : ${uptime}
`
        case 'grid':
            return `┌────────────────────┐
│ [ ${displayBotName} ]
├────────────────────┤
│ [ user ] : ${userTag.padEnd(10)} │
│ [ total ]: ${String(totalUser).padEnd(10)} │
│ [ time ] : ${time.padEnd(10)} │
└────────────────────┘`

        case 'simple':
            return `[ ${displayBotName} ]
User : ${userTag}
Time : ${time} | Uptime: ${uptime}`

        case 'ramadhan':
            return `       .       .       .
    .      [ ramadhan ]      .
       .       .       .
    
    [ MARHABAN YA RAMADHAN ]
    
[ user ] : ${userTag}
[ time ] : ${time} WIB
`
        case 'lebaran':
            return `  .    .       .       .
    .      .       .       .
       .       .       .
    
  [ EID MUBARAK ]
  [ minal aidin wal faizin ]
    
  [+] User : ${userTag}
  [+] Time : ${time} WIB
`
        case 'modern':
            return `[ SYSTEM ] : ${displayBotName}
[ STATUS ] : ONLINE
[ UPTIME ] : ${uptime}
[ USER ]   : ${userTag}
`
        case 'image':
        default:
            return `╭─── [ ${displayBotName} ] ───╮
│
│ [ user ]   : ${userTag}
│ [ mode ]   : ${global.public ? 'PUBLIC' : 'SELF'}
│ [ uptime ] : ${uptime}
│
╰─────────────────────╯`
    }
}

// --- RENDERERS ---

// Context Info Helper
const getMenuContext = () => {
    return {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
            newsletterJid: global.idCh,
            serverMessageId: 100,
            newsletterName: global.botName
        },
        externalAdReply: {
            title: global.botName,
            body: 'Click to join channel',
            thumbnailUrl: global.thumbnail,
            sourceUrl: global.linkCh,
            mediaType: 1,
            renderLargerThumbnail: true
        }
    }
}

// 1. SIMPLE
const sendSimpleMenu = async (xp, m, data, p, headerData) => {
    const head = buildDynamicHeader('simple', m, headerData.uptime, headerData.totalUser, headerData.botName)
    const text = buildSimpleMenu(head, data, p)
    await xp.sendMessage(m.chat, { text: text, contextInfo: getMenuContext() }, { quoted: m })
}

// 2. IMAGE
const sendImageMenu = async (xp, m, data, p, headerData) => {
    const head = buildDynamicHeader('image', m, headerData.uptime, headerData.totalUser, headerData.botName)
    let txt = `${head}\n\n`
    txt += `┌─⭓「 *ʟɪꜱᴛ - ᴍᴇɴᴜ* 」\n`
    for (const cat of data.availableCategories) {
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `│• ${p}ᴍᴇɴᴜ ${catName}\n`
    }
    txt += `│• ${p}ᴍᴇɴᴜ ᴀʟʟ\n`
    txt += `└───────────────⭓`
    
    const thumbUrl = global.thumbnail //|| 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'
    await xp.sendMessage(m.chat, { image: { url: thumbUrl }, caption: txt, contextInfo: getMenuContext() }, { quoted: m })
}

// 3. GRID
const sendGridMenu = async (xp, m, data, p, headerData) => {
    const head = buildDynamicHeader('grid', m, headerData.uptime, headerData.totalUser, headerData.botName)
    const text = buildGridMenu(head, data, p)
    await xp.sendMessage(m.chat, { image: { url: global.thumbnail }, caption: text, contextInfo: getMenuContext() }, { quoted: m })
}

// 4. CUTE
const sendCuteMenu = async (xp, m, data, p, headerData) => {
    const head = buildDynamicHeader('cute', m, headerData.uptime, headerData.totalUser, headerData.botName)
    const text = buildCuteMenu(head, data, p)
    await xp.sendMessage(m.chat, { image: { url: global.thumbnail }, caption: text, contextInfo: getMenuContext() }, { quoted: m })
}

// 5. RETRO
const sendRetroMenu = async (xp, m, data, p, headerData) => {
    const head = buildDynamicHeader('retro', m, headerData.uptime, headerData.totalUser, headerData.botName)
    const text = buildRetroMenu(head, data, p)
    await xp.sendMessage(m.chat, { image: { url: global.thumbnail }, caption: text, contextInfo: getMenuContext() }, { quoted: m })
}

// 6. AESTHETIC
const sendAestheticMenu = async (xp, m, data, p, headerData) => {
    const head = buildDynamicHeader('aesthetic', m, headerData.uptime, headerData.totalUser, headerData.botName)
    const text = buildAestheticMenu(head, data, p)
    await xp.sendMessage(m.chat, { image: { url: global.thumbnail }, caption: text, contextInfo: getMenuContext() }, { quoted: m })
}

// 8. RAMADHAN (ISLAMIC AESTHETIC - SIMPLE LIST & BUTTON)
const sendRamadhanMenu = async (xp, m, data, p, headerData) => {
    const tiny = (t) => t.split('').map(c=>{const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'};return m[c]||c}).join('')
    
    // Header Logic
    let txt = `﷽\n⭒₊ ⊹☪︎₊ ⊹⭒\n`
    txt += `      ⭐       .       *       .       🌙
   .      🕌      .       *       .
      *       .       📿      .

╭━━━〔 ☪︎ *RAMADHAN KAREEM* ☪︎ 〕
│
│ ◦👤 ${headerData.uptime} | ${headerData.totalUser} Users
│ ◦🕰️ Time: ${moment().tz('Asia/Jakarta').format('HH:mm')} WIB
│ ◦🌙 Hijri: ${getHijriDate()}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

    رمضان كريم
    
    _"Selamat menunaikan ibadah puasa."_
    _"Semoga amal ibadah kita diterima Allah SWT."_
    
    كل عام وأنتم بخير
    ۞ ══════════════════════ ۞\n\n`
    
    txt += `╭─── [  *DAFTAR KATEGORI*  ] ───╮\n`
    
    const ramadhanEmojis = {
        'Main Menu': '📜', 'Download Menu': '📥', 'Tools Menu': '🛠️',
        'Fun Menu': '🎡', 'Group Menu': '👥', 'Ai Menu': '🤖',
        'Owner Menu': '👑', 'Other Menu': '📦', 'RPG Menu': '⚔️',
        'User Menu': '👤', 'Game Menu': '🎮', 'Sticker Menu': '🎨',
        'Anime Menu': '⛩️', 'Economy Menu': '💰', 'Editor Menu': '🎨', 
        'Gambling Menu': '🎰', 'Information Menu': '📰',
        'Maker Menu': '✏️', 'Privacy Menu': '🔒', 'Religion Menu': '🕌',
        'Search Menu': '🔍', 'Setbot Menu': '⚙️', 'Simulation Menu': '🏙️','Channel Menu': '📻',
        'Lainnya': '📦'
    }

    for (const cat of data.availableCategories) {
        let emoji = ramadhanEmojis[cat] || ramadhanEmojis[cat.replace(' Menu', '')] || '💠'
        const catName = cat.toUpperCase().replace(' MENU', '')
        txt += `│ ۞ ${emoji} *${tiny(catName)}*\n`
    }
    
    txt += `╰─── ۞ ════════════ ۞ ───╯\n\n`
    txt += `🤲 *Doa Hari Ini:*\n"Ya Allah, sesungguhnya Engkau Maha Pemaaf lagi Maha Mulia, Engkau suka memaafkan, maka maafkanlah aku."\n(HR. Tirmidzi)`

    const sections = [{
        title: "☪︎ PILIH KATEGORI MENU",
        highlight_label: "Ramadhan Special",
        rows: []
    }]

    for (const cat of data.availableCategories) {
        let emoji = ramadhanEmojis[cat] || '📂'
        const catName = cat.replace(' Menu', '')
        const count = data.commands[cat] ? data.commands[cat].length : 0
        sections[0].rows.push({
            header: `${emoji} ${catName}`,
            title: `Menu ${catName}`,
            description: `Menampilkan ${count} fitur`,
            id: `${p}menu ${cat}`
        })
    }
    
    sections[0].rows.unshift({ header: "📜 ALL MENU", title: "Tampilkan Semua", description: "Lihat semua fitur sekaligus", id: `${p}menu all` })

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: txt }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: global.botName }),
                    header: proto.Message.InteractiveMessage.Header.create({ 
                        title: `*MARHABAN YA RAMADHAN*`, 
                        hasMediaAttachment: true, 
                        ...(await prepareWAMessageMedia({ image: { url: "https://c.termai.cc/i168/iXXKNn.jpg" || global.thumbnail } }, { upload: xp.waUploadToServer })) 
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "BUKA MENU", sections }) }]
                    }),
                    contextInfo: getMenuContext()
                })
            }
        }
    }, { quoted: m })

    await xp.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

// 9. LEBARAN (EID AL-FITR AESTHETIC - SIMPLE LIST & BUTTON)
const sendLebaranMenu = async (xp, m, data, p, headerData) => {
    const tiny = (t) => t.toLowerCase().split('').map(c=>{const m={'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','0':'₀'};return m[c]||c}).join('')
    
    let txt = `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم\n\n`
    
    txt += ` ༺ ۞ [ *EID AL-FITR* ] ۞ ༻\n`
    txt += ` ─────── ❃ ───────\n`
    txt += ` ◦ Uptime: ${headerData.uptime}\n`
    txt += ` ◦ Users: ${headerData.totalUser}\n`
    txt += ` ◦ Time: ${moment().tz('Asia/Jakarta').format('HH:mm')} WIB\n`
    txt += ` ◦ Hijri: ${getHijriDate()}\n`
    txt += ` ─────── ❃ ───────\n\n`

    txt += `تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ\n`
    txt += `_"Taqabbalallahu Minna Wa Minkum"_\n`
    txt += `_Mohon Maaf Lahir & Batin_\n`
    txt += ` ───────────────\n\n`
    
    const textIcons = {
        'Main Menu': '◈', 'Download Menu': '◇', 'Tools Menu': '◦',
        'Fun Menu': '⟡', 'Group Menu': '✦', 'Ai Menu': '⬙',
        'Owner Menu': '⬘', 'Other Menu': '⬚', 'RPG Menu': '⟣',
        'User Menu': '⟢', 'Game Menu': '⟥', 'Sticker Menu': '⟤',
        'Anime Menu': '◰', 'Religion Menu': '◱', 'Search Menu': '◲',
        'Maker Menu': '◳', 'Lainnya': '⬚'
    }

    txt += `*CATEGORIES LIST:*\n`
    for (const cat of data.availableCategories) {
        let icon = textIcons[cat] || textIcons[cat.replace(' Menu', '')] || '✦'
        const catName = cat.replace(' Menu', '')
        txt += ` ${icon} ${tiny(catName)}\n`
    }
    
    txt += `\n_${global.botName || 'FRIEREN BOT'}_\n`

    const sections = [{
        title: "✦ PILIH KATEGORI MENU",
        highlight_label: "Lebaran Special",
        rows: []
    }]

    for (const cat of data.availableCategories) {
        let icon = textIcons[cat] || '✦'
        const catName = cat.replace(' Menu', '')
        const count = data.commands[cat] ? data.commands[cat].length : 0
        sections[0].rows.push({
            header: `${icon} ${catName}`,
            title: `Menu ${catName}`,
            description: `Menampilkan ${count} fitur`,
            id: `${p}menu ${cat}`
        })
    }
    
    sections[0].rows.unshift({ header: "◈ ALL MENU", title: "Tampilkan Semua", description: "Lihat semua fitur sekaligus", id: `${p}menu all` })

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: txt }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: global.botName }),
                    header: proto.Message.InteractiveMessage.Header.create({ 
                        title: `[ IDUL FITRI ]`, 
                        hasMediaAttachment: true, 
                        ...(await (async () => {
                            try {
                                return await prepareWAMessageMedia({ image: { url: "https://c.termai.cc/i177/9OUZe.jpg" } }, { upload: xp.waUploadToServer })
                            } catch (e) {
                                console.error('Lebaran Menu Image Error:', e.message)
                                return await prepareWAMessageMedia({ image: { url: global.thumbnail } }, { upload: xp.waUploadToServer })
                            }
                        })())
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "BUKA MENU", sections }) }]
                    }),
                    contextInfo: getMenuContext()
                })
            }
        }
    }, { quoted: m })

    await xp.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}


async function sendMenuWithPremiumUI(xp, m, text, greeting, p, availableCategories, commands) {
    const botName = global.botName || 'FRIEREN';
    const botVersion = global.botVersion || '2.6.7';
    const ownerName = global.ownerName || 'Har';
    const channelId = global.idCh || '120363422522996201@newsletter';
    const channelName = global.channelName || global.botName;
    const channelLink = 'https://whatsapp.com/channel/0029Vb72DoS545uy5FD6W006';
    
    const fakeStatusQuoted = {
        key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
        message: {
            extendedTextMessage: {
                text: `${botName} by ${ownerName}`,
                contextInfo: {
                    isForwarded: true, forwardingScore: 999,
                    forwardedNewsletterMessageInfo: { newsletterJid: channelId, newsletterName: channelName, serverMessageId: 127 }
                }
            }
        }
    };

    // Read Local Images
    const menuImgPath = './media/frieren-menu.jpg';
    const thumbImgPath = './media/frieren-thumb.jpg';
    
    let menuImageBuffer, thumbImageBuffer;
    
    try {
        if (fs.existsSync(menuImgPath)) menuImageBuffer = fs.readFileSync(menuImgPath);
        if (fs.existsSync(thumbImgPath)) thumbImageBuffer = fs.readFileSync(thumbImgPath);
    } catch (e) {
        console.error('Error reading local media:', e);
    }

    const mainImageUrl = global.thumbnail || 'https://api.deline.web.id/bNVWXiXf6o.png';
    const thumbUrl = global.thumbnail2 || global.thumbUrl || 'https://files.catbox.moe/3qpgvy.jpg';

    // Prepare Header (Document with Thumbnail)
    let header;
    try {
        header = await prepareWAMessageMedia({
            document: menuImageBuffer || { url: mainImageUrl }, 
            mimetype: 'image/png', 
            fileName: `${greeting}`,
            jpegThumbnail: thumbImageBuffer, 
            fileLength: 1024 * 100 
        }, { upload: xp.waUploadToServer });
    } catch (e) {
        console.error('Failed to load menu document media, falling back', e);
    }

    try {
        const sections = []

        // SECTION 1: TOP MENU
        sections.push({
            title: "📋 LIST MENU",
            rows: [
                 { title: "📜 ALL MENU", description: "Menampilkan Semua Fitur", id: `${p}allmenu` },
                 { title: "👑 OWNER MENU", description: "Informasi Owner", id: `${p}owner` }
            ]
        })

        // SECTION 2: CATEGORY GROUPS (GRANULAR)
        const categoryGroups = {
            "🤖 AI FEATURES": ["Ai Menu", "ai", "gpt"],
            "📥 DOWNLOADER": ["Download Menu", "download"],
            "🔍 SEARCH & TOOLS": ["Search Menu", "Tools Menu", "search", "tools", "convert", "utility"],
            "🎮 GAME & RPG": ["Game Menu", "RPG Menu", "Economy Menu", "game", "rpg", "economy", "shop"],
            "⛩️ ANIME & MANGA": ["Anime Menu", "anime", "wibu"],
            "👥 GROUP & COMMUNITY": ["Group Menu", "Channel Menu", "group", "channel", "community"],
            "🎨 MAKER & STICKER": ["Maker Menu", "Sticker", "editor", "maker", "sticker"],
            "😂 FUN & RANDOM": ["Fun Menu", "fun", "random", "meme"],
            "🕌 RELIGION": ["Religion Menu", "islam", "religion", "religi", "ceramah"],
            "ℹ️ MAIN & INFO": ["Main Menu", "Info Menu", "main", "info", "system", "dashboard", "user"],
            "👑 OWNER & DEVELOPER": ["Owner Menu", "owner", "creator"],
            "📦 LAINNYA": []
        }

        availableCategories.forEach(cat => {
            const catLower = cat.toLowerCase()
            const count = commands[cat].length
            const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS[catLower] || '📋'
            
            const row = {
                title: `${emoji} ${cat.toUpperCase()}`,
                description: `Menampilkan ${count} fitur`,
                id: `${p}menu ${cat}`
            }

            let added = false
            for (const [groupName, keywords] of Object.entries(categoryGroups)) {
                 if (groupName === "📦 LAINNYA") continue
                 if (keywords.some(k => catLower === k.toLowerCase() || catLower.includes(k.toLowerCase()))) {
                     let sec = sections.find(s => s.title === groupName)
                     if (!sec) { sec = { title: groupName, rows: [] }; sections.push(sec); }
                     if (!sec.rows.some(r => r.title === row.title)) { sec.rows.push(row); }
                     added = true; break;
                 }
            }
            
            if (!added) {
                let sec = sections.find(s => s.title === "📦 LAINNYA")
                 if (!sec) { sec = { title: "📦 LAINNYA", rows: [] }; sections.push(sec); }
                 sec.rows.push(row)
            }
        })
        
        // Move LAINNYA to bottom
        const otherSecIndex = sections.findIndex(s => s.title === "📦 LAINNYA")
        if (otherSecIndex !== -1) {
            const [otherSec] = sections.splice(otherSecIndex, 1)
            sections.push(otherSec)
        }

        const hasMedia = !!header;

        const message = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: text }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${botName} by ${ownerName}` }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: greeting,
                            subtitle: "Main Menu",
                            hasMediaAttachment: hasMedia,
                            ...(hasMedia ? header : {})
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: { newsletterJid: channelId, newsletterName: channelName, serverMessageId: 127 },
                            externalAdReply: {
                                title: `${botName}`,
                                body: `v${botVersion} | Mode: ${global.public ? 'Public' : 'Self'} `,
                                sourceUrl: channelLink,
                                mediaType: 1,
                                thumbnail: menuImageBuffer || thumbImageBuffer,
                                renderLargerThumbnail: true
                            }
                        },
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "📋 PILIH KATEGORI",
                                        sections: sections
                                    })
                                },
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({ display_text: "📜 ALL MENU", id: `${p}allmenu` })
                                },
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({ display_text: "📦 SCRIPT", id: `${p}script` })
                                }
                            ]
                        })
                    })
                }
            }
        }, { userJid: m.sender, quoted: fakeStatusQuoted });

        await xp.relayMessage(m.chat, message.message, { messageId: message.key.id });

    } catch (error) {
        console.error("Failed to send premium menu:", error);
        await m.reply(text);
    }
}


export default function menu(ev) {
  // --- COMMAND HELP ---
  ev.on({
    name: 'help',
    cmd: ['help', 'infocmd'],
    tags: 'Information Menu',
    desc: 'Memberikan informasi detail mengenai perintah yang tersedia.',
    run: async (xp, m, { args, chat, prefix }) => {
      try {
        const query = args.join(' ').toLowerCase().trim()
        const cmds = ev.cmd || []

        if (!query) {
          return xp.sendMessage(chat.id, { text: `Gunakan: *${prefix}help <nama_command>*\nContoh: *${prefix}help ai*` }, { quoted: m })
        }

        // 1. Try EXACT match
        let found = cmds.find(c => {
            const name = c.name?.toLowerCase()
            const aliases = Array.isArray(c.cmd) ? c.cmd.map(v => typeof v === 'string' ? v.toLowerCase() : String(v)) : [String(c.cmd).toLowerCase()]
            return name === query || aliases.includes(query)
        })

        // 2. If NOT found, try PARTIAL match (Multiple results)
        if (!found) {
            const matches = cmds.filter(c => {
                const name = c.name?.toLowerCase() || ''
                const aliases = Array.isArray(c.cmd) ? c.cmd.map(v => typeof v === 'string' ? v.toLowerCase() : String(v)) : [String(c.cmd).toLowerCase()]
                return name.includes(query) || aliases.some(a => a.includes(query))
            })

            if (matches.length > 0) {
                if (matches.length === 1) {
                    found = matches[0]
                } else {
                    let txt = `🔍 *HASIL PENCARIAN: "${query}"*\n\n`
                    matches.forEach((c, i) => {
                        const name = c.name || (Array.isArray(c.cmd) ? c.cmd[0] : c.cmd)
                        txt += `${i + 1}. *${prefix}${name}*\n`
                    })
                    txt += `\nGunakan *${prefix}help <nama_fitur>* untuk info detail.`
                    return xp.sendMessage(chat.id, { text: txt }, { quoted: m })
                }
            }
        }

        // 3. If STILL not found, try SIMILARITY
        if (!found) {
            const allCmds = cmds.flatMap(c => Array.isArray(c.cmd) ? c.cmd.filter(x => typeof x === 'string') : [c.cmd])
            const suggestions = allCmds
                .map(c => ({ name: c, score: similarity(query, c) }))
                .filter(s => s.score > 0.4)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)

            if (suggestions.length > 0) {
                let txt = `❌ *FITUR TIDAK DITEMUKAN*\nMungkin maksud Anda:\n`
                suggestions.forEach((s, i) => {
                    txt += `${i + 1}. *${prefix}${s.name}* (${Math.floor(s.score * 100)}%)\n`
                })
                return xp.sendMessage(chat.id, { text: txt }, { quoted: m })
            } else {
                return xp.sendMessage(chat.id, { text: `❌ *FITUR TIDAK DITEMUKAN*\nFitur "${query}" tidak ada di database.` }, { quoted: m })
            }
        }

        // 4. RENDER DETAIL INFO
        let txt = style.header('COMMAND INFO') + '\n\n'
        txt += `${style.key('NAMA')} ${style.val(found.name || (Array.isArray(found.cmd) ? found.cmd[0] : found.cmd))}\n`
        
        const aliases = Array.isArray(found.cmd) ? found.cmd.filter(v => typeof v === 'string' && v !== found.name) : []
        if (aliases.length > 0) {
            txt += `${style.key('ALIASES')} ${style.val(aliases.join(', '))}\n`
        }

        txt += `${style.key('KATEGORI')} ${style.val(found.tags || 'General')}\n`
        txt += `${style.key('DESKRIPSI')} ${found.desc || '-'}\n\n`

        // Check handler.help style examples
        if (found.help || found.example) {
            const examples = found.help || found.example
            txt += `💡 *USAGE / EXAMPLES:*\n`
            if (Array.isArray(examples)) {
                examples.forEach(ex => {
                    txt += `◦ ${prefix}${ex}\n`
                })
            } else {
                txt += `◦ ${prefix}${examples}\n`
            }
            txt += '\n'
        }

        // PERMISSIONS & LIMITS
        let info = []
        if (found.owner) info.push('👑 Owner Only')
        if (found.premium) info.push('💎 Premium Only')
        if (found.limit) info.push('⌛ Limit Required')
        if (found.group) info.push('👥 Group Only')
        if (found.admin) info.push('👮 Admin Only')
        
        if (info.length > 0) {
            txt += `🔐 *RESTRICTIONS:*\n${info.map(i => '◦ ' + i).join('\n')}\n`
        }

        txt += style.footer(global.botName || 'FRIEREN AI')
        
        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        console.error('error pada help', e)
        m.reply('Gagal mendapatkan info command.')
      }
    }
  })

  // --- MAIN MENU ---
  ev.on({
    name: 'menu',
    cmd: ['menu', 'list'],
    tags: 'Information Menu',
    desc: 'Menampilkan menu utama bot',
    run: async (xp, m, { chat, args, command }) => {
      try {
        const timeNow = moment().tz('Asia/Jakarta')
        const timeStr = timeNow.format('HH:mm:ss')
        const greeting = getGreeting(timeStr)
        const senderName = m.pushName || 'User'
        const p = Array.isArray(global.prefix) ? global.prefix[0] : global.prefix
        const type = db().settings?.menuType || 'button'

        // Build Data
        const data = buildMenuData(ev, m, p)
        const availableCategories = data.availableCategories
        const commands = data.commands

        const filterKey = args.join(' ').toLowerCase()

        if (filterKey === 'all') {
            const uptime = formatUptime(process.uptime() * 1000)
            const totalUser = Object.keys(db().key).length
            const isHide = db().settings?.hideBotName
            const botName = isHide ? 'SYSTEM' : (global.botName || 'FRIEREN')
            
            let txt = buildDynamicHeader('professional', m, uptime, totalUser, botName) + '\n\n'

            txt += `> Menampilkan seluruh fitur yang tersedia.\n\n`

            for (const cat of availableCategories) {
                const emoji = CATEGORY_EMOJIS[cat] || '📋'

                let cleanCat = cat.toUpperCase().replace(' MENU', '')

                txt += `┌───〔 ${emoji} *${cleanCat}* 〕───\n`
                let cmdCount = 0
                commands[cat].forEach(cmdObj => {
                    let n = Array.isArray(cmdObj.cmd) ? cmdObj.cmd[0] : cmdObj.cmd
                    if (n instanceof RegExp) n = cmdObj.help ? cmdObj.help[0].split(' ')[0] : String(n).replace(/[\^$()\[\]{}|\\\/]/g, '').replace(/i$/, '').replace(/_/g, '')
                    txt += `│ ⚬ ${p}${n}\n`
                    cmdCount++
                })
                txt += `└─────────────── ( ${cmdCount} ) ──\n\n`
            }
            txt += `\n© ${botName} | ${global.author || 'BOTZ'} - Advanced Assistant`            
            const headerMedia = await prepareWAMessageMedia({ image: { url: global.thumbnail || 'https://c.termai.cc/i144/iQpwQM.jpg' } }, { upload: xp.waUploadToServer })
            const message = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: txt }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${botName} - Advanced Assistant` }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: `*COMMAND LIST*`, hasMediaAttachment: true, ...headerMedia }),
                            contextInfo: { isForwarded: true, forwardingScore: 999, forwardedNewsletterMessageInfo: { newsletterJid: global.idCh || "120363405765781159@newsletter", newsletterName: `Official ${botName} Channel`, serverMessageId: 1 }, externalAdReply: { title: `${botName} - Multi Device Bot`, body: `Browse all ${data.totalCommands} features!`, thumbnailUrl: global.thumbnail, sourceUrl: global.linkCh, mediaType: 1, renderLargerThumbnail: true } },
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🔗 Channel", url: global.linkCh || "https://whatsapp.com/channel/0029VbCGe9q1XquPfMgyhN1c" }) }, { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👤 Owner", id: ".owner" }) }]
                            })
                        })
                    }
                }
            }, { userJid: m.sender, quoted: m })
            await xp.relayMessage(m.chat, message.message, { messageId: message.key.id })
            return
        }

        if (!filterKey) {
            // General Menu
            const uptime = formatUptime(process.uptime() * 1000);
            const totalUser = Object.keys(db().key).length;
            const botName = global.botName || 'FRIEREN';
            
            // Header Data Object for Dynamic Builder
            const headerData = { uptime, totalUser, botName }

            switch(type) {
                case 'lebaran': await sendLebaranMenu(xp, m, data, p, headerData); break;
                case 'ramadhan': await sendRamadhanMenu(xp, m, data, p, headerData); break;
                case 'simple': await sendSimpleMenu(xp, m, data, p, headerData); break;
                case 'image': await sendImageMenu(xp, m, data, p, headerData); break;
                case 'grid': await sendGridMenu(xp, m, data, p, headerData); break;
                case 'retro': await sendRetroMenu(xp, m, data, p, headerData); break;
                case 'cute': await sendCuteMenu(xp, m, data, p, headerData); break;
                case 'aesthetic': await sendAestheticMenu(xp, m, data, p, headerData); break;
                case 'doc': await sendDocMenu(xp, m, null, data, p); break; // Doc menu handles header internally or simply
                case 'button': 
                default: 
                    // Re-use specific button text logic (ORIGINAL DETAILED VERSION)
                    let txt = `Hai *${senderName}*\n\n`;
                    txt += `╭─────═┅═─────⊱\n`;
                    txt += `┊ ◦ *🤖 BOT INFO*\n`;
                    txt += `┊┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈◈\n`;
                    txt += `┊ ◦🤖 Nama: *${global.botName || 'FRIEREN'}*\n`;
                    txt += `┊ ◦⚙️ Versi: *v${global.botVersion || '2.6.7'}*\n`;
                    txt += `┊ ◦🔐 Mode: *${global.public ? 'PUBLIC' : 'SELF'}*\n`;
                    txt += `┊ ◦📍 Prefix: *[Multiprefix]*\n`;
                    txt += `┊ ◦⏳ Uptime: *${uptime}*\n`;
                    txt += `┊ ◦📃 Total Command: *${data.totalCommands}*\n`;
                    txt += `┊ ◦📦 Baileys: *elaina-baileys*\n`;
                    txt += `╰═┅═──────═┅═─────◈\n\n`;

                    txt += `╭─────═┅═─────⊱\n`;
                    txt += `┊ ◦ *👤 USER INFO*\n`;
                    txt += `┊┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈◈\n`;
                    txt += `┊ ◦🔖 Nama: *${senderName}*\n`;
                    txt += `┊ ◦📱 Number: *${m.sender.split('@')[0]}*\n`;
                    txt += `┊ ◦⌚ Waktu: *${timeStr} WIB*\n`;
                    txt += `┊ ◦🌙 Hijri: *${getHijriDate()}*\n`;
                    txt += `╰═┅═──────═┅═─────◈\n\n`;
                    txt += `_Pilih kategori di bawah untuk melihat daftar command_`;

                    // Greeting already declared at top
                    await sendMenuWithPremiumUI(xp, m, txt, greeting, p, availableCategories, commands);
                    break;
            }
            return
        }

        // === CATEGORY VIEW (FOR BUTTON & SEARCH) ===
        const selectedCat = availableCategories.find(cat => cat.toLowerCase().includes(filterKey))

        if (!selectedCat) {
            return xp.sendMessage(chat.id, { text: `❌ Kategori *${filterKey}* tidak ditemukan.` }, { quoted: m })
        }

        const categoryName = selectedCat.toUpperCase()
        const categoryCmds = commands[selectedCat]
        const emoji = CATEGORY_EMOJIS[selectedCat] || CATEGORY_EMOJIS[selectedCat.toLowerCase()] || '📋'
        
        let cmdListTxt = `╭─────═┅═─────⊱\n`
        cmdListTxt += `┊ ◦ *${emoji} ${categoryName}*\n`
        cmdListTxt += `┊┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈◈\n`
        
        categoryCmds.forEach(cmdObj => {
            let cmdName = (Array.isArray(cmdObj.cmd) ? cmdObj.cmd[0] : cmdObj.cmd)
            
            // Regex Handling
            if (cmdName instanceof RegExp) {
                if (cmdObj.help && Array.isArray(cmdObj.help)) {
                    cmdName = cmdObj.help[0].split(' ')[0] // Use help name
                } else {
                    // Clean regex characters AND unwanted underscores
                    cmdName = String(cmdName).replace(/[\^$()\[\]{}|\\\/]/g, '').replace(/i$/, '').replace(/_/g, '')
                }
            }
            
            cmdListTxt += `┊ ◦ ${p}${cmdName}\n`
        })
        
        cmdListTxt += `╰═┅═──────═┅═─────◈\n\n`
        cmdListTxt += `_Total ${categoryCmds.length} fitur_`
        
        try {
            const thumbUrl = global.thumbnail || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'
            const catHeaderMedia = await prepareWAMessageMedia({ image: { url: thumbUrl } }, { upload: xp.waUploadToServer })

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: cmdListTxt }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${global.botName}` }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: `${emoji} ${categoryName}`,
                                subtitle: "Category Menu", 
                                hasMediaAttachment: true, 
                                ...catHeaderMedia
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🔙 BACK TO MENU",
                                            id: `${p}menu`
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
            console.error('Error sending premium category menu:', e)
            await xp.sendMessage(m.chat, { text: cmdListTxt }, { quoted: m })
        }

      } catch (e) {
        console.error('Error pada menu', e)
        xp.sendMessage(chat.id, { text: 'Gagal memuat menu.' }, { quoted: m })
      }
    }
  })

  // --- ALL MENU (TEXT ONLY) ---
  ev.on({
    name: 'allmenu',
    cmd: ['allmenu'],
    tags: 'Information Menu',
    desc: 'Menampilkan semua menu tanpa tombol',
    run: async (xp, m, { chat }) => {
        try {
            const time = global.time ? global.time.timeIndo("Asia/Jakarta", "HH:mm:ss") : moment().tz('Asia/Jakarta').format('HH:mm:ss')
            const p = Array.isArray(global.prefix) ? global.prefix[0] : global.prefix
            const data = buildMenuData(ev, m, p)
            
            let txt = `📜 *ALL MENU* 📜\n`
            txt += `Waktu : ${time}\n\n`

            for (const cat of data.availableCategories) {
                const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS[cat.toLowerCase()] || '📋'
                txt += `┌───〔 ${emoji} *${cat.toUpperCase().replace(' MENU', '')}* 〕───\n`
                let cmdCount = 0
                for (const cmdObj of data.commands[cat]) {
                    let cmdName = (Array.isArray(cmdObj.cmd) ? cmdObj.cmd[0] : cmdObj.cmd)
                    
                    // Regex Handling
                    if (cmdName instanceof RegExp) {
                        if (cmdObj.help && Array.isArray(cmdObj.help)) {
                            cmdName = cmdObj.help[0].split(' ')[0]
                        } else {
                            cmdName = String(cmdName).replace(/[\^$()\[\]{}|\\\/]/g, '').replace(/i$/, '').replace(/_/g, '')
                        }
                    }
                    
                    txt += `│ ⚬ ${p}${cmdName}\n`
                    cmdCount++
                }
                txt += `└─────────────── ( ${cmdCount} ) ──\n\n`
            }

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: txt }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "Powered by " + global.botName })
                            ,
                            header: proto.Message.InteractiveMessage.Header.create({
                                subtitle: "Complete Command List",
                                hasMediaAttachment: true,
                                ...(await prepareWAMessageMedia({
                                    image: { url: global.thumbnail || 'https://c.termai.cc/i144/iQpwQM.jpg' } 
                                }, { upload: xp.waUploadToServer }))
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📢 SALURAN WA",
                                            url: global.linkCh || 'https://whatsapp.com/channel/0029VbCGe9q1XquPfMgyhN1c',
                                            merchant_url: global.linkCh || 'https://whatsapp.com/channel/0029VbCGe9q1XquPfMgyhN1c'
                                        })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🔙 MAIN MENU",
                                            id: ".menu"
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
            console.error('Error pada allmenu', e)
            m.reply('Gagal memuat allmenu.', e)
        }
    }
  })
  
  
}
