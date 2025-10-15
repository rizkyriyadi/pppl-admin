import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeWithCustomPrompt(customPrompt: string, context: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Kamu adalah asisten analisis data untuk guru SD. Jawab pertanyaan berdasarkan DATA yang diberikan saja.

PENTING:
- HANYA analisis berdasarkan data yang tersedia
- JANGAN membuat asumsi atau data fiktif
- JANGAN memberikan saran umum yang tidak terkait data
- Fokus pada FAKTA dari data yang ada
- Gunakan angka dan nama yang SESUAI dengan data

DATA:
${context}

PERTANYAAN:
${customPrompt}

JAWABAN:
(Berikan jawaban singkat dan jelas dalam bahasa Indonesia sederhana, maksimal 5-7 kalimat. Sebutkan data spesifik seperti nama siswa dan nilai jika relevan.)`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing with custom prompt:', error);
    throw new Error('Gagal menganalisis data. Silakan coba lagi.');
  }
}

export async function analyzeExamData(data: {
  totalStudents: number;
  totalExams: number;
  totalAttempts: number;
  activeExams: number;
  averageScore: number;
  recentAttempts: Array<{
    studentName: string;
    studentClass: string;
    examTitle: string;
    score: number;
    isPassed: boolean;
    submittedAt: Date;
  }>;
}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Kamu adalah asisten analisis data untuk guru SD. Analisis DATA berikut dengan OBJEKTIF.

ATURAN PENTING:
- HANYA gunakan data yang tersedia di bawah
- JANGAN buat asumsi atau tambahkan informasi yang tidak ada
- Sebutkan NAMA SISWA dan NILAI SPESIFIK dari data
- Berikan saran PRAKTIS berdasarkan pola dalam data

DATA STATISTIK:
- Total Siswa: ${data.totalStudents}
- Total Ujian: ${data.totalExams}
- Total Percobaan Ujian: ${data.totalAttempts}
- Ujian Aktif: ${data.activeExams}
- Nilai Rata-rata: ${data.averageScore}%

HASIL UJIAN TERBARU (${data.recentAttempts.length} percobaan):
${data.recentAttempts.map((attempt, i) => `${i + 1}. ${attempt.studentName} (${attempt.studentClass}) - ${attempt.examTitle}: ${attempt.score}% (${attempt.isPassed ? 'Lulus' : 'Tidak Lulus'})`).join('\n')}

Berikan analisis dalam format:

**Kondisi Kelas Saat Ini**
(1-2 kalimat berdasarkan nilai rata-rata dan tingkat kelulusan)

**Yang Perlu Diperhatikan**
(Sebutkan 2-3 siswa dengan nilai terendah dari data di atas dan nilai mereka)

**Saran Tindakan**
(2-3 saran konkret berdasarkan data ini, misalnya fokus pada siswa tertentu atau mata pelajaran tertentu)

Gunakan bahasa sederhana. Maksimal 10 kalimat total.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing data with Gemini:', error);
    throw new Error('Gagal menganalisis data. Silakan coba lagi.');
  }
}

export async function analyzeClassResults(results: Array<{
  studentName: string;
  studentClass: string;
  examTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  isPassed: boolean;
  submittedAt: Date;
}>) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const passRate = (results.filter(r => r.isPassed).length / results.length) * 100;
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;

    // Urutkan berdasarkan nilai dari terendah
    const sortedByScore = [...results].sort((a, b) => a.score - b.score);
    const lowestScorers = sortedByScore.slice(0, 5);
    const highestScorers = sortedByScore.slice(-3);

    const prompt = `Kamu adalah asisten analisis data untuk guru SD. Analisis hasil ujian ini berdasarkan DATA yang ada.

ATURAN KETAT:
- HANYA analisis siswa yang ada dalam daftar
- WAJIB sebutkan NAMA dan NILAI dari data
- JANGAN buat nama atau nilai fiktif
- Berikan saran yang SPESIFIK untuk siswa dalam data

STATISTIK KELAS:
- Total Siswa: ${results.length}
- Nilai Rata-rata: ${avgScore.toFixed(1)}%
- Tingkat Kelulusan: ${passRate.toFixed(1)}%
- Waktu Rata-rata: ${Math.floor(avgTime / 60)} menit

SISWA DENGAN NILAI TERENDAH:
${lowestScorers.map((r, i) => `${i + 1}. ${r.studentName} - ${r.score}% (${r.correctAnswers}/${r.totalQuestions} benar)`).join('\n')}

SISWA DENGAN NILAI TERTINGGI:
${highestScorers.map((r, i) => `${i + 1}. ${r.studentName} - ${r.score}% (${r.correctAnswers}/${r.totalQuestions} benar)`).join('\n')}

SEMUA SISWA (${Math.min(results.length, 20)} dari ${results.length}):
${results.slice(0, 20).map((r, i) => `${i + 1}. ${r.studentName} (${r.studentClass}) - ${r.examTitle}: ${r.score}% (${r.correctAnswers}/${r.totalQuestions} benar, ${Math.floor(r.timeSpent / 60)} menit)`).join('\n')}

Berikan analisis dalam format:

**Performa Kelas**
(1 kalimat tentang nilai rata-rata dan tingkat kelulusan berdasarkan angka di atas)

**Siswa yang Perlu Bantuan**
(Sebutkan 3-5 nama siswa dengan nilai terendah dari daftar di atas dan nilai mereka. Jelaskan kenapa perlu bantuan.)

**Siswa Berprestasi**
(Sebutkan nama siswa dengan nilai tertinggi dari daftar di atas)

**Rekomendasi Praktis**
(2 saran konkret untuk guru, misalnya: memberikan les tambahan untuk siswa tertentu)

Gunakan bahasa sederhana. Maksimal 12 kalimat total.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing class results:', error);
    throw new Error('Gagal menganalisis data. Silakan coba lagi.');
  }
}

