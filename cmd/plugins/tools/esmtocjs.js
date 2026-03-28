/**
 * @module plugins/tools/esmtocjs
 * @description Convert ES Modules (ESM) to CommonJS (CJS)
 */

function convertEsmToCjs(code) {
    let result = code
    const exportedItems = []
    let hasDefaultExport = false
    let defaultExportValue = null

    // import x from 'y' -> const x = require('y')
    result = result.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (match, name, path) => {
        return `const ${name} = require('${path}');`
    })

    // import { x, y } from 'z' -> const { x, y } = require('z')
    result = result.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, imports, path) => {
        const items = imports.split(',').map(i => {
            const parts = i.trim().split(/\s+as\s+/)
            if (parts.length === 2) {
                return `${parts[0].trim()}: ${parts[1].trim()}`
            }
            return parts[0].trim()
        })
        const destructure = items.join(', ')
        return `const { ${destructure} } = require('${path}');`
    })

    // import * as x from 'y' -> const x = require('y')
    result = result.replace(/import\s*\*\s*as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (match, name, path) => {
        return `const ${name} = require('${path}');`
    })

    // import 'x' -> require('x')
    result = result.replace(/import\s+['"]([^'"]+)['"]\s*;?/g, (match, path) => {
        return `require('${path}');`
    })

    // import def, { named } from 'x'
    result = result.replace(/import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, defaultName, named, path) => {
        const items = named.split(',').map(i => i.trim())
        return `const ${defaultName} = require('${path}');\nconst { ${items.join(', ')} } = require('${path}');`
    })

    // export default x
    result = result.replace(/export\s+default\s+(\w+)\s*;?/g, (match, name) => {
        hasDefaultExport = true
        defaultExportValue = name
        return ''
    })

    // export default function/class
    result = result.replace(/export\s+default\s+(function|class|async\s+function)\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, type, name, params) => {
        hasDefaultExport = true
        if (name) {
            defaultExportValue = name
            return `${type} ${name}${params || ''} {`
        }
        defaultExportValue = '__default__'
        return `const __default__ = ${type}${params || ''} {`
    })

    // export default { object }
    result = result.replace(/export\s+default\s+(\{[\s\S]*?\})\s*;?/g, (match, obj) => {
        hasDefaultExport = true
        defaultExportValue = obj
        return ''
    })

    // export { x, y }
    result = result.replace(/export\s*\{\s*([^}]+)\s*\}\s*;?/g, (match, exports) => {
        const items = exports.split(',').map(i => {
            const parts = i.trim().split(/\s+as\s+/)
            if (parts.length === 2) {
                exportedItems.push({ name: parts[0].trim(), alias: parts[1].trim() })
            } else {
                exportedItems.push({ name: parts[0].trim(), alias: null })
            }
            return null
        })
        return ''
    })

    // export const x = ...
    result = result.replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, (match, type, name) => {
        exportedItems.push({ name, alias: null })
        return `${type} ${name} =`
    })

    // export function x()
    result = result.replace(/export\s+(async\s+)?function\s+(\w+)/g, (match, async, name) => {
        exportedItems.push({ name, alias: null })
        return `${async || ''}function ${name}`
    })

    // export class X
    result = result.replace(/export\s+class\s+(\w+)/g, (match, name) => {
        exportedItems.push({ name, alias: null })
        return `class ${name}`
    })

    // export * from 'x'
    result = result.replace(/export\s*\*\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, path) => {
        return `Object.assign(module.exports, require('${path}'));`
    })

    // Construct module.exports
    let exportsCode = ''
    if (hasDefaultExport && exportedItems.length === 0) {
        exportsCode = `\nmodule.exports = ${defaultExportValue};`
    } else if (exportedItems.length > 0) {
        const exportObj = exportedItems.map(e => e.alias ? `${e.alias}: ${e.name}` : e.name).join(', ')
        if (hasDefaultExport) {
            exportsCode = `\nmodule.exports = ${defaultExportValue};\nmodule.exports = { ...module.exports, ${exportObj} };`
        } else {
            exportsCode = `\nmodule.exports = { ${exportObj} };`
        }
    } else if (hasDefaultExport) {
         exportsCode = `\nmodule.exports = ${defaultExportValue};`
    }

    result = result.trim() + exportsCode
    result = result.replace(/\n{3,}/g, '\n\n')
    return result
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let code = m.quoted ? m.quoted.text : text
    
    if (!code) {
        return m.reply(
            `[ COMMONJS COMPATIBILITY ]\n\n` +
            `Konversi kode ES Modules (import) kembali ke format CommonJS (require) untuk dukungan Node.js lama.\n\n` +
            `-- Instruksi --\n` +
            `Reply script ESM menggunakan:\n` +
            `*${usedPrefix + command}*\n\n` +
            `-- Contoh Input --\n` +
            `import path from 'path';\n` +
            `export default path;`
        )
    }

    try {
        const converted = convertEsmToCjs(code)
        
        await conn.sendMessage(m.chat, {
            text: `[ CONVERTED TO COMMONJS (CJS) ]\n\n\`\`\`javascript\n${converted}\n\`\`\``,
            contextInfo: {
                isForwarded: true
            }
        }, { quoted: m })
        
    } catch (error) {
        await m.reply(`❌ *GAGAL*\n\nError: ${error.message}`)
    }
}

handler.help = ['esmtocjs <reply code>']
handler.tags = ['tools']
handler.command = ['esmtocjs', 'esm2cjs']
handler.prefix = true

export default handler