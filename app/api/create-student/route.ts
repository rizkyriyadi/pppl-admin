import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is properly initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not properly configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const { name, nisn, class: studentClass, password } = await request.json();

    // Validate required fields
    if (!name || !nisn || !studentClass || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create email from NISN
    const email = `${nisn}@student.sdntugu1.sch.id`;

    // Check if NISN already exists in Firestore
    const usersSnapshot = await adminDb
      .collection('users')
      .where('nisn', '==', nisn)
      .where('role', '==', 'student')
      .get();

    if (!usersSnapshot.empty) {
      return NextResponse.json(
        { error: `A student with NISN ${nisn} already exists` },
        { status: 409 }
      );
    }

    // Create user with Firebase Admin SDK (doesn't affect current session)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create Firestore document
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      role: 'student',
      name,
      email,
      nisn,
      class: studentClass,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Student created successfully',
        uid: userRecord.uid,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating student:', error);

    // Handle specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message?: string };
      
      if (firebaseError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'A student with this NISN already exists' },
          { status: 409 }
        );
      }

      if (firebaseError.code === 'auth/weak-password') {
        return NextResponse.json(
          { error: 'Password is too weak. Please use at least 6 characters.' },
          { status: 400 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to create student';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
