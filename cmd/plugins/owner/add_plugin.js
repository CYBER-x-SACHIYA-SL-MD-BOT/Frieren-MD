/**
 * @module plugins/owner/add_plugin
 * @description Install Plugin (Smart Path Detection, CJS->ESM, Custom Format Converter, Auto Fixes)
 */

import fs from 'fs'
import path from 'path'
import syntaxError from 'syntax-error'

const convertToESM = (code) => {
    let newCode = code
    newCode = newCode.replace(/const\s+(\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g, "import $1 from '$2'")
    newCode = newCode.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g, "import { $1 } from '$2'")
    if (newCode.includes('module.exports = {') && newCode.includes('handler')) {
        newCode = newCode.replace(/module\.exports\s*=\s*{\s*config\s*:\s*(\w+)\s*,\s*handler\s*\}/, '$1.handler = handler\nexport default $1')
    }
    newCode = newCode.replace(/module\.exports\s*=\s*(\w+)/, 'export default $1')
    newCode = newCode.replace(/module\.exports\s*=\s*\{/, 'export default {')
    return newCode
}

const convertCustomFormat = (code) => {
    if (code.includes('async function handle(sock, messageInfo)') && code.includes('export default {')) {
        
        const cmdMatch = code.match(/Commands\s*:\s*(\[[^\]]+\])/);
        const cmds = cmdMatch ? cmdMatch[1] : "['converted_cmd']";
        
        const ownerMatch = code.match(/OnlyOwner\s*:\s*(true|false)/);
        const isOwner = ownerMatch ? ownerMatch[1] : 'false';
        
        const premMatch = code.match(/OnlyPremium\s*:\s*(true|false)/);
        const isPrem = premMatch ? premMatch[1] : 'false';
        
        const limitMatch = code.match(/limitDeduction\s*:\s*(\d+)/);
        const limit = limitMatch ? limitMatch[1] : 'false';

        let newCode = code.replace(
            /async function handle\s*\(sock,\s*messageInfo\)\s*\{/, 
            'let handler = async (m, { conn, text, args, usedPrefix, command }) => {'
        );

        newCode = newCode.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*messageInfo\s*;?/g, (match, content) => {
            const vars = content.split(',').map(v => v.trim()).filter(v => v !== 'command').join(', ');
            return `const { ${vars} } = messageInfo;`;
        });

        const mapping = `
    const sock = conn;
    const messageInfo = {
        remoteJid: m.chat,
        message: m,
        content: text,
        isQuoted: m.quoted ? true : false,
        prefix: usedPrefix,
        command: command
    };
`;
        newCode = newCode.replace(
            'let handler = async (m, { conn, text, args, usedPrefix, command }) => {', 
            'let handler = async (m, { conn, text, args, usedPrefix, command }) => {\n' + mapping
        );

        newCode = newCode.replace(/export default\s*\{[\s\S]*?\};/, '');

        newCode += `
handler.command = ${cmds}
handler.owner = ${isOwner}
handler.premium = ${isPrem}
handler.limit = ${limit}
handler.tags = ['converted']
handler.help = ${cmds}
handler.prefix = true

export default handler`;

        return newCode;
    }
    return code;
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const tiny = (t) => t.split('').map(c=>{
        const m = { 'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ' };
        return m[c] || c
    }).join('')
    
    if (!m.quoted || !m.quoted.text) {
        return m.reply(`╭───「 *${tiny('INSTALLER')}* 」───\n│\n│ 📦 Reply kode plugin.\n│ 🎮 Format: ${usedPrefix + command} folder/namafile\n│ 📝 Contoh: ${usedPrefix + command} ai/copilot\n│\n╰────────────────────`)
    }
    
    let code = m.quoted.text
    let input = text?.trim() || ''
    let folder = 'other'
    let filename = 'new_plugin'

    // Clean input
    if (input.includes('/')) {
        const parts = input.split('/')
        folder = parts[0].trim().toLowerCase().replace(/\s+/g, '') // Remove spaces in folder name
        filename = parts.slice(1).join('_').trim().toLowerCase().replace(/\s+/g, '')
    } else if (input) {
        filename = input.trim().toLowerCase().replace(/\s+/g, '_')
    } else {
        const nameMatch = code.match(/name\s*:\s*['"`]([^'"`]+)['"`]/i)
        if (nameMatch) filename = nameMatch[1]
        const commentName = code.match(/Name fitur\s*:\s*([^\n]+)/i)
        if (commentName) filename = commentName[1].trim().replace(/\s+/g, '_').toLowerCase()
    }

    // Safety cleanup
    filename = filename.replace('.js', '').replace(/[^a-z0-9_]/g, '')
    folder = folder.replace(/[^a-z0-9_]/g, '')
    
    // --- AUTO FIXES ---
    
    // 1. CJS -> ESM
    if (code.includes('module.exports') || code.includes('require(')) {
        await m.reply(`🔄 *CONVERTING CJS TO ESM...*`)
        code = convertToESM(code)
    }

    // 2. Custom Format (sock, messageInfo)
    if (code.includes('async function handle(sock, messageInfo)')) {
        await m.reply(`🔄 *CONVERTING CUSTOM FORMAT...*`)
        code = convertCustomFormat(code)
    }

    // 3. Fix Cheerio Import
    if (code.includes('import cheerio from "cheerio"') || code.includes("import cheerio from 'cheerio'")) {
        code = code.replace(/import cheerio from ["']cheerio["']/g, 'import * as cheerio from "cheerio"')
    }

    // 4. Fix Conn Reply
    if (code.includes('conn.reply(m.chat,')) {
        code = code.replace(/conn\.reply\s*\(\s*m\.chat\s*,/g, 'm.reply(')
    }
    
    // 5. Fix Regex Command to Array
    code = code.replace(/handler\.command\s*=\s*\/\^([a-zA-Z0-9_]+)\$\/i/g, "handler.command = ['$1']")
    
    // 6. Auto Add Prefix
    if (!code.includes('handler.prefix') && code.includes('export default handler')) {
        code = code.replace(/export default handler/, 'handler.prefix = true\nexport default handler')
    }

    // 7. DB Access Fix (Attempt - Experimental)
    // global.db.data.users[m.sender] -> db().key[Object.keys(db().key).find(k => db().key[k].jid === m.sender)]
    // Ini agak kompleks regex-nya, lebih baik manual atau simple replacement
    // code = code.replace(/global\.db\.data\.users\[m\.sender\]/g, "db().key[Object.keys(db().key).find(k => db().key[k].jid === m.sender)]")
    
    const err = syntaxError(code, filename, {
        sourceType: 'module',
        allowReturnOutsideFunction: true
    })
    
    if (err) return m.reply(`❌ *SYNTAX ERROR*\n\n${err}`)
    
    const dir = path.join('cmd/plugins', folder)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, filename + '.js')
    
    fs.writeFileSync(filePath, code)
    
    m.reply(`╭───「 *${tiny('INSTALL SUCCESS')}* 」───\n│\n│ ✅ Path: ${folder}/${filename}.js\n│ 📦 Size: ${code.length} bytes\n│\n╰────────────────────`)
}

handler.help = ['addplugin']
handler.tags = ['owner']
handler.command = ['addplugin']
handler.owner = true
handler.prefix = true

export default handler