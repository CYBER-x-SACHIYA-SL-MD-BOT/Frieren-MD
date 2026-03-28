import axios from 'axios'

export default function(ev) {
    ev.on({
        name: 'skiplink',
        cmd: ['skiplink', 'bypass'],
        tags: 'Tools',
        desc: 'Bypass link TUTWURI & SFL',
        run: async (xp, m, { text }) => {
            const FGSI_API_KEY = global.fgsi || "-";
            
            // Ambil text dari input langsung atau dari reply pesan
            let input = m.quoted ? (m.quoted.text || m.quoted.caption) : text;

            if (!input) {
                return m.reply(`Masukkan atau reply URL!\n\nContoh:\n.skiplink https://sfl.gl/xxxx`);
            }

            // Regex untuk mencari URL dalam teks
            const urlRegex = /(https?:\[^\]+)/gi;
            let match = input.match(urlRegex);

            if (!match) return m.reply("❌ Tidak ditemukan URL yang valid.");

            let url = match[0];
            m.reply('⏳ Sedang memproses bypass link...');

            let apiUrl = `https://fgsi.dpdns.org/api/tools/skip/tutwuri?apikey=${FGSI_API_KEY}&url=${encodeURIComponent(url)}`;

            try {
                let { data } = await axios.get(apiUrl, {
                    timeout: 30000
                });

                if (!data || !data.status) {
                    return m.reply("❌ Gagal bypass link (API error atau limit habis).");
                }

                let result = data?.data?.url;
                if (!result) return m.reply("❌ URL hasil tidak ditemukan dalam respons API.");

                let response = `✅ *Link berhasil dibypass!*\n\n🔗 *Asal:* ${url}\n🚀 *Hasil:* ${result}`;
                m.reply(response);

            } catch (err) {
                console.error('Skiplink Error:', err);
                m.reply("❌ Terjadi kesalahan saat menghubungi server bypass.");
            }
        }
    })
}
