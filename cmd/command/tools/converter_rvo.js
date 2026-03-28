let handler = async (m, { conn, args, usedPrefix, command }) => {
    const text = m.quoted ? m.quoted.text : args.join(' ')

    if (command === 'tomc' || command === 'tominecraft') {
        if (!text) return m.reply(`Masukkan teks atau reply pesan.\nContoh: ${usedPrefix}${command} hello world`)
        const mc = {
            a: "ᔑ", b: "ʖ", c: "ᓵ", d: "↸", e: "ᒷ", f: "⎓", g: "⊣", h: "⍑", i: "╎", j: "⋮",
            k: "ꖌ", l: "ꖎ", m: "ᒲ", n: "リ", o: "𝙹", p: "!¡", q: "ᑑ", r: "∷", s: "ᓭ", t: "ℸ̣",
            u: "⚍", v: "⍊", w: "∴", x: "̇/", y: "||", z: "⨅", " ": "/"
        }
        const result = text.toLowerCase().split("").map(v => mc[v] ?? v).join(" ")
        m.reply(result)
    }

    if (command === 'tomorse') {
        if (!text) return m.reply(`Masukkan teks atau reply pesan.\nContoh: ${usedPrefix}${command} hello`)
        const mrs = {
            a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
            i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
            q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
            y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
            4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", " ": "/"
        }
        const result = text.toLowerCase().split("").map(v => mrs[v] ?? v).join(" ")
        m.reply(result)
    }

    if (command === 'toenigma' || command === 'enigma') {
        if (!text) return m.reply(`Masukkan teks atau reply pesan.\nContoh: ${usedPrefix}${command} secret message`)
        const abc = [...'abcdefghijklmnopqrstuvwxyz']
        const rotor = [...abc].sort(() => Math.random() - .5)
        const result = text.toLowerCase().split('').map(c => {
            const i = abc.indexOf(c)
            return i !== -1 ? rotor[i] : c
        }).join('')
        m.reply(`*ENIGMA RESULT*\n\nResult: ${result}\nKey: ${rotor.join('')}\n\n_Simpan key ini untuk mendeskripsi (fitur deskripsi segera hadir)._`)
    }

    if (command === 'rvo' || command === 'readviewonce') {
        if (!m.quoted || !m.quoted.mediaMessage) return m.reply('Reply pesan View Once (Sekali Lihat)!')
        const buffer = await m.quoted.download()
        if (!buffer) return m.reply('Gagal mengunduh media.')
        const type = m.quoted.mediaType
        await conn.sendMessage(m.chat, { [type.replace('Message', '')]: buffer, caption: m.quoted.text }, { quoted: m })
    }
}

handler.help = ['tomc <teks>', 'tomorse <teks>', 'toenigma <teks>', 'rvo']
handler.tags = ['tools']
handler.command = ['tomc', 'tominecraft', 'tomorse', 'toenigma', 'enigma', 'rvo', 'readviewonce']
handler.prefix = true

export default handler