// ===========================
//  SawitID — Logika Estimasi
// ===========================

// Jumlah pohon per hektar berdasarkan jarak tanam
function jumlahPohonPerHa(jarak) {
  const tabel = { "9x9": 143, "9x8": 139, "8x8": 156 };
  return tabel[jarak] || 143;
}

// Produktivitas TBS per pohon per tahun (kg) berdasarkan umur
function produktivitasTBS(umur, varietas) {
  let base = 0;

  if (umur < 3) base = 0;
  else if (umur === 3) base = 30;
  else if (umur <= 5) base = 80;
  else if (umur <= 10) base = 150;
  else if (umur <= 20) base = 130;
  else if (umur <= 25) base = 100;
  else base = 60;

  // Koreksi varietas
  const koreksiVarietas = { "unggul": 1.0, "lokal": 0.82, "dura": 0.75 };
  return base * (koreksiVarietas[varietas] || 1.0);
}

// Faktor koreksi kondisi
function faktorKoreksi(irigasi, pupuk) {
  let f = 1.0;
  if (irigasi === "irigasi") f += 0.10;
  if (pupuk === "sedang") f -= 0.12;
  if (pupuk === "kurang") f -= 0.25;
  return Math.max(f, 0.4);
}

// Distribusi panen per bulan (persen dari tahunan)
const distribusiBulan = {
  "Jan": 6, "Feb": 5, "Mar": 6, "Apr": 8,
  "Mei": 10, "Jun": 10, "Jul": 9, "Agu": 9,
  "Sep": 10, "Okt": 9, "Nov": 9, "Des": 9
};

// Harga TBS estimasi (Rp/kg) — dapat disesuaikan
const HARGA_TBS = 3500;

// Status fase berdasarkan umur
function getFase(umur) {
  if (umur < 3) return { label: "Belum Produksi", kelas: "status-belum", icon: "🌱" };
  if (umur <= 5) return { label: "Produksi Awal", kelas: "status-awal", icon: "🌿" };
  if (umur <= 20) return { label: "Produksi Prima", kelas: "status-prima", icon: "🌴" };
  if (umur <= 25) return { label: "Produksi Menurun", kelas: "status-awal", icon: "🍂" };
  return { label: "Perlu Replanting", kelas: "status-tua", icon: "⚠️" };
}

// ===========================
//  FUNGSI UTAMA: HITUNG
// ===========================
function hitungEstimasi() {
  // Ambil nilai input
  const luas = parseFloat(document.getElementById("luas").value);
  const jarak = document.getElementById("jarak").value;
  const umur = parseInt(document.getElementById("umur").value);
  const varietas = document.getElementById("varietas").value;
  const irigasi = document.getElementById("irigasi").value;
  const pupuk = document.getElementById("pupuk").value;

  // Validasi
  if (!luas || luas <= 0) {
    alert("⚠️ Masukkan luas lahan yang valid!");
    return;
  }
  if (!umur || umur <= 0) {
    alert("⚠️ Masukkan umur tanaman yang valid!");
    return;
  }

  // Hitung
  const pohonPerHa = jumlahPohonPerHa(jarak);
  const totalPohon = Math.round(pohonPerHa * luas);
  const kgPerPohon = produktivitasTBS(umur, varietas);
  const faktor = faktorKoreksi(irigasi, pupuk);
  const produksiTahunanKg = totalPohon * kgPerPohon * faktor;
  const produksiTahunanTon = produksiTahunanKg / 1000;
  const produksiBulananTon = produksiTahunanTon / 12;
  const pendapatanTahunan = produksiTahunanKg * HARGA_TBS;
  const tonPerHa = produksiTahunanTon / luas;
  const fase = getFase(umur);

  // Tampilkan hasil
  tampilkanHasil({
    luas, jarak, umur, varietas, irigasi, pupuk,
    totalPohon, produksiTahunanTon, produksiBulananTon,
    pendapatanTahunan, tonPerHa, fase
  });

  tampilkanKalender(produksiTahunanTon);
}

