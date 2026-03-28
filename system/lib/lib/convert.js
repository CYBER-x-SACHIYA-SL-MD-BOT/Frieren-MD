import ff from 'fluent-ffmpeg'
import { PassThrough } from 'stream'

export function convert(inputBuffer, options = {}) {
    return new Promise((resolve, reject) => {
        const inputStream = new PassThrough()
        const outputStream = new PassThrough()
        const chunks = []

        inputStream.end(inputBuffer)

        const cmd = ff(inputStream)

        if (options.format) cmd.format(options.format)
        if (options.bitrate) cmd.audioBitrate(options.bitrate)
        if (options.channels) cmd.audioChannels(options.channels)
        if (options.sampleRate) cmd.audioFrequency(options.sampleRate)
        if (options.codec) cmd.audioCodec(options.codec)

        cmd.on('error', reject)
           .on('end', () => resolve(Buffer.concat(chunks)))
           .pipe(outputStream, { end: true })

        outputStream.on('data', chunk => chunks.push(chunk))
    })
}
