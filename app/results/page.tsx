'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ExamAttempt } from '@/lib/types';

export default function ResultsPage() {
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, filterClass, filterExam, filterStatus]);

  const fetchResults = async () => {
    try {
      const q = query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      const resultsData: ExamAttempt[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
      } as ExamAttempt));
      setResults(resultsData);
      setFilteredResults(resultsData);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (filterClass) {
      filtered = filtered.filter((r) => r.studentClass === filterClass);
    }

    if (filterExam) {
      filtered = filtered.filter((r) => r.examId === filterExam);
    }

    if (filterStatus === 'passed') {
      filtered = filtered.filter((r) => r.isPassed);
    } else if (filterStatus === 'failed') {
      filtered = filtered.filter((r) => !r.isPassed);
    }

    setFilteredResults(filtered);
  };

  const getUniqueClasses = () => {
    const classes = new Set(results.map((r) => r.studentClass));
    return Array.from(classes).sort();
  };

  const getUniqueExams = () => {
    const exams = new Map<string, string>();
    results.forEach((r) => {
      if (!exams.has(r.examId)) {
        exams.set(r.examId, r.examTitle);
      }
    });
    return Array.from(exams.entries());
  };

  const calculateStats = () => {
    if (filteredResults.length === 0) {
      return { avgScore: 0, passRate: 0, totalAttempts: 0 };
    }

    const totalScore = filteredResults.reduce((sum, r) => sum + r.score, 0);
    const avgScore = totalScore / filteredResults.length;
    const passedCount = filteredResults.filter((r) => r.isPassed).length;
    const passRate = (passedCount / filteredResults.length) * 100;

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      totalAttempts: filteredResults.length,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Exam Results</h1>
        <p className="text-slate-600 text-sm mt-1">View and analyze student exam results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-600 mb-1">Total Attempts</p>
          <p className="text-3xl font-semibold text-slate-900">{stats.totalAttempts}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-600 mb-1">Average Score</p>
          <p className="text-3xl font-semibold text-blue-700">{stats.avgScore}%</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-600 mb-1">Pass Rate</p>
          <p className="text-3xl font-semibold text-green-700">{stats.passRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Filter by Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {getUniqueClasses().map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Filter by Exam
            </label>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Exams</option>
              {getUniqueExams().map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {(filterClass || filterExam || filterStatus) && (
          <button
            onClick={() => {
              setFilterClass('');
              setFilterExam('');
              setFilterStatus('');
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
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
                  Correct
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Time
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
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {results.length === 0
                      ? 'No exam results yet'
                      : 'No results match the selected filters'}
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{result.studentName}</div>
                        <div className="text-xs text-slate-500">{result.studentClass}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{result.examTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{result.score}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {result.correctAnswers}/{result.totalQuestions}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">
                        {Math.floor(result.timeSpent / 60)} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          result.isPassed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(result.submittedAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
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
