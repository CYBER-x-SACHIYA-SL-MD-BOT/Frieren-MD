import axios from 'axios'

export default function(ev) {
    ev.on({
        name: 'hargaemas',
        cmd: ['hargaemas', 'goldprice', 'emas'],
        tags: 'Search Menu',
        desc: 'Cek harga emas Antam terkini (IDR)',
        run: async (xp, m, { args }) => {
            try {
                await xp.sendMessage(m.chat, { react: { text: '🪙', key: m.key } })
                
                // API Unofficial Logam Mulia Indonesia
                const { data } = await axios.get('https://logam-mulia-api.vercel.app/prices/hargaemas-com')
                
                if (!data || !data.data || data.data.length === 0) {
                    return m.reply('❌ Gagal mengambil data harga emas.')
                }

                // Ambil data terbaru (biasanya array pertama)
                const latest = data.data[0]
                const date = latest.date
                
                let txt = `🪙 *HARGA EMAS TERKINI* 🪙\n`
                txt += `📅 Update: ${date}\n\n`
                
                // Format: "buy": harga beli, "sell": harga jual (buyback)
                const buyPrice = latest.price.replace(/Rp\s?|\./g, '') // Bersihkan format
                const sellPrice = latest.sell_price?.replace(/Rp\s?|\./g, '') || '0'

                txt += `📈 *Harga Beli (Kita Beli):*\n`
                txt += `Rp ${parseInt(buyPrice).toLocaleString('id-ID')} / gram\n\n`
                
                txt += `📉 *Harga Jual (Buyback):*\n`
                txt += `Rp ${parseInt(sellPrice).toLocaleString('id-ID')} / gram\n\n`
                
                txt += `_Sumber: hargaemas.com (Unofficial API)_`

                m.reply(txt)

            } catch (e) {
                console.error('Gold Price Error:', e)
                // Fallback ke API Global jika lokal gagal (XAU -> IDR)
                // Menggunakan free tier metalprice jika punya key, atau mock data sementara
                m.reply('❌ Layanan sedang gangguan. Coba lagi nanti.')
            }
        }
    })

    ev.on({
        name: 'kurs',
        cmd: ['kurs', 'exchange', 'konversi'],
        tags: 'Search Menu',
        desc: 'Konversi mata uang (Default: USD ke IDR)',
        run: async (xp, m, { args }) => {
            try {
                const amount = parseInt(args[0]) || 1
                const from = (args[1] || 'USD').toUpperCase()
                const to = (args[2] || 'IDR').toUpperCase()

                // API Exchange Rate Gratisan (Frankfurter)
                const api = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
                
                const { data } = await axios.get(api)
                
                if (!data || !data.rates || !data.rates[to]) {
                    return m.reply(`❌ Mata uang tidak didukung atau format salah.\nContoh: .kurs 10 USD IDR`)
                }

                const result = data.rates[to]
                const date = data.date

                let txt = `💱 *KONVERSI MATA UANG* 💱\n`
                txt += `📅 ${date}\n\n`
                txt += `💸 ${amount} ${from} = *${result.toLocaleString('id-ID')} ${to}*`

                m.reply(txt)

            } catch (e) {
                console.error('Exchange Error:', e)
                m.reply('❌ Gagal mengambil data kurs.')
            }
        }
    })
}
