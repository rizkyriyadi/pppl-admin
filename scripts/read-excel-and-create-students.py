#!/usr/bin/env python3
"""
Script untuk membaca file Excel dengan daftar siswa dan generate script Node.js
untuk clear database dan input data siswa baru dengan password yang sesuai.
"""

import openpyxl
import json
from pathlib import Path

def read_excel_file():
    """Membaca file Excel dan extract data siswa"""
    excel_path = Path(__file__).parent.parent / "DAFTAR SISWA KELAS 6 SDN TUGU 1.xlsx"
    
    if not excel_path.exists():
        print(f"File tidak ditemukan: {excel_path}")
        return None
    
    workbook = openpyxl.load_workbook(excel_path)
    worksheet = workbook.active
    
    students = []
    
    # Skip header row (row 1)
    for row in list(worksheet.iter_rows(min_row=2, values_only=False)):
        # Get cell values
        no_cell = row[0].value
        nama_cell = row[1].value
        kelas_cell = row[2].value
        nisn_cell = row[3].value
        
        # Skip if no number (empty row) or if it's the header row
        if no_cell is None or no_cell == "NO":
            continue
            
        # Skip if nama is "NAMA" (header row check)
        if nama_cell == "NAMA":
            continue
        
        # Extract data
        nama = str(nama_cell).strip() if nama_cell else ""
        kelas = str(kelas_cell).strip() if kelas_cell else ""
        nisn = str(nisn_cell).strip() if nisn_cell else ""
        
        if not nama or not nisn:
            continue
        
        # Extract first name for password (lowercase)
        first_name = nama.split()[0].lower()
        
        # Get last 4 digits of NISN
        last_4_nisn = nisn[-4:] if len(nisn) >= 4 else nisn
        
        # Create password
        password = f"{first_name}{last_4_nisn}"
        
        student = {
            "no": no_cell,
            "nama": nama,
            "kelas": kelas,
            "nisn": nisn,
            "password": password,
            "email": f"{first_name.replace('.', '')}.{nisn[-4:]}@students.pppl.id"
        }
        
        students.append(student)
    
    return students

def generate_node_script(students):
    """Generate Node.js script untuk clear data dan input siswa baru"""
    
    script = '''const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
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
    privateKey: privateKey.replace(/\\\\n/g, '\\n'),
  }),
});

const db = getFirestore(app);
const auth = getAuth(app);

const studentsData = ''' + json.dumps(students) + ''';

async function clearExistingData() {
  try {
    console.log('\\n=== CLEARING EXISTING DATA ===');
    
    // Delete all students from users collection
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    console.log(`Found ${studentsSnapshot.size} existing students`);
    
    let deletedCount = 0;
    for (const doc of studentsSnapshot.docs) {
      const studentData = doc.data();
      
      // Delete from Firebase Auth if email exists
      if (studentData.email) {
        try {
          await auth.deleteUser(doc.id);
          console.log(`Deleted auth user: ${studentData.email}`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            console.log(`Auth user not found for: ${studentData.email}`);
          } else {
            console.error(`Error deleting auth user ${studentData.email}:`, error.message);
          }
        }
      }
      
      // Delete from Firestore
      await db.collection('users').doc(doc.id).delete();
      deletedCount++;
      console.log(`Deleted student: ${studentData.name} (${studentData.nisn})`);
    }
    
    console.log(`\\nSuccessfully deleted ${deletedCount} students`);
    
  } catch (error) {
    console.error('Error clearing existing data:', error);
    throw error;
  }
}

async function createStudents() {
  try {
    console.log('\\n=== CREATING NEW STUDENTS ===');
    
    for (const student of studentsData) {
      try {
        // Create auth user
        const userRecord = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.nama,
          emailVerified: false,
        });
        
        console.log(`Created auth user: ${student.email} (UID: ${userRecord.uid})`);
        
        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          name: student.nama,
          email: student.email,
          nisn: student.nisn,
          class: student.kelas,
          role: 'student',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`✓ Student created: ${student.nama} - NISN: ${student.nisn}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Password: ${student.password}`);
        console.log(`  Kelas: ${student.kelas}`);
        
      } catch (error) {
        console.error(`✗ Error creating student ${student.nama}:`, error.message);
      }
    }
    
    console.log('\\n=== STUDENT CREATION COMPLETED ===');
    
  } catch (error) {
    console.error('Error creating students:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting student data migration...');
    console.log(`Total students to process: ${studentsData.length}`);
    
    await clearExistingData();
    await createStudents();
    
    console.log('\\n✓ All operations completed successfully!');
    
  } catch (error) {
    console.error('\\n✗ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
'''
    
    return script

def main():
    print("Reading Excel file...")
    students = read_excel_file()
    
    if not students:
        print("Tidak ada data siswa yang ditemukan")
        return
    
    print(f"\\n✓ Found {len(students)} students:")
    print("-" * 80)
    
    for i, student in enumerate(students, 1):
        print(f"{i}. {student['nama']:30} | {student['nisn']:15} | Kelas: {student['kelas']:5} | Password: {student['password']}")
    
    print("-" * 80)
    
    # Generate script
    script = generate_node_script(students)
    
    # Save script
    output_path = Path(__file__).parent / "populate-students-from-excel.js"
    with open(output_path, 'w') as f:
        f.write(script)
    
    print(f"\\n✓ Script generated: {output_path}")
    print("\\nTo run the script, execute:")
    print(f"  node {output_path}")

if __name__ == '__main__':
    main()
