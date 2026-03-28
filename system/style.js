import c from 'chalk'

// --- 1. FONT CONVERTER: SMALL CAPS (Header) ---
// Memberikan kesan rapi dan profesional seperti judul di dokumen resmi
const tinyStyle = (text) => {
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    }
    return text.split('').map(char => map[char] || char).join('')
}

// --- 2. FONT CONVERTER: MONOSPACE (Data/Code) ---
// Standar coding, mudah dibaca, memberikan kesan "Tech"
const monoStyle = (text) => {
    return '`' + text + '`'
}

// --- 3. STANDARD MESSAGES (Konsistensi) ---
// Gunakan ini di semua plugin agar respon bot seragam
const status = {
    wait: '⚡ *ᴘʀᴏᴄᴇssɪɴɢ...* Mohon tunggu sebentar.',
    error: '⚠️ *sʏsᴛᴇᴍ ᴇʀʀᴏʀ* Terjadi kendala saat memproses permintaan.',
    success: '✅ *sᴜᴄᴄᴇss!* Permintaan berhasil dijalankan.',
    owner: '👑 *ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ* Fitur ini khusus untuk Owner.',
    group: '👥 *ɢʀᴏᴜᴘ ᴏɴʟʏ* Fitur ini hanya bisa digunakan di dalam Grup.',
    private: '👤 *ᴘʀɪᴠᴀᴛᴇ ᴏɴʟʏ* Silakan gunakan fitur ini di Private Chat.',
    admin: '👮 *ᴀᴅᴍɪɴ ᴏɴʟʏ* Anda harus menjadi Admin untuk menggunakan fitur ini.',
    botAdmin: '🤖 *ʙᴏᴛ ᴀᴅᴍɪɴ* Bot harus menjadi Admin terlebih dahulu.',
    restrict: '🚫 *ʀᴇsᴛʀɪᴄᴛᴇᴅ* Fitur ini dinonaktifkan di grup ini.'
}

// --- 4. STYLE HELPER ---
// Memudahkan formatting teks kompleks
// Contoh: style.header('Menu') -> ╔══ [ ᴍᴇɴᴜ ] ══╗
const style = {
    header: (text) => `💠 *${tinyStyle(text)}*`,
    body: (text) => `│ ${text}`,
    footer: (text) => `╰─────────────────\n> ${text}`,
    key: (key) => `🔹 ${tinyStyle(key)}:`,
    val: (val) => monoStyle(val)
}

// Legacy export untuk kompatibilitas
const fontStyle = tinyStyle 

export { fontStyle, tinyStyle, monoStyle, status, style }