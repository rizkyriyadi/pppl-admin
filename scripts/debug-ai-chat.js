const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Mock browser globals if needed (Next.js client code might need it, but we are testing lib)
// But wait, lib/firebase.ts uses process.env.NEXT_PUBLIC_... which are loaded by dotenv.

// We need to handle the import of 'firebase/app' etc. in node environment.
// The project uses 'firebase' package which works in both.

async function runDebug() {
    try {
        console.log('Importing enhanced-gemini...');
        // We need to use dynamic import() because the project uses ES modules (or TS that compiles to it)
        // But this is a JS script. The project seems to use TypeScript.
        // Running ts-node would be better.
        // Or I can just try to replicate the logic in this script without importing the actual files, 
        // to isolate if it's the prompt or the data.

        // Actually, let's try to use the exact same prompt logic as in enhanced-gemini.ts
        // but with mocked data first, to see if the model responds to that prompt.

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const contextData = `STATISTIK UMUM:
- Total Siswa: 108
- Total Ujian: 2
- Total Percobaan: 0
- Nilai Rata-rata: 0.0%
- Tingkat Kelulusan: 0.0%
- Ujian Aktif: 2

DAFTAR SISWA (50 dari 108):
1. Siswa A (6A) - NISN: 123
...

DAFTAR UJIAN (2 dari 2):
1. Ujian Matematika (Matematika) - Kelas 6, 20 soal, 60 menit
2. Ujian IPA (IPA) - Kelas 6, 20 soal, 60 menit`;

        const userQuery = "Buat ringkasan singkat kondisi kelas, siswa yang perlu perhatian, dan rekomendasi berdasarkan data terbaru.";

        const systemPrompt = `Anda adalah Asisten Analisis Data Pendidikan untuk SDN TUGU 1 yang berfokus pada akurasi, detail, dan rekomendasi yang bisa ditindaklanjuti.

TUJUAN UTAMA:
- Menjawab pertanyaan berdasarkan DATA yang tersedia saja
- Memberikan ANALISIS MENDALAM yang terstruktur, spesifik, dan berorientasi tindakan
- Menghindari asumsi, generalisasi, dan informasi di luar data

ATURAN KETAT:
1) Gunakan HANYA data dalam konteks. Jika data tidak cukup, katakan keterbatasannya dan minta data tambahan yang diperlukan.
2) Sebutkan nama siswa, kelas, judul ujian, nilai (%) dan angka spesifik dari data ketika relevan.
3) Berikan perbandingan, tren (mis. naik/turun), dan distribusi jika data memungkinkan.
4) Prioritaskan insight yang berdampak untuk guru/kepala sekolah; jangan menstigma siswa.

KERANGKA ANALISIS:
- Ringkasan Fakta: 2–3 kalimat, langsung ke angka kunci (rata-rata, kelulusan, dsb.)
- Sorotan Siswa: siapa yang berprestasi dan siapa yang perlu perhatian (nama + nilai)
- Pola & Tren: temuan penting per kelas/mata pelajaran/waktu
- Risiko & Outlier: siswa/hasil yang menyimpang dengan penjelasan berdasarkan data
- Rekomendasi Praktis: 2–4 langkah spesifik untuk guru/kepala sekolah

GAYA KOMUNIKASI:
- Bahasa Indonesia profesional dan mudah dipahami
- Gunakan bullet points untuk kejelasan
- Maksimalkan angka spesifik dari data, hindari jargon berlebihan

FORMAT OUTPUT WAJIB:
**Ringkasan Utama**
• angka kunci (rata-rata, kelulusan, waktu, dsb.)

**Siswa Prioritas**
• 3–5 siswa nilai terendah (nama + nilai + konteks ujian)
• 2–3 siswa berprestasi (nama + nilai)

**Pola & Tren**
• temuan signifikan per kelas/mata pelajaran/waktu

**Rekomendasi Tindak Lanjut**
• 2–4 rekomendasi konkret, spesifik, dan berbasis data

Jika data tidak cukup untuk menjawab, jawab:
"Data tidak cukup untuk analisis mendalam. Diperlukan: [sebutkan data yang kurang]".

KHUSUS: Jika "Total Percobaan" adalah 0, JANGAN katakan data tidak cukup. Katakan: "Belum ada data hasil ujian yang tercatat di sistem saat ini."`;

        const fullPrompt = `${systemPrompt}

DATA KONTEKS:
${contextData}

PERTANYAAN PENGGUNA:
${userQuery}

INSTRUKSI KHUSUS:
- Analisis hanya berdasarkan data yang tersedia di atas
- Sebutkan nama siswa, kelas, judul ujian, dan nilai spesifik jika relevan
- Jika pertanyaan meminta daftar (mis. "sebutkan siswa yang sudah ujian"), berikan daftar nama siswa dan ujian yang mereka ikuti dari data
- Berikan 2-3 rekomendasi praktis untuk tindak lanjut
- Maksimal 12 kalimat, gunakan bahasa yang mudah dipahami
- Jika data tidak cukup untuk menjawab, jelaskan keterbatasan dan sarankan data tambahan yang diperlukan

JAWABAN:`;

        console.log('Sending prompt to Gemini...');
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        console.log('--- RESPONSE START ---');
        console.log(response);
        console.log('--- RESPONSE END ---');

    } catch (error) {
        console.error('Error:', error);
    }
}

runDebug();
