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

async function runDebug() {
    try {
        console.log('Fetching all students...');
        const usersSnap = await db.collection('users').where('role', '==', 'student').get();
        const students = usersSnap.docs.map(doc => doc.data());
        console.log(`Found ${students.length} students.`);

        // Test Regex Logic
        const userQuery = "ada kah siswa bernama zahra? berapa ya nisn dia";
        const lowerQuery = userQuery.toLowerCase();
        // Regex from context-retrieval.ts
        const nameMatch = lowerQuery.match(/(?:siswa|bernama)\s+([a-zA-Z\s]{3,20})/);

        console.log('\nRegex Test:');
        console.log(`Query: "${userQuery}"`);

        let extractedName = null;
        if (nameMatch) {
            extractedName = nameMatch[1].trim();
            console.log(`Extracted Name: "${extractedName}"`);
        } else {
            console.log('Regex failed to extract name.');
        }

        if (extractedName) {
            console.log(`\nSearching for students matching "${extractedName}"...`);
            const matches = students.filter(s => s.name.toLowerCase().includes(extractedName));

            if (matches.length > 0) {
                console.log(`Found ${matches.length} matches:`);
                matches.forEach(s => console.log(`- ${s.name} (Class: ${s.class}, NISN: ${s.nisn})`));
            } else {
                console.log('No matches found.');

                // Debug: Print first 10 names to see format
                console.log('\nSample student names in DB:');
                students.slice(0, 10).forEach(s => console.log(`- ${s.name}`));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

runDebug();
