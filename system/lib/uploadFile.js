import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

/**
 * Upload file to Catbox.moe (Primary) or Telegra.ph (Fallback for images)
 * @param {Buffer} buffer File Buffer
 * @returns {Promise<string>} URL File
 */
export default async function uploadFile(buffer) {
  try {
    const { ext, mime } = (await fileTypeFromBuffer(buffer)) || { ext: 'bin', mime: 'application/octet-stream' }
    
    // 1. Try Catbox (Best for all files)
    try {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('fileToUpload', buffer, 'file.' + ext)

        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() }
        })
        
        if (res.data && res.data.toString().startsWith('http')) {
            return res.data.toString().trim()
        }
    } catch (e) {
        // console.error('Catbox upload failed:', e.message)
    }

    // 2. Try Telegra.ph (Images only)
    if (mime.startsWith('image')) {
        const form = new FormData()
        form.append('file', buffer, 'tmp.' + ext)
        
        const res = await axios.post('https://telegra.ph/upload', form, {
            headers: { ...form.getHeaders() }
        })
        
        if (res.data && res.data[0] && res.data[0].src) {
            return 'https://telegra.ph' + res.data[0].src
        }
    }

    // 3. Try Uguu.se (Temporary)
    try {
        const form = new FormData()
        form.append('files[]', buffer, 'file.' + ext)
        
        const res = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() }
        })
        
        if (res.data && res.data.files && res.data.files[0]) {
            return res.data.files[0].url
        }
    } catch (e) {
        // console.error('Uguu upload failed')
    }

    throw new Error('All upload services failed')

  } catch (err) {
    throw err
  }
}
