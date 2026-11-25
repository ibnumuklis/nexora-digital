-- NEXORA DIGITAL — localisation to Bahasa Indonesia (primary) with English kept in translations->'en'.
-- APPLIED to live on 2026-11-25. Idempotent: English is captured only once; Indonesian updates are by slug/tier/title.
-- Prices are PROVISIONAL "starting from" monthly prices approved in principle by the owner (to be corrected in Admin).

begin;

-- 1) Preserve current English content in translations->'en' (only if not captured yet).
update public.products set translations = translations || jsonb_build_object('en', jsonb_build_object(
  'short_description', short_description, 'problem_statement', problem_statement, 'description', description,
  'target_market', target_market, 'benefits', to_jsonb(benefits), 'faq', faq, 'seo_title', seo_title, 'seo_description', seo_description))
where not (translations ? 'en');

update public.product_features set translations = translations || jsonb_build_object('en', jsonb_build_object('title', title, 'description', description))
where not (translations ? 'en');

update public.pricing_packages set translations = translations || jsonb_build_object('en', jsonb_build_object('name', name, 'description', description))
where not (translations ? 'en');

update public.product_categories set translations = translations || jsonb_build_object('en', jsonb_build_object('name', name, 'description', description))
where not (translations ? 'en');

update public.articles set translations = translations || jsonb_build_object('en', jsonb_build_object(
  'title', title, 'excerpt', excerpt, 'body', body, 'seo_title', seo_title, 'seo_description', seo_description))
where not (translations ? 'en');

-- 2) Categories (Bahasa Indonesia).
update public.product_categories set name = 'Manajemen Usaha', description = 'Sistem operasional, stok dan keuangan untuk usaha yang sedang bertumbuh.' where slug = 'business-management';
update public.product_categories set name = 'Teknologi Pemasaran', description = 'Kampanye, CRM dan laporan untuk tim marketing.' where slug = 'marketing-technology';
update public.product_categories set name = 'Teknologi Pendidikan', description = 'Administrasi dan platform belajar untuk sekolah dan guru.' where slug = 'education-technology';
update public.product_categories set name = 'AI & Produktivitas', description = 'Alat berbasis AI untuk mempercepat pembuatan konten dan pekerjaan kantor.' where slug = 'artificial-intelligence';

-- 3) Products.
update public.products set
  short_description = $t$Kelola restoran dalam satu sistem — kasir, menu, stok, supplier, HPP sampai keuangan.$t$,
  problem_statement = $t$Banyak restoran dan kafe masih mencatat penjualan, stok, belanja bahan dan kas di buku dan spreadsheet terpisah. Akibatnya HPP, margin menu dan kinerja tiap cabang sulit dipantau.$t$,
  description = $t$Waroeng Suramadu ERP adalah sistem operasional restoran yang dirancang dari pekerjaan harian usaha kuliner. Kasir (POS), data menu dan produk, stok, supplier, perhitungan HPP, kas, keuangan, data pelanggan, cabang dan hak akses pengguna ada dalam satu tempat, sehingga pemilik dan manajer bisa melihat kondisi setiap outlet.

Produk ini masih tahap prototipe. Modul dan alur kerjanya terus disempurnakan bersama operasional restoran sungguhan; konfigurasi akhir disepakati per klien.$t$,
  target_market = $t$Restoran, kafe, warung dan usaha kuliner multi-cabang$t$,
  benefits = array[$t$Penjualan, stok dan kas semua outlet dalam satu tampilan$t$, $t$HPP dan margin menu lebih jelas$t$, $t$Rekap manual di akhir shift berkurang$t$, $t$Hak akses terpisah untuk kasir, manajer dan pemilik$t$],
  faq = $j$[{"q":"Apakah Waroeng Suramadu ERP sudah bisa dipakai sekarang?","a":"Saat ini masih tahap prototipe. Kami bisa menunjukkan alur kerja yang sudah ada dan membahas uji coba (pilot) atau implementasi khusus untuk outlet Anda."},{"q":"Bisa untuk lebih dari satu cabang?","a":"Bisa. Pengelolaan multi-cabang termasuk dalam cakupan produk dan diatur saat implementasi."},{"q":"Bagaimana harga ditentukan?","a":"Harga di halaman ini adalah harga mulai dari. Harga akhir bergantung pada jumlah outlet, pengguna, modul dan tingkat dukungan — hubungi kami untuk penawaran."}]$j$::jsonb,
  seo_title = $t$Waroeng Suramadu ERP — Aplikasi Kasir, Stok & Keuangan Restoran$t$,
  seo_description = $t$Aplikasi kasir (POS), menu, stok, supplier, HPP, kas dan manajemen cabang untuk restoran dan kafe dari NEXORA DIGITAL.$t$
where slug = 'waroeng-suramadu-erp';

update public.products set
  short_description = $t$Pusat kendali tim marketing: kampanye, CRM, aktivitas cabang, anggaran, alur konten dan laporan KPI.$t$,
  problem_statement = $t$Tim marketing dengan banyak cabang sering mengelola rencana kampanye, data pelanggan, laporan cabang dan persetujuan konten lewat grup chat dan spreadsheet, sehingga kinerja sulit dipantau dan dibandingkan.$t$,
  description = $t$Marcom Command Center adalah ruang kerja operasional marketing yang menghubungkan perencanaan kampanye, pencatatan pelanggan dan leads, pemantauan aktivitas cabang, KPI dan anggaran, alur kerja konten serta pelaporan.

Dirancang untuk tim marketing & komunikasi yang mengoordinasikan beberapa cabang atau kanal dan membutuhkan satu sumber data. Produk masih dalam pengembangan aktif; fitur diprioritaskan bersama pengguna pilot.$t$,
  target_market = $t$Tim marketing & komunikasi, usaha ritel dan multi-cabang$t$,
  benefits = array[$t$Kampanye, anggaran dan hasil dalam satu ruang kerja$t$, $t$Aktivitas cabang dipantau terhadap rencana$t$, $t$Tindak lanjut leads dan pelanggan di CRM bersama$t$, $t$Laporan ke manajemen lebih cepat$t$],
  faq = $j$[{"q":"Marcom Command Center cocok untuk siapa?","a":"Tim marketing dan komunikasi yang mengelola kampanye, konten dan tindak lanjut pelanggan di beberapa cabang atau kanal."},{"q":"Bisa disesuaikan dengan alur kerja kami?","a":"Bisa. Produk ini dapat dikonfigurasi, dan dikembangkan khusus bila diperlukan."},{"q":"Apakah ada demo?","a":"Ada demo sandbox dengan data contoh, dan kami juga bisa mengatur demo terpandu."}]$j$::jsonb,
  seo_title = $t$Marcom Command Center — Operasional Marketing, CRM & KPI$t$,
  seo_description = $t$Platform operasional marketing untuk kampanye, CRM, pemantauan cabang, anggaran, alur konten dan laporan KPI.$t$
where slug = 'marcom-command-center';

update public.products set
  short_description = $t$Platform belajar yang menghubungkan siswa, guru, admin sekolah dan orang tua — materi, tugas, kuis, jadwal dan nilai.$t$,
  problem_statement = $t$Materi, tugas, nilai dan komunikasi dengan orang tua sering tersebar di grup chat dan kertas, sehingga perkembangan belajar siswa sulit diikuti.$t$,
  description = $t$EDUCLASS adalah platform manajemen pembelajaran yang mempertemukan siswa, guru, admin sekolah dan orang tua. Cakupannya meliputi materi belajar, jadwal, tugas dan kuis, hasil dan perkembangan belajar, komunikasi serta portal orang tua.

