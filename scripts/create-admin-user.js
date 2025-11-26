const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
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
const auth = admin.auth();

const ADMIN_EMAIL = 'admin@sdntugu1.sch.id';
const ADMIN_PASSWORD = 'sdntugu1depok';

async function createOrUpdateAdmin() {
    try {
        console.log(`Setting up admin user: ${ADMIN_EMAIL}...`);

        let uid;

        try {
            const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
            console.log('User exists, updating password...');
            await auth.updateUser(userRecord.uid, {
                password: ADMIN_PASSWORD,
                emailVerified: true,
            });
            uid = userRecord.uid;
            console.log('Password updated.');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('User does not exist, creating...');
                const userRecord = await auth.createUser({
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASSWORD,
                    emailVerified: true,
                });
                uid = userRecord.uid;
                console.log('User created.');
            } else {
                throw error;
            }
        }

        // Update Firestore
        console.log('Updating Firestore user document...');
        await db.collection('users').doc(uid).set({
            email: ADMIN_EMAIL,
            role: 'admin',
            name: 'Admin SDN Tugu 1',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
        }, { merge: true });

        console.log('✅ Admin user setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up admin user:', error);
        process.exit(1);
    }
}

createOrUpdateAdmin().then(() => {
    process.exit(0);
});
