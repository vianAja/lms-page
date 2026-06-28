# Lab Docker 3 — Docker Compose & Multi-Container App

> **Tujuan:** Setelah menyelesaikan lab ini, kamu akan mampu mendefinisikan aplikasi multi-container menggunakan Docker Compose, mengonfigurasi shared network, dan menjalankan stack aplikasi web beserta database.

---

## 🗂️ Konsep Dasar

**Docker Compose** adalah tool yang digunakan untuk mendefinisikan dan menjalankan aplikasi Docker multi-container. Dengan file `docker-compose.yml`, kamu dapat mengonfigurasi seluruh layanan aplikasi kamu hanya dengan satu perintah.

| Konsep | Deskripsi |
|--------|-----------|
| **Service** | Container yang berjalan sebagai bagian dari aplikasi (misal: web, db) |
| **Network** | Jaringan terisolasi agar container dapat saling berkomunikasi via DNS name |
| **Environment** | Variabel konfigurasi yang di-pass ke dalam container |
| **docker-compose.yml** | File konfigurasi YAML untuk Docker Compose |

---

## 📂 Bagian 1 — Membuat File docker-compose.yml

### Buat direktori project baru

```bash
mkdir -p ~/compose-app
cd ~/compose-app
```

### Buat file `docker-compose.yml`

```yaml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    networks:
      - app-network
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: lmsuser
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: compose_db
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  db-data:

networks:
  app-network:
    driver: bridge
EOF
```

### Buat direktori dan file HTML untuk web service

```bash
mkdir -p html
echo "<h1>Hello from Docker Compose!</h1>" > html/index.html
```

---

## 🚀 Bagian 2 — Menjalankan Application Stack

### Jalankan stack di background (detached mode)

```bash
docker-compose up -d
```

### Cek container yang sedang berjalan

```bash
docker-compose ps
```

Output:
```
        Name                       Command               State          Ports
-------------------------------------------------------------------------------------
compose-app_db_1    docker-entrypoint.sh postgres   Up      5432/tcp
compose-app_web_1   /docker-entrypoint.sh ...       Up      0.0.0.0:8080->80/tcp
```

### Verifikasi web server

```bash
curl http://localhost:8080
```

Output:
```html
<h1>Hello from Docker Compose!</h1>
```

---

## 🧪 Bagian 3 — Menguji Koneksi Antar Container

### Cek komunikasi dari container web ke database

```bash
docker-compose exec web ping -c 3 db
```

---

## 🛑 Bagian 4 — Menghentikan dan Membersihkan Stack

### Berhentikan stack tanpa menghapus volume data

```bash
docker-compose down
```

### Berhentikan stack beserta volume datanya

```bash
docker-compose down -v
```

---

## ✅ Kriteria Keberhasilan

| Tugas | Perintah |
|-------|----------|
| Menulis file Compose | `cat > docker-compose.yml` |
| Menjalankan stack | `docker-compose up -d` |
| Inspeksi status | `docker-compose ps` |
| Verifikasi network | `docker-compose exec web ping db` |
| Hapus stack & volume | `docker-compose down -v` |
