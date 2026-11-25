import Link from 'next/link';
import { COMPANY } from '@/lib/company';

export function TermsId() {
  return (
    <>
      <p>Syarat & ketentuan ini mengatur penggunaan situs dan demo produk yang dikelola oleh {COMPANY.brand}, usaha perorangan milik {COMPANY.owner}, {COMPANY.city}, {COMPANY.country}. Dengan menggunakan situs ini, Anda menyetujui ketentuan berikut.</p>

      <h2>1. Informasi di situs ini</h2>
      <p>Deskripsi produk, fitur, tahap pengembangan dan ketersediaan disampaikan dengan itikad baik untuk keperluan evaluasi dan dapat berubah seiring perkembangan produk. Setiap halaman produk menampilkan tahap saat ini (misalnya prototipe, dalam pengembangan atau tersedia). Tidak ada isi situs ini yang merupakan penawaran yang mengikat.</p>

      <h2>2. Harga, penawaran, perjanjian dan pembayaran</h2>
      <p>Harga yang tercantum di situs adalah harga <em>mulai dari</em> dalam Rupiah (IDR), belum termasuk pajak yang berlaku, dan dapat berubah sewaktu-waktu. Harga, cakupan, hasil kerja, lisensi, update, tingkat dukungan dan ketentuan pembayaran baru mengikat setelah dituangkan dalam penawaran atau perjanjian tertulis yang disetujui kedua pihak. Situs ini tidak menerima pembayaran.</p>

      <h2>3. Lisensi dan hak kekayaan intelektual</h2>
      <p>Situs, software, desain, teks, logo dan merek NEXORA DIGITAL dimiliki oleh {COMPANY.brand} atau pemberi lisensinya. Anda tidak diperkenankan menyalin, mengubah, mendistribusikan, melakukan rekayasa balik atau membuat karya turunan, kecuali diizinkan oleh hukum atau lisensi tertulis. Kepemilikan atas hasil pengembangan khusus diatur dalam perjanjian proyek terkait.</p>

      <h2>4. Demo</h2>
      <p>Demo disediakan “sebagaimana adanya” hanya untuk evaluasi, menggunakan data contoh, berbatas waktu, dan dapat tidak tersedia atau direset sewaktu-waktu. Anda tidak boleh memasukkan data pribadi, keuangan atau rahasia yang sebenarnya, mencoba mengakali batas sesi atau kontrol keamanan, mengakses secara otomatis, mengambil konten (scraping), atau menggunakan konten demo untuk tujuan lain. Baca <Link href="/demo-disclaimer">disclaimer demo</Link>.</p>

      <h2>5. Penggunaan yang wajar</h2>
      <p>Anda setuju untuk tidak menyalahgunakan situs, termasuk mencoba akses tanpa izin, menyebarkan malware, membebani layanan secara berlebihan, mengirim pertanyaan palsu atau kasar, atau melanggar hak pihak lain. Kami dapat memblokir akses yang melanggar ketentuan ini.</p>

      <h2>6. Tautan pihak ketiga</h2>
      <p>Tautan ke situs pihak ketiga (termasuk WhatsApp) disediakan untuk kemudahan. Kami tidak bertanggung jawab atas isi maupun praktik situs tersebut.</p>

      <h2>7. Batasan tanggung jawab</h2>
      <p>Sejauh diizinkan hukum Indonesia, {COMPANY.brand} tidak bertanggung jawab atas kerugian tidak langsung, insidental atau konsekuensial, kehilangan data atau keuntungan yang timbul dari penggunaan situs atau demo. Ketentuan ini tidak membatasi tanggung jawab yang menurut hukum tidak dapat dibatasi. Tanggung jawab atas layanan berbayar diatur dalam perjanjian terkait.</p>

      <h2>8. Data pribadi</h2>
      <p>Pemrosesan data pribadi dijelaskan dalam <Link href="/privacy">kebijakan privasi</Link>.</p>

      <h2>9. Hukum yang berlaku dan penyelesaian sengketa</h2>
      <p>Ketentuan ini tunduk pada hukum Negara Republik Indonesia. Para pihak akan lebih dahulu menyelesaikan sengketa secara musyawarah untuk mufakat. Bila dalam 30 hari tidak tercapai penyelesaian, sengketa diajukan ke Pengadilan Negeri Makassar.</p>

      <h2>10. Perubahan</h2>
      <p>Ketentuan ini dapat kami perbarui; tanggal di bagian atas menunjukkan versi yang berlaku. Penggunaan situs setelah pembaruan berarti Anda menerima ketentuan yang telah diperbarui. Bila terdapat perbedaan antara versi bahasa, versi Bahasa Indonesia yang berlaku.</p>
    </>
  );
}
