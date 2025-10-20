const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
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
}

const db = admin.firestore();

async function updateExistingData() {
  try {
    console.log('Updating existing students data...');
    
    // Update students to add missing fields
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    
    for (const doc of studentsSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      if (data.isActive === undefined) {
        updates.isActive = true;
      }
      
      if (!data.updatedAt) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        console.log(`✓ Updated student: ${data.name}`);
      }
    }

    console.log('Updating existing exams data...');
    
    // Update exams to add missing fields
    const examsSnapshot = await db.collection('exams').get();
    
    for (const doc of examsSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      if (!data.subject) {
        updates.subject = data.title.includes('Matematika') ? 'Matematika' : 
                         data.title.includes('Bahasa Indonesia') ? 'Bahasa Indonesia' : 'Fisika';
      }
      
      if (data.grade === undefined) {
        updates.grade = 12;
      }
      
      if (data.totalQuestions === undefined) {
        // Count questions in subcollection
        const questionsSnapshot = await doc.ref.collection('questions').get();
        updates.totalQuestions = questionsSnapshot.size;
      }
      
      if (data.passingScore === undefined) {
        updates.passingScore = 70;
      }
      
      if (data.isActive === undefined) {
        updates.isActive = true;
      }
      
      if (!data.createdBy) {
        updates.createdBy = 'admin';
      }
      
      if (!data.updatedAt) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        console.log(`✓ Updated exam: ${data.title}`);
      }
    }

    console.log('✅ All existing data updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating existing data:', error);
  }
}

updateExistingData().then(() => {
  console.log('Update process completed');
  process.exit(0);
}).catch((error) => {
  console.error('Update process failed:', error);
  process.exit(1);
});