Produk masih dalam pengembangan. Fitur pembayaran hanya diaktifkan bila sudah terintegrasi dengan benar dan disepakati bersama lembaga.$t$,
  target_market = $t$Sekolah, bimbel, guru, siswa dan orang tua$t$,
  benefits = array[$t$Materi, tugas dan jadwal dalam satu tempat$t$, $t$Perkembangan belajar terlihat oleh guru dan orang tua$t$, $t$Tidak perlu banyak grup chat$t$, $t$Bisa dipakai di HP maupun komputer$t$],
  faq = $j$[{"q":"Apakah orang tua bisa memantau perkembangan anak?","a":"Bisa. Portal orang tua termasuk dalam cakupan produk sehingga orang tua dapat melihat jadwal, tugas dan nilai."},{"q":"Apakah EDUCLASS memproses pembayaran?","a":"Tidak secara bawaan. Fitur pembayaran hanya diaktifkan setelah integrasi yang tepat disepakati dengan lembaga."}]$j$::jsonb,
  seo_title = $t$EDUCLASS — Platform Belajar untuk Sekolah, Siswa & Orang Tua$t$,
  seo_description = $t$Platform pembelajaran dengan materi, tugas, kuis, jadwal, nilai dan portal orang tua untuk sekolah dan bimbel.$t$
where slug = 'educlass';

update public.products set
  short_description = $t$Administrasi guru jadi lebih ringan: perangkat ajar, Prota & Promes, kalender akademik dan rekap dalam satu tempat.$t$,
  problem_statement = $t$Guru menghabiskan banyak waktu menyiapkan dan merapikan dokumen administrasi — Prota, Promes, RPP/modul ajar, analisis pekan efektif dan jurnal — alih-alih fokus mengajar.$t$,
  description = $t$EDU ADMIN adalah ruang kerja bagi guru dan sekolah untuk menyiapkan dan merapikan administrasi mengajar: perangkat ajar, program tahunan dan semester (Prota & Promes), analisis pekan efektif, jadwal mengajar, jurnal dan rekap administrasi untuk supervisi.

Produk masih dalam pengembangan. Format dokumen mengikuti praktik umum di sekolah dan bisa disesuaikan per sekolah.$t$,
  target_market = $t$Guru, sekolah dan lembaga pendidikan$t$,
  benefits = array[$t$Waktu menyusun dokumen berulang jauh berkurang$t$, $t$Format seragam antar guru dan mata pelajaran$t$, $t$Dokumen siap untuk supervisi akademik$t$, $t$Semua tersimpan di satu tempat$t$],
  faq = $j$[{"q":"Dokumen apa saja yang dicakup EDU ADMIN?","a":"Perangkat ajar, Prota dan Promes, analisis pekan efektif, jadwal, jurnal dan rekap administrasi. Template pastinya dikonfirmasi saat onboarding."},{"q":"Bisa dipakai satu sekolah sekaligus?","a":"Bisa — tersedia untuk guru perorangan maupun lisensi sekolah."}]$j$::jsonb,
  seo_title = $t$EDU ADMIN — Aplikasi Administrasi Guru & Sekolah$t$,
  seo_description = $t$Aplikasi administrasi guru untuk perangkat ajar, Prota & Promes, analisis pekan efektif, jadwal mengajar dan rekap supervisi.$t$
where slug = 'edu-admin';

update public.products set
  short_description = $t$Ubah satu ide atau materi menjadi caption, postingan media sosial, aset visual dan storyboard video pendek.$t$,
  problem_statement = $t$Kreator dan tim marketing butuh banyak format konten untuk setiap kanal, dan menulis ulang pesan yang sama secara manual itu lambat dan tidak konsisten.$t$,
  description = $t$AI Content Repurposing Studio adalah ruang kerja produksi konten yang membantu mengubah satu sumber — ide, artikel atau brief produk — menjadi berbagai format siap tayang: caption dan copy, desain postingan, carousel dan storyboard video pendek, tertata dalam planner konten dan pustaka aset.

