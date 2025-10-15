export interface User {
  uid: string;
  role: 'student' | 'admin' | 'superadmin';
  name: string;
  email: string;
  nisn?: string;
  class?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  questionNumber: number;
  options: string[];
  correctAnswer: number;
  subject: string;
  difficulty?: string;
  explanation?: string;
  imageUrl?: string;
  createdAt?: Date;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: number;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  answers: { [questionId: string]: number };
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  timeSpent: number;
  isPassed: boolean;
  startedAt: Date;
  submittedAt: Date;
  status: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  totalAttempts: number;
  activeExams: number;
  averageScore: number;
  recentAttempts: ExamAttempt[];
}
