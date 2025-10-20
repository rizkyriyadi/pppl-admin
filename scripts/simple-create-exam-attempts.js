const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('Environment variables loaded:');
console.log('FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID ? 'Set' : 'Not set');
console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'Set' : 'Not set');
console.log('FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'Set (length: ' + process.env.FIREBASE_ADMIN_PRIVATE_KEY.length + ')' : 'Not set');

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

async function createExamAttempts() {
  try {
    console.log('Creating exam attempts...');

    // Get students and exams first
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    const examsSnapshot = await db.collection('exams').get();

    const students = [];
    const exams = [];

    studentsSnapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });

    examsSnapshot.forEach(doc => {
      exams.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${students.length} students and ${exams.length} exams`);

    if (students.length === 0 || exams.length === 0) {
      console.log('No students or exams found. Please create them first.');
      return;
    }

    // Create exam attempts
    const attempts = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const exam = exams[Math.floor(Math.random() * exams.length)];
      
      // Generate random answers
      const answers = {};
      let correctAnswers = 0;
      const totalQuestions = exam.questions ? exam.questions.length : 5;
      
      for (let j = 0; j < totalQuestions; j++) {
        const selectedAnswer = Math.floor(Math.random() * 4);
        answers[j] = selectedAnswer;
        
        if (exam.questions && exam.questions[j] && exam.questions[j].correctAnswer === selectedAnswer) {
          correctAnswers++;
        } else if (!exam.questions) {
          // Random correct answers if no questions structure
          if (Math.random() > 0.5) correctAnswers++;
        }
      }

      const incorrectAnswers = totalQuestions - correctAnswers;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = score >= 70;

      const startedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
      const submittedAt = new Date(startedAt.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours after start
      const timeSpent = Math.floor((submittedAt - startedAt) / 1000); // in seconds

      const attempt = {
        id: `attempt_${Date.now()}_${i}`,
        examId: exam.id,
        examTitle: exam.title,
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        answers,
        score,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unanswered: 0,
        timeSpent,
        isPassed,
        startedAt: startedAt.toISOString(),
        submittedAt: submittedAt.toISOString(),
        status: 'completed'
      };

      attempts.push(attempt);
    }

    // Save to Firestore
    const batch = db.batch();
    attempts.forEach(attempt => {
      const docRef = db.collection('examAttempts').doc(attempt.id);
      batch.set(docRef, attempt);
    });

    await batch.commit();
    console.log(`Successfully created ${attempts.length} exam attempts`);

    // Show sample data
    console.log('\nSample exam attempt:');
    console.log(JSON.stringify(attempts[0], null, 2));

  } catch (error) {
    console.error('Error creating exam attempts:', error);
  }
}

createExamAttempts().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});