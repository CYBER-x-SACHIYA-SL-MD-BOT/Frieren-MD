/*
 @ Base: https://play.google.com/store/apps/details?id=photoeditor.aiart.animefilter.snapai/
 @ Author: Shannz
 @ Note: Wrapper from apk AI Morph
*/

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const PUBLIC_KEY_STRING = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo+yvc35R8VPsfy1ScmQap+vVg/IYTcZCiJP5iiIo0HFLBrfDhwZ30wpvQ8lpezTN3exdZU3edIspp+weCgifbjFEyI7/Ecce7GTYXZyLncBrjzvO6IohPnaz/hx7+Uy6eNw8DNk15sxcJrQeSOULtOWJJ8dJ2IbR1eRIp0PXwJeXqdfoT52WzT/FaNzwh7sWmt4Zl8cw9o9JvdTqdU3WsCsdqsOXWIgyP/UIFWM+uu7P1xJ/DY40nMokHlG+fDdiT0us5Vu4LNUt3Er8OOZynnOESSQUocSvpb9UOcK5SurLCjWsk0RnQY2RBQluBnC9isJK5RC9FyK/5ezjmaQ1hQIDAQAB";
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
${PUBLIC_KEY_STRING}
-----END PUBLIC KEY-----`;

function getCurrentDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function decryptResponse(encryptedData, sessionKey) {
    try {
        const aesKey = sessionKey.substring(0, 16);
        const aesIv = sessionKey.substring(16, 32);
        const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(aesKey, 'utf8'), Buffer.from(aesIv, 'utf8'));
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("[!] Gagal dekripsi:", error.message);
        return null;
    }
}

function generateEncryptedBody(payloadJson) {
    const sessionKey = uuidv4().replace(/-/g, '');
    const aesKey = sessionKey.substring(0, 16);
    const aesIv = sessionKey.substring(16, 32);
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(aesKey, 'utf8'), Buffer.from(aesIv, 'utf8'));
    let encryptedData = cipher.update(JSON.stringify(payloadJson), 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    
    const encryptedKeyBuffer = crypto.publicEncrypt(
        { key: PUBLIC_KEY_PEM, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(sessionKey, 'utf8')
    );
    return {
        rv: 1,
        ki: encryptedKeyBuffer.toString('base64'),
        data: encryptedData,
        sessionKey: sessionKey
    };
}

async function executeRequest(endpoint, payload) {
    try {
        // console.log(`[-] Fetching credentials...`);
        const { data } = await axios.get('https://www.kitsulabs.xyz/api/frida-hook/a/bd/jniutils/TokenUtils');
        if (!data.success) throw new Error('Gagal mengambil token dari server.');
        const { uid, token } = data;

        // console.log(`[-] Encrypting payload...`);
        const encryptedBody = generateEncryptedBody(payload);
        const currentTime = Date.now().toString();
        
        // console.log(`[-] Sending request...`);
        const res = await axios.post(endpoint, 
          { 
            rv: 1, 
            ki: encryptedBody.ki, 
            data: encryptedBody.data 
          }, 
          {
            headers: {
                'User-Agent': 'okhttp/4.12.0',
                'Accept-Encoding': 'gzip',
                '--v2-time': currentTime,
                'uid': uid,
                'token': token,
                'content-type': 'application/json; charset=utf-8'
            }
        });

        const decryptedRaw = decryptResponse(res.data.data, encryptedBody.sessionKey);
        if (!decryptedRaw) throw new Error('Gagal mendekripsi respon dari server.');
        
        const responseData = JSON.parse(decryptedRaw);
        const baseUrl = 'https://hardstonepte.ltd/hs-us/'; 
        const rawResult = responseData.image_url || responseData.result_url;

        if (rawResult) {
            if (Array.isArray(rawResult)) {
                const finalResult = rawResult.map(relativePath => {
                    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
                    return baseUrl + cleanPath;
                });
                return { success: true, result: finalResult };
            } 
            else if (typeof rawResult === 'string') {
                const cleanPath = rawResult.startsWith('/') ? rawResult.slice(1) : rawResult;
                const finalUrl = baseUrl + cleanPath;
                return { success: true, result: finalUrl };
            }
        }

        return { success: false, message: 'Gagal parsing URL gambar' };

    } catch (err) {
        // console.error('Request Error:', err.response?.data || err.message);
        return { success: false, error: err.message };
    }
}

export const morph = {
  getRetakeStyles: async () => ["Funny", "Calm", "Smile", "Surprise", "Sad"],

  upload: async (filePath, folderPrefix = 'snap_img2img/upload') => {
      const fileData = fs.readFileSync(filePath);
      const fileSize = fileData.length;      
      const dateStr = getCurrentDate();
      const randomUuid = uuidv4();
      const storagePath = `${folderPrefix}/${dateStr}/${randomUuid}_0.jpg`;
      const encodedPath = encodeURIComponent(storagePath);
      
      const initUrl = `https://firebasestorage.googleapis.com/v0/b/stn2_hs_us/o?name=${encodedPath}&uploadType=resumable`;
      
      const headers = {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 15; 25028RN03A Build/AP3A.240905.015.A2)',
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip',
        'x-firebase-appcheck': 'eyJlcnJvciI6IlVOS05PV05fRVJST1IifQ==',
        'X-Firebase-Storage-Version': 'Android/21.0.2',
        'x-firebase-gmpid': '1:890704113682:android:4fe6bc1e015020503a28cb',
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      const initRes = await axios.post(initUrl, '', { 
          headers: { ...headers, 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Protocol': 'resumable', 'Content-Length': '0' } 
      });
      
      const uploadUrl = initRes.headers['x-goog-upload-url'];
      if (!uploadUrl) throw new Error('Gagal init upload.');

      await axios.post(uploadUrl, fileData, { 
          headers: { 
              ...headers, 
              'X-Goog-Upload-Command': 'upload, finalize', 
              'X-Goog-Upload-Offset': '0', 
              'X-Goog-Upload-Protocol': 'resumable', 
              'Content-Length': fileSize.toString() 
          } 
      });
      
      return { imagePath: storagePath };
  },

  img2img: async (filePath, style) => {
      try {
        const { imagePath } = await morph.upload(filePath, 'snap_img2img/upload');
        const payload = {
            "image_name": imagePath,
            "nb": "stn2_hs_us",
            "pro_t": "",
            "style_id": style, // e.g. "Roblox"
            "strength": "50",
            "bs": "4",
            "ratio": 1,
            "is_first": "1",
            "gender": "male"
        };
        return await executeRequest('https://ai.hardstonepte.ltd/snap/img2img/v2/', payload);
      } catch (err) {
        return { success: false, error: err.message };
      }
  },

  edit: async (filePath, prompt) => {
      try {
        const { imagePath } = await morph.upload(filePath, 'snap_img2img/upload'); 
        const payload = {
            "image_name": imagePath,
            "nb": "stn2_hs_us",
            "prompt": prompt
        };
        return await executeRequest('https://ai.hardstonepte.ltd/snap/chat/edit/v2/', payload);
      } catch (err) {
        return { success: false, error: err.message };
      }
  },

  retake: async (filePath, styleName) => {
      try {
        const { imagePath } = await morph.upload(filePath, 'snap_retake/upload');
        const payload = {
            "image_name": imagePath,
            "nb": "stn2_hs_us",
            "style_name": styleName
        };
        return await executeRequest('https://ai.hardstonepte.ltd/snap/ai/retake/v2/', payload);
      } catch (err) {
        return { success: false, error: err.message };
      }
  },

  enhance: async (filePath) => {
      try {
        const { imagePath } = await morph.upload(filePath, 'snap_single/upload');
        const payload = {
            "image_name": imagePath,
            "nb": "stn2_hs_us"
        };
        return await executeRequest('https://ai.hardstonepte.ltd/snap/single/enhance/v2/', payload);
      } catch (err) {
        return { success: false, error: err.message };
      }
  }
};