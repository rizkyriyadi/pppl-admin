'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, User, Hash, GraduationCap, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { User as StudentUser } from '@/lib/types';

interface CreateStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentToEdit?: StudentUser | null;
}

export function CreateStudentModal({ isOpen, onClose, onSuccess, studentToEdit }: CreateStudentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        nisn: '',
        class: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (studentToEdit) {
            setFormData({
                name: studentToEdit.name,
                nisn: studentToEdit.nisn || '',
                class: studentToEdit.class || '',
                password: '',
            });
        } else {
            setFormData({
                name: '',
                nisn: '',
                class: '',
                password: '',
            });
        }
    }, [studentToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (studentToEdit) {
                // Update existing student
                await updateDoc(doc(db, 'users', studentToEdit.uid), {
                    name: formData.name,
                    nisn: formData.nisn,
                    class: formData.class,
                    updatedAt: serverTimestamp(),
                });
                toast.success('Student updated successfully');
            } else {
                // Create new student
                const response = await fetch('/api/create-student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        nisn: formData.nisn,
                        class: formData.class,
                        password: formData.password,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to create student');
                }
                toast.success('Student created successfully');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving student:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save student';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {studentToEdit ? 'Edit Student' : 'Add New Student'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {studentToEdit ? 'Update student information' : 'Create a new student account'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="e.g., Ahmad Rizki"
                                    required
                                />
                            </div>
                        </div>

                        {/* NISN Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                NISN
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.nisn}
                                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter NISN"
                                    required
                                    disabled={!!studentToEdit}
                                />
                            </div>
                            {!studentToEdit && (
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                                    This will be used as the login username
                                </p>
                            )}
                        </div>

                        {/* Class Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                Class
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <GraduationCap className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.class}
                                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="e.g., 6A"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        {!studentToEdit && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Min. 6 characters"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-2 focus:ring-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all focus:ring-2 focus:ring-blue-500/50 shadow-sm shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    {studentToEdit ? 'Save Changes' : 'Create Student'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
