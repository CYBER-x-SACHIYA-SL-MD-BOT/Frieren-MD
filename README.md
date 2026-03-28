<p align="center">
  <img src="https://c.termai.cc/i153/9tU.jpg" width="100%" style="border-radius: 15px;"/>
</p>

<!-- Dynamic Typing Animation -->
<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com/?font=Fira+Code&pause=1000&color=92E3A9&center=true&vCenter=true&width=500&lines=Your+Ageless+Digital+Companion;Deep+RPG+V3+Adventure;Optimized+Modular+Architecture" alt="Typing SVG" />
  </a>
</p>

---

## 🌿 The Mage's Journey: Frieren-MD

**Frieren-MD** adalah WhatsApp Bot canggih yang dirancang dengan filosofi "umur panjang" dan "efisiensi". Dibangun di atas arsitektur modular, bot ini menggabungkan kecerdasan buatan (AI) yang mendalam dengan ekosistem RPG yang kaya, memberikan pengalaman interaktif yang belum pernah ada sebelumnya.

### ✨ Kenapa Memilih Frieren-MD?

- **Modular Architecture**: Mudah dimodifikasi dan dikembangkan oleh siapa saja.
- **Intelligent Logic**: Didukung oleh sistem logika yang fleksibel dan responsif.
- **RPG System V3**: Petualangan tanpa henti dengan sistem ekonomi, level, dan item.
- **Lightweight**: Dioptimalkan untuk berjalan lancar bahkan di server spesifikasi rendah.

---

## ⚔️ Arsitektur Sistem RPG V3

Sistem RPG telah dioptimalkan agar lebih responsif dan adiktif.

| Fitur             | Deskripsi                                                         |
| :---------------- | :---------------------------------------------------------------- |
| **Bounty Hunter** | Buru pemain dengan kriminalitas tinggi dan klaim hadiahnya.       |
| **Job System**    | Pilih peran sebagai Warrior, Thief, atau Farmer untuk bonus unik. |
| **Alchemy**       | Racik berbagai potion dan bahan langka untuk bertahan di Dungeon. |
| **Pet Companion** | Pelihara makhluk mistis yang akan membantumu dalam pertempuran.   |

---

## 🚀 Memulai Instalasi

Pastikan Anda telah menginstal **Node.js v24+** dan **Git** di sistem Anda.

### 🛠️ Langkah Cepat

```bash
# Clone repository
git clone https://github.com/Har404-err/frieren-md.git

# Masuk ke direktori
cd frieren-md

# Instal dependensi
npm install

# Jalankan bot
npm start
```

---

## 🏗️ Arsitektur & Alur Kerja

### 1. Sistem Dispatcher (Penerima Pesan)

```mermaid
sequenceDiagram
    participant U as "User"
    participant W as "WhatsApp Socket"
    participant B as "Frieren-MD Core"
    participant D as "Command Dispatcher"
    participant P as "Plugins / Logic Engine"

    U->>W: Kirim Pesan (e.g. .menu)
    W->>B: Event "messages.upsert"
    B->>D: Validasi Prefix & Permission
    D->>P: Eksekusi Logika Perintah
    P-->>B: Return Response (Text/Media)
    B->>W: Kirim Balasan
    W->>U: Pesan Diterima
```

### 2. Struktur Proyek (Modular)

```mermaid
graph TD
    A["WhatsApp Interface"] -->|Socket| B(Baileys Library)
    B --> C{"Dispatcher"}
    C -->|"Logic Requests"| D["Logic Engine / LLM"]
    C -->|"Game Logic"| E["RPG Engine V3"]
    C -->|"Utilities"| F["Tools & Search"]
    E --> G[(Database Local / Mongo)]
```

---

## 🚩 Melaporkan Masalah (Issues)

Jika Anda menemukan bug, error, atau memiliki saran fitur, silakan laporkan melalui halaman **[Issues](https://github.com/Har404-err/frieren-md/issues)** di GitHub. Kami akan sangat menghargai laporan yang detail agar masalah dapat segera diatasi.

---

## 👥 Developer & Tim

<p align="center">
  <a href="https://github.com/Har404-err">
    <img src="https://github-readme-stats.vercel.app/api?username=Har404-err&show_icons=true&theme=radical&rank_icon=github&count_private=true" alt="Developer Stats" />
  </a>
</p>

<p align="center">
  <img src="https://c.termai.cc/i153/9tU.jpg" width="200" style="border-radius: 50%; border: 3px solid #92E3A9;"/>
</p>

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=30&section=footer&fontSize=20" width="100%"/>
</p>
