const admin = require('firebase-admin');
const serviceAccount = require('./pppl-ede4b-firebase-adminsdk-fbsvc-af6cbefe26.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function upgradeUser(email) {
    try {
        const userRecord = await auth.getUserByEmail(email);
        console.log(`User found: ${userRecord.uid}`);

        const userRef = db.collection('users').doc(userRecord.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            await userRef.update({
                role: 'superadmin',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Successfully upgraded ${email} to superadmin.`);
        } else {
            console.log('User document not found in Firestore');
        }
    } catch (error) {
        console.error('Error upgrading user:', error);
    }
}

upgradeUser('admin@sdntugu1.sch.id');
