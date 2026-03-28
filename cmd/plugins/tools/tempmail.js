/**
 * @module plugins/tools/tempmail
 * @description Temporary Email Generator & Inbox Checker (Emailnator Scraper)
 */

import fetch from 'node-fetch';

const base = 'https://www.emailnator.com';

async function getSession() {
    const res = await fetch(base, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'accept': 'application/json, text/plain, */*',
            'referer': base + '/'
        }
    });

    let cookies = '';
    const raw = res.headers.raw ? res.headers.raw()['set-cookie'] : null;

    if (raw && raw.length) {
        cookies = raw.map(v => v.split(';')[0]).join('; ');
    } else {
        const single = res.headers.get('set-cookie');
        if (!single) throw new Error('Session cookie not found');
        cookies = single.split(',').map(v => v.split(';')[0]).join('; ');
    }

    const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (!match) throw new Error('XSRF token not found');

    return { cookies, xsrf: decodeURIComponent(match[1]) };
}

function auth(session) {
    return {
        headers: {
            'cookie': session.cookies,
            'x-xsrf-token': session.xsrf,
            'x-requested-with': 'XMLHttpRequest',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'referer': base + '/'
        }
    };
}

function cleanHTML(html) {
    let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let clean = bodyMatch ? bodyMatch[1] : html;

    return clean
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&#\d+;/g, '')
        .replace(/\uFEFF/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&zwnj;/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\\r?\\n|\\r/g, ' ')
        .replace(/\\s{2,}/g, ' ')
        .trim();
        }

        function extractOTP(text) {
        const otpRegex = /(code|otp|verify|verification|login|password)[^0-9]{0,20}(\\d{4,6})/i;
        const match = text.match(otpRegex);
        return match ? match[2] : null;
        }

async function checkInbox(email) {
    const session = await getSession();

    const inboxRes = await fetch(base + '/message-list', {
        method: 'POST',
        ...auth(session),
        body: JSON.stringify({ email })
    });

    const inboxData = await inboxRes.json();
    const inbox = inboxData.messageData || [];
    const mail = inbox.find(v => v.messageID !== 'ADSVPN');
    if (!mail) return null;

    const openRes = await fetch(base + '/message-list', {
        method: 'POST',
        ...auth(session),
        body: JSON.stringify({ email, messageID: mail.messageID })
    });

    const rawHtml = await openRes.text();
    const clean = cleanHTML(rawHtml);
    const otp = extractOTP(clean);

    return { mail, clean, otp };
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        if (!text) {
            const session = await getSession();
            const res = await fetch(base + '/generate-email', {
                method: 'POST',
                ...auth(session),
                body: JSON.stringify({ email: ['plusGmail', 'dotGmail', 'googleMail'] })
            });

            const data = await res.json();
            if (!data || !data.email) {
                return m.reply('❌ Gagal membuat email sementara.');
            }

            return conn.sendMessage(m.chat, {
                text: `📧 *TEMPORARY EMAIL GENERATED*\n\n` +
                      `*Alamat Email:*\n\`${data.email[0]}\`\n\n` +
                      `_Pilih cara pengecekan pesan:_\n` +
                      `> Cek Manual:\n` +
                      `> *${usedPrefix + command} inbox ${data.email[0]}*\n\n` +
                      `> Tunggu OTP Otomatis:\n` +
                      `> *${usedPrefix + command} auto ${data.email[0]}*`,
                contextInfo: {
                    externalAdReply: {
                        title: "Emailnator Generator",
                        body: "Disposable Email Service",
                        thumbnailUrl: "https://www.emailnator.com/images/logo.png",
                        sourceUrl: "https://www.emailnator.com",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        }

        const args = text.trim().split(/\s+/);

        // --- AUTO OTP MODE ---
        if (args[0].toLowerCase() === 'auto') {
            if (!args[1]) return m.reply(`⚠️ *Format Salah!*

Contoh: *${usedPrefix + command} auto example@gmail.com*`);

            const email = args[1];
            await m.reply(`🔄 *AUTO OTP MODE*\nSedang memantau inbox untuk \`${email}\`...\n_(Maksimal pencarian 60 detik)_`);

            for (let i = 0; i < 12; i++) {
                const result = await checkInbox(email);

                if (result && result.otp) {
                    return m.reply(
                        `*📬 OTP DITEMUKAN!*\n\n` +
                        `*Email:* ${email}\n` +
                        `*From:* ${result.mail.from}\n` +
                        `*🔐 OTP:* \`${result.otp}\``
                    );
                }

                await new Promise(r => setTimeout(r, 5000));
            }

            return m.reply('❌ *Timeout:* OTP tidak ditemukan dalam 60 detik.');
        }

        // --- INBOX CHECK MODE ---
        if (args[0].toLowerCase() === 'inbox') {
            if (!args[1]) return m.reply(`⚠️ *Format Salah!*\n\nContoh: *${usedPrefix + command} inbox example@gmail.com*`);

            const email = args[1];
            const result = await checkInbox(email);

            if (!result) return m.reply('📭 *Inbox kosong* atau belum ada pesan baru masuk.');

            let msg = `*📬 INBOX RESULT*\n\n`;
            msg += `*To:* ${email}\n`;
            msg += `*From:* ${result.mail.from}\n`;
            msg += `*Subject:* ${result.mail.subject}\n`;
            msg += `*Time:* ${result.mail.time}\n`;
            if (result.otp) msg += `\n*🔐 OTP Detected:* \`${result.otp}\`\n`;
            msg += `\n*Preview Pesan:*\n${result.clean.slice(0, 800)}...`;

            return m.reply(msg);
        }

        return m.reply(`❓ Format perintah tidak dikenali.\nGunakan *${usedPrefix + command}* untuk membuat email baru.`);

    } catch (err) {
        console.error('Tempmail error:', err.message);
        return m.reply(`❌ Terjadi kesalahan saat memproses permintaan: ${err.message}`);
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } }).catch(()=>{});
    }
};

handler.help = ['tempmail [opsi]'];
handler.tags = ['tools'];
handler.command = ['tempmail', 'fakeemail', 'email'];
handler.limit = true; 

export default handler;