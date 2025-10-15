'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DashboardStats, ExamAttempt } from '@/lib/types';

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1">Overview of exam system statistics</p>
      </div>

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
