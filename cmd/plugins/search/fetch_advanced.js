import fetch from 'node-fetch'
import { format } from 'util'

// ============================================================================ 
// --- 🛠️ HELPER FUNCTIONS (Internal Implementation) 🛠️ --- 
// ============================================================================ 

/**
 * Memformat ukuran byte menjadi string yang mudah dibaca (KB, MB, GB).
 * @param {number} bytes - Ukuran dalam byte.
 * @param {number} [decimals=2] - Jumlah desimal di belakang koma.
 * @returns {string} String ukuran terformat (contoh: "1.5 MB").
 */
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Mendeteksi tipe konten berdasarkan header Content-Type.
 * @param {Headers} headers - Header respons fetch.
 * @returns {Object} Objek info tipe { m: mime, e: extension, c: category }.
 */
const getContentType = (headers) => {
    const ct = headers.get('content-type') || '';
    if (ct.includes('image')) return { m: ct, e: ct.split('/')[1], c: 'image' };
    if (ct.includes('video')) return { m: ct, e: ct.split('/')[1], c: 'video' };
    if (ct.includes('audio')) return { m: ct, e: ct.split('/')[1], c: 'audio' };
    if (ct.includes('json')) return { m: ct, e: 'json', c: 'text' };
    if (ct.includes('text')) return { m: ct, e: 'txt', c: 'text' };
    return { m: ct, e: 'bin', c: 'other' };
}

// ============================================================================ 
// --- 🌐 CORE FETCH LOGIC (FWA) 🌐 --- 
// ============================================================================ 

/**
 * Fetch Web Address (FWA) - Advanced Fetcher dengan Timing Metrics.
 */
const fwa = async (url, opts = {}) => {
    const start = Date.now();
    const timings = { dns: 0, cn: 0, ft: 0, dl: 0, pr: 0, tt: 0 };
    
    try {
        // Normalize URL
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        
        const t1 = Date.now();
        
        const res = await fetch(url, {
            method: opts.m || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ...(opts.r ? { 'Referer': opts.r } : {})
            },
            timeout: opts.to || 15000
        });
        
        const t2 = Date.now();
        timings.ft = t2 - t1;

        const buffer = await res.buffer();
        const t3 = Date.now();
        timings.dl = t3 - t2;

        const typeInfo = getContentType(res.headers);
        const metadata = {
            sz: buffer.length,
            dt: typeInfo,
            dm: 'Headers'
        };

        if (typeInfo.e === 'json') {
            try {
                const json = JSON.parse(buffer.toString());
                metadata.json = { 
                    v: true, 
                    t: Array.isArray(json) ? 'Array' : 'Object', 
                    kc: Object.keys(json).length 
                };
            } catch { metadata.json = { v: false }; }
        }
        
        if (typeInfo.m.includes('html')) {
             const html = buffer.toString();
             metadata.html = {
                 ttl: html.match(/<title>(.*?)<\/title>/i)?.[1] || 'No Title',
                 lc: (html.match(/<a /g) || []).length,
                 ic: (html.match(/<img /g) || []).length
             };
        }

        const t4 = Date.now();
        timings.pr = t4 - t3;
        timings.tt = t4 - start;

        return {
            ok: res.ok,
            s: res.status,
            er: res.ok ? null : res.statusText,
            bf: buffer,
            md: metadata,
            tm: timings,
            h: Object.fromEntries(res.headers.entries()),
            fu: res.url,
            rch: res.redirected ? [{f: url, t: res.url, s: 302}] : []
        };

    } catch (e) {
        return { ok: false, er: e.message, tm: { tt: Date.now() - start } };
    }
}

// ============================================================================ 
// --- 📊 DISPLAY HELPERS 📊 --- 
// ============================================================================ 

function ft(tm) {
    const b = (ms, mx = 2000) => {
        const p = Math.min((ms / mx) * 10, 10);
        const f = Math.floor(p);
        return "█".repeat(f) + "░".repeat(10 - f);
    };

    return `*PERFORMANCE METRICS:*
📡 Fetch: ${tm.ft}ms ${b(tm.ft)}
📥 Down: ${tm.dl}ms ${b(tm.dl)}
⚙️ Proc: ${tm.pr}ms ${b(tm.pr)}
⏱️ Total: ${tm.tt}ms`;
}

function fm(md) {
    const l = [];
    l.push(`*CONTENT ANALYSIS:*`);
    l.push(`📦 Size: ${formatBytes(md.sz)}`);
    l.push(`📂 Type: ${md.dt.m}`);
    
    if (md.json?.v) l.push(`📝 JSON: Valid (${md.json.t}, ${md.json.kc} keys)`);
    if (md.html) l.push(`🌐 HTML: ${md.html.ttl}`);
    
    return l.join("\n");
}

function fh(h) {
    const l = [`*HEADERS:*`];
    if (h['server']) l.push(`🖥️ Server: ${h['server']}`);
    if (h['content-type']) l.push(`📄 Type: ${h['content-type']}`);
    if (h['last-modified']) l.push(`🕒 Date: ${h['last-modified']}`);
    return l.join("\n");
}

// ============================================================================ 
// --- 🎮 COMMAND HANDLER 🎮 --- 
// ============================================================================ 

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*ADVANCED FETCH*\n\nUsage: ${usedPrefix + command} <url> [options]\n\nOptions:\n--timeout N\n--method POST\n\nExample:\n${usedPrefix + command} https://google.com`)

    const a = text.trim().split(/\s+/);
    const u = a[0]; 
    
    const o = {};
    const go = (fg) => {
        const i = a.indexOf(fg);
        return i !== -1 && a[i + 1] ? a[i + 1] : null;
    };
    
    const to = go("--timeout");
    if (to) o.to = parseInt(to);
    
    const mt = go("--method");
    if (mt) o.m = mt.toUpperCase();

    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

    try {
        const r = await fwa(u, o);

        if (!r.ok) {
            return m.reply(`❌ *FETCH FAILED*\n\nStatus: ${r.s}\nError: ${r.er}\nTime: ${r.tm?.tt || 0}ms`);
        }

        const { bf, md, tm, h, fu } = r;

        const cp = [
            `✅ *FETCH SUCCESS*`,
            `🔗 URL: ${u}`,
            ...(fu !== u ? [`🔀 Redirect: ${fu}`] : []),
            ``,
            fm(md),
            ``,
            ft(tm),
            ``,
            fh(h)
        ].join("\n");

        const opts = { quoted: m };
        const ext = md.dt.e || 'bin';
        const fn = `fetch_${Date.now()}.${ext}`;

        if (md.dt.c === 'image') {
            await conn.sendMessage(m.chat, { image: bf, caption: cp }, opts);
        } else if (md.dt.c === 'video') {
            await conn.sendMessage(m.chat, { video: bf, caption: cp }, opts);
        } else if (md.dt.c === 'audio') {
            await conn.sendMessage(m.chat, { audio: bf, mimetype: md.dt.m, fileName: fn }, opts);
            await m.reply(cp);
        } else if (md.dt.c === 'text' && bf.length < 10000) {
            const body = bf.toString().slice(0, 4000);
            await m.reply(cp + `\n\n*RESPONSE BODY:*\n` + '```' + body + '```');
        } else {
            await conn.sendMessage(m.chat, { document: bf, mimetype: md.dt.m, fileName: fn, caption: cp }, opts);
        }

    } catch (e) {
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ["fetch", "get"];
handler.tags = ["tools"];
handler.command = ['fetch', 'get', 'curl', 'wget'];
handler.prefix = true;

export default handler;