function tampilkanHasil(d) {
  const section = document.getElementById("result-section");
  section.classList.remove("hidden");

  const html = `
    <span class="status-badge ${d.fase.kelas}">${d.fase.icon} ${d.fase.label}</span>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="value">${d.totalPohon.toLocaleString("id-ID")}</div>
        <div class="unit">pohon</div>
        <div class="label">Total Tanaman</div>
      </div>
      <div class="metric-card">
        <div class="value">${d.produksiTahunanTon.toFixed(1)}</div>
        <div class="unit">ton TBS/tahun</div>
        <div class="label">Estimasi Tahunan</div>
      </div>
      <div class="metric-card">
        <div class="value">${d.produksiBulananTon.toFixed(1)}</div>
        <div class="unit">ton TBS/bulan</div>
        <div class="label">Rata-rata Bulanan</div>
      </div>
      <div class="metric-card">
        <div class="value">${d.tonPerHa.toFixed(1)}</div>
        <div class="unit">ton/ha/tahun</div>
        <div class="label">Produktivitas Lahan</div>
      </div>
      <div class="metric-card">
        <div class="value">Rp${formatRupiah(d.pendapatanTahunan)}</div>
        <div class="unit">estimasi*</div>
        <div class="label">Pendapatan/Tahun</div>
      </div>
      <div class="metric-card">
        <div class="value">Rp${formatRupiah(d.pendapatanTahunan / 12)}</div>
        <div class="unit">estimasi*</div>
        <div class="label">Pendapatan/Bulan</div>
      </div>
    </div>

    <div class="info-box">
      <strong>📋 Ringkasan Kebun:</strong><br>
      Luas: <strong>${d.luas} ha</strong> &bull;
      Pohon: <strong>${d.totalPohon.toLocaleString("id-ID")} batang</strong> &bull;
      Umur: <strong>${d.umur} tahun</strong> &bull;
      Varietas: <strong>${namaVarietas(d.varietas)}</strong><br><br>
      *Harga TBS estimasi Rp 2.200/kg. Harga aktual dapat berbeda sesuai kondisi pasar dan lokasi.
    </div>
  `;

  document.getElementById("result-content").innerHTML = html;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function tampilkanKalender(totalTonTahun) {
  const section = document.getElementById("calendar-section");
  section.classList.remove("hidden");

  const bulanArr = Object.entries(distribusiBulan);
  const maxPersen = Math.max(...bulanArr.map(([, p]) => p));

  let html = '<div class="kalender-grid">';
  for (const [nama, persen] of bulanArr) {
    const ton = (totalTonTahun * persen / 100).toFixed(1);
    let level = "level-rendah";
    if (persen >= maxPersen * 0.85) level = "level-tinggi";
    else if (persen >= maxPersen * 0.65) level = "level-sedang";

    html += `
      <div class="bulan-card ${level}">
        <div class="bulan-nama">${nama}</div>
        <div class="bulan-ton">${ton}</div>
        <div style="font-size:0.72rem;opacity:0.8">ton</div>
      </div>
    `;
  }
  html += "</div>";
  html += `<p style="font-size:0.8rem;color:#6a8a6a;margin-top:0.75rem;">🟢 Panen tinggi &nbsp;🟡 Sedang &nbsp;🔴 Rendah — berdasarkan pola musim rata-rata Sumatera/Kalimantan</p>`;

  document.getElementById("calendar-content").innerHTML = html;
}

// ===========================
//  FUNGSI BANTU
// ===========================
function formatRupiah(angka) {
  if (angka >= 1_000_000_000) return (angka / 1_000_000_000).toFixed(1) + " M";
  if (angka >= 1_000_000) return (angka / 1_000_000).toFixed(1) + " jt";
  return angka.toLocaleString("id-ID");
}

function namaVarietas(v) {
  const nama = { "unggul": "Tenera Unggul (DxP)", "lokal": "Lokal Biasa", "dura": "Dura" };
  return nama[v] || v;
}

function resetForm() {
  document.getElementById("result-section").classList.add("hidden");
  document.getElementById("calendar-section").classList.add("hidden");
  document.getElementById("input-section").scrollIntoView({ behavior: "smooth" });
}

function cetakLaporan() {
  window.print();
}
