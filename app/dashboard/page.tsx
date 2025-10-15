'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DashboardStats, ExamAttempt } from '@/lib/types';
import { analyzeExamData, analyzeWithCustomPrompt } from '@/lib/gemini';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalExams: 0,
    totalAttempts: 0,
    activeExams: 0,
    averageScore: 0,
    recentAttempts: [],
  });
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsSnap, examsSnap, attemptsSnap, recentAttemptsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'))),
          getDocs(query(collection(db, 'exams'))),
          getDocs(query(collection(db, 'examAttempts'))),
          getDocs(query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'), limit(5))),
        ]);

        const students = studentsSnap.docs.filter((doc) => doc.data().role === 'student');
        const exams = examsSnap.docs;
        const activeExams = exams.filter((doc) => doc.data().isActive === true);
        const attempts = attemptsSnap.docs;

        const totalScore = attempts.reduce((sum, doc) => sum + (doc.data().score || 0), 0);
        const averageScore = attempts.length > 0 ? totalScore / attempts.length : 0;

        const recentAttempts: ExamAttempt[] = recentAttemptsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            submittedAt: data.submittedAt?.toDate() || new Date(),
          } as ExamAttempt;
        });

        setStats({
          totalStudents: students.length,
          totalExams: exams.length,
          totalAttempts: attempts.length,
          activeExams: activeExams.length,
          averageScore: Math.round(averageScore * 10) / 10,
          recentAttempts,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleAIAnalysis = async () => {
    if (stats.totalAttempts === 0) {
      alert('Tidak ada data ujian untuk dianalisis');
      return;
    }

    setAnalyzingWithAI(true);
    setShowAIAnalysis(true);
    try {
      const analysis = await analyzeExamData(stats);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      setAiAnalysis('Maaf, terjadi kesalahan saat menganalisis data. Silakan coba lagi.');
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  const handleCustomPromptAnalysis = async () => {
    if (!customPrompt.trim()) {
      alert('Silakan masukkan pertanyaan untuk AI');
      return;
    }

    if (stats.totalAttempts === 0) {
      alert('Tidak ada data ujian untuk dianalisis');
      return;
    }

    setAnalyzingWithAI(true);
    setShowAIAnalysis(true);
    setShowCustomPrompt(false);
    try {
      const context = `
Data Statistik:
- Total Siswa: ${stats.totalStudents}
- Total Ujian: ${stats.totalExams}
- Total Percobaan Ujian: ${stats.totalAttempts}
- Ujian Aktif: ${stats.activeExams}
- Nilai Rata-rata: ${stats.averageScore}%

Percobaan Ujian Terbaru:
${stats.recentAttempts.map((attempt, i) => `${i + 1}. ${attempt.studentName} (${attempt.studentClass}) - ${attempt.examTitle}: ${attempt.score}% (${attempt.isPassed ? 'Lulus' : 'Tidak Lulus'})`).join('\n')}
      `;
      const analysis = await analyzeWithCustomPrompt(customPrompt, context);
      setAiAnalysis(analysis);
      setCustomPrompt('');
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      setAiAnalysis('Maaf, terjadi kesalahan saat menganalisis data. Silakan coba lagi.');
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Overview of exam system statistics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAIAnalysis}
            disabled={analyzingWithAI || stats.totalAttempts === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {analyzingWithAI ? 'Menganalisis...' : 'Analisis Otomatis'}
          </button>
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            disabled={stats.totalAttempts === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Tanya AI
          </button>
        </div>
      </div>

      {showCustomPrompt && (
        <div className="mb-6 bg-white rounded-lg border border-blue-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Tanya AI</h2>
          <p className="text-sm text-slate-600 mb-4">
            Tulis pertanyaan Anda tentang data siswa. Contoh: &quot;Bagaimana cara meningkatkan nilai siswa yang kurang?&quot;
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Tulis pertanyaan Anda di sini..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-md text-slate-900
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-slate-400"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCustomPromptAnalysis}
              disabled={!customPrompt.trim() || analyzingWithAI}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Kirim Pertanyaan
            </button>
            <button
              onClick={() => {
                setShowCustomPrompt(false);
                setCustomPrompt('');
              }}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300
                       focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {showAIAnalysis && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-purple-900">Analisis AI</h2>
            </div>
            <button
              onClick={() => setShowAIAnalysis(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {analyzingWithAI ? (
            <div className="flex items-center gap-3 text-purple-700">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <p>Sedang menganalisis data Anda...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700">
              <div className="whitespace-pre-wrap">{aiAnalysis}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <StatCard
          title="Active Exams"
          value={stats.activeExams}
          bgColor="bg-amber-50"
          textColor="text-amber-700"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          bgColor="bg-slate-50"
          textColor="text-slate-700"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Exam Attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Exam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No exam attempts yet
                  </td>
                </tr>
              ) : (
                stats.recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{attempt.studentName}</div>
                        <div className="text-xs text-slate-500">{attempt.studentClass}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{attempt.examTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{attempt.score}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          attempt.isPassed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {attempt.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(attempt.submittedAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  bgColor,
  textColor,
}: {
  title: string;
  value: string | number;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-6 border border-slate-200`}>
      <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
      <p className={`text-3xl font-semibold ${textColor}`}>{value}</p>
    </div>
  );
}