Produk masih tahap prototipe. Hasil buatan AI selalu berupa draf yang bisa diedit dan diperiksa manusia; tingkat otomatisasi dijelaskan per fitur saat sudah tersedia.$t$,
  target_market = $t$Kreator konten, tim marketing dan UMKM$t$,
  benefits = array[$t$Satu sumber, banyak format siap tayang$t$, $t$Gaya bahasa brand konsisten di semua postingan$t$, $t$Mulai dari draf, bukan halaman kosong$t$, $t$Planner dan pustaka aset dalam satu tempat$t$],
  faq = $j$[{"q":"Apakah AI memposting konten secara otomatis?","a":"Tidak. Semua hasil adalah draf yang Anda periksa dan edit sebelum dipublikasikan."},{"q":"Format apa saja yang didukung?","a":"Caption, desain postingan, carousel dan storyboard video pendek. Ketersediaan tiap format dikonfirmasi seiring perkembangan prototipe."}]$j$::jsonb,
  seo_title = $t$AI Content Repurposing Studio — Satu Ide, Banyak Format Konten$t$,
  seo_description = $t$Ruang kerja berbasis AI untuk mengubah satu materi menjadi caption, postingan, carousel dan storyboard video.$t$
where slug = 'ai-content-repurposing-studio';

-- 4) Features (matched by product + current English title).
with m(slug, en, title, descr) as (values
  ('waroeng-suramadu-erp','POS & cashier','Kasir (POS)','Catat penjualan dan pembayaran di kasir.'),
  ('waroeng-suramadu-erp','Menu & products','Menu & produk','Kelola menu, varian dan resep.'),
  ('waroeng-suramadu-erp','Inventory & suppliers','Stok & supplier','Pantau pergerakan stok, pembelian dan supplier.'),
  ('waroeng-suramadu-erp','Cost of goods (HPP) planning','Perhitungan HPP','Hitung biaya resep dan margin menu.'),
  ('waroeng-suramadu-erp','Cash & finance','Kas & keuangan','Kas kecil, arus kas dan rekap keuangan.'),
  ('waroeng-suramadu-erp','Branches & users','Cabang & pengguna','Kelola outlet dengan hak akses per peran.'),
  ('marcom-command-center','Campaign management','Manajemen kampanye','Rencanakan kampanye, jadwal dan anggaran.'),
  ('marcom-command-center','CRM & lead tracking','CRM & leads','Tindak lanjut pelanggan dan leads dalam satu daftar.'),
  ('marcom-command-center','Branch monitoring','Pemantauan cabang','Pantau aktivitas marketing tiap cabang.'),
  ('marcom-command-center','KPI & budget','KPI & anggaran','Bandingkan target dan pengeluaran dengan rencana.'),
  ('marcom-command-center','Content workflow','Alur kerja konten','Brief, review dan persetujuan konten.'),
  ('marcom-command-center','Reporting','Laporan','Ringkasan untuk manajemen.'),
  ('educlass','Learning materials','Materi belajar','Bagikan materi per kelas dan mata pelajaran.'),
  ('educlass','Assignments & quizzes','Tugas & kuis','Beri tugas dan kuis, kumpulkan jawaban.'),
  ('educlass','Schedules','Jadwal','Jadwal kelas dan kegiatan.'),
  ('educlass','Results & progress','Nilai & perkembangan','Pantau hasil dan perkembangan belajar.'),
  ('educlass','Parent portal','Portal orang tua','Orang tua memantau jadwal dan nilai.'),
  ('edu-admin','Learning tools (perangkat ajar)','Perangkat ajar','Susun dokumen mengajar dari template.'),
  ('edu-admin','Prota & Promes','Prota & Promes','Perencanaan program tahunan dan semester.'),
  ('edu-admin','Effective-week analysis','Analisis pekan efektif','Hitung pekan efektif pembelajaran.'),
  ('edu-admin','Teaching schedule & journal','Jadwal & jurnal mengajar','Atur jadwal dan jurnal mengajar.'),
  ('edu-admin','Administrative recap','Rekap administrasi','Kumpulkan dokumen untuk supervisi.'),
  ('ai-content-repurposing-studio','Content repurposing','Repurpose konten','Ubah satu sumber menjadi beberapa format.'),
  ('ai-content-repurposing-studio','AI copywriting drafts','Draf copywriting AI','Draf caption dan copy untuk direview.'),
  ('ai-content-repurposing-studio','Storyboard generator','Pembuat storyboard','Storyboard video pendek dari brief.'),
  ('ai-content-repurposing-studio','Social content planner','Planner konten sosmed','Rencanakan postingan di berbagai kanal.'),
  ('ai-content-repurposing-studio','Creative asset library','Pustaka aset kreatif','Simpan aset yang sudah disetujui di satu tempat.')
)
update public.product_features f set title = m.title, description = m.descr
from m join public.products p on p.slug = m.slug
where f.product_id = p.id and f.translations->'en'->>'title' = m.en;

