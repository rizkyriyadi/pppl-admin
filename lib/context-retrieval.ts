import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  getCountFromServer,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { ExamAttempt, User, Exam, Question } from './types';

export interface ContextData {
  students?: User[];
  exams?: Exam[];
  examAttempts?: ExamAttempt[];
  questions?: Question[];
  summary: {
    totalStudents: number;
    totalExams: number;
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    activeExams: number;
  };
}

export interface RelevantContext {
  contextText: string;
  dataSize: number;
  sources: string[];
}

/**
 * Helper to convert Firestore data to typed objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertDates = (data: any): any => {
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    } else if (result[key]?.toDate) {
      result[key] = result[key].toDate();
    }
  }
  return result;
};

// ... (skipping to line 173)



/**
 * Analyzes user query to determine what data is most relevant
 */
export function analyzeQueryIntent(query: string): {
  needsStudentData: boolean;
  needsExamData: boolean;
  needsResultsData: boolean;
  needsQuestionData: boolean;
  isGeneralStats: boolean;
  specificFilters: {
    studentClass?: string;
    studentName?: string;
    examSubject?: string;
    timeRange?: 'recent' | 'all';
  };
} {
  const lowerQuery = query.toLowerCase();

  // Keywords for different data types
  const studentKeywords = ['siswa', 'murid', 'anak', 'kelas', 'nama'];
  const examKeywords = ['ujian', 'tes', 'soal', 'mata pelajaran', 'matematika', 'bahasa', 'ipa'];
  const resultsKeywords = ['nilai', 'skor', 'hasil', 'lulus', 'gagal', 'prestasi', 'sudah ujian', 'telah ujian', 'mengikuti ujian', 'performa'];
  const questionKeywords = ['pertanyaan', 'soal', 'jawaban', 'pilihan'];
  const statsKeywords = ['rata-rata', 'statistik', 'ringkasan', 'total', 'jumlah', 'persentase', 'analisis', 'kondisi kelas'];

  // Filters
  const classMatch = lowerQuery.match(/kelas\s*(\d+[a-z]?)/);
  const subjectMatch = lowerQuery.match(/(matematika|bahasa|ipa|pkn|ips)/);
  const timeMatch = lowerQuery.match(/(terbaru|baru-baru|minggu|bulan|hari)/);

  // Improved regex to handle "siswa bernama zahra" or just "bernama zahra"
  const nameMatch = lowerQuery.match(/(?:siswa|murid|anak|bernama)(?:\s+bernama)?\s+([a-zA-Z\s]{3,20})/);

  const needsResults = resultsKeywords.some(keyword => lowerQuery.includes(keyword));
  const needsStats = statsKeywords.some(keyword => lowerQuery.includes(keyword)) ||
    (lowerQuery.includes('bagaimana') && lowerQuery.includes('kelas'));

  return {
    needsStudentData: studentKeywords.some(keyword => lowerQuery.includes(keyword)),
    needsExamData: examKeywords.some(keyword => lowerQuery.includes(keyword)),
    needsResultsData: needsResults || needsStats, // Stats usually imply results
    needsQuestionData: questionKeywords.some(keyword => lowerQuery.includes(keyword)),
    isGeneralStats: needsStats && !classMatch && !nameMatch,
    specificFilters: {
      studentClass: classMatch ? classMatch[1] : undefined,
      studentName: nameMatch ? nameMatch[1].trim() : undefined,
      examSubject: subjectMatch ? subjectMatch[1] : undefined,
      timeRange: timeMatch ? 'recent' : 'all'
    }
  };
}

/**
 * Retrieves basic statistics efficiently
 */
