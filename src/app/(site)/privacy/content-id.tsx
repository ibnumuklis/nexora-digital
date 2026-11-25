import Link from 'next/link';
import { COMPANY } from '@/lib/company';

export function PrivacyId() {
  return (
    <>
      <p>Kebijakan ini menjelaskan bagaimana {COMPANY.brand} (“kami”), usaha perorangan milik {COMPANY.owner} yang berkedudukan di {COMPANY.city}, {COMPANY.country}, memproses data pribadi saat Anda menggunakan situs ini, demo produk dan layanan kami. Kami memproses data pribadi sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (“UU PDP”) beserta peraturan pelaksanaannya. {COMPANY.brand} bertindak sebagai pengendali data pribadi.</p>

      <h2>1. Data yang kami kumpulkan</h2>
      <ul>
        <li><strong>Formulir pertanyaan dan kontak</strong> — nama, email, serta (opsional) nomor telepon/WhatsApp, nama usaha, bidang usaha, produk yang diminati, perkiraan anggaran, target waktu dan isi pesan Anda.</li>
        <li><strong>Percakapan WhatsApp</strong> — bila Anda menghubungi kami lewat WhatsApp, nomor, nama profil dan isi percakapan diproses oleh WhatsApp (Meta) dan oleh kami untuk menanggapi Anda.</li>
        <li><strong>Catatan persetujuan</strong> — bahwa Anda menyetujui kebijakan ini (diperlukan agar kami dapat membalas) dan, secara terpisah, apakah Anda setuju menerima info produk (opsional), masing-masing beserta waktunya.</li>
        <li><strong>Analitik anonim</strong> — hanya dikumpulkan bila Anda memilih “Izinkan analitik anonim”: halaman yang dilihat (tanpa parameter URL), produk yang dilihat, klik demo dan tombol, serta pengiriman formulir, yang dikaitkan dengan pengenal acak yang hanya berlaku selama satu sesi tab browser. Tanpa iklan atau pelacakan pihak ketiga.</li>
        <li><strong>Sesi demo</strong> — kunci pengunjung berbentuk pseudonim (hash satu arah dari alamat IP dan jenis browser; alamat IP sendiri tidak disimpan), waktu sesi dan aktivitasnya, untuk menegakkan batas waktu dan mencegah penyalahgunaan.</li>
        <li><strong>Akun staf</strong> — email, hash kata sandi dan catatan login anggota tim kami.</li>
      </ul>

      <h2>2. Tujuan dan dasar pemrosesan</h2>
      <ul>
        <li>Menjawab permintaan Anda, menyiapkan proposal dan penawaran harga, serta mengelola hubungan usaha — berdasarkan persetujuan Anda dan langkah atas permintaan Anda sebelum perjanjian dibuat.</li>
        <li>Mengirim info produk — hanya dengan persetujuan terpisah yang bersifat opsional dan dapat Anda tarik kapan saja.</li>
        <li>Meningkatkan situs dan produk dengan statistik agregat — berdasarkan persetujuan Anda atas analitik.</li>
        <li>Keamanan serta pencegahan penipuan dan penyalahgunaan (pembatasan jumlah permintaan, log audit, perlindungan demo) — berdasarkan kepentingan sah kami menjaga layanan tetap aman.</li>
        <li>Memenuhi kewajiban hukum, seperti penyimpanan catatan atau permintaan yang sah dari instansi berwenang.</li>
      </ul>

      <h2>3. Masa penyimpanan</h2>
      <ul>
        <li>Data pertanyaan dan CRM: hingga 24 bulan sejak interaksi terakhir, atau lebih lama bila diwajibkan perjanjian atau hukum.</li>
        <li>Data analitik: hingga 13 bulan.</li>
        <li>Catatan sesi demo: 30 hari.</li>
        <li>Log keamanan dan audit: hingga 24 bulan.</li>
      </ul>
      <p>Setelah masa penyimpanan berakhir, data dihapus atau dianonimkan secara permanen.</p>

      <h2>4. Pembagian data dan pemroses</h2>
      <p>Kami tidak menjual data pribadi. Kami menggunakan penyedia layanan berikut yang terikat ketentuan pemrosesan data masing-masing:</p>
      <ul>
        <li><strong>Supabase</strong> — database, autentikasi dan penyimpanan file (server di Tokyo, Jepang).</li>
        <li><strong>Vercel</strong> — hosting situs dan jaringan pengiriman konten (jaringan global).</li>
        <li><strong>GitHub</strong> — tugas pemeliharaan otomatis dan pembuatan media (memproses informasi produk, bukan data pengunjung).</li>
        <li><strong>WhatsApp (Meta)</strong> — bila Anda memilih menghubungi kami lewat WhatsApp.</li>
      </ul>
      <p>Karena penyedia tersebut beroperasi di luar Indonesia, data Anda dapat ditransfer ke luar negeri. Kami memilih penyedia yang menerapkan perlindungan setidaknya setara dengan ketentuan UU PDP.</p>

      <h2>5. Keamanan</h2>
      <p>Akses ke data pribadi dibatasi hanya untuk staf yang berwenang sesuai perannya dan ditegakkan di database (row-level security). Koneksi dienkripsi (HTTPS), tindakan administratif dicatat, dan kata sandi hanya disimpan dalam bentuk hash. Tidak ada sistem yang sepenuhnya aman; bila terjadi kegagalan pelindungan data pribadi yang berdampak pada Anda, kami akan memberi tahu Anda dan lembaga terkait sesuai UU PDP (pada prinsipnya paling lambat 3×24 jam).</p>

      <h2>6. Hak Anda</h2>
      <p>Berdasarkan UU PDP, Anda berhak meminta informasi, akses, pembetulan, pembaruan, penghapusan atau pemusnahan data pribadi Anda; menarik persetujuan; mengajukan keberatan atas pemrosesan tertentu; serta meminta penundaan atau pembatasan pemrosesan. Kirim permintaan ke <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Kami akan memverifikasi identitas Anda dan menanggapi dalam 3×24 jam bila diwajibkan hukum, atau secepatnya bila tidak. Pilihan analitik dapat diubah kapan saja lewat “Pengaturan cookie” di bagian bawah halaman.</p>

      <h2>7. Anak-anak</h2>
      <p>Situs ini ditujukan untuk pelaku usaha dan profesional. Kami tidak dengan sengaja mengumpulkan data anak di bawah 17 tahun tanpa persetujuan orang tua atau wali.</p>

      <h2>8. Perubahan</h2>
      <p>Kebijakan ini dapat kami perbarui. Tanggal di bagian atas menunjukkan versi terbaru; perubahan penting akan ditandai di halaman ini.</p>

      <p>Lihat juga <Link href="/cookies">kebijakan cookie & analitik</Link>, <Link href="/terms">syarat & ketentuan</Link> dan <Link href="/demo-disclaimer">disclaimer demo</Link>. Bila terdapat perbedaan antara versi bahasa, versi Bahasa Indonesia yang berlaku.</p>
    </>
  );
}
