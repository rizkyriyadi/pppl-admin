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

async function deleteCollection(collectionName) {
  try {
    console.log(`\n=== DELETING COLLECTION: ${collectionName} ===`);
    
    const snapshot = await db.collection(collectionName).get();
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);
    
    if (snapshot.size === 0) {
      console.log(`No documents to delete in ${collectionName}`);
      return 0;
    }
    
    let deletedCount = 0;
    const batch = db.batch();
    let batchCount = 0;
    const batchSize = 100; // Firestore batch limit
    
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      batchCount++;
      
      if (batchCount === batchSize) {
        await batch.commit();
        deletedCount += batchCount;
        console.log(`Deleted ${deletedCount} documents...`);
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      deletedCount += batchCount;
    }
    
    console.log(`✓ Successfully deleted ${deletedCount} documents from ${collectionName}`);
    return deletedCount;
    
  } catch (error) {
    console.error(`✗ Error deleting collection ${collectionName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting data deletion...\n');
    
    const collections = ['exams', 'examAttempts', 'questions'];
    let totalDeleted = 0;
    
    for (const collectionName of collections) {
      const count = await deleteCollection(collectionName);
      totalDeleted += count;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✓ All operations completed successfully!`);
    console.log(`Total documents deleted: ${totalDeleted}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n✗ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
