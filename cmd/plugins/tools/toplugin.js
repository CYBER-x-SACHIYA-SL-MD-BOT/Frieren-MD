/**
 * @module plugins/tools/toplugin
 * @description Kode Converter (SC to Plugin ESM) - Supports Custom Handle & Multi-Emitter
 */

import syntaxError from 'syntax-error'

const convertToESM = (code) => {
    let newCode = code
    newCode = newCode.replace(/const\s+(\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g, "import $1 from '$2'")
    newCode = newCode.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g, "import { $1 } from '$2'")
    if (newCode.includes('module.exports = {') && newCode.includes('handler')) {
        newCode = newCode.replace(/module\.exports\s*=\s*{\s*config\s*:\s*(\w+)\s*,\s*handler\s*\}/, '$1.handler = handler\nexport default $1')
    }
    newCode = newCode.replace(/module\.exports\s*=\s*(\w+)/, 'export default $1')
    return newCode
}

const convertCustomHandle = (code) => {
    if (code.includes('async function handle(sock, messageInfo)')) {
        const cmdMatch = code.match(/Commands\s*:\s*(\[[^\]]+\])/);
        const cmds = cmdMatch ? cmdMatch[1] : "['converted']";
        
        let newCode = code.replace(/async function handle\s*\(sock,\s*messageInfo\)\s*\{/, 'let handler = async (m, { conn, text, args, usedPrefix, command }) => {');
        
        newCode = newCode.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*messageInfo\s*;?/g, (match, content) => {
            const vars = content.split(',').map(v => v.trim()).filter(v => v !== 'command').join(', ');
            return `const { ${vars} } = messageInfo;`;
        });

        const mapping = `
    const sock = conn;
    const messageInfo = { remoteJid: m.chat, message: m, content: text, isQuoted: m.quoted ? true : false, prefix: usedPrefix, command: command };
`;
        newCode = newCode.replace('let handler = async (m, { conn, text, args, usedPrefix, command }) => {', 'let handler = async (m, { conn, text, args, usedPrefix, command }) => {\n' + mapping);
        newCode = newCode.replace(/export default\s*\{[\s\S]*?\};/, '');
        newCode += `\nhandler.command = ${cmds}\nhandler.tags = ['converted']\nhandler.help = ${cmds}\nexport default handler`;
        return newCode
    }
    return code
}

