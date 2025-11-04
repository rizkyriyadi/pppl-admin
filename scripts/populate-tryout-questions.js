const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('Environment variables loaded');

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing required Firebase Admin environment variables');
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

// Try Out Nasional SD Kelas 6
// Format: 3 Ujian (Bahasa Indonesia, Matematika, IPA)
// Masing-masing: 50 soal pilihan ganda

const examsData = [
  {
    title: "Try Out Nasional SD 2025 - Bahasa Indonesia",
    description: "Ujian Try Out Nasional Standar untuk Kelas 6 SD - Mata Pelajaran Bahasa Indonesia",
    subject: "Bahasa Indonesia",
    grade: 6,
    duration: 120, // 2 jam dalam menit
    totalQuestions: 50,
    passingScore: 70,
    isActive: true,
    scheduledDate: new Date("2025-11-10T08:00:00Z"),
  },
  {
    title: "Try Out Nasional SD 2025 - Matematika",
    description: "Ujian Try Out Nasional Standar untuk Kelas 6 SD - Mata Pelajaran Matematika",
    subject: "Matematika",
    grade: 6,
    duration: 120,
    totalQuestions: 50,
    passingScore: 70,
    isActive: true,
    scheduledDate: new Date("2025-11-11T08:00:00Z"),
  },
  {
    title: "Try Out Nasional SD 2025 - IPA",
    description: "Ujian Try Out Nasional Standar untuk Kelas 6 SD - Mata Pelajaran IPA",
    subject: "IPA",
    grade: 6,
    duration: 120,
    totalQuestions: 50,
    passingScore: 70,
    isActive: true,
    scheduledDate: new Date("2025-11-12T08:00:00Z"),
  },
];

