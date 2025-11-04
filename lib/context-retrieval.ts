import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { ExamAttempt, User, Exam, Question } from './types';

export interface ContextData {
  students: User[];
  exams: Exam[];
  examAttempts: ExamAttempt[];
  questions: Question[];
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
 * Retrieves comprehensive context data from Firestore
 */
export async function getFullContext(): Promise<ContextData> {
  try {
    // Fetch all collections in parallel
    const [studentsSnapshot, examsSnapshot, attemptsSnapshot, questionsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'exams')),
      getDocs(query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'), limit(100))),
      getDocs(collection(db, 'questions'))
    ]);

    const students = studentsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          role: data.role,
          name: data.name,
          email: data.email,
          nisn: data.nisn,
          class: data.class,
          isActive: data.isActive,
          createdAt: data.createdAt instanceof Date ? data.createdAt : 
                    (data.createdAt?.toDate ? data.createdAt.toDate() : new Date()),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : 
                    (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date())
        } as User;
      })
      .filter(user => user.role === 'student');

    const exams = examsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        grade: data.grade,
        duration: data.duration,
        totalQuestions: data.totalQuestions,
        passingScore: data.passingScore,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt instanceof Date ? data.createdAt : 
                  (data.createdAt?.toDate ? data.createdAt.toDate() : new Date()),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : 
                  (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()),
        scheduledDate: data.scheduledDate instanceof Date ? data.scheduledDate : 
                      (data.scheduledDate?.toDate ? data.scheduledDate.toDate() : undefined)
      } as Exam;
    });
    
    const examAttempts = attemptsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        examId: data.examId,
        examTitle: data.examTitle,
        studentId: data.studentId,
        studentName: data.studentName,
        studentClass: data.studentClass,
        answers: data.answers,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        incorrectAnswers: data.incorrectAnswers,
        unanswered: data.unanswered,
        timeSpent: data.timeSpent,
        isPassed: data.isPassed,
        startedAt: data.startedAt instanceof Date ? data.startedAt : 
                  (data.startedAt?.toDate ? data.startedAt.toDate() : new Date()),
        submittedAt: data.submittedAt instanceof Date ? data.submittedAt : 
                    (data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date()),
        status: data.status
      } as ExamAttempt;
    });

    const questions = questionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        examId: data.examId,
        questionText: data.questionText,
        questionNumber: data.questionNumber,
        options: data.options,
        correctAnswer: data.correctAnswer,
        subject: data.subject,
        difficulty: data.difficulty,
        explanation: data.explanation,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt?.toDate()
      } as Question;
    });

    // Calculate summary statistics
    const totalStudents = students.length;
    const totalExams = exams.length;
    const totalAttempts = examAttempts.length;
    const averageScore = totalAttempts > 0 
      ? examAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts 
      : 0;
    const passRate = totalAttempts > 0 
      ? (examAttempts.filter(attempt => attempt.isPassed).length / totalAttempts) * 100 
      : 0;
    const activeExams = exams.filter(exam => exam.isActive).length;

    return {
      students,
      exams,
      examAttempts,
      questions,
      summary: {
        totalStudents,
        totalExams,
        totalAttempts,
        averageScore,
        passRate,
        activeExams
      }
    };
  } catch (error) {
    console.error('Error fetching full context:', error);
    throw new Error('Gagal mengambil data konteks');
  }
}

/**
 * Analyzes user query to determine what data is most relevant
 */
export function analyzeQueryIntent(query: string): {
  needsStudentData: boolean;
  needsExamData: boolean;
  needsResultsData: boolean;
  needsQuestionData: boolean;
  specificFilters: {
    studentClass?: string;
    examSubject?: string;
    timeRange?: 'recent' | 'all';
  };
} {
  const lowerQuery = query.toLowerCase();
  
  // Keywords for different data types
  const studentKeywords = ['siswa', 'murid', 'anak', 'kelas', 'nama'];
  const examKeywords = ['ujian', 'tes', 'soal', 'mata pelajaran', 'matematika', 'bahasa', 'ipa'];
  const resultsKeywords = ['nilai', 'skor', 'hasil', 'lulus', 'gagal', 'prestasi', 'sudah ujian', 'telah ujian', 'mengikuti ujian'];
  const questionKeywords = ['pertanyaan', 'soal', 'jawaban', 'pilihan'];

  // Class filters
  const classMatch = lowerQuery.match(/kelas\s*(\d+[a-z]?)/);
  const subjectMatch = lowerQuery.match(/(matematika|bahasa|ipa|pkn|ips)/);
  const timeMatch = lowerQuery.match(/(terbaru|baru-baru|minggu|bulan|hari)/);

  return {
    needsStudentData: studentKeywords.some(keyword => lowerQuery.includes(keyword)),
    needsExamData: examKeywords.some(keyword => lowerQuery.includes(keyword)),
    needsResultsData: resultsKeywords.some(keyword => lowerQuery.includes(keyword)),
    needsQuestionData: questionKeywords.some(keyword => lowerQuery.includes(keyword)),
    specificFilters: {
      studentClass: classMatch ? classMatch[1] : undefined,
      examSubject: subjectMatch ? subjectMatch[1] : undefined,
      timeRange: timeMatch ? 'recent' : 'all'
    }
  };
}

