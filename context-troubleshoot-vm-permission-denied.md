# Postmortem: VM Gagal Start — Permission Denied pada Backing File qcow2

## Status: RESOLVED ✅
**Fix yang berhasil:** `systemctl restart libvirtd`, tanpa mengubah permission/security_driver secara permanen.

---

## Environment
- Host: `hznz-fsn1-ta-bms-lab-02` (libvirt/KVM, XFS filesystem `/dev/mapper/vg_sata-data`)
- VM: `pro-k9adm-najwanocta` (UUID: `ee38378d-3b1e-4bfd-897d-8a274a1195e1`)
- Disk chain VM:
  - `vda` (disk utama, writable) — didefinisikan via **storage pool**: `<source pool='vms' volume='pro-k9adm-najwanocta-vda.qcow2'/>`
  - **backing file** (base image, read-only): `/data/isos/template-k9adm.qcow2` ← **ini yang error**
  - cloudinit iso: `/vm/pro-k9adm-najwanocta-cloudinit.iso`

## Gejala Awal
```
virsh start pro-k9adm-najwanocta --console
error: internal error: process exited while connecting to monitor:
qemu-system-x86_64: -blockdev {...,"filename":"/data/isos/template-k9adm.qcow2",...}: Could not open '/data/isos/template-k9adm.qcow2': Permission denied
```
Error muncul dari proses QEMU sendiri (bukan dari libvirtd), konsisten di log `/var/log/libvirt/qemu/pro-k9adm-najwanocta.log`.

Catatan konteks: file `/data/isos/template-k9adm.qcow2` **baru saja diganti/dibuat ulang** sebelum masalah muncul (`Birth: 2026-07-25 06:54:26`, inode baru), berdampingan dengan file lain `template-k9adm-djp.qcow2` yang tidak bermasalah.

---

## Kronologi Pengecekan (semua dilakukan, semua "bersih")

### 1. Permission dasar (awal)
```
-rw-r----- 1 libvirt-qemu kvm 12G ... template-k9adm.qcow2   (0640)
```
Owner & group sudah sesuai user qemu runtime (`libvirt-qemu:kvm`, uid 64055 / gid 994).

### 2. Ubah permission jadi 644 (test)
```
chmod 644 /data/isos/template-k9adm.qcow2
```
**Hasil: tetap Permission denied.** → DAC klasik dieliminasi dari kandidat awal.

### 3. `id libvirt-qemu` & `getent group kvm`
```
uid=64055(libvirt-qemu) gid=994(kvm) groups=994(kvm),64055(libvirt-qemu)
kvm:x:994:
```
UID/GID proses sesuai owner file — tidak ada mismatch.

### 4. `stat` file
```
Access: (0640/-rw-r-----)  Uid: (64055/libvirt-qemu)  Gid: (994/kvm)
Birth: 2026-07-25 06:54:26  ← file baru
```

### 5. Cek log systemd/journalctl
Error konsisten muncul berulang di setiap percobaan start, dari qemu langsung saat `open()` blockdev.

### 6. Cek mount `/data`
```
/dev/mapper/vg_sata-data on /data type xfs (rw,noatime,...)
```
Filesystem lokal biasa, bukan network storage — dieliminasi sebagai penyebab.

### 7. AppArmor (`aa-status`, `dmesg`)
```
aa-status | grep -i libvirt → hanya profil "libvirtd" & "libvirtd//qemu_bridge_helper"
dmesg | grep apparmor → semua entry berstatus profile="unconfined", tidak ada DENIED eksplisit
```
Tapi ditemukan `kauditd_printk_skb: N callbacks suppressed` berulang → indikasi audit log **di-throttle**, sehingga event DENIED yang sebenarnya bisa saja tidak tercetak.

### 8. SELinux
```
getenforce → (kosong)
ls -Z → "?" pada kedua file qcow2
```
SELinux tidak aktif di sistem ini. Dieliminasi.

### 9. ACL & extended attribute
```
getfacl → hanya permission standar (user/group/other), tidak ada ACL entry tambahan
lsattr → "----------------------" (tidak ada attribute khusus)
```
Dieliminasi.