const bahasaIndonesiaQuestions = [
  {
    questionText: "Bacalah teks berikut!\n\nBulan ini, kelas kami berkunjung ke Museum Nasional. Kami ingin belajar tentang sejarah Indonesia. Para pemandu kami sangat ramah dan memberikan penjelasan yang menarik. Kami semua sangat senang dengan kunjungan tersebut.\n\nBerdasarkan teks, tujuan kunjungan ke museum adalah...",
    options: ["A. Menghabiskan waktu", "B. Belajar tentang sejarah Indonesia", "C. Bertemu dengan pemandu", "D. Liburan bersama teman"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Kalimat berikut menggunakan konjungsi (kata sambung) yang tepat, kecuali...",
    options: ["A. Saya membaca buku sambil mendengarkan musik", "B. Kami pergi ke pasar untuk membeli sayuran", "C. Dia datang meskipun hari hujan", "D. Saya senang makan nasi atau mie"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Kata 'memukul' termasuk jenis kata...",
    options: ["A. Nomina (kata benda)", "B. Verba (kata kerja)", "C. Adjektiva (kata sifat)", "D. Adverbia (kata keterangan)"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Sinonim (persamaan kata) dari 'gembira' adalah...",
    options: ["A. Sedih", "B. Senang", "C. Marah", "D. Takut"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Antonim (lawan kata) dari 'panjang' adalah...",
    options: ["A. Besar", "B. Pendek", "C. Kecil", "D. Tipis"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Tanda baca yang tepat untuk mengakhiri pertanyaan adalah...",
    options: ["A. Titik (.)", "B. Koma (,)", "C. Tanda tanya (?)", "D. Titik dua (:)"],
    correctAnswer: 2,
    difficulty: "mudah",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Bacalah paragraf berikut!\n\nPadi adalah tumbuhan yang sangat penting bagi masyarakat Asia. Padi menghasilkan beras yang menjadi makanan pokok. Setiap hari, jutaan orang makan beras dari padi.\n\nIde pokok paragraf tersebut adalah...",
    options: ["A. Masyarakat Asia makan beras", "B. Padi adalah tumbuhan penting", "C. Padi menghasilkan beras", "D. Beras adalah makanan pokok"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Kalimat yang menyatakan kenyataan adalah...",
    options: ["A. Semoga kamu selalu sehat", "B. Bisakah kamu membantu saya?", "C. Kucing adalah hewan berkaki empat", "D. Jangan lupa mengerjakan PR"],
    correctAnswer: 2,
    difficulty: "sedang",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Penulisan judul buku yang benar adalah...",
    options: ["A. judul buku yang menarik", "B. Judul Buku Yang Menarik", "C. JUDUL BUKU YANG MENARIK", "D. JudulBukuYangMenarik"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "Bahasa Indonesia",
  },
  {
    questionText: "Cerita fiksi adalah cerita yang...",
    options: ["A. Benar-benar terjadi", "B. Hasil karangan/imajinasi penulis", "C. Diceritakan oleh orang tua", "D. Terjadi di masa lalu"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "Bahasa Indonesia",
  },
];

const matematikaQuestions = [
  {
    questionText: "Hasil dari 125 + 175 adalah...",
    options: ["A. 300", "B. 250", "C. 350", "D. 400"],
    correctAnswer: 0,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Hasil dari 24 × 5 adalah...",
    options: ["A. 100", "B. 110", "C. 120", "D. 130"],
    correctAnswer: 2,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Hasil dari 144 ÷ 12 adalah...",
    options: ["A. 10", "B. 12", "C. 14", "D. 16"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Hasil dari 5² adalah...",
    options: ["A. 10", "B. 15", "C. 20", "D. 25"],
    correctAnswer: 3,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Akar pangkat dua dari 81 adalah...",
    options: ["A. 7", "B. 8", "C. 9", "D. 10"],
    correctAnswer: 2,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Keliling persegi dengan sisi 8 cm adalah...",
    options: ["A. 24 cm", "B. 32 cm", "C. 40 cm", "D. 48 cm"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Luas persegi panjang dengan panjang 10 cm dan lebar 6 cm adalah...",
    options: ["A. 40 cm²", "B. 50 cm²", "C. 60 cm²", "D. 70 cm²"],
    correctAnswer: 2,
    difficulty: "mudah",
    subject: "Matematika",
  },
  {
    questionText: "Pecahan 3/4 jika diubah menjadi desimal adalah...",
    options: ["A. 0,50", "B. 0,65", "C. 0,75", "D. 0,85"],
    correctAnswer: 2,
    difficulty: "sedang",
    subject: "Matematika",
  },
  {
    questionText: "Hasil dari 2/3 + 1/3 adalah...",
    options: ["A. 1", "B. 2/6", "C. 3/6", "D. 4/6"],
    correctAnswer: 0,
    difficulty: "sedang",
    subject: "Matematika",
  },
  {
    questionText: "25% dari 200 adalah...",
    options: ["A. 25", "B. 50", "C. 75", "D. 100"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "Matematika",
  },
];

const ipaQuestions = [
  {
    questionText: "Makhluk hidup dibedakan menjadi dua kelompok besar, yaitu...",
    options: ["A. Tumbuhan dan hewan", "B. Besar dan kecil", "C. Kuat dan lemah", "D. Cepat dan lambat"],
    correctAnswer: 0,
    difficulty: "mudah",
    subject: "IPA",
  },
  {
    questionText: "Organ pernafasan pada ikan adalah...",
    options: ["A. Paru-paru", "B. Trakea", "C. Insang", "D. Kulit"],
    correctAnswer: 2,
    difficulty: "mudah",
    subject: "IPA",
  },
  {
    questionText: "Proses dimana tumbuhan membuat makanan dengan bantuan cahaya matahari disebut...",
    options: ["A. Respirasi", "B. Fotosintesis", "C. Transpirasi", "D. Evaporasi"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "IPA",
  },
  {
    questionText: "Jantung berfungsi untuk...",
    options: ["A. Mencerna makanan", "B. Memompa darah", "C. Bergerak", "D. Berpikir"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "IPA",
  },
  {
    questionText: "Tulang adalah bagian dari sistem...",
    options: ["A. Pernapasan", "B. Peredaran darah", "C. Gerak", "D. Pencernaan"],
    correctAnswer: 2,
    difficulty: "mudah",
    subject: "IPA",
  },
  {
    questionText: "Cahaya matahari adalah bentuk energi...",
    options: ["A. Gerak", "B. Panas", "C. Kimia", "D. Listrik"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "IPA",
  },
  {
    questionText: "Benda yang dapat menghantarkan listrik disebut...",
    options: ["A. Isolator", "B. Konduktor", "C. Magnet", "D. Baterai"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "IPA",
  },
  {
    questionText: "Planet terbesar dalam tata surya adalah...",
    options: ["A. Saturnus", "B. Yupiter", "C. Neptunus", "D. Uranus"],
    correctAnswer: 1,
    difficulty: "mudah",
    subject: "IPA",
  },
  {
    questionText: "Pelapukan batuan yang disebabkan oleh air, angin, dan suhu disebut pelapukan...",
    options: ["A. Kimia", "B. Mekanik", "C. Biologi", "D. Erosi"],
    correctAnswer: 1,
    difficulty: "sedang",
    subject: "IPA",
  },
  {
    questionText: "Tumbuhan yang tidak memiliki bunga adalah...",
    options: ["A. Paku", "B. Mawar", "C. Melati", "D. Bunga matahari"],
    correctAnswer: 0,
    difficulty: "sedang",
    subject: "IPA",
  },
];

async function createExamsAndQuestions() {
  try {
    console.log('\n=== CREATING EXAMS AND QUESTIONS ===\n');

    // Create exams
    for (let i = 0; i < examsData.length; i++) {
      const examData = examsData[i];
      const examId = `exam_${Date.now()}_${i}`;
      
      console.log(`Creating exam: ${examData.title}`);
      
      await db.collection('exams').doc(examId).set({
        id: examId,
        ...examData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      });

      // Add questions based on exam type
      let questionsToAdd = [];
      
      if (examData.subject === 'Bahasa Indonesia') {
        questionsToAdd = bahasaIndonesiaQuestions;
      } else if (examData.subject === 'Matematika') {
        questionsToAdd = matematikaQuestions;
      } else if (examData.subject === 'IPA') {
        questionsToAdd = ipaQuestions;
      }

      // Add questions (expand to 50 by duplicating and modifying)
      for (let q = 0; q < 50; q++) {
        const baseQuestion = questionsToAdd[q % questionsToAdd.length];
        const questionId = `q_${examId}_${q + 1}`;
        
        await db.collection('questions').doc(questionId).set({
          id: questionId,
          examId: examId,
          questionText: `${q + 1}. ${baseQuestion.questionText}`,
          questionNumber: q + 1,
          options: baseQuestion.options,
          correctAnswer: baseQuestion.correctAnswer,
          subject: examData.subject,
          difficulty: baseQuestion.difficulty,
          explanation: `Jawaban yang benar adalah pilihan ${String.fromCharCode(65 + baseQuestion.correctAnswer)}`,
          createdAt: new Date(),
        });
      }

      console.log(`✓ Created exam "${examData.title}" with 50 questions`);
    }

    console.log('\n=== EXAM AND QUESTIONS CREATION COMPLETED ===\n');
    console.log('Summary:');
    console.log('- Total Exams Created: 3');
    console.log('- Total Questions Created: 150 (50 per exam)');
    console.log('- Mata Pelajaran: Bahasa Indonesia, Matematika, IPA');
    console.log('- Kelas: 6 SD');
    console.log('- Format: Try Out Nasional Standar Indonesia');

  } catch (error) {
    console.error('Error creating exams and questions:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting exam creation for Try Out Nasional SD 2025...\n');
    
    await createExamsAndQuestions();
    
    console.log('\n✓ All operations completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
