/**
 * @module plugins/tools/encrypt
 * @description Javascript Obfuscator
 */

import JavaScriptObfuscator from "javascript-obfuscator"

let handler = async (m, { args, command, usedPrefix }) => {
    try {
        const modes = ["low", "high"]
        const usage = `*PENGGUNAAN ENCRYPT*

Reply kode JS yang ingin dienkripsi!

*Contoh:*
${usedPrefix + command} high (Susah dibaca)
${usedPrefix + command} low (Lebih ringan)`
        
        if (!m.quoted) return m.reply(usage)
        
        let type = (args[0] || '').toLowerCase()
        if (!modes.includes(type)) return m.reply(usage)

        let code = m.quoted.text || m.quoted.caption || ''
        if (!code) return m.reply('❌ Tidak ada teks untuk dienkripsi.')

        // Extract from markdown code block if exists
        const codeBlock = code.match(/```(?:javascript|js)?([\s\S]*?)```/i)
        let processedCode = codeBlock ? codeBlock[1].trim() : code.trim()

        if (!processedCode) return m.reply('❌ Konten kode kosong.')

        await m.reply('⏳ _Encrypting..._')

        try {
            let message
            if (type === "high") {
                message = await Encrypt(processedCode)
            } else {
                message = await LightObfuscate(processedCode)
            }
            m.reply(message)
        } catch (obfuscateError) {
            console.error('Obfuscation Error:', obfuscateError)
            m.reply(`❌ Gagal mengenkripsi kode: ${obfuscateError.message}`)
        }

    } catch (e) {
        console.error(e)
        await m.reply('❌ Terjadi kesalahan saat enkripsi.')
    }
}

handler.help = ['encrypt <high/low>']
handler.tags = ['tools']
handler.command = ['enkripsi', 'enc', 'encrypt']
handler.limit = true
handler.prefix = true

export default handler

async function Encrypt(query) {
    const obfuscationResult = JavaScriptObfuscator.obfuscate(query, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1,
        sourceMap: false,
        sourceMapMode: "separate",
    })

    return obfuscationResult.getObfuscatedCode()
}

async function LightObfuscate(code) {
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: false, // Pretty print
        controlFlowFlattening: false,
        mangle: false,
        stringArray: false
    })

    return obfuscationResult.getObfuscatedCode()
}