/**
 * Builds optimized context based on query analysis
 */
export async function getRelevantContext(userQuery: string): Promise<RelevantContext> {
  const intent = analyzeQueryIntent(userQuery);
  const fullContext = await getFullContext();
  
  const contextParts: string[] = [];
    const sources: string[] = [];
  
  // Always include summary statistics
  contextParts.push(`STATISTIK UMUM:
- Total Siswa: ${fullContext.summary.totalStudents}
- Total Ujian: ${fullContext.summary.totalExams}
- Total Percobaan: ${fullContext.summary.totalAttempts}
- Nilai Rata-rata: ${fullContext.summary.averageScore.toFixed(1)}%
- Tingkat Kelulusan: ${fullContext.summary.passRate.toFixed(1)}%
- Ujian Aktif: ${fullContext.summary.activeExams}`);
  sources.push('summary');

  // Add student data if needed
  if (intent.needsStudentData) {
    let studentsToInclude = fullContext.students;
    
    if (intent.specificFilters.studentClass) {
      studentsToInclude = studentsToInclude.filter(
        student => student.class?.toLowerCase().includes(intent.specificFilters.studentClass!)
      );
    }
    
    // Limit to prevent token overflow
    const studentList = studentsToInclude.slice(0, 50).map((student, i) => 
      `${i + 1}. ${student.name} (${student.class}) - NISN: ${student.nisn}`
    ).join('\n');
    
    contextParts.push(`DAFTAR SISWA (${Math.min(studentsToInclude.length, 50)} dari ${studentsToInclude.length}):\n${studentList}`);
    sources.push('students');
  }

  // Add exam data if needed
  if (intent.needsExamData) {
    let examsToInclude = fullContext.exams;
    
    if (intent.specificFilters.examSubject) {
      examsToInclude = examsToInclude.filter(
        exam => exam.subject?.toLowerCase().includes(intent.specificFilters.examSubject!)
      );
    }
    
    const examList = examsToInclude.slice(0, 20).map((exam, i) => 
      `${i + 1}. ${exam.title} (${exam.subject}) - Kelas ${exam.grade}, ${exam.totalQuestions} soal, ${exam.duration} menit`
    ).join('\n');
    
    contextParts.push(`DAFTAR UJIAN (${Math.min(examsToInclude.length, 20)} dari ${examsToInclude.length}):\n${examList}`);
    sources.push('exams');
  }

  // Add results data if needed
  if (intent.needsResultsData) {
    let attemptsToInclude = fullContext.examAttempts;
    
    if (intent.specificFilters.timeRange === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      attemptsToInclude = attemptsToInclude.filter(
        attempt => attempt.submittedAt >= oneWeekAgo
      );
    }
    
    if (intent.specificFilters.studentClass) {
      attemptsToInclude = attemptsToInclude.filter(
        attempt => attempt.studentClass?.toLowerCase().includes(intent.specificFilters.studentClass!)
      );
    }
    
    // Limit and sort by most recent
    const resultsList = attemptsToInclude
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 30)
      .map((attempt, i) => 
        `${i + 1}. ${attempt.studentName} (${attempt.studentClass}) - ${attempt.examTitle}: ${attempt.score}% (${attempt.isPassed ? 'Lulus' : 'Tidak Lulus'})`
      ).join('\n');
    
    contextParts.push(`HASIL UJIAN TERBARU (${Math.min(attemptsToInclude.length, 30)} dari ${attemptsToInclude.length}):\n${resultsList}`);
    sources.push('examAttempts');
  }

  const contextText = contextParts.join('\n\n');
  
  return {
    contextText,
    dataSize: contextText.length,
    sources
  };
}

/**
 * Chunks large context into smaller pieces if needed
 */
export function chunkContext(context: string, maxChunkSize: number = 8000): string[] {
  if (context.length <= maxChunkSize) {
    return [context];
  }
  
  const chunks: string[] = [];
  const sections = context.split('\n\n');
  let currentChunk = '';
  
  for (const section of sections) {
    if (currentChunk.length + section.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = section;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Summarizes large datasets for AI consumption
 */
export function summarizeContext(context: ContextData): string {
  const topPerformers = context.examAttempts
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
    
  const lowPerformers = context.examAttempts
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
    
  const subjectPerformance = context.examAttempts.reduce((acc, attempt) => {
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
${Array.from(new Set(context.students.map(s => s.class))).map(cls => 
  `${cls}: ${context.students.filter(s => s.class === cls).length} siswa`
).join('\n')}`;
}