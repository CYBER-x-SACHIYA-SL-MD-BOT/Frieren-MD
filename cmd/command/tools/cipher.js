export default function cipher(ev) {
    
    // --- HELPER FUNCTIONS ---
    
    const caesar = (str, shift) => {
        return str.replace(/[a-z]/gi, (char) => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + shift) % 26 + 26) % 26 + start);
        });
    };

    const textToBinary = (text) => text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    const binaryToText = (bin) => bin.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
    
    const textToHex = (text) => Buffer.from(text, 'utf8').toString('hex');
    const hexToText = (hex) => Buffer.from(hex, 'hex').toString('utf8');

    const morseMap = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
        'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
        'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
        '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/'
    };
    const reverseMorse = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]));

    const vigenere = (str, key, decrypt = false) => {
        if (!key) return str;
        let result = '';
        for (let i = 0, j = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (65 <= c && c <= 90) {
                result += String.fromCharCode((c - 65 + (decrypt ? -1 : 1) * (key.toUpperCase().charCodeAt(j % key.length) - 65) + 26) % 26 + 65);
                j++;
            } else if (97 <= c && c <= 122) {
                result += String.fromCharCode((c - 97 + (decrypt ? -1 : 1) * (key.toLowerCase().charCodeAt(j % key.length) - 97) + 26) % 26 + 97);
                j++;
            } else {
                result += str.charAt(i);
            }
        }
        return result;
    };

    const base32 = {
        alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
        encode: (s) => {
            let parts = [];
            let quintetCount = 0;
            let quintetValue = 0;
            for (let i = 0; i < s.length; i++) {
                let binary = s.charCodeAt(i);
                for (let j = 7; j >= 0; j--) {
                    if ((binary & (1 << j)) !== 0) quintetValue += (1 << (4 - quintetCount));
                    quintetCount++;
                    if (quintetCount === 5) {
                        parts.push(base32.alphabet[quintetValue]);
                        quintetCount = 0;
                        quintetValue = 0;
                    }
                }
            }
            if (quintetCount > 0) parts.push(base32.alphabet[quintetValue]);
            return parts.join('');
        },
        decode: (s) => {
            let parts = [];
            let bitCount = 0;
            let bitValue = 0;
            for (let i = 0; i < s.length; i++) {
                let index = base32.alphabet.indexOf(s[i].toUpperCase());
                if (index === -1) continue;
                for (let j = 4; j >= 0; j--) {
                    if ((index & (1 << j)) !== 0) bitValue += (1 << (7 - bitCount));
                    bitCount++;
                    if (bitCount === 8) {
                        parts.push(String.fromCharCode(bitValue));
                        bitCount = 0;
                        bitValue = 0;
                    }
                }
            }
            return parts.join('');
        }
    };

    const textToMorse = (text) => text.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
    const morseToText = (morse) => morse.split(' ').map(m => reverseMorse[m] || m).join('');

    // --- 1. CAESAR ---
    ev.on({
        name: 'caesar',
        cmd: ['caesar'],
        tags: 'Tools Menu',
        desc: 'Caesar Cipher Encryption',
        run: async (xp, m, { args, prefix }) => {
            let shift = parseInt(args[0]);
            // Ambil text dari args ke-1 dst, ATAU dari quoted text
            let input = args.slice(1).join(' ') || (m.quoted?.text) || '';
            
            if (isNaN(shift)) return m.reply(`Format: ${prefix}caesar <angka> <teks>\nContoh: ${prefix}caesar 13 halo`);
            if (!input.trim()) return m.reply('Mana teksnya?');
            
            const result = caesar(input, shift);
            m.reply(`🔐 *CAESAR CIPHER (Shift ${shift})*\n\n${result}`);
        }
    })

    // --- 2. ROT13 ---
    ev.on({
        name: 'rot13',
        cmd: ['rot13'],
        tags: 'Tools Menu',
        desc: 'ROT13 Encryption',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            const result = caesar(input, 13);
            m.reply(`🔐 *ROT13*\n\n${result}`);
        }
    })

    // --- 3. ATBASH ---
    ev.on({
        name: 'atbash',
        cmd: ['atbash'],
        tags: 'Tools Menu',
        desc: 'Atbash Cipher',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            const result = input.replace(/[a-z]/gi, (char) => {
                const start = char <= 'Z' ? 65 : 97;
                return String.fromCharCode(start + (25 - (char.charCodeAt(0) - start)));
            });
            m.reply(`🔐 *ATBASH CIPHER*\n\n${result}`);
        }
    })

    // --- 4. BASE64 ---
    ev.on({
        name: 'base64',
        cmd: ['base64'],
        tags: 'Tools Menu',
        desc: 'Base64 Encode/Decode',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            let result, title;
            if (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(input.trim()) && input.length > 4) {
                result = Buffer.from(input, 'base64').toString('utf-8');
                title = 'BASE64 DECODE';
            } else {
                result = Buffer.from(input).toString('base64');
                title = 'BASE64 ENCODE';
            }
            m.reply(`🔐 *${title}*\n\n${result}`);
        }
    })

    // --- 5. HEX ---
    ev.on({
        name: 'hex',
        cmd: ['hex'],
        tags: 'Tools Menu',
        desc: 'Hex Encode/Decode',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            let result, title;
            if (/^[0-9a-fA-F]+$/.test(input.trim().replace(/\s/g, ''))) {
                result = hexToText(input.replace(/\s/g, ''));
                title = 'HEXADECIMAL DECODE';
            } else {
                result = textToHex(input);
                title = 'HEXADECIMAL ENCODE';
            }
            m.reply(`🔐 *${title}*\n\n${result}`);
        }
    })

    // --- 6. BINARY ---
    ev.on({
        name: 'binary',
        cmd: ['binary', 'biner'],
        tags: 'Tools Menu',
        desc: 'Binary Encode/Decode',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            let result, title;
            if (/^[01\s]+$/.test(input.trim())) {
                result = binaryToText(input);
                title = 'BINARY DECODE';
            } else {
                result = textToBinary(input);
                title = 'BINARY ENCODE';
            }
            m.reply(`🔐 *${title}*\n\n${result}`);
        }
    })

    // --- 7. MORSE ---
    ev.on({
        name: 'morse',
        cmd: ['morse'],
        tags: 'Tools Menu',
        desc: 'Morse Code Encode/Decode',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            let result, title;
            if (/^[.\-\/\[\s]+$/.test(input.trim())) {
                result = morseToText(input);
                title = 'MORSE CODE DECODE';
            } else {
                result = textToMorse(input);
                title = 'MORSE CODE ENCODE';
            }
            m.reply(`🔐 *${title}*\n\n${result}`);
        }
    })

    // --- 8. VIGENERE ---
    ev.on({
        name: 'vigenere',
        cmd: ['vigenere', 'vig'],
        tags: 'Tools Menu',
        desc: 'Vigenere Cipher (Key|Text)',
        run: async (xp, m, { args, text, usedPrefix, command }) => {
            const fullText = args.join(' ') || (m.quoted?.text) || '';
            if (!fullText.includes('|')) return m.reply(`⚠️ Format: ${usedPrefix + command} key|text\nContoh: ${usedPrefix + command} secret|halo dunia\n\nUntuk decode gunakan minus di depan key: -secret|teks`);
            
            const [key, ...msg] = fullText.split('|');
            const message = msg.join('|').trim();
            const keyword = key.trim();
            
            if (!message || !keyword) return m.reply('⚠️ Key dan Text tidak boleh kosong!');
            
            const isDecrypt = keyword.startsWith('-');
            const finalKey = isDecrypt ? keyword.substring(1) : keyword;
            
            const result = vigenere(message, finalKey, isDecrypt);
            const mode = isDecrypt ? 'DECRYPT' : 'ENCRYPT';
            
            m.reply(`🔐 *VIGENERE ${mode}*\n🔑 Key: ${finalKey}\n\n${result}`);
        }
    })

    // --- 9. REVERSE ---
    ev.on({
        name: 'reverse',
        cmd: ['reverse', 'balik'],
        tags: 'Tools Menu',
        desc: 'Membalikkan teks',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            const result = input.split('').reverse().join('');
            m.reply(`🪞 *REVERSE TEXT*\n\n${result}`);
        }
    })

    // --- 10. BASE32 ---
    ev.on({
        name: 'base32',
        cmd: ['base32'],
        tags: 'Tools Menu',
        desc: 'Base32 Encode/Decode',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            
            let result, title;
            // Simple auto-detect (if only contains A-Z2-7 and length valid)
            if (/^[A-Z2-7=]+$/.test(input.trim().toUpperCase())) {
                try {
                    result = base32.decode(input.trim());
                    title = 'BASE32 DECODE';
                } catch {
                    result = base32.encode(input);
                    title = 'BASE32 ENCODE (Fallback)';
                }
            } else {
                result = base32.encode(input);
                title = 'BASE32 ENCODE';
            }
            m.reply(`🔐 *${title}*\n\n${result}`);
        }
    })

    // --- 11. URL ENCODE/DECODE ---
    ev.on({
        name: 'urlencode',
        cmd: ['url', 'urlencode', 'urldecode'],
        tags: 'Tools Menu',
        desc: 'URL Encode/Decode',
        run: async (xp, m, { text }) => {
            let input = text || (m.quoted?.text) || '';
            if (!input.trim()) return m.reply('Mana teksnya?');
            
            let result, title;
            if (input.includes('%')) {
                try {
                    result = decodeURIComponent(input);
                    title = 'URL DECODE';
                } catch {
                    result = encodeURIComponent(input);
                    title = 'URL ENCODE';
                }
            } else {
                result = encodeURIComponent(input);
                title = 'URL ENCODE';
            }
            m.reply(`🔗 *${title}*\n\n${result}`);
        }
    })
}