### 10. qemu.conf — namespaces & security_driver
```
#namespaces = [ "mount" ]         ← di-comment, fitur OFF
#security_driver = "selinux"      ← di-comment, pakai default
```
Mount namespace per-VM tidak aktif. Dieliminasi sebagai penyebab langsung.

### 11. systemd sandboxing pada libvirtd
```
ReadWritePaths=  ReadOnlyPaths=  InaccessiblePaths=
ProtectHome=no  ProtectSystem=no  NoNewPrivileges=no
```
Tidak ada restriction dari systemd unit. Dieliminasi.

### 12. Cek proses EDR/security agent
```
ps aux | grep -iE 'clamav|wazuh|falco|crowdstrike|...' → kosong
systemctl list-units | grep -iE 'secur|edr|agent|scan' → kosong
```
Dieliminasi.

### 13. Cek file lock oleh proses lain
```
lsof /data/isos/template-k9adm.qcow2 → kosong
fuser -v ... → kosong
```
Tidak ada proses lain yang memegang file. Dieliminasi.

### 14. Baca file langsung sebagai root (`dd`, `head`)
```
dd if=... of=/dev/null bs=1M count=10 → berhasil, 5.5 GB/s
head -c 1024 ... → "OK BACA"
```
⚠️ Catatan: test ini awalnya kurang valid karena root selalu bypass DAC — tidak membuktikan user `libvirt-qemu` bisa baca.

### 15. Full log qemu (`/var/log/libvirt/qemu/pro-k9adm-najwanocta.log`)
Konfirmasi command line lengkap qemu, dan error persis terjadi di baris `-blockdev` untuk `/data/isos/template-k9adm.qcow2` (backing file), bukan di disk utama `vda` atau cloudinit.

### 16. auditd
```
systemctl status auditd → Unit auditd.service could not be found
```
`auditd` tidak terpasang di sistem ini — jalur `ausearch` untuk audit log mentah buntu.

### 17. Isi profil AppArmor domain
```
cat /etc/apparmor.d/libvirt/libvirt-ee38378d-...
→ hanya wrapper, isi whitelist sebenarnya ada di file terpisah:
   #include <libvirt/libvirt-ee38378d-....files>

cat .../libvirt-ee38378d-....files
→ No such file or directory
```
File `.files` ini bersifat **transient** — dibuat otomatis oleh `virt-aa-helper` di setiap proses `virsh start` dan (kemungkinan) dihapus lagi setelah start gagal/domain teardown. Tidak bisa jadi bukti definitif tanpa menangkapnya saat proses start sedang berjalan.

### 18. `virsh dumpxml` — cek disk & backing store
```xml
<disk type='volume' device='disk'>
  <driver name='qemu' type='qcow2'/>
  <source pool='vms' volume='pro-k9adm-najwanocta-vda.qcow2'/>
  <target dev='vda' bus='virtio'/>
</disk>
```
Disk didefinisikan via **storage pool** (`pool='vms'`), bukan path langsung. **Tidak ada elemen `<backingStore>`** yang ditampilkan — mengindikasikan libvirt mungkin belum/tidak berhasil me-resolve ulang backing chain dari kondisi disk terbaru.

### 19. Test baca file sebagai user `libvirt-qemu` (bukan root) — test DAC yang valid
```
sudo -u libvirt-qemu head -c 1024 /data/isos/template-k9adm.qcow2 && echo "DAC OK"
→ berhasil, "DAC OK"
```
✅ **DAC 100% dikonfirmasi bukan penyebab** — user `libvirt-qemu` memang bisa baca file ini secara langsung di level kernel/filesystem.

### 20. Percobaan set AppArmor ke mode complain manual
```
sed -i 's/flags=(attach_disconnected)/flags=(attach_disconnected,complain)/' .../libvirt-ee38378d-...
apparmor_parser -r .../libvirt-ee38378d-...
→ ERROR: Could not open '.files' (karena file transient belum ada saat itu, di luar konteks virsh start)
```
Test ini tidak berhasil dieksekusi sesuai rencana karena keterbatasan file transient.

