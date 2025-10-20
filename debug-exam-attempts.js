const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('Environment check:');
  console.log('FIREBASE_ADMIN_PROJECT_ID:', projectId ? 'Set' : 'Not set');
  console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', clientEmail ? 'Set' : 'Not set');
  console.log('FIREBASE_ADMIN_PRIVATE_KEY:', privateKey ? 'Set (length: ' + privateKey.length + ')' : 'Not set');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    console.error('Firebase Admin environment variables not found');
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkExamAttempts() {
  try {
    console.log('=== Checking examAttempts collection ===');
    const snapshot = await db.collection('examAttempts').limit(3).get();
    
    if (snapshot.empty) {
      console.log('No examAttempts found');
      return;
    }
    
    console.log(`Found ${snapshot.size} examAttempts documents:`);
    snapshot.forEach(doc => {
      console.log('\nDocument ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
      console.log('---');
    });

    // Check users collection too
    console.log('\n=== Checking users collection (students) ===');
    const usersSnapshot = await db.collection('users').where('role', '==', 'student').limit(3).get();
    
    if (usersSnapshot.empty) {
      console.log('No students found');
    } else {
      console.log(`Found ${usersSnapshot.size} student documents:`);
      usersSnapshot.forEach(doc => {
        console.log('\nStudent ID:', doc.id);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
        console.log('---');
      });
    }

    // Check exams collection
    console.log('\n=== Checking exams collection ===');
    const examsSnapshot = await db.collection('exams').limit(3).get();
    
    if (examsSnapshot.empty) {
      console.log('No exams found');
    } else {
      console.log(`Found ${examsSnapshot.size} exam documents:`);
      examsSnapshot.forEach(doc => {
        console.log('\nExam ID:', doc.id);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkExamAttempts();