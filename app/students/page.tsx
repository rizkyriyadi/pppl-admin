'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { User } from '@/lib/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    class: '',
    password: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      const studentsData: User[] = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as User));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        // Update existing student
        await updateDoc(doc(db, 'users', editingStudent.uid), {
          name: formData.name,
          nisn: formData.nisn,
          class: formData.class,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new student - append @gmail.com to NISN for Firebase Auth
        const email = `${formData.nisn}@gmail.com`;

        // Check if NISN already exists in Firestore
        const nisnQuery = query(
          collection(db, 'users'),
          where('nisn', '==', formData.nisn),
          where('role', '==', 'student')
        );
        const nisnSnapshot = await getDocs(nisnQuery);

        if (!nisnSnapshot.empty) {
          alert(`A student with NISN ${formData.nisn} already exists. Please use a different NISN.`);
          return;
        }

        let userCredential;
        let firestoreDocCreated = false;

        try {
          // Create Firebase Auth user first
          userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            formData.password
          );

          // Create Firestore document with the user's UID as document ID
          // This ensures the document exists for security rules checking
          await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            role: 'student',
            name: formData.name,
            email: email,
            nisn: formData.nisn,
            class: formData.class,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          firestoreDocCreated = true;
        } catch (firestoreError) {
          console.error('Error creating Firestore document:', firestoreError);

          // If Firestore fails but Auth succeeded, we need to clean up the Auth user
          if (userCredential && !firestoreDocCreated) {
            try {
              await userCredential.user.delete();
              console.log('Cleaned up orphaned Auth user');
            } catch (deleteError) {
              console.error('Failed to delete orphaned Auth user:', deleteError);
            }
          }

          // Re-throw the error to be caught by outer catch
          throw firestoreError;
        }
      }

      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);

      // Handle specific Firebase Auth errors
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === 'auth/email-already-in-use') {
        alert(`A student with NISN ${formData.nisn} already exists.`);
      } else if (firebaseError.code === 'auth/weak-password') {
        alert('Password is too weak. Please use at least 6 characters.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        alert('Invalid NISN format. Please use a valid format (e.g., email address).');
      } else if (firebaseError.code === 'permission-denied' || firebaseError.message?.includes('permission')) {
        alert('Permission denied. Please contact administrator to update Firestore security rules.');
      } else {
        alert(firebaseError.message || 'Failed to save student. Please try again.');
      }
    }
  };

  const handleEdit = (student: User) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nisn: student.nisn || '',
      class: student.class || '',
      password: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (studentUid: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', studentUid));
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nisn: '',
      class: '',
      password: '',
    });
    setEditingStudent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Students Management</h1>
          <p className="text-slate-600 text-sm mt-1">Manage student accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  NISN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No students found. Add your first student to get started.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.uid} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {student.nisn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {student.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          student.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.uid)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Ahmad Rizki"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  NISN
                </label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter NISN"
                  required
                  disabled={!!editingStudent}
                />
                {!editingStudent && (
                  <p className="text-xs text-slate-500 mt-1">
                    This will be used as the login username
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Class
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 4A"
                  required
                />
              </div>

              {!editingStudent && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium
                           hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500
                           focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
