const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing required Firebase Admin environment variables');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

async function checkData() {
    try {
        const collections = ['users', 'exams', 'examAttempts', 'questions'];
        console.log('Checking Firestore Collections:');

        for (const colName of collections) {
            const snapshot = await db.collection(colName).get();
            console.log(`- ${colName}: ${snapshot.size} documents`);
        }
    } catch (error) {
        console.error('Error checking data:', error);
    }
}

checkData();
