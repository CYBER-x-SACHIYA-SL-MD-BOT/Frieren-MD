import { fileTypeFromBuffer } from "file-type";
import fetch from 'node-fetch'
import FormData from 'form-data'
import axios from 'axios'

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * Upload to Catbox.moe
 */
async function uploadCatbox(buf) {
    try {
        const type = await fileTypeFromBuffer(buf);
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", buf, { filename: `file.${type?.ext || 'jpg'}`, contentType: type?.mime || 'image/jpeg' });

        const res = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            headers: { ...HEADERS, ...form.getHeaders() },
            body: form
        });
        const txt = await res.text();
        return txt.startsWith("http") ? txt.trim() : null;
    } catch { return null; }
}

/**
 * Upload to Telegra.ph
 */
async function uploadTelegra(buf) {
    try {
        const type = await fileTypeFromBuffer(buf);
        const form = new FormData();
        form.append("file", buf, { filename: `file.${type?.ext || 'jpg'}`, contentType: type?.mime || 'image/jpeg' });

        const res = await axios.post("https://telegra.ph/upload", form, {
            headers: form.getHeaders()
        });
        if (res.data && res.data[0] && res.data[0].src) {
            return 'https://telegra.ph' + res.data[0].src;
        }
        return null;
    } catch { return null; }
}

/**
 * Upload to Uguu.se
 */
async function uploadUguu(buf) {
    try {
        const type = await fileTypeFromBuffer(buf);
        const form = new FormData();
        form.append("files[]", buf, { filename: `file.${type?.ext || 'jpg'}`, contentType: type?.mime || 'image/jpeg' });

        const res = await fetch("https://uguu.se/upload.php", {
            method: "POST",
            headers: { ...HEADERS, ...form.getHeaders() },
            body: form
        });
        const json = await res.json();
        return json?.files?.[0]?.url || null;
    } catch { return null; }
}

/**
 * Upload to Termai CDN
 */
async function uploadTermai(buf) {
    try {
        const type = await fileTypeFromBuffer(buf);
        const form = new FormData();
        form.append("file", buf, { filename: `file.${type?.ext || 'jpg'}`, contentType: type?.mime || 'image/jpeg' });

        const res = await axios.post("https://api.termai.cc/api/upload/file", form, {
            headers: form.getHeaders()
        });
        return res.data?.url || null;
    } catch { return null; }
}

/**
 * Main Uploader Function (Auto Fallback)
 */
export async function uploader(buf) {
    // Priority order: Catbox -> Termai -> Telegra -> Uguu
    return await uploadCatbox(buf) || await uploadTermai(buf) || await uploadTelegra(buf) || await uploadUguu(buf) || null;
}

export { uploadCatbox, uploadTelegra, uploadUguu, uploadTermai }