async function getBasicStats() {
  try {
    const [studentsCount, examsCount, attemptsCount] = await Promise.all([
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student'))),
      getCountFromServer(collection(db, 'exams')),
      getCountFromServer(collection(db, 'examAttempts'))
    ]);

    // For average score and pass rate, we still need some data. 
    // We'll fetch a sample of recent attempts to estimate if total is large, 
    // or all if small (but we want to avoid fetching all).
    // For now, let's fetch last 100 attempts to calculate "recent" stats.
    const recentAttemptsSnapshot = await getDocs(
      query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'), limit(100))
    );

    const recentAttempts = recentAttemptsSnapshot.docs.map(doc => ({ ...convertDates(doc.data()) } as ExamAttempt));

    const totalAttemptsVal = attemptsCount.data().count;
    const avgScore = recentAttempts.length > 0
      ? recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length
      : 0;
    const passRate = recentAttempts.length > 0
      ? (recentAttempts.filter(a => a.isPassed).length / recentAttempts.length) * 100
      : 0;

    // Active exams
    const activeExamsSnapshot = await getDocs(query(collection(db, 'exams'), where('isActive', '==', true)));

    return {
      totalStudents: studentsCount.data().count,
      totalExams: examsCount.data().count,
      totalAttempts: totalAttemptsVal,
      averageScore: avgScore,
      passRate,
      activeExams: activeExamsSnapshot.size,
      recentAttempts // Return this to reuse
    };
  } catch (error) {
    console.error('Error fetching basic stats:', error);
    return {
      totalStudents: 0, totalExams: 0, totalAttempts: 0, averageScore: 0, passRate: 0, activeExams: 0, recentAttempts: []
    };
  }
}

/**
 * Builds optimized context based on query analysis
 */
export async function getRelevantContext(userQuery: string): Promise<RelevantContext> {
  const intent = analyzeQueryIntent(userQuery);
  const stats = await getBasicStats();

  const contextParts: string[] = [];
  const sources: string[] = [];

  // 1. Always include Summary Stats
  contextParts.push(`STATISTIK UMUM (Berdasarkan ${stats.recentAttempts.length} percobaan terbaru):
- Total Siswa: ${stats.totalStudents}
- Total Ujian: ${stats.totalExams}
- Total Percobaan: ${stats.totalAttempts}
- Nilai Rata-rata: ${stats.averageScore.toFixed(1)}%
- Tingkat Kelulusan: ${stats.passRate.toFixed(1)}%
- Ujian Aktif: ${stats.activeExams}`);
  sources.push('summary_stats');

  // 2. Student Data (Only if needed)
  if (intent.needsStudentData) {
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));

    const studentsSnapshot = await getDocs(studentsQuery);
    let students = studentsSnapshot.docs.map(doc => ({ ...convertDates(doc.data()) } as User));

    if (intent.specificFilters.studentClass) {
      students = students.filter(s => s.class?.toLowerCase().includes(intent.specificFilters.studentClass!));
    }

    if (intent.specificFilters.studentName) {
      const queryName = intent.specificFilters.studentName.toLowerCase();
      students = students.filter(s => s.name.toLowerCase().includes(queryName));
    }

    if (students.length > 0) {
      const studentList = students.slice(0, 50).map((s, i) =>
        `${i + 1}. ${s.name} (${s.class || '-'}) - NISN: ${s.nisn || '-'}`
      ).join('\n');
      contextParts.push(`DAFTAR SISWA RELEVAN (${Math.min(students.length, 50)} dari ${students.length}):\n${studentList}`);
      sources.push('students');
    } else if (intent.specificFilters.studentName) {
      contextParts.push(`PENCARIAN SISWA: Tidak ditemukan siswa dengan nama yang mengandung "${intent.specificFilters.studentName}".`);
      sources.push('students_empty');
    }
  }

  // 3. Exam Data (Only if needed)
  if (intent.needsExamData) {
    const examsSnapshot = await getDocs(collection(db, 'exams'));
    let exams = examsSnapshot.docs.map(doc => ({ ...convertDates(doc.data()) } as Exam));

    if (intent.specificFilters.examSubject) {
      exams = exams.filter(e => e.subject.toLowerCase().includes(intent.specificFilters.examSubject!));
    }

    const examList = exams.slice(0, 20).map((e, i) =>
      `${i + 1}. ${e.title} (${e.subject}) - Kelas ${e.grade}`
    ).join('\n');

    contextParts.push(`DAFTAR UJIAN (${Math.min(exams.length, 20)} dari ${exams.length}):\n${examList}`);
    sources.push('exams');
  }

  // 4. Results/Attempts Data (The heavy part)
  if (intent.needsResultsData) {
    let attempts: ExamAttempt[] = [];

    // If specific filter exists, try to query specifically
    if (intent.specificFilters.studentClass) {
      const q = query(
        collection(db, 'examAttempts'),
        where('studentClass', '==', intent.specificFilters.studentClass.toUpperCase()), // Try exact match first
        limit(50)
      );
      const snap = await getDocs(q);
      // If empty, maybe case mismatch, but let's trust the query for now or fall back to recent
      if (!snap.empty) {
        attempts = snap.docs.map(doc => ({ ...convertDates(doc.data()) } as ExamAttempt));
      } else {
        // Fallback: filter from recent stats if query failed (e.g. formatting)
        attempts = stats.recentAttempts.filter(a =>
          a.studentClass?.toLowerCase().includes(intent.specificFilters.studentClass!)
        );
      }
    } else if (intent.specificFilters.studentName) {
      // Client-side filter on recent attempts for name (since we can't easily query substring)
      attempts = stats.recentAttempts.filter(a =>
        a.studentName.toLowerCase().includes(intent.specificFilters.studentName!)
      );
    } else {
      // General results query: Use the recent attempts we already fetched
      attempts = stats.recentAttempts;
    }

    if (attempts.length > 0) {
      const resultsList = attempts
        .sort((a, b) => b.score - a.score) // Sort by score for better context? Or time? Let's do time.
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 30)
        .map((a, i) =>
          `${i + 1}. ${a.studentName} (${a.studentClass}) - ${a.examTitle}: ${a.score}%`
        ).join('\n');

      contextParts.push(`SAMPEL HASIL UJIAN (${Math.min(attempts.length, 30)} data relevan):\n${resultsList}`);
      sources.push('examAttempts');
    } else {
      contextParts.push("BELUM ADA DATA HASIL UJIAN YANG COCOK DENGAN KRITERIA.");
    }
  }

  const contextText = contextParts.join('\n\n');
  return {
    contextText,
    dataSize: contextText.length,
    sources
  };
}