export async function getExamInsights(examTitle: string, results: Array<{
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  isPassed: boolean;
}>) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const passRate = (results.filter(r => r.isPassed).length / results.length) * 100;
    const avgCorrect = results.reduce((sum, r) => sum + r.correctAnswers, 0) / results.length;
    const totalQuestions = results[0]?.totalQuestions || 0;
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;

    // Distribusi nilai
    const excellent = results.filter(r => r.score >= 90).length;
    const good = results.filter(r => r.score >= 75 && r.score < 90).length;
    const average = results.filter(r => r.score >= 60 && r.score < 75).length;
    const poor = results.filter(r => r.score < 60).length;

    const prompt = `Kamu adalah asisten analisis untuk guru SD. Analisis ujian "${examTitle}" berdasarkan DATA ini.

ATURAN:
- Fokus pada ANGKA dan FAKTA dari data
- JANGAN membuat kesimpulan yang tidak didukung data
- Berikan penilaian objektif tentang tingkat kesulitan

DATA UJIAN:
- Total Siswa: ${results.length} siswa
- Nilai Rata-rata: ${avgScore.toFixed(1)}%
- Tingkat Kelulusan: ${passRate.toFixed(1)}%
- Rata-rata Benar: ${avgCorrect.toFixed(1)} dari ${totalQuestions} soal
- Waktu Rata-rata: ${Math.floor(avgTime / 60)} menit

DISTRIBUSI NILAI:
- Sangat Baik (≥90%): ${excellent} siswa (${(excellent/results.length*100).toFixed(0)}%)
- Baik (75-89%): ${good} siswa (${(good/results.length*100).toFixed(0)}%)
- Cukup (60-74%): ${average} siswa (${(average/results.length*100).toFixed(0)}%)
- Kurang (<60%): ${poor} siswa (${(poor/results.length*100).toFixed(0)}%)

Berikan analisis dalam format:

**Tingkat Kesulitan Ujian**
(Berdasarkan nilai rata-rata ${avgScore.toFixed(1)}% dan tingkat kelulusan ${passRate.toFixed(1)}%, apakah ujian ini mudah, sedang, atau sulit? Jelaskan alasannya dengan data.)

**Kesimpulan**
(1-2 kalimat tentang hasil ujian berdasarkan distribusi nilai di atas)

**Saran untuk Guru**
(1-2 saran berdasarkan data, misalnya: perlu remedial untuk ${poor} siswa yang nilainya kurang)

Gunakan bahasa sederhana. Maksimal 8 kalimat total.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting exam insights:', error);
    throw new Error('Gagal menganalisis data. Silakan coba lagi.');
  }
}
