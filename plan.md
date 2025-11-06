# aplikasi rekap registrasi ujian

- nextjs (static export) optimized for mobile important to use context7
- use turso mcp to communicate with turso
- memiliki bottom navbar dengan dua tab: 1. daftar kelas 2. semua ujian

  - spesifikasi tab daftar kelas:
    - floating action button untuk tambah kelas, saat tambah kelas muncul dialog dengan pertanyaan: nama kelas, pilih jam pelajaran qur'an di kelas tersebut dari senin sampai jum'at, ada 5 jam, user bisa pilih 2-3 jam dari opsi jam ke-1 sampai jam ke-5 (tolong optimasi ui untuk pemilihan ini).
    - data kelas yang dibuat (nama + jam alquran) disimpan di turso db
    - setelah kelas dibuat maka akan ada card tentang kelas tersebut dengan tombol edit atau delete
    - halaman class detail menampilakn list card untuk murid yang telah didaftarkan dengan tombol edit dan delete dan tombol daftarkan murid, jika di klik akan muncul dialog dengan dua tab: non 5 juz (form: nama (contoh: amir), ujian (contoh: 1/2 ke-1 juz 1) dan 5 juz (form: nama, ujian (dropdown selection dari 1-5 sampai 26-30))
    - semua aksi crud tersimpan di turso database
  - spesifikasi tab list ujian:

    - berisi semua ujian murid yang akan datang untuk semua kelas dipisahkan per tanggal.