// Keep these for backward compatibility if needed, but they are largely replaced by dynamic logic
export function chunkContext(context: string, maxChunkSize: number = 8000): string[] {
  if (context.length <= maxChunkSize) return [context];
  const chunks: string[] = [];
  let currentChunk = '';
  context.split('\n\n').forEach(section => {
    if (currentChunk.length + section.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = section;
    }
  });
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export function summarizeContext(context: ContextData): string {
  // Legacy function, might not be needed with new logic but keeping to avoid breakages
  // Safely handle undefined arrays
  const attempts = context.examAttempts || [];
  const students = context.students || [];

  if (attempts.length === 0) return "Belum ada data ujian untuk diringkas.";

  const topPerformers = [...attempts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const lowPerformers = [...attempts]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const subjectPerformance = attempts.reduce((acc, attempt) => {
    const subject = attempt.examTitle?.split(' ')[0] || 'Unknown';
    if (!acc[subject]) {
      acc[subject] = { total: 0, sum: 0, count: 0 };
    }
    acc[subject].sum += attempt.score;
    acc[subject].count += 1;
    acc[subject].total = acc[subject].sum / acc[subject].count;
    return acc;
  }, {} as Record<string, { total: number; sum: number; count: number }>);

  return `RINGKASAN DATA:

PERFORMA TERTINGGI:
${topPerformers.map((attempt, i) => `${i + 1}. ${attempt.studentName}: ${attempt.score}%`).join('\n')}

PERFORMA TERENDAH:
${lowPerformers.map((attempt, i) => `${i + 1}. ${attempt.studentName}: ${attempt.score}%`).join('\n')}

PERFORMA PER MATA PELAJARAN:
${Object.entries(subjectPerformance).map(([subject, data]) =>
    `${subject}: ${data.total.toFixed(1)}% (${data.count} percobaan)`
  ).join('\n')}

DISTRIBUSI KELAS:
${Array.from(new Set(students.map(s => s.class))).map(cls =>
    `${cls}: ${students.filter(s => s.class === cls).length} siswa`
  ).join('\n')}`;
}

// Re-export getFullContext but optimized (or deprecated)
// We'll implement a lightweight version just in case something calls it
export async function getFullContext(): Promise<ContextData> {
  const stats = await getBasicStats();
  // Return empty arrays for heavy data to prevent massive reads
  return {
    students: [],
    exams: [],
    examAttempts: stats.recentAttempts,
    questions: [],
    summary: {
      totalStudents: stats.totalStudents,
      totalExams: stats.totalExams,
      totalAttempts: stats.totalAttempts,
      averageScore: stats.averageScore,
      passRate: stats.passRate,
      activeExams: stats.activeExams
    }
  };
}