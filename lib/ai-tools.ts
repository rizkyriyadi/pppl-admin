import {
    collection,
    getDocs,
    query,
    where,
    limit,
    orderBy,
    getCountFromServer,
    Timestamp,
    type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import type { ExamAttempt, User } from './types';

// Helper to sanitize Firestore dates
const convertDates = (data: DocumentData): DocumentData => {
    const result = { ...data };
    for (const key in result) {
        if (result[key] instanceof Timestamp) {
            result[key] = result[key].toDate().toISOString(); // Convert to string for JSON serialization
        } else if (result[key]?.toDate && typeof result[key].toDate === 'function') {
            result[key] = result[key].toDate().toISOString();
        } else if (result[key] instanceof Date) {
            result[key] = result[key].toISOString();
        }
    }
    return result;
};

// --- Tool Implementations ---

export async function getSchoolStats() {
    try {
        const [studentsCount, examsCount, attemptsCount] = await Promise.all([
            getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student'))),
            getCountFromServer(collection(db, 'exams')),
            getCountFromServer(collection(db, 'examAttempts'))
        ]);

        // Fetch a sample for averages
        const recentAttemptsSnapshot = await getDocs(
            query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'), limit(50))
        );
        const recentAttempts = recentAttemptsSnapshot.docs.map(doc => doc.data() as ExamAttempt);

        const avgScore = recentAttempts.length > 0
            ? recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length
            : 0;

        const passRate = recentAttempts.length > 0
            ? (recentAttempts.filter(a => a.isPassed).length / recentAttempts.length) * 100
            : 0;

        return {
            totalStudents: studentsCount.data().count,
            totalExams: examsCount.data().count,
            totalAttempts: attemptsCount.data().count,
            averageScore: parseFloat(avgScore.toFixed(1)),
            passRate: parseFloat(passRate.toFixed(1)),
            sampleSize: recentAttempts.length
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { error: 'Failed to fetch statistics' };
    }
}

export async function searchStudents(args: { name?: string; className?: string }) {
    try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(studentsQuery);
        let students = snapshot.docs.map(doc => ({ ...convertDates(doc.data()) } as User));

        if (args.className) {
            students = students.filter(s => s.class?.toLowerCase().includes(args.className!.toLowerCase()));
        }

        if (args.name) {
            students = students.filter(s => s.name.toLowerCase().includes(args.name!.toLowerCase()));
        }

        return students.slice(0, 20).map(s => ({
            name: s.name,
            class: s.class,
            nisn: s.nisn,
            email: s.email
        }));
    } catch (error) {
        console.error('Error searching students:', error);
        return { error: 'Failed to search students' };
    }
}

export async function getExamResults(args: {
    studentName?: string;
    className?: string;
    examSubject?: string;
    limitCount?: number
}) {
    try {
        let attempts: DocumentData[] = [];

        // Optimization: If class is provided, query by class directly if possible or just fetch recent
        // Firestore limitation: cannot filter by multiple fields easily without index.
        // We'll fetch recent attempts and filter in memory for now, or use specific indexes if we knew them.
        // For safety, let's fetch a larger batch of recent attempts.

        const q = query(
            collection(db, 'examAttempts'),
            orderBy('submittedAt', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        attempts = snapshot.docs.map(doc => ({ ...convertDates(doc.data()) }));

        if (args.className) {
            attempts = attempts.filter(a => a.studentClass?.toLowerCase().includes(args.className!.toLowerCase()));
        }

        if (args.studentName) {
            attempts = attempts.filter(a => a.studentName.toLowerCase().includes(args.studentName!.toLowerCase()));
        }

        if (args.examSubject) {
            attempts = attempts.filter(a => a.examTitle.toLowerCase().includes(args.examSubject!.toLowerCase()));
        }

        const limitVal = args.limitCount || 10;

        // Format for AI consumption
        return attempts.slice(0, limitVal).map(a => ({
            student: a.studentName,
            class: a.studentClass,
            exam: a.examTitle,
            score: a.score,
            status: a.isPassed ? 'Lulus' : 'Tidak Lulus',
            date: a.submittedAt
        }));
    } catch (error) {
        console.error('Error getting exam results:', error);
        return { error: 'Failed to get exam results' };
    }
}

export async function getExamList() {
    try {
        const q = query(collection(db, 'exams'), where('isActive', '==', true));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                title: data.title,
                subject: data.subject,
                grade: data.grade,
                totalQuestions: data.totalQuestions
            };
        });
    } catch {
        return { error: 'Failed to fetch exam list' };
    }
}

