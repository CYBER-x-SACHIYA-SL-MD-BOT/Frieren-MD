import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      let tmp = path.join(process.cwd(), 'system', 'temp', +new Date + '.' + ext)
      let out = tmp + '.' + ext2
      // Ensure temp dir exists
      if (!fs.existsSync(path.dirname(tmp))) fs.mkdirSync(path.dirname(tmp), { recursive: true })
      
      await fs.promises.writeFile(tmp, buffer)
      spawn('ffmpeg', [
        '-y',
        '-i', tmp,
        ...args,
        out
      ])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await fs.promises.unlink(tmp)
            if (code !== 0) return reject(code)
            resolve(await fs.promises.readFile(out))
            await fs.promises.unlink(out)
          } catch (e) {
            reject(e)
          }
        })
    } catch (e) {
      reject(e)
    }
  })
}

function imageToWebp(buffer) {
  return ffmpeg(buffer, [
    '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
    '-f', 'webp'
  ], 'jpeg', 'webp')
}

function videoToWebp(buffer) {
  return ffmpeg(buffer, [
    '-vcodec', 'libwebp',
    '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
    '-loop', '0',
    '-ss', '00:00:00',
    '-t', '00:00:05',
    '-preset', 'default',
    '-an',
    '-vsync', '0'
  ], 'mp4', 'webp')
}

function webpToImage(buffer) {
  return ffmpeg(buffer, [], 'webp', 'png')
}

function webpToVideo(buffer) {
  return ffmpeg(buffer, [
    '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
    '-movflags', 'faststart',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
  ], 'webp', 'mp4')
}

export {
  ffmpeg,
  imageToWebp,
  videoToWebp,
  webpToImage,
  webpToVideo
}