-- 5) Packages: Indonesian names/descriptions + provisional "starting from" monthly prices (IDR).
with m(slug, tier, descr, price) as (values
  ('waroeng-suramadu-erp','starter','Untuk 1 outlet: kasir, menu dan stok dasar.',149000),
  ('waroeng-suramadu-erp','professional','Untuk usaha yang bertumbuh: HPP, supplier, keuangan dan lebih banyak pengguna.',349000),
  ('waroeng-suramadu-erp','enterprise','Untuk multi-cabang: laporan gabungan, integrasi dan dukungan prioritas.',899000),
  ('marcom-command-center','starter','Untuk 1 tim marketing: kampanye dan CRM dasar.',499000),
  ('marcom-command-center','professional','Beberapa cabang, KPI, anggaran dan alur konten.',1490000),
  ('marcom-command-center','enterprise','Banyak cabang, integrasi data dan dukungan prioritas.',3490000),
  ('educlass','starter','Untuk 1 sekolah atau bimbel kecil: materi, tugas dan jadwal.',299000),
  ('educlass','professional','Kuis, nilai, portal orang tua dan lebih banyak kelas.',749000),
  ('educlass','enterprise','Untuk yayasan atau beberapa sekolah, dengan integrasi dan dukungan prioritas.',1990000),
  ('edu-admin','starter','Per guru: perangkat ajar, Prota & Promes, jadwal dan jurnal.',49000),
  ('edu-admin','professional','Per sekolah: semua guru, format seragam dan rekap supervisi.',299000),
  ('edu-admin','enterprise','Untuk yayasan atau beberapa sekolah, dengan template khusus.',799000),
  ('ai-content-repurposing-studio','starter','Untuk kreator atau UMKM: caption dan postingan.',99000),
  ('ai-content-repurposing-studio','professional','Untuk tim marketing: carousel, storyboard dan planner.',249000),
  ('ai-content-repurposing-studio','enterprise','Untuk agensi atau beberapa brand, dengan pustaka aset bersama.',699000)
)
update public.pricing_packages k set description = m.descr, price_amount = m.price, currency = 'IDR', billing_period = 'month'
from m join public.products p on p.slug = m.slug
where k.product_id = p.id and k.tier = m.tier;

update public.pricing_packages set name = 'Custom', description = 'Cakupan dan fitur disesuaikan dengan kebutuhan Anda — harga melalui penawaran.', price_amount = null, billing_period = 'custom'
where tier = 'custom';

