import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('Environment variables loaded:');
console.log('FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID ? 'Set' : 'Not set');
console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'Set' : 'Not set');
console.log('FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? `Set (length: ${process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0})` : 'Not set');

// Import Firebase Admin after environment variables are loaded
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing required Firebase Admin environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

interface MockStudent {
  nisn: string;
  name: string;
  email: string;
  password: string;
  class: string;
  gender: 'Laki-laki' | 'Perempuan';
}

interface MockExam {
  title: string;
  description: string;
  duration: number;
  questions: MockQuestion[];
}

interface MockQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const mockStudents: MockStudent[] = [
  {
    nisn: '2024001001',
    name: 'Ahmad Rizki Pratama',
    email: 'ahmad.rizki.new@student.sch.id',
    password: 'student123',
    class: 'XII IPA 1',
    gender: 'Laki-laki'
  },
  {
    nisn: '2024001002',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza.new@student.sch.id',
    password: 'student123',
    class: 'XII IPA 1',
    gender: 'Perempuan'
  },
  {
    nisn: '2024001003',
    name: 'Budi Santoso',
    email: 'budi.santoso.new@student.sch.id',
    password: 'student123',
    class: 'XII IPA 2',
    gender: 'Laki-laki'
  },
  {
    nisn: '2024001004',
    name: 'Dewi Sartika',
    email: 'dewi.sartika.new@student.sch.id',
    password: 'student123',
    class: 'XII IPA 2',
    gender: 'Perempuan'
  },
  {
    nisn: '2024001005',
    name: 'Andi Wijaya',
    email: 'andi.wijaya.new@student.sch.id',
    password: 'student123',
    class: 'XII IPS 1',
    gender: 'Laki-laki'
  },
  {
    nisn: '2024001006',
    name: 'Maya Indira',
    email: 'maya.indira.new@student.sch.id',
    password: 'student123',
    class: 'XII IPS 1',
    gender: 'Perempuan'
  },
  {
    nisn: '2024001007',
    name: 'Reza Firmansyah',
    email: 'reza.firmansyah.new@student.sch.id',
    password: 'student123',
    class: 'XII IPS 2',
    gender: 'Laki-laki'
  },
  {
    nisn: '2024001008',
    name: 'Putri Maharani',
    email: 'putri.maharani.new@student.sch.id',
    password: 'student123',
    class: 'XII IPS 2',
    gender: 'Perempuan'
  },
  {
    nisn: '2024001009',
    name: 'Fajar Nugroho',
    email: 'fajar.nugroho.new@student.sch.id',
    password: 'student123',
    class: 'XII BAHASA',
    gender: 'Laki-laki'
  },
  {
    nisn: '2024001010',
    name: 'Rina Kusumawati',
    email: 'rina.kusumawati.new@student.sch.id',
    password: 'student123',
    class: 'XII BAHASA',
    gender: 'Perempuan'
  }
];

const mockExams: MockExam[] = [
  {
    title: 'Ujian Matematika Semester 1',
    description: 'Ujian matematika untuk semester 1 kelas XII',
    duration: 90,
    questions: [
      {
        question: 'Berapakah hasil dari 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      },
      {
        question: 'Berapakah hasil dari 5 × 3?',
        options: ['12', '15', '18', '20'],
        correctAnswer: 1
      },
      {
        question: 'Berapakah hasil dari 10 ÷ 2?',
        options: ['4', '5', '6', '7'],
        correctAnswer: 1
      },
      {
        question: 'Berapakah hasil dari 8 - 3?',
        options: ['4', '5', '6', '7'],
        correctAnswer: 1
      },
      {
        question: 'Berapakah hasil dari 3²?',
        options: ['6', '8', '9', '12'],
        correctAnswer: 2
      }
    ]
  },
  {
    title: 'Ujian Bahasa Indonesia',
    description: 'Ujian bahasa Indonesia untuk kelas XII',
    duration: 120,
    questions: [
      {
        question: 'Apa yang dimaksud dengan puisi?',
        options: ['Karya sastra berbentuk prosa', 'Karya sastra berbentuk syair', 'Karya sastra berbentuk drama', 'Karya sastra berbentuk novel'],
        correctAnswer: 1
      },
      {
        question: 'Siapa penulis novel "Laskar Pelangi"?',
        options: ['Pramoedya Ananta Toer', 'Andrea Hirata', 'Habiburrahman El Shirazy', 'Dee Lestari'],
        correctAnswer: 1
      },
      {
        question: 'Apa fungsi utama paragraf dalam sebuah teks?',
        options: ['Memperindah tulisan', 'Mengorganisir ide', 'Menambah halaman', 'Mempersulit pembaca'],
        correctAnswer: 1
      },
      {
        question: 'Apa yang dimaksud dengan majas metafora?',
        options: ['Perbandingan langsung', 'Perbandingan tidak langsung', 'Pengulangan kata', 'Pertanyaan retoris'],
        correctAnswer: 1
      },
      {
        question: 'Apa ciri utama teks argumentasi?',
        options: ['Berisi cerita', 'Berisi pendapat dan alasan', 'Berisi deskripsi', 'Berisi dialog'],
        correctAnswer: 1
      }
    ]
  },
  {
    title: 'Ujian Fisika',
    description: 'Ujian fisika untuk kelas XII IPA',
    duration: 100,
    questions: [
      {
        question: 'Apa satuan dari gaya dalam sistem SI?',
        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
        correctAnswer: 1
      },
      {
        question: 'Berapakah kecepatan cahaya dalam vakum?',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10⁷ m/s', '3 × 10⁹ m/s'],
        correctAnswer: 0
      },
      {
        question: 'Apa hukum Newton yang pertama?',
        options: ['F = ma', 'Hukum kelembaman', 'Aksi = Reaksi', 'Hukum gravitasi'],
        correctAnswer: 1
      },
      {
        question: 'Apa yang dimaksud dengan energi kinetik?',
        options: ['Energi karena posisi', 'Energi karena gerak', 'Energi karena panas', 'Energi karena listrik'],
        correctAnswer: 1
      },
      {
        question: 'Berapakah percepatan gravitasi bumi?',
        options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'],
        correctAnswer: 0
      }
    ]
  }
];

async function createMockData() {
  try {
    console.log('Starting mock data creation...');

    // Create students
    console.log('Creating students...');
    const studentIds: string[] = [];
    
    for (const student of mockStudents) {
      try {
        // Create Firebase Auth user
        const userRecord = await adminAuth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.name,
        });

        // Store student data in Firestore users collection with role field
        await adminDb.collection('users').doc(userRecord.uid).set({
          nisn: student.nisn,
          name: student.name,
          email: student.email,
          class: student.class,
          gender: student.gender,
          role: 'student',
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        studentIds.push(userRecord.uid);
        console.log(`✓ Created student: ${student.name}`);
      } catch (error) {
        console.error(`Error creating student ${student.name}:`, error);
      }
    }

    // Create exams
    console.log('Creating exams...');
    const examIds: string[] = [];
    
    for (const exam of mockExams) {
      try {
        const examRef = await adminDb.collection('exams').add({
          title: exam.title,
          description: exam.description,
          subject: exam.title.includes('Matematika') ? 'Matematika' : 
                   exam.title.includes('Bahasa Indonesia') ? 'Bahasa Indonesia' : 'Fisika',
          grade: 12,
          duration: exam.duration,
          totalQuestions: exam.questions.length,
          passingScore: 70,
          isActive: true,
          createdBy: 'admin',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        examIds.push(examRef.id);
        console.log(`✓ Created exam: ${exam.title}`);

        // Create questions for this exam
        for (let i = 0; i < exam.questions.length; i++) {
          const question = exam.questions[i];
          await adminDb.collection('exams').doc(examRef.id).collection('questions').add({
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            order: i + 1,
          });
        }

        console.log(`✓ Created ${exam.questions.length} questions for ${exam.title}`);
      } catch (error) {
        console.error(`Error creating exam ${exam.title}:`, error);
      }
    }

    // Create test results (exam attempts)
    console.log('Creating test results...');
    
    for (const studentId of studentIds) {
      for (const examId of examIds) {
        try {
          // Generate random but realistic results
          const totalQuestions = 5; // Each exam has 5 questions
          const correctAnswers = Math.floor(Math.random() * 4) + 2; // 2-5 correct answers
          const score = Math.round((correctAnswers / totalQuestions) * 100);
          const incorrectAnswers = totalQuestions - correctAnswers;
          const unanswered = 0; // Assume all questions are answered
          const timeSpent = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
          const isPassed = score >= 70;
          const status = isPassed ? 'passed' : 'failed';

          // Get student data for denormalization
          const studentDoc = await adminDb.collection('users').doc(studentId).get();
          const studentData = studentDoc.data();
          
          // Get exam data for denormalization
          const examDoc = await adminDb.collection('exams').doc(examId).get();
          const examData = examDoc.data();

          // Generate random answers as object with questionId keys
          const answers: { [questionId: string]: number } = {};
          for (let i = 0; i < totalQuestions; i++) {
            answers[`question_${i + 1}`] = Math.floor(Math.random() * 4);
          }

          // Create timestamps
          const now = new Date();
          const startedAt = new Date(now.getTime() - (timeSpent * 60 * 1000)); // Started timeSpent minutes ago

          await adminDb.collection('examAttempts').add({
            examId: examId,
            examTitle: examData?.title || 'Unknown Exam',
            studentId: studentId,
            studentName: studentData?.name || 'Unknown Student',
            studentClass: studentData?.class || 'Unknown Class',
            answers: answers,
            score: score,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
            unanswered: unanswered,
            timeSpent: timeSpent,
            isPassed: isPassed,
            startedAt: admin.firestore.Timestamp.fromDate(startedAt),
            submittedAt: admin.firestore.Timestamp.fromDate(now),
            status: status,
          });

          console.log(`✓ Created result for student ${studentData?.name || studentId} on exam ${examData?.title || examId} - Score: ${score}%`);
        } catch (error) {
          console.error(`Error creating result for student ${studentId}:`, error);
        }
      }
    }

    console.log('✅ Mock data creation completed!');
    console.log(`Created ${studentIds.length} students, ${examIds.length} exams, and ${studentIds.length * examIds.length} test results`);
    
  } catch (error) {
    console.error('Error creating mock data:', error);
  }
}

createMockData().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});