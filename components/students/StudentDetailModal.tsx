'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, BookOpen, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import type { User as StudentUser } from '@/lib/types';
import { toast } from 'sonner';

interface StudentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: StudentUser | null;
}

interface ExamAttempt {
    id: string;
    examId: string;
    examTitle: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    startedAt: Timestamp;
    submittedAt: Timestamp;
    isPassed: boolean;
}

export function StudentDetailModal({ isOpen, onClose, student }: StudentDetailModalProps) {
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttempts = useCallback(async () => {
        if (!student) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'examAttempts'),
                where('studentId', '==', student.uid),
                orderBy('submittedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const attemptsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ExamAttempt[];

            setAttempts(attemptsData);
        } catch (error) {
            console.error('Error fetching attempts:', error);
            toast.error('Failed to fetch exam attempts');
        } finally {
            setLoading(false);
        }
    }, [student]);

    useEffect(() => {
        if (isOpen && student) {
            fetchAttempts();
        } else {
            setAttempts([]);
        }
    }, [isOpen, student, fetchAttempts]);

    const handleDeleteAttempt = async (attemptId: string) => {
        if (!confirm('Are you sure you want to delete this exam attempt? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'examAttempts', attemptId));
            toast.success('Exam attempt deleted successfully');
            fetchAttempts();
        } catch (error) {
            console.error('Error deleting attempt:', error);
            toast.error('Failed to delete exam attempt');
        }
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                            {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">NISN:</span> {student.nisn}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">Class:</span> {student.class}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        Exam History
                    </h3>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                            <p className="text-gray-500">Loading exam history...</p>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                            <h4 className="text-gray-900 font-medium mb-1">No Exams Taken Yet</h4>
                            <p className="text-gray-500 text-sm">This student hasn&apos;t participated in any exams.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {attempts.map((attempt) => (
                                <div
                                    key={attempt.id}
                                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all group relative"
                                >
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDeleteAttempt(attempt.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Attempt"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pr-12">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {attempt.examTitle}
                                            </h4>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {attempt.submittedAt?.toDate().toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {attempt.submittedAt?.toDate().toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${attempt.score >= 75 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {attempt.score}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${attempt.isPassed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {attempt.isPassed ? 'Passed' : 'Failed'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="p-1.5 rounded-full bg-green-100 text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Correct</p>
                                                <p className="font-semibold text-gray-900">{attempt.correctAnswers}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="p-1.5 rounded-full bg-red-100 text-red-600">
                                                <XCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Incorrect</p>
                                                <p className="font-semibold text-gray-900">{attempt.incorrectAnswers}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                                                <AlertCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Total Questions</p>
                                                <p className="font-semibold text-gray-900">{attempt.totalQuestions}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
