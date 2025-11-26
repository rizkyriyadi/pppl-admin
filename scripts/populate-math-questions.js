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

const examsData = [
  {
    title: "Matematika SD - TKA Matematika",
    description: "Ujian Matematika berisi 50 soal pilihan ganda",
    subject: "Matematika",
    grade: 6,
    duration: 120,
    totalQuestions: 50,
    passingScore: 70,
    isActive: true,
    scheduledDate: new Date(),
  },
];

const mathQuestions = [
  {
    questionText: "Hasil dari 4.178 + 2.539 adalah...",
    options: ["A. 6.617", "B. 6.707", "C. 6.717", "D. 7.717"],
    correctAnswer: 2,
    difficulty: "mudah"
  },
  {
    questionText: "Hasil dari 15 x (100 - 40) adalah...",
    options: ["A. 600", "B. 900", "C. 1.440", "D. 1.500"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Hasil dari 4,5 + 2,1 - 1,4 x 2 adalah...",
    options: ["A. 9,4", "B. 5,7", "C. 3,8", "D. 4,2"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Hasil dari 3,45 + (0,5 x 4) - 1,2 adalah...",
    options: ["A. 4,25", "B. 2,75", "C. 4,75", "D. 10,8"],
    correctAnswer: 0,
    difficulty: "sedang"
  },
  {
    questionText: "Hasil dari 10 : 0,5 + 2,25 adalalh…",
    options: ["A. 5,25", "B. 22,25", "C. 20,25", "D. 7,25"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Hasil dari (4,5 : 3) + (1,2 x 4) adalah...",
    options: ["A. 1,5", "B. 4,8", "C. 5,3", "D. 6,3"],
    correctAnswer: 3,
    difficulty: "sedang"
  },
  {
    questionText: "Bentuk pecahan biasa paling sederhana dari 0,25 adalah...",
    options: ["A. 25/100", "B. 5/20", "C. 1/4", "D. 1/5"],
    correctAnswer: 2,
    difficulty: "mudah"
  },
  {
    questionText: "Urutan pecahan berikut dari yang terbesar ke terkecil adalah: 0,8; 3/4 ; 65%; 1 1/5",
    options: ["A. 1 1/5 ; 0,8; 65%; 3/4", "B. 1 1/5 ; 0,8; 3/4 ; 65%", "C. 3/4 ; 0,8; 65%; 1 1/5", "D. 0,8; 3/4 ; 65%; 1 1/5"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Ibu membeli ¾ kg tepung. Kemudian ia membeli lagi 1½ kg. Jumlah total tepung yang dibeli Ibu adalah...",
    options: ["A. 1 4/6 kg", "B. 2 1/4 kg", "C. 1 3/4 kg", "D. 2 1/2 kg"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Ibu membeli 2 1/2 kg gula. Ibu menggunakan 1 1/4 kg gula untuk membuat kue. Sisa gula Ibu adalah...",
    options: ["A. 1 1/4 kg", "B. 1 1/2 kg", "C. 1 3/4 kg", "D. 3 3/4 kg"],
    correctAnswer: 0,
    difficulty: "sedang"
  },
  {
    questionText: "Di sebuah keranjang terdapat 50 buah mangga. Sebanyak 10% mangga busuk. Jumlah mangga yang tidak busuk adalah...",
    options: ["A. 5 buah", "B. 10 buah", "C. 40 buah", "D. 45 buah"],
    correctAnswer: 3,
    difficulty: "mudah"
  },
  {
    questionText: "Ibu membeli 60 buah jeruk. 20% dari jeruk itu diberikan kepada tetangga. Sisa jeruk Ibu adalah...",
    options: ["A. 12 buah", "B. 30 buah", "C. 40 buah", "D. 48 buah"],
    correctAnswer: 3,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah persegi panjang memiliki panjang 12 cm dan lebar 5 cm. Luas persegi panjang tersebut adalah...",
    options: ["A. 17 cm²", "B. 34 cm²", "C. 60 cm²", "D. 120 cm²"],
    correctAnswer: 2,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah segitiga memiliki alas 10 cm dan tinggi 8 cm. Luas segitiga tersebut adalah...",
    options: ["A. 18 cm²", "B. 40 cm²", "C. 80 cm²", "D. 160 cm²"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah bak mandi berbentuk kubus memiliki panjang sisi (rusuk) 50 cm. Volume bak mandi tersebut adalah...",
    options: ["A. 150 cm³", "B. 2.500 cm³", "C. 12.500 cm³", "D. 125.000 cm³"],
    correctAnswer: 3,
    difficulty: "sedang"
  },
  {
    questionText: "Jam menunjukkan pukul 04.00. Sudut terkecil yang dibentuk oleh kedua jarum jam adalah...",
    options: ["A. 30°", "B. 90°", "C. 120°", "D. 180°"],
    correctAnswer: 2,
    difficulty: "mudah"
  },
  {
    questionText: "4 jam + 15 menit - 30 detik = … detik.",
    options: ["A. 14.850", "B. 14.970", "C. 14.820", "D. 14.400"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "5 kuintal + 20 kg - 500 gram = … kg.",
    options: ["A. 520,5", "B. 520", "C. 519,5", "D. 520.500"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Suhu di sebuah kota pada pagi hari adalah -5°C. Siang hari, suhunya naik 18°C. Selisih suhu antara pagi dan siang hari adalah...",
    options: ["A. 13°C", "B. 18°C", "C. 23°C", "D. -13°C"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "Pada musim dingin, suhu udara di puncak gunung adalah -10°C. Menjelang siang, suhu naik 15°C. Suhu udara di puncak gunung pada siang hari adalah...",
    options: ["A. 5°C", "B. 25°C", "C. -5°C", "D. -25°C"],
    correctAnswer: 0,
    difficulty: "mudah"
  },
  {
    questionText: "Bangun ruang yang jaring-jaringnya tersusun dari 6 buah persegi yang sama besar adalah...",
    options: ["A. Balok", "B. Prisma Segitiga", "C. Limas Segiempat", "D. Kubus"],
    correctAnswer: 3,
    difficulty: "mudah"
  },
  {
    questionText: "Bangun datar yang memiliki 4 sudut siku-siku, sisi yang berhadapan sama panjang, dan dua simetri lipat adalah...",
    options: ["A. Persegi", "B. Belah Ketupat", "C. Trapesium", "D. Persegi Panjang"],
    correctAnswer: 3,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah bangun datar memiliki 4 sisi sama panjang, sudut-sudut yang berhadapan sama besar, dan kedua diagonalnya berpotongan tegak lurus. Bangun tersebut adalah...",
    options: ["A. Persegi", "B. Persegi panjang", "C. Belah ketupat", "D. Jajar genjang"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Sifat-sifat berikut dimiliki oleh bangun datar Jajar Genjang, kecuali...",
    options: ["A. Memiliki dua pasang sisi yang sejajar.", "B. Sudut yang berhadapan sama besar.", "C. Kedua diagonal berpotongan di titik tengah.", "D. Memiliki simetri lipat."],
    correctAnswer: 3,
    difficulty: "sedang"
  },
  {
    questionText: "Sebuah keran air mengisi bak mandi dengan debit 10 liter/menit. Jika volume bak mandi 120 liter, waktu yang dibutuhkan untuk mengisinya adalah...",
    options: ["A. 10 menit", "B. 12 menit", "C. 20 menit", "D. 1 jam 20 menit"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah kolam renang berbentuk persegi dengan luas 144 m². Keliling kolam renang tersebut adalah...",
    options: ["A. 12 m", "B. 36 m", "C. 48 m", "D. 144 m"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Sebuah lapangan berbentuk persegi panjang dengan ukuran panjang 30 meter dan lebar 20 meter. Jika Budi berlari mengelilingi lapangan tersebut sebanyak 2 kali, jarak yang ditempuh Budi adalah...",
    options: ["A. 100 meter", "B. 120 meter", "C. 200 meter", "D. 1.200 meter"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Luas sebuah segitiga adalah 60 cm². Jika panjang alasnya 12 cm, maka tinggi segitiga tersebut adalah...",
    options: ["A. 5 cm", "B. 10 cm", "C. 12 cm", "D. 15 cm"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Sebuah akuarium berbentuk balok memiliki volume 3.000 cm³. Jika panjangnya 20 cm dan lebarnya 10 cm, maka tinggi akuarium tersebut adalah...",
    options: ["A. 15 cm", "B. 20 cm", "C. 30 cm", "D. 150 cm"],
    correctAnswer: 0,
    difficulty: "sedang"
  },
  {
    questionText: "Besar sudut pelurus dari sudut 75° adalah...",
    options: ["A. 15°", "B. 25°", "C. 105°", "D. 115°"],
    correctAnswer: 2,
    difficulty: "mudah"
  },
  {
    questionText: "Lampu A menyala setiap 6 menit sekali dan lampu B menyala setiap 8 menit sekali. Jika kedua lampu menyala bersamaan pada pukul 10.00, pada pukul berapa kedua lampu akan menyala bersamaan lagi?",
    options: ["A. 10.10", "B. 10.24", "C. 10.48", "D. 11.00"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Ibu memiliki 24 kue coklat dan 30 kue keju. Ibu ingin memasukkan kue-kue tersebut ke dalam beberapa kotak dengan jumlah kue coklat dan kue keju yang sama di setiap kotak. Berapa jumlah kotak paling banyak yang bisa disiapkan Ibu?",
    options: ["A. 4", "B. 5", "C. 6", "D. 12"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Data tinggi badan (dalam cm) siswa kelas 5 adalah: 135, 138, 140, 138, 136, 135, 138, 137. Modus (nilai yang paling sering muncul) dari data tersebut adalah...",
    options: ["A. 135", "B. 136", "C. 137", "D. 138"],
    correctAnswer: 3,
    difficulty: "mudah"
  },
  {
    questionText: "Data nilai ulangan Sinta adalah sebagai berikut: 8, 7, 9, 8, 6, 10, 8, 7. Modus (nilai yang paling sering muncul) dari data tersebut adalah...",
    options: ["A. 7", "B. 8", "C. 9", "D. 10"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "Data berat badan (kg) 5 siswa adalah: 35, 32, 36, 38, 34. Median (nilai tengah) dari data tersebut adalah...",
    options: ["A. 32 kg", "B. 34 kg", "C. 35 kg", "D. 36 kg"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Nilai ulangan matematika 4 orang siswa adalah 70, 80, 90, dan 60. Rata-rata (mean) nilai keempat siswa tersebut adalah...",
    options: ["A. 70", "B. 75", "C. 80", "D. 300"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Ayah berlari sejauh 2 km. Adik berlari sejauh 500 meter. Selisih jarak yang ditempuh Ayah dan Adik adalah...",
    options: ["A. 300 m", "B. 1.500 m", "C. 2.500 m", "D. 3 km"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "Ayah pergi ke kantor selama 1 jam 45 menit. Jika ayah tiba di kantor pukul 08.15, pukul berapa ayah berangkat dari rumah?",
    options: ["A. 06.30", "B. 06.45", "C. 07.00", "D. 07.30"],
    correctAnswer: 0,
    difficulty: "sedang"
  },
  {
    questionText: "Ayah mengendarai mobil dengan kecepatan rata-rata 60 km/jam. Jika Ayah menempuh jarak 150 km, waktu yang dibutuhkan adalah...",
    options: ["A. 2 jam", "B. 2 jam 15 menit", "C. 2 jam 30 menit", "D. 3 jam"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Sebuah mobil menempuh jarak 180 km dalam waktu 3 jam. Kecepatan rata-rata mobil tersebut adalah...",
    options: ["A. 50 km/jam", "B. 60 km/jam", "C. 80 km/jam", "D. 90 km/jam"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "3 jam - 30 menit = ... menit",
    options: ["A. 150 menit", "B. 180 menit", "C. 210 menit", "D. 330 menit"],
    correctAnswer: 0,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah roda sepeda memiliki jari-jari 35 cm. Jika roda itu berputar 100 kali, jarak yang ditempuh adalah... meter. (Gunakan 𝝿 = 22/7)",
    options: ["A. 22 meter", "B. 110 meter", "C. 220 meter", "D. 22.000 meter"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Sebuah bus berangkat dari terminal setiap 15 menit, sedangkan bus lain berangkat setiap 20 menit. Jika pada pukul 07.00 mereka berangkat bersama, pukul berapa mereka akan berangkat bersama lagi?",
    options: ["A. 07.30", "B. 08.00", "C. 08.15", "D. 09.00"],
    correctAnswer: 1,
    difficulty: "sedang"
  },
  {
    questionText: "Sebuah toko menjual 24 roti setiap pagi. Pada siang hari terjual lagi 18 roti. Jumlah roti yang terjual hari itu adalah…",
    options: ["A. 32", "B. 40", "C. 42", "D. 48"],
    correctAnswer: 2,
    difficulty: "mudah"
  },
  {
    questionText: "Hasil dari 2.408 − 1.679 adalah…",
    options: ["A. 719", "B. 729", "C. 739", "D. 749"],
    correctAnswer: 1,
    difficulty: "mudah"
  },
  {
    questionText: "Ibu mempunyai 3 liter minyak. Ibu menggunakan 750 ml untuk memasak. Sisa minyak Ibu adalah…",
    options: ["A. 2,75 liter", "B. 2,5 liter", "C. 2,25 liter", "D. 1,75 liter"],
    correctAnswer: 0,
    difficulty: "sedang"
  },
  {
    questionText: "Panjang sisi sebuah persegi adalah 16 cm. Keliling persegi tersebut adalah…",
    options: ["A. 32 cm", "B. 48 cm", "C. 52 cm", "D. 64 cm"],
    correctAnswer: 3,
    difficulty: "mudah"
  },
  {
    questionText: "Sebuah balok memiliki panjang 12 cm, lebar 5 cm, dan tinggi 4 cm. Volume balok tersebut adalah…",
    options: ["A. 60 cm³", "B. 120 cm³", "C. 240 cm³", "D. 480 cm³"],
    correctAnswer: 3,
    difficulty: "sedang"
  },
  {
    questionText: "Hasil dari 3,6 × 2,5 adalah…",
    options: ["A. 6,9", "B. 7,0", "C. 8,5", "D. 9,0"],
    correctAnswer: 2,
    difficulty: "sedang"
  },
  {
    questionText: "Rata-rata nilai Matematika dari 5 siswa adalah 80. Jika 4 nilai siswa adalah 75, 80, 85, dan 90, maka nilai siswa kelima adalah…",
    options: ["A. 65", "B. 70", "C. 75", "D. 80"],
    correctAnswer: 1,
    difficulty: "sedang"
  }
];

async function createExamsAndQuestions() {
  try {
    console.log('\n=== CREATING EXAMS AND QUESTIONS ===\n');

    for (let i = 0; i < examsData.length; i++) {
      const examData = examsData[i];
      const examId = `exam_math_${Date.now()}`;
      
      console.log(`Creating exam: ${examData.title}`);
      
      await db.collection('exams').doc(examId).set({
        id: examId,
        ...examData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      });

      let questionsToAdd = mathQuestions;

      for (let q = 0; q < questionsToAdd.length; q++) {
        const baseQuestion = questionsToAdd[q];
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

      console.log(`✓ Created exam "${examData.title}" with ${questionsToAdd.length} questions`);
    }

    console.log('\n=== EXAM AND QUESTIONS CREATION COMPLETED ===\n');
    console.log('Summary:');
    console.log('- Total Exams Created: 1');
    console.log('- Total Questions Created: 50');
    console.log('- Mata Pelajaran: Matematika');
    console.log('- Kelas: 6 SD');

  } catch (error) {
    console.error('Error creating exams and questions:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting exam creation for Matematika SD...\n');
    
    await createExamsAndQuestions();
    
    console.log('\n✓ All operations completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