### 21. Cek ulang `security_driver` di qemu.conf
```
grep security_driver /etc/libvirt/qemu.conf
→ tetap "#security_driver = \"selinux\"" (masih di-comment / default, TIDAK diubah ke "none")
```

### 22. 🎯 FIX: Restart libvirtd
```
systemctl restart libvirtd
virsh start pro-k9adm-najwanocta --console
→ BERHASIL START
```

---

## Analisis Root Cause (kesimpulan terbaik)

Karena `security_driver` **tidak pernah benar-benar diubah**, dan satu-satunya tindakan yang berhasil adalah **restart daemon libvirtd**, penyebab paling mungkin adalah:

**Stale internal state di proses `libvirtd`** — kemungkinan besar terkait cache metadata **storage pool `vms`** dan/atau hasil probe **backing-chain qcow2** yang sempat disimpan di memori sejak sebelum file `template-k9adm.qcow2` diganti/dibuat ulang (inode baru, `Birth: 06:54:26`). Karena disk `vda` didefinisikan lewat storage pool (bukan path langsung), libvirtd perlu me-resolve volume & backing chain-nya; jika cache ini tidak ter-refresh otomatis setelah file backing diganti di belakang layar (di luar libvirt API, langsung di filesystem), maka:
- **Security driver (AppArmor via `virt-aa-helper`, dan/atau DAC dynamic-ownership)** bisa jadi mengacu ke informasi backing-chain yang sudah usang, sehingga gagal meng-whitelist / meng-otorisasi path backing file yang baru — walau permission Unix di filesystem sendiri sudah benar.
- Beberapa kali percobaan start yang gagal, ditambah edit manual pada profil AppArmor di tengah proses debugging, kemungkinan turut memperparah/mempertahankan state yang tidak konsisten ini.

**Restart `libvirtd`** memaksa daemon melakukan re-inisialisasi penuh: refresh pool storage, re-probe backing chain qcow2 dari kondisi disk yang sebenarnya sekarang, dan `virt-aa-helper` men-generate ulang profil AppArmor dengan whitelist yang sesuai kondisi terkini — sehingga start berikutnya berhasil.

> Catatan kejujuran: penjelasan di atas adalah kesimpulan terbaik berdasarkan proses eliminasi sistematis (semua kandidat permanen sudah terbukti bersih), bukan hasil observasi langsung ke internal libvirtd (tidak ada cara mudah untuk membuktikan cache mana persisnya yang stale tanpa debug build/log verbose libvirtd). Yang **pasti** secara empiris: tidak ada perubahan konfigurasi permanen yang menyebabkan fix ini — murni efek restart daemon.

---

## Pelajaran & Rekomendasi ke Depan

1. **Kalau mengganti/menulis ulang file backing image (base image) qcow2 yang sedang dipakai backing chain, sebaiknya diikuti dengan:**
   ```bash
   virsh pool-refresh vms
   systemctl restart libvirtd   # kalau pool-refresh saja belum cukup
   ```
   sebelum mencoba start VM yang memakainya, terutama kalau disk didefinisikan via storage pool (bukan path langsung).

2. **Kembalikan permission file ke semula** (`0640`, bukan `0644`) sekarang karena sempat diubah untuk keperluan testing:
   ```bash
   chmod 640 /data/isos/template-k9adm.qcow2
   ```

3. **Hapus flag `,complain` manual** yang sempat ditambahkan ke `/etc/apparmor.d/libvirt/libvirt-ee38378d-3b1e-4bfd-897d-8a274a1195e1` (kalau masih ada) — walau file ini kemungkinan besar sudah di-overwrite otomatis oleh `virt-aa-helper` di start yang berhasil, tidak ada salahnya diverifikasi:
   ```bash
   cat /etc/apparmor.d/libvirt/libvirt-ee38378d-3b1e-4bfd-897d-8a274a1195e1
   # pastikan flags kembali ke (attach_disconnected) saja, tanpa ",complain"
   ```

4. Kalau kasus serupa terulang di masa depan, **restart `libvirtd` (atau minimal `virsh pool-refresh <pool>`)** sebaiknya jadi salah satu langkah awal yang dicoba — terutama kalau file/backing image baru saja diganti di luar kendali libvirt API.