export async function getStudentReport(args: { studentName: string; className?: string }) {
    try {
        const usersQ = query(collection(db, 'users'), where('role', '==', 'student'));
        const userSnapshot = await getDocs(usersQ);
        let matchedUsers = userSnapshot.docs.map(doc => ({ ...convertDates(doc.data()) } as User));

        if (args.className) {
            matchedUsers = matchedUsers.filter(u => u.class?.toLowerCase() === args.className?.toLowerCase());
        }

        matchedUsers = matchedUsers.filter(u => u.name.toLowerCase().includes(args.studentName.toLowerCase()));

        if (matchedUsers.length === 0) {
            return { message: "Siswa tidak ditemukan." };
        }

        const student = matchedUsers[0];

        const attemptsQ = query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'), limit(100));
        const attemptsSnap = await getDocs(attemptsQ);
        const allAttempts = attemptsSnap.docs.map(doc => doc.data() as ExamAttempt);

        const studentAttempts = allAttempts.filter(a =>
            a.studentName.toLowerCase() === student.name.toLowerCase()
        );

        if (studentAttempts.length === 0) {
            return {
                student: student.name,
                class: student.class,
                message: "Belum ada data ujian untuk siswa ini."
            };
        }

        const totalExams = studentAttempts.length;
        const averageScore = studentAttempts.reduce((sum, a) => sum + a.score, 0) / totalExams;
        const passed = studentAttempts.filter(a => a.isPassed).length;
        const processedAttempts = studentAttempts.map(a => ({
            exam: a.examTitle,
            score: a.score,
            date: a.submittedAt instanceof Timestamp ? a.submittedAt.toDate().toISOString() : a.submittedAt,
            status: a.isPassed ? "Lulus" : "Tidak Lulus"
        }));

        const bestExam = studentAttempts.reduce((prev, current) => (prev.score > current.score) ? prev : current);

        return {
            student: student.name,
            class: student.class,
            totalExams,
            averageScore: parseFloat(averageScore.toFixed(1)),
            passRate: `${((passed / totalExams) * 100).toFixed(0)}%`,
            highestScore: { exam: bestExam.examTitle, score: bestExam.score },
            recentHistory: processedAttempts.slice(0, 5)
        };

    } catch (error) {
        console.error('Error in student report:', error);
        return { error: 'Failed to generate student report' };
    }
}

// --- Tool Definitions for Gemini ---
import { SchemaType } from '@google/generative-ai';

export const tools = [
    {
        functionDeclarations: [
            {
                name: "get_school_stats",
                description: "Get general school statistics. Use this when asked about total students, average scores, or general performance overview.",
            },
            {
                name: "search_students",
                description: "Search for specific students. Use this to find a student's class or details.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Name of the student" },
                        className: { type: SchemaType.STRING, description: "Class name (e.g. '6A')" }
                    }
                }
            },
            {
                name: "get_exam_results",
                description: "Get exam results or grades. Use this to find who passed/failed, specific student scores, or class performance lists.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        studentName: { type: SchemaType.STRING, description: "Filter by student name" },
                        className: { type: SchemaType.STRING, description: "Filter by class name" },
                        examSubject: { type: SchemaType.STRING, description: "Filter by subject or exam title" },
                        limitCount: { type: SchemaType.NUMBER, description: "Max number of results to return (default 10)" }
                    }
                }
            },
            {
                name: "get_exam_list",
                description: "Get a list of active exams.",
            },
            {
                name: "get_student_report",
                description: "Get a detailed report for a specific student, including average score, highest score, and recent history.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        studentName: { type: SchemaType.STRING, description: "Name of the student" },
                        className: { type: SchemaType.STRING, description: "Class name (optional)" }
                    },
                    required: ["studentName"]
                }
            }
        ]
    }
];

export async function handleToolCall(functionName: string, args: Record<string, unknown>) {
    console.log(`[ToolCall] ${functionName}`, args);

    switch (functionName) {
        case "get_school_stats":
            return await getSchoolStats();
        case "search_students":
            return await searchStudents(args as { name?: string; className?: string });
        case "get_exam_results":
            return await getExamResults(args as { studentName?: string; className?: string; examSubject?: string; limitCount?: number });
        case "get_exam_list":
            return await getExamList();
        case "get_student_report":
            return await getStudentReport(args as { studentName: string; className?: string });
        default:
            throw new Error(`Unknown function: ${functionName}`);
    }
}