const convertEmitter = (code) => {
    // Basic detection
    if (!code.includes('ev.on') || !code.includes('run:')) return code;

    // Regex to capture ev.on blocks
    // Be careful with nested braces. This regex is simple and might fail on complex nested structures.
    const evRegex = /ev\.on\(\{\s*[\s\S]*?run\s*:\s*async\s*\(([^)]+)\)\s*=>\s*\{([\s\S]*?)\}\s*\}\)/g;
    
    let matches = [];
    let match;
    while ((match = evRegex.exec(code)) !== null) {
        matches.push(match);
    }

    if (matches.length === 0) return code;

    // Header (Imports & Constants before first ev.on)
    const firstEvIndex = code.indexOf('ev.on');
    let header = code.substring(0, firstEvIndex);
    // Remove export default function wrapper
    header = header.replace(/export\s+default\s+function\s*\(\w+\)\s*\{/, '');

    // Main Handler Builder
    let mainHandler = `let handler = async (m, { conn: xp, args, command, text, usedPrefix }) => {\n  switch(command) {`;
    let allCmds = [];
    let allTags = new Set();
    let allHelp = [];

    matches.forEach(m => {
        const block = m[0];
        // Params capture: xp, m, { args }
        const paramsStr = m[1]; 
        const body = m[2];

        // Metadata Extraction
        const cmdMatch = block.match(/cmd\s*:\s*(\[[^\]]+\])/);
        const tagsMatch = block.match(/tags\s*:\s*['"`]([^'"`]+)['"`]/);
        const descMatch = block.match(/desc\s*:\s*['"`]([^'"`]+)['"`]/);

        let cmds = [];
        try {
            if (cmdMatch) {
                // Pre-process common JS array formats to valid JSON
                let cleanJson = cmdMatch[1]
                    .replace(/'/g, '"') // single to double quotes
                    .replace(/,\s*]/, ']') // trailing comma
                cmds = JSON.parse(cleanJson);
            }
        } catch (e) {
            cmds = ['converted'];
        }
        
        const desc = descMatch ? descMatch[1] : '';
        const tag = tagsMatch ? tagsMatch[1] : 'converted';

        allCmds.push(...cmds);
        allTags.add(tag);
        allHelp.push(cmds[0] + (desc ? ` (${desc})` : ''));

        // Generate Switch Cases
        cmds.forEach(c => {
            mainHandler += `\n    case '${c}':`;
        });
        
        // Body Adjustment (Map params to standard handler params)
        // Original: (xp, m, { args })
        // New: (m, { conn: xp, args, ... })
        // We need to inject variables if they are named differently
        
        let adjustedBody = body;
        
        // Simple var mapping based on position
        const pParts = paramsStr.split(',').map(p => p.trim());
        const varXp = pParts[0]; // e.g. 'xp'
        // const varM = pParts[1]; // e.g. 'm' (already m in handler)
        
        // Prepend var alias if needed
        if (varXp && varXp !== 'xp') {
            adjustedBody = `      const ${varXp} = xp;\n` + adjustedBody;
        }

        mainHandler += `\n    {\n${adjustedBody}\n    }\n    break;`;
    });

    mainHandler += `\n  }\n}\n`;

    // Metadata Construction
    mainHandler += `\nhandler.command = ${JSON.stringify(allCmds)}`;
    mainHandler += `\nhandler.tags = ${JSON.stringify([...allTags])}`;
    mainHandler += `\nhandler.help = ${JSON.stringify(allHelp)}`;
    mainHandler += `\nhandler.prefix = true`;
    mainHandler += `\nexport default handler`;

    return header + '\n' + mainHandler;
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.quoted || !m.quoted.text) {
        return m.reply(`📦 Reply kode yang mau di-convert ke Plugin ESM.\nContoh: ${usedPrefix + command} namafile`)
    }
    
    let code = m.quoted.text
    let filename = text?.trim() || `plugin_${Date.now()}`
    filename = filename.replace('.js', '').replace(/[^a-z0-9_]/g, '')

    await m.reply('🔄 Converting code...')

    try {
        if (code.includes('module.exports') || code.includes('require(')) {
            code = convertToESM(code)
        }

        if (code.includes('async function handle(sock, messageInfo)')) {
            code = convertCustomHandle(code)
        }
        
        if (code.includes('ev.on') && code.includes('run:')) {
            code = convertEmitter(code)
        }

        if (!code.includes('handler.prefix') && code.includes('export default handler')) {
            // Check if not already added by converters
            if (!code.includes('handler.prefix = true')) {
                 code = code.replace(/export default handler/, 'handler.prefix = true\nexport default handler')
            }
        }

        const err = syntaxError(code, filename, { sourceType: 'module', allowReturnOutsideFunction: true })
        if (err) return m.reply(`❌ *SYNTAX ERROR*\n\n${err}`)

        await conn.sendMessage(m.chat, {
            document: Buffer.from(code),
            mimetype: 'text/javascript',
            fileName: filename + '.js',
            caption: `✅ *CONVERSION SUCCESS*\n\nKode berhasil dikonversi ke format Plugin ESM.`
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply(`❌ *CONVERT ERROR*\nGagal mengonversi kode: ${e.message}`)
    }
}

handler.help = ['toplugin [namafile]']
handler.tags = ['tools']
handler.command = ['toplugin', 'convertplugin']
handler.owner = true
handler.prefix = true

export default handler