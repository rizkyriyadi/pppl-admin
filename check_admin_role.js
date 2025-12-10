const admin = require('firebase-admin');
const serviceAccount = require('./pppl-ede4b-firebase-adminsdk-fbsvc-af6cbefe26.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function checkUserRole(email) {
    try {
        const userRecord = await auth.getUserByEmail(email);
        console.log(`User found: ${userRecord.uid}`);

        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        if (userDoc.exists) {
            console.log('User Data:', userDoc.data());
        } else {
            console.log('User document not found in Firestore');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

checkUserRole('admin@sdntugu1.sch.id');
