/**
 * @module plugins/tools/cjstoesm
 * @description Convert CommonJS code to ES Modules (ESM)
 */

function convertCjsToEsm(code) {
    let result = code
    const requires = []
    const moduleExports = []
    
    // Convert: const x = require('y') -> import x from 'y'
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, name, path) => {
        requires.push({ type: 'default', name, path })
        return `import ${name} from '${path}';`
    })

    // Convert: const { x, y } = require('z') -> import { x, y } from 'z'
    result = result.replace(/(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, imports, path) => {
        const items = imports.split(',').map(i => {
            const parts = i.trim().split(/\s*:\s*/)
            if (parts.length === 2) {
                return `${parts[0].trim()} as ${parts[1].trim()}`
            }
            return parts[0].trim()
        })
        return `import { ${items.join(', ')} } from '${path}';`
    })

    // Convert: require('x') -> import 'x'
    result = result.replace(/^require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?$/gm, (match, path) => {
        return `import '${path}';`
    })

    // Convert: .default imports
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.default\s*;?/g, (match, name, path) => {
        return `import ${name} from '${path}';`
    })

    // Convert: require('x').prop
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.(\w+)\s*;?/g, (match, name, path, prop) => {
        if (name === prop) {
            return `import { ${prop} } from '${path}';`
        }
        return `import { ${prop} as ${name} } from '${path}';`
    })

    // Convert: module.exports = name
    result = result.replace(/module\.exports\s*=\s*(\w+)\s*;?/g, (match, name) => {
        moduleExports.push({ type: 'default', value: name })
        return `export default ${name};`
    })

    // Convert: module.exports = { ... }
    result = result.replace(/module\.exports\s*=\s*\{([^}]+)\}\s*;?/g, (match, exports) => {
        const items = exports.split(',').map(i => {
            const parts = i.trim().split(/\s*:\s*/)
            if (parts.length === 2) {
                return `${parts[1].trim()} as ${parts[0].trim()}`
            }
            return parts[0].trim()
        })
        return `export { ${items.join(', ')} };`
    })

    // Convert: module.exports = function/class
    result = result.replace(/module\.exports\s*=\s*(async\s+)?(function|class)\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, async, type, name, params) => {
        if (name) {
            return `export default ${async || ''}${type} ${name}${params || ''} {`
        }
        return `export default ${async || ''}${type}${params || ''} {`
    })

    // Convert: exports.key = value
    result = result.replace(/exports\.(\w+)\s*=\s*(\w+)\s*;?/g, (match, key, value) => {
        if (key === value) {
            return `export { ${key} };`
        }
        return `export { ${value} as ${key} };`
    })

    result = result.replace(/exports\.(\w+)\s*=\s*([^;\n]+)\s*;?/g, (match, key, value) => {
        if (value.trim().startsWith('function') || value.trim().startsWith('async') || value.trim().startsWith('(') || value.trim().startsWith('class')) {
            return `export const ${key} = ${value}`
        }
        return `export const ${key} = ${value};`
    })

    // Helper for __dirname
    if (result.includes('__dirname') || result.includes('__filename')) {
        const helperCode = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\nimport { createRequire } from 'module';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\nconst require = createRequire(import.meta.url);\n\n`
        if (!result.includes('fileURLToPath')) {
            result = helperCode + result
        }
    }

    result = result.replace(/\n{3,}/g, '\n\n')
    return result
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Get quoted text or direct text
    let code = m.quoted ? m.quoted.text : text
    
    if (!code) {
        return m.reply(
            `[ UPGRADE TO ESM MODULES ]\n\n` +
            `Ubah kode legacy CommonJS (require) menjadi ES Modules (import) yang lebih modern.\n\n` +
            `-- Penggunaan --\n` +
            `Reply pesan kode CJS dengan command:\n` +
            `*${usedPrefix + command}*\n\n` +
            `-- Contoh Input --\n` +
            `const fs = require('fs');\n` +
            `module.exports = { fs };`
        )
    }

    try {
        const converted = convertCjsToEsm(code)
        
        await conn.sendMessage(m.chat, {
            text: `[ CODE MODERNIZED (ESM) ]\n\n\`\`\`javascript\n${converted}\n\`\`\``,
            contextInfo: {
                isForwarded: true
            }
        }, { quoted: m })
        
    } catch (error) {
        console.error(error)
        await m.reply(`❌ *GAGAL*\n\nError: ${error.message}`)
    }
}

handler.help = ['cjstoesm <reply code>']
handler.tags = ['tools']
handler.command = ['cjstoesm', 'cjs2esm']
handler.prefix = true

export default handler