/**
 * @module plugins/owner/addme
 * @description Bot masuk ke grup dan menambahkan Owner secara otomatis.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { getBinaryNodeChild, getBinaryNodeChildren } = require('@adiwajshing/baileys');

let handler = async (m, { conn, usedPrefix, command, text }) => {
    // Fake Contact for Reply
    const fkontak = {
        key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'FrierenBot' },
        message: { conversation: `Adding Owner to Group...` }
    };

    if (!text) {
        return conn.sendMessage(m.chat, { text: `❌ Masukkan Link atau ID Grup!\n\nContoh:\n${usedPrefix + command} https://chat.whatsapp.com/...\n${usedPrefix + command} 123456789@g.us` }, { quoted: m });
    }
    
    let link = text.trim();
    let code = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]{22})/)?.[1];
    let jid = link.match(/(\d{15,})@g\.us/i)?.[0];
    let gid;

    // --- 1. JOIN GROUP ---
    if (code) {
        await conn.sendMessage(m.chat, { text: `🔄 Mencoba bergabung via link...` }, { quoted: fkontak });
        try {
            gid = await conn.groupAcceptInvite(code);
            await conn.sendMessage(m.chat, { text: `✅ Berhasil masuk grup!` }, { quoted: fkontak });
        } catch (e) {
            return conn.sendMessage(m.chat, { text: `❌ Gagal bergabung. Link mungkin kadaluwarsa atau bot di-kick.` }, { quoted: fkontak });
        }
    } else if (jid) {
        gid = jid;
        try {
            await conn.groupMetadata(gid); // Verify ID
        } catch (e) {
            return conn.sendMessage(m.chat, { text: `❌ Gagal memverifikasi ID Grup. Pastikan bot sudah di dalam.` }, { quoted: fkontak });
        }
    } else {
        return conn.sendMessage(m.chat, { text: '❌ Link/ID tidak valid.' }, { quoted: fkontak });
    }
    
    // --- 2. GET OWNER NUMBERS ---
    // Support multiple formats
    let ownerNumbers = global.ownerNumber || (global.owner ? global.owner.map(o => o[0]) : []);
    if (!Array.isArray(ownerNumbers)) ownerNumbers = [ownerNumbers];
  
    let ownerJids = ownerNumbers
        .map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        .filter(j => j.length > 10);

    if (ownerJids.length === 0) return conn.sendMessage(m.chat, { text: '⚠️ Nomor owner tidak ditemukan di config.' }, { quoted: fkontak });

    await conn.sendMessage(m.chat, { text: `🆔 ID: ${gid}\n🔄 Menambahkan owner...` }, { quoted: fkontak });

    // --- 3. ADD OWNER (BINARY NODE) ---
    try {
        let response = await conn.query({
            tag: 'iq',
            attrs: {
                type: 'set',
                xmlns: 'w:g2',
                to: gid,
            },
            content: ownerJids.map(jid => ({
                tag: 'add',
                attrs: {},
                content: [{ tag: 'participant', attrs: { jid } }]
            }))
        });
        
        const add = getBinaryNodeChild(response, 'add');
        const participant = getBinaryNodeChildren(add, 'participant');
        
        let successJids = [];
        let error403Jids = [];
        let otherErrors = [];

        for (const user of participant) {
            let jid = user.attrs.jid;
            let error = user.attrs.error;

            if (error) {
                if (error === '403') {
                    const content = getBinaryNodeChild(user, 'add_request');
                    const invite_code = content?.attrs?.code || 'N/A';
                    error403Jids.push({ jid, invite_code });
                } else {
                    otherErrors.push({ jid, error });
                }
            } else {
                successJids.push(jid);
            }
        }

        // --- 4. REPORT (Fixed Syntax) ---
        let resultText = `✨ *ADD OWNER REPORT:*

`;
        
        if (successJids.length > 0) {
            resultText += `✅ *SUKSES:*
${successJids.map(j => `@${j.split('@')[0]}`).join('\n')}\n\n`;
        }
        
        if (error403Jids.length > 0) {
            resultText += `⚠️ *BUTUH INVITE (Privasi):*
`;
            resultText += error403Jids.map(e => `@${e.jid.split('@')[0]}`).join('\n') + '\n\n';
        }
        
        if (otherErrors.length > 0) {
            resultText += `❌ *GAGAL:*
`;
            resultText += otherErrors.map(e => `@${e.jid.split('@')[0]} (Err: ${e.error})`).join('\n') + '\n\n';
        }
        
        if (successJids.length === 0 && error403Jids.length === 0 && otherErrors.length > 0) {
             resultText += `> *Tips:* Jadikan bot sebagai admin grup dulu agar bisa add member!`;
        }

        await conn.sendMessage(m.chat, { text: resultText.trim(), mentions: [...successJids, ...error403Jids.map(e => e.jid)] }, { quoted: fkontak });

    } catch (e) {
        console.error('[ADDME ERROR]', e);
        await conn.sendMessage(m.chat, { text: `❌ Gagal menambahkan owner.\nBot harus jadi admin grup!` }, { quoted: fkontak });
    }
}

handler.help = ['addme <link/id>']
handler.tags = ['owner']
handler.command = ['addme', 'joinadd']
handler.owner = true
handler.prefix = true

export default handler