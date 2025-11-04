'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ExamAttempt } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { validateUserQuery, analyzeWithEnhancedPrompt } from '@/lib/enhanced-gemini';
import { formatAIResponse, createLoadingState, createErrorState } from '@/lib/ai-response-formatter';

export default function ResultsPage() {
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Helper function to parse dates from Firestore
  const parseDate = (dateValue: unknown): Date => {
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return new Date();
  };

  const fetchResults = useCallback(async () => {
    try {
      const q = query(collection(db, 'examAttempts'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      const resultsData: ExamAttempt[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startedAt: parseDate(doc.data().startedAt),
        submittedAt: parseDate(doc.data().submittedAt),
      } as ExamAttempt));
      setResults(resultsData);
      setFilteredResults(resultsData);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, filterClass, filterExam, filterStatus]);

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

  const handleDelete = async (resultId: string) => {
    if (!confirm('Are you sure you want to delete this exam result? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'examAttempts', resultId));
      fetchResults();
    } catch (error) {
      console.error('Error deleting result:', error);
      alert('Failed to delete result');
    }
  };

  const getUniqueClasses = () => {
    const classes = new Set(
      results
        .map((r) => r.studentClass)
        .filter((cls) => cls && cls.trim() !== '') // Filter out empty/null classes
    );
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


  const handleCustomPromptAnalysis = async () => {
    if (!customPrompt.trim()) {
      alert('Silakan masukkan pertanyaan untuk AI');
      return;
    }

    // Validate user input
    const validation = validateUserQuery(customPrompt);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    if (filteredResults.length === 0) {
      alert('Tidak ada data hasil ujian untuk dianalisis');
      return;
    }

    setAnalyzingWithAI(true);
    setShowAIAnalysis(true);
    setShowCustomPrompt(false);
    try {
      // Use enhanced AI with smart context retrieval
      const result = await analyzeWithEnhancedPrompt(customPrompt, {
        maxContextSize: 8000,
        useSmartRetrieval: true,
        includeRecommendations: true
      });
      
      setAiAnalysis(formatAIResponse(result.response).html);
      setCustomPrompt('');
      
      // Log context usage for debugging (remove in production)
      console.log('Context sources used:', result.contextUsed);
      console.log('Context size:', result.dataSize, 'characters');
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      setAiAnalysis(createErrorState(error instanceof Error ? error.message : 'Maaf, terjadi kesalahan saat menganalisis data. Silakan coba lagi.'));
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  const exportToPDF = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = new jsPDF() as any;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SDN TUGU 1', 105, 15, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Nilai Ujian Siswa', 105, 23, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);

    // Statistics
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistik:', 14, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Percobaan: ${stats.totalAttempts}`, 14, 46);
    doc.text(`Nilai Rata-rata: ${stats.avgScore}%`, 14, 52);
    doc.text(`Tingkat Kelulusan: ${stats.passRate}%`, 14, 58);

    // Applied filters
    if (filterClass || filterExam || filterStatus) {
      doc.setFont('helvetica', 'bold');
      doc.text('Filter Aktif:', 14, 66);
      doc.setFont('helvetica', 'normal');
      let yPos = 72;
      if (filterClass) {
        doc.text(`- Kelas: ${filterClass}`, 14, yPos);
        yPos += 6;
      }
      if (filterExam) {
        const examTitle = getUniqueExams().find(([id]) => id === filterExam)?.[1];
        doc.text(`- Ujian: ${examTitle}`, 14, yPos);
        yPos += 6;
      }
      if (filterStatus) {
        doc.text(`- Status: ${filterStatus === 'passed' ? 'Lulus' : 'Tidak Lulus'}`, 14, yPos);
      }
    }

    // Table data
    const tableData = filteredResults.map((result) => [
      result.studentName,
      result.studentClass,
      result.examTitle,
      `${result.score}%`,
      `${result.correctAnswers}/${result.totalQuestions}`,
      `${Math.floor(result.timeSpent / 60)} min`,
      result.isPassed ? 'Lulus' : 'Tidak Lulus',
      new Date(result.submittedAt).toLocaleDateString('id-ID'),
    ]);

    // Generate table
    autoTable(doc, {
      startY: filterClass || filterExam || filterStatus ? 80 : 68,
      head: [['Nama Siswa', 'Kelas', 'Ujian', 'Nilai', 'Benar', 'Waktu', 'Status', 'Tanggal']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `Laporan_Nilai_${filterClass || 'Semua_Kelas'}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Exam Results</h1>
          <p className="text-slate-600 text-sm mt-1">View and analyze student exam results</p>
        </div>
        <div className="flex gap-3">

          <button
            onClick={exportToPDF}
            disabled={filteredResults.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export to PDF
          </button>
        </div>
      </div>

      {showCustomPrompt && (
        <div className="mb-6 bg-white rounded-lg border border-indigo-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-indigo-900 mb-3">Tanya AI</h2>
          <p className="text-sm text-slate-600 mb-4">
            Tulis pertanyaan Anda tentang hasil ujian. Contoh: &quot;Siswa mana yang perlu les tambahan?&quot;
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Tulis pertanyaan Anda di sini..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-md text-slate-900
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder:text-slate-400"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCustomPromptAnalysis}
              disabled={!customPrompt.trim() || analyzingWithAI}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
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
        <div className="mb-6 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-slate-900">Analisis AI</h2>
            </div>
            <button
              onClick={() => setShowAIAnalysis(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {analyzingWithAI ? (
              <div dangerouslySetInnerHTML={{ __html: createLoadingState() }} />
            ) : (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: aiAnalysis }}
              />
            )}
          </div>
        </div>
      )}

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
              {getUniqueClasses().map((cls, index) => (
                <option key={`class-${cls}-${index}`} value={cls}>
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
              {getUniqueExams().map(([id, title], index) => (
                <option key={`exam-${id}-${index}`} value={id}>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(result.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
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
    </div>
  );
}
