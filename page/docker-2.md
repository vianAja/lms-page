# Lab Docker 2 — Volumes & Port Mapping

> **Tujuan:** Setelah menyelesaikan lab ini, kamu akan memahami cara memetakan port container ke host, menggunakan Docker volumes untuk persistensi data, dan mengelola data antar container restart.

---

## 🗂️ Konsep Dasar

| Konsep | Deskripsi |
|--------|-----------|
| **Volume** | Mekanisme penyimpanan data persisten yang dikelola Docker, terpisah dari container lifecycle |
| **Bind Mount** | Memetakan direktori host langsung ke dalam container |
| **Port Mapping** | Menghubungkan port container ke port host (`-p host:container`) |
| **Named Volume** | Volume dengan nama eksplisit, mudah dikelola dan di-share antar container |

---

## 🔌 Bagian 1 — Port Mapping Lanjutan

### Jalankan container dengan multiple ports

```bash
docker run -d \
  --name multi-port \
  -p 8080:80 \
  -p 8443:443 \
  nginx:latest
```

### Cek port yang dipetakan

```bash
docker port multi-port
```

Output yang diharapkan:
```
443/tcp -> 0.0.0.0:8443
80/tcp -> 0.0.0.0:8080
```

### Verifikasi dengan curl

```bash
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080
```

### Bind ke interface tertentu

```bash
# Hanya bisa diakses dari localhost
docker run -d --name local-only -p 127.0.0.1:9090:80 nginx:latest
```

---

## 📦 Bagian 2 — Named Volumes

### Buat named volume

```bash
docker volume create my-data
```

### Lihat semua volume

```bash
docker volume ls
```

Output:
```
DRIVER    VOLUME NAME
local     my-data
```

### Inspect volume

```bash
docker volume inspect my-data
```

Output (contoh):
```json
[
  {
    "CreatedAt": "2025-06-28T09:00:00Z",
    "Driver": "local",
    "Mountpoint": "/var/lib/docker/volumes/my-data/_data",
    "Name": "my-data",
    "Scope": "local"
  }
]
```

### Gunakan volume dalam container

```bash
docker run -d \
  --name app-with-data \
  -v my-data:/usr/share/nginx/html \
  -p 8080:80 \
  nginx:latest
```

---

## ✏️ Bagian 3 — Tulis Data ke Volume

### Buat file kustom di dalam container

```bash
docker exec app-with-data bash -c "echo '<h1>Hello from Volume!</h1>' > /usr/share/nginx/html/index.html"
```

### Verifikasi

```bash
curl http://localhost:8080
```

Output:
```html
<h1>Hello from Volume!</h1>
```

### Restart container — data tetap ada

```bash
docker restart app-with-data
curl http://localhost:8080
```

Data masih ada! ✅

---

## 📁 Bagian 4 — Bind Mount

### Buat direktori di host

```bash
mkdir -p ~/docker-webroot
echo "<h1>Served from Host!</h1>" > ~/docker-webroot/index.html
```

### Jalankan container dengan bind mount

```bash
docker run -d \
  --name bind-nginx \
  -v ~/docker-webroot:/usr/share/nginx/html:ro \
  -p 8081:80 \
  nginx:latest
```

> **`:ro`** — read-only mount, container tidak bisa mengubah file host.

### Verifikasi

```bash
curl http://localhost:8081
```

### Edit file di host — perubahan langsung terlihat

```bash
echo "<h1>Updated from Host!</h1>" > ~/docker-webroot/index.html
curl http://localhost:8081
```

---

## 🔄 Bagian 5 — Volume Sharing Antar Container

### Buat container pertama dengan volume

```bash
docker run -d \
  --name writer \
  -v shared-vol:/data \
  alpine \
  sh -c "while true; do date >> /data/log.txt; sleep 2; done"
```

### Baca dari container kedua

```bash
docker run --rm \
  -v shared-vol:/data:ro \
  alpine \
  cat /data/log.txt
```

---

## 🧹 Bagian 6 — Cleanup

```bash
# Stop dan hapus container
docker stop multi-port local-only app-with-data bind-nginx writer
docker rm multi-port local-only app-with-data bind-nginx writer

# Hapus volumes
docker volume rm my-data shared-vol

# Pruning semua resource tidak terpakai
docker system prune -f
docker volume prune -f
```

---

## 🧪 Latihan Mandiri

Buat setup persistent web server dengan custom content:

```bash
# 1. Buat volume
docker volume create webdata

# 2. Jalankan container dan isi konten
docker run -d --name mysite -v webdata:/usr/share/nginx/html -p 8080:80 nginx:latest
docker exec mysite bash -c "echo '<h1>My Persistent Site</h1>' > /usr/share/nginx/html/index.html"

# 3. Verifikasi
curl http://localhost:8080

# 4. Hapus container tapi pertahankan volume
docker stop mysite && docker rm mysite

# 5. Buat container baru dengan volume yang sama
docker run -d --name mysite2 -v webdata:/usr/share/nginx/html -p 8080:80 nginx:latest

# 6. Data masih ada?
curl http://localhost:8080
```

---

## ✅ Kriteria Keberhasilan

| Tugas | Perintah |
|-------|----------|
| Multi-port mapping | `docker run -p host1:c1 -p host2:c2` |
| Buat named volume | `docker volume create` |
| Mount volume | `docker run -v vol:/path` |
| Bind mount host dir | `docker run -v ~/dir:/path` |
| Share volume antar container | `-v shared-vol:/data` |
| Verifikasi persistensi | Restart + curl |

> 💡 **Tips:** Gunakan `docker volume inspect <name>` untuk menemukan lokasi fisik data volume di host system!