-- English package descriptions to match the new per-product scope.
with m(slug, tier, en) as (values
  ('waroeng-suramadu-erp','starter','For one outlet: cashier, menu and basic stock.'),
  ('waroeng-suramadu-erp','professional','For growing businesses: cost of goods, suppliers, finance and more users.'),
  ('waroeng-suramadu-erp','enterprise','For multi-branch operations: consolidated reports, integrations and priority support.'),
  ('marcom-command-center','starter','For one marketing team: campaigns and basic CRM.'),
  ('marcom-command-center','professional','Several branches, KPIs, budgets and content workflow.'),
  ('marcom-command-center','enterprise','Many branches, data integrations and priority support.'),
  ('educlass','starter','For one school or small tutoring centre: materials, tasks and schedules.'),
  ('educlass','professional','Quizzes, results, parent portal and more classes.'),
  ('educlass','enterprise','For foundations or several schools, with integrations and priority support.'),
  ('edu-admin','starter','Per teacher: learning tools, Prota & Promes, schedules and journals.'),
  ('edu-admin','professional','Per school: all teachers, consistent formats and supervision recaps.'),
  ('edu-admin','enterprise','For foundations or several schools, with custom templates.'),
  ('ai-content-repurposing-studio','starter','For creators or small businesses: captions and posts.'),
  ('ai-content-repurposing-studio','professional','For marketing teams: carousels, storyboards and planner.'),
  ('ai-content-repurposing-studio','enterprise','For agencies or several brands, with a shared asset library.')
)
update public.pricing_packages k set translations = jsonb_set(k.translations, '{en,description}', to_jsonb(m.en))
from m join public.products p on p.slug = m.slug
where k.product_id = p.id and k.tier = m.tier;

update public.pricing_packages set translations = jsonb_set(translations, '{en,description}', to_jsonb('Scope and features tailored to your requirements — priced by quotation.'::text))
where tier = 'custom';

-- FAQ "how is pricing determined" (EN) now mentions starting prices.
update public.products set translations = jsonb_set(translations, '{en,faq}', $j$[{"q":"Is Waroeng Suramadu ERP ready to use today?","a":"It is at prototype stage. We can walk you through the current workflows and discuss a pilot or custom implementation for your outlets."},{"q":"Can it handle more than one branch?","a":"Yes. Multi-branch management is part of the product scope and is configured during implementation."},{"q":"How is pricing determined?","a":"Prices on this page are starting prices. The final price depends on the number of outlets, users, modules and support level — contact us for a quote."}]$j$::jsonb)
where slug = 'waroeng-suramadu-erp';

-- 6) Article (Bahasa Indonesia).
update public.articles set
  title = 'Mengenal NEXORA DIGITAL',
  excerpt = 'Studio teknologi & produk dari Makassar yang membangun produk digital praktis dan software sesuai kebutuhan usaha.',
  seo_title = 'Mengenal NEXORA DIGITAL — Technology & Product Studio dari Makassar',
  seo_description = 'NEXORA DIGITAL adalah studio teknologi & produk di Makassar yang membangun aplikasi untuk UMKM, sekolah, tim marketing dan perusahaan.',
  body = $t$## Kenapa NEXORA

NEXORA DIGITAL adalah studio teknologi & produk yang berbasis di Makassar, Indonesia. Kami membangun produk digital untuk operasional sehari-hari — restoran dan UMKM, tim marketing, sekolah, dan kreator konten — serta software khusus ketika belum ada produk yang cocok.

## Cara kami bekerja

- **Status produk yang jujur.** Setiap produk menampilkan tahap sebenarnya: prototipe, dalam pengembangan, beta atau tersedia.
- **Coba dulu, baru diskusi.** Produk dengan demo sandbox bisa dicoba dengan data contoh dalam sesi berbatas waktu.
- **Harga dan ketentuan jelas.** Langganan, lisensi sekali bayar, pengembangan khusus, maintenance atau white-label — selalu tertulis sebelum pekerjaan dimulai.

## Selanjutnya

Kami sedang menyempurnakan lima produk pertama bersama pengguna awal. Tertarik uji coba atau proyek khusus? [Hubungi kami](/contact) atau chat lewat WhatsApp.$t$
where slug = 'introducing-nexora-digital';

commit;
