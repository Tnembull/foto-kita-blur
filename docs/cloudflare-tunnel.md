# Cloudflare Tunnel Setup untuk foto-blur.bulindev.tech

Panduan lengkap untuk men-deploy dan menghubungkan aplikasi web **Foto Kita Blur** ke domain `foto-blur.bulindev.tech` menggunakan Cloudflare Tunnel.

---

## 1. Persiapan Build & Local Preview

Jalankan perintah build dan pratinjau server statis lokal pada port `3000`:

```bash
# Install dependensi (jika belum)
npm install

# Build aset produksi
npm run build

# Menjalankan preview server lokal (port 3000)
npm run preview
```

Aplikasi web sekarang berjalan secara lokal di `http://localhost:3000`.

---

## 2. Konfigurasi Cloudflare Tunnel (`cloudflared`)

Pastikan aplikasi `cloudflared` sudah terpasang di sistem Linux Anda.

### Langkah A: Login & Buat Tunnel (Jika belum pernah)
```bash
cloudflared tunnel login
cloudflared tunnel create foto-blur-tunnel
```

### Langkah B: Konfigurasi File Routing Tunnel
Buat atau edit file konfigurasi `~/.cloudflared/config.yml`:

```yaml
tunnel: <UUID-TUNNEL-ANDA>
credentials-file: /home/bulindev/.cloudflared/<UUID-TUNNEL-ANDA>.json

ingress:
  - hostname: foto-blur.bulindev.tech
    service: http://localhost:3000
  - service: http_status:404
```

### Langkah C: Routing DNS Subdomain Cloudflare
Hubungkan subdomain `foto-blur.bulindev.tech` ke Tunnel:

```bash
cloudflared tunnel route dns foto-blur-tunnel foto-blur.bulindev.tech
```

### Langkah D: Jalankan Tunnel Service
```bash
cloudflared tunnel run foto-blur-tunnel
```

Aplikasi Anda kini sudah aktif secara publik melalui HTTPS pada domain **https://foto-blur.bulindev.tech**!
