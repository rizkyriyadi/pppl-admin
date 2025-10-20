import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRelevantContext, chunkContext, summarizeContext, getFullContext } from './context-retrieval';
import type { ExamAttempt } from './types';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Enhanced AI analysis with intelligent context retrieval
 */
export async function analyzeWithEnhancedPrompt(
  userQuery: string,
  options: {
    maxContextSize?: number;
    useSmartRetrieval?: boolean;
    includeRecommendations?: boolean;
  } = {}
): Promise<{
  response: string;
  contextUsed: string[];
  dataSize: number;
}> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    });

    const { maxContextSize = 8000, useSmartRetrieval = true, includeRecommendations = true } = options;

    let contextData;
    let contextSources: string[] = [];

    if (useSmartRetrieval) {
      // Use intelligent context retrieval
      const relevantContext = await getRelevantContext(userQuery);
      contextData = relevantContext.contextText;
      contextSources = relevantContext.sources;
      
      // If context is too large, chunk it or summarize
      if (relevantContext.dataSize > maxContextSize) {
        const fullContext = await getFullContext();
        contextData = summarizeContext(fullContext);
        contextSources.push('summary');
      }
    } else {
      // Fallback to full context with summarization
      const fullContext = await getFullContext();
      contextData = summarizeContext(fullContext);
      contextSources = ['full-summary'];
    }

    const systemPrompt = `Anda adalah asisten analisis data pendidikan yang cerdas dan profesional untuk administrator sekolah dasar. 

IDENTITAS & PERAN:
- Anda membantu kepala sekolah dan guru dalam menganalisis data akademik siswa
- Fokus pada memberikan insight yang actionable dan praktis
- Gunakan bahasa Indonesia yang formal namun mudah dipahami

PRINSIP ANALISIS:
1. AKURASI: Hanya gunakan data yang tersedia, jangan membuat asumsi
2. RELEVANSI: Fokus pada informasi yang berguna untuk pengambilan keputusan
3. ACTIONABLE: Berikan rekomendasi konkret yang bisa ditindaklanjuti
4. SENSITIF: Hindari stigmatisasi siswa, gunakan pendekatan yang konstruktif

GAYA KOMUNIKASI:
- Profesional namun hangat
- Gunakan bullet points untuk clarity
- Sertakan angka spesifik dari data
- Hindari jargon teknis yang berlebihan

FORMAT RESPONS:
Berikan analisis dalam struktur yang jelas dengan heading yang sesuai konteks pertanyaan.`;

    const userPrompt = `${systemPrompt}

DATA KONTEKS:
${contextData}

PERTANYAAN PENGGUNA:
${userQuery}

INSTRUKSI KHUSUS:
- Analisis berdasarkan data yang tersedia di atas
- Sebutkan nama siswa, kelas, dan nilai spesifik jika relevan
- ${includeRecommendations ? 'Berikan 2-3 rekomendasi praktis untuk tindak lanjut' : 'Fokus pada analisis faktual tanpa rekomendasi'}
- Maksimal 12 kalimat, gunakan bahasa yang mudah dipahami
- Jika data tidak cukup untuk menjawab, jelaskan keterbatasan dan sarankan data tambahan yang diperlukan

JAWABAN:`;

    const result = await model.generateContent(userPrompt);
    const response = result.response.text();

    return {
      response,
      contextUsed: contextSources,
      dataSize: contextData.length
    };

  } catch (error) {
    console.error('Error in enhanced AI analysis:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('Kuota API Gemini telah habis. Silakan coba lagi nanti atau hubungi administrator.');
      } else if (error.message.includes('safety')) {
        throw new Error('Pertanyaan tidak dapat diproses karena alasan keamanan. Silakan reformulasi pertanyaan Anda.');
      }
    }
    
    throw new Error('Terjadi kesalahan saat menganalisis data. Silakan coba lagi atau hubungi administrator.');
  }
}

/**
 * Specialized analysis for exam performance with detailed insights
 */
export async function analyzeExamPerformance(
  examId?: string,
  classFilter?: string,
  timeRange?: 'week' | 'month' | 'all'
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const fullContext = await getFullContext();
    
    let filteredAttempts = fullContext.examAttempts;
    
    // Apply filters
    if (examId) {
      filteredAttempts = filteredAttempts.filter(attempt => attempt.examId === examId);
    }
    
    if (classFilter) {
      filteredAttempts = filteredAttempts.filter(attempt => 
        attempt.studentClass?.toLowerCase().includes(classFilter.toLowerCase())
      );
    }
    
    if (timeRange && timeRange !== 'all') {
      const cutoffDate = new Date();
      if (timeRange === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeRange === 'month') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      }
      filteredAttempts = filteredAttempts.filter(attempt => attempt.submittedAt >= cutoffDate);
    }

    if (filteredAttempts.length === 0) {
      return 'Tidak ada data ujian yang sesuai dengan filter yang dipilih.';
    }

    // Calculate detailed statistics
    const totalAttempts = filteredAttempts.length;
    const averageScore = filteredAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts;
    const passRate = (filteredAttempts.filter(attempt => attempt.isPassed).length / totalAttempts) * 100;
    
    // Performance distribution
    const excellent = filteredAttempts.filter(attempt => attempt.score >= 90).length;
    const good = filteredAttempts.filter(attempt => attempt.score >= 75 && attempt.score < 90).length;
    const average = filteredAttempts.filter(attempt => attempt.score >= 60 && attempt.score < 75).length;
    const poor = filteredAttempts.filter(attempt => attempt.score < 60).length;
    
    // Top and bottom performers
    const sortedByScore = [...filteredAttempts].sort((a, b) => b.score - a.score);
    const topPerformers = sortedByScore.slice(0, 3);
    const bottomPerformers = sortedByScore.slice(-3).reverse();

    const contextData = `ANALISIS PERFORMA UJIAN

STATISTIK UMUM:
- Total Percobaan: ${totalAttempts}
- Nilai Rata-rata: ${averageScore.toFixed(1)}%
- Tingkat Kelulusan: ${passRate.toFixed(1)}%

DISTRIBUSI PERFORMA:
- Sangat Baik (≥90%): ${excellent} siswa (${(excellent/totalAttempts*100).toFixed(0)}%)
- Baik (75-89%): ${good} siswa (${(good/totalAttempts*100).toFixed(0)}%)
- Cukup (60-74%): ${average} siswa (${(average/totalAttempts*100).toFixed(0)}%)
- Perlu Perbaikan (<60%): ${poor} siswa (${(poor/totalAttempts*100).toFixed(0)}%)

PERFORMA TERTINGGI:
${topPerformers.map((attempt, i) => `${i + 1}. ${attempt.studentName} (${attempt.studentClass}): ${attempt.score}%`).join('\n')}

PERFORMA TERENDAH:
${bottomPerformers.map((attempt, i) => `${i + 1}. ${attempt.studentName} (${attempt.studentClass}): ${attempt.score}%`).join('\n')}

DETAIL PERCOBAAN TERBARU:
${filteredAttempts.slice(0, 10).map((attempt, i) => 
  `${i + 1}. ${attempt.studentName} (${attempt.studentClass}) - ${attempt.examTitle}: ${attempt.score}% (${Math.floor(attempt.timeSpent/60)} menit)`
).join('\n')}`;

    const prompt = `Anda adalah konsultan pendidikan yang menganalisis performa ujian untuk sekolah dasar.

TUGAS: Berikan analisis mendalam tentang performa ujian berdasarkan data berikut.

${contextData}

BERIKAN ANALISIS DALAM FORMAT:

**📊 Ringkasan Performa**
(2-3 kalimat tentang kondisi umum berdasarkan statistik)

**🎯 Siswa yang Perlu Perhatian Khusus**
(Sebutkan nama siswa dengan performa rendah dan saran spesifik)

**⭐ Siswa Berprestasi**
(Sebutkan nama siswa dengan performa tinggi)

**💡 Rekomendasi Tindak Lanjut**
(3-4 saran konkret untuk guru dan kepala sekolah)

Gunakan bahasa yang profesional namun mudah dipahami. Fokus pada solusi praktis.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error('Error analyzing exam performance:', error);
    throw new Error('Gagal menganalisis performa ujian. Silakan coba lagi.');
  }
}

/**
 * Generate insights for class management
 */
export async function generateClassInsights(
  examResults: ExamAttempt[],
  options: {
    maxContextSize?: number;
    includeRecommendations?: boolean;
    analysisDepth?: 'basic' | 'detailed';
  } = {}
): Promise<{
  response: string;
  contextUsed: string[];
  dataSize: number;
}> {
  const { maxContextSize = 8000, includeRecommendations = true, analysisDepth = 'basic' } = options;

  try {
    // Build context from exam results
    const contextSources: string[] = [];
    let contextData = '';

    if (examResults.length > 0) {
      // Calculate statistics
      const totalStudents = examResults.length;
      const avgScore = examResults.reduce((sum, r) => sum + r.score, 0) / totalStudents;
      const passRate = (examResults.filter(r => r.isPassed).length / totalStudents) * 100;
      
      // Get unique classes and exams
      const classes = [...new Set(examResults.map(r => r.studentClass))];
      const exams = [...new Set(examResults.map(r => r.examTitle))];

      contextData += `STATISTIK UMUM:
- Total Siswa: ${totalStudents}
- Kelas: ${classes.join(', ')}
- Ujian: ${exams.join(', ')}
- Nilai Rata-rata: ${avgScore.toFixed(1)}%
- Tingkat Kelulusan: ${passRate.toFixed(1)}%

`;

      // Add detailed results (limited by context size)
      const maxResults = Math.min(examResults.length, Math.floor(maxContextSize / 100));
      contextData += `DETAIL HASIL UJIAN (${maxResults} dari ${totalStudents} siswa):\n`;
      
      examResults.slice(0, maxResults).forEach((result, i) => {
        contextData += `${i + 1}. ${result.studentName} (${result.studentClass}) - ${result.examTitle}:
   Nilai: ${result.score}% (${result.correctAnswers}/${result.totalQuestions} benar)
   Status: ${result.isPassed ? 'Lulus' : 'Tidak Lulus'}
   Waktu: ${Math.floor(result.timeSpent / 60)} menit
   Tanggal: ${new Date(result.submittedAt).toLocaleDateString('id-ID')}

`;
      });

      contextSources.push('exam_results');
    }

    // Chunk context if too large
    if (contextData.length > maxContextSize) {
      contextData = chunkContext(contextData, maxContextSize)[0];
      contextSources.push('chunked_data');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const systemPrompt = `Anda adalah asisten AI untuk analisis hasil ujian sekolah SDN TUGU 1. 
Tugas Anda adalah menganalisis data hasil ujian siswa dan memberikan wawasan yang berguna untuk guru dan kepala sekolah.

KONTEKS SEKOLAH:
- Sekolah Dasar Negeri (SDN) TUGU 1
- Sistem ujian digital dengan berbagai mata pelajaran
- Standar kelulusan biasanya 70-75%

GAYA KOMUNIKASI:
- Profesional namun mudah dipahami
- Gunakan bahasa Indonesia yang baik dan benar
- Fokus pada insight yang actionable untuk pendidik
- Hindari jargon teknis yang berlebihan

${analysisDepth === 'detailed' ? `
ANALISIS MENDALAM:
- Identifikasi pola performa per kelas dan mata pelajaran
- Analisis distribusi nilai dan outlier
- Bandingkan dengan standar sekolah
- Identifikasi siswa yang memerlukan perhatian khusus
` : `
ANALISIS DASAR:
- Ringkasan performa umum
- Identifikasi tren utama
- Highlight pencapaian dan area yang perlu diperbaiki
`}

FORMAT RESPONS:
Berikan analisis dalam struktur yang jelas dengan heading yang sesuai.`;

    const userPrompt = `${systemPrompt}

DATA HASIL UJIAN:
${contextData}

INSTRUKSI ANALISIS:
- Analisis performa siswa berdasarkan data di atas
- Identifikasi pola dan tren yang signifikan
- Sebutkan nama siswa dan kelas spesifik jika relevan
- ${includeRecommendations ? 'Berikan 2-3 rekomendasi praktis untuk guru dan kepala sekolah' : 'Fokus pada analisis faktual'}
- Maksimal 15 kalimat, gunakan bahasa yang mudah dipahami

ANALISIS:`;

    const result = await model.generateContent(userPrompt);
    const response = result.response.text();

    return {
      response,
      contextUsed: contextSources,
      dataSize: contextData.length
    };

  } catch (error) {
    console.error('Error in class insights generation:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('Kuota API Gemini telah habis. Silakan coba lagi nanti atau hubungi administrator.');
      } else if (error.message.includes('safety')) {
        throw new Error('Data tidak dapat diproses karena alasan keamanan. Silakan periksa kembali data ujian.');
      }
    }
    
    throw new Error('Terjadi kesalahan saat menganalisis data kelas. Silakan coba lagi.');
  }
}

/**
 * Validate and sanitize user input
 */
export function validateUserQuery(query: string): { isValid: boolean; message?: string } {
  if (!query || query.trim().length === 0) {
    return { isValid: false, message: 'Pertanyaan tidak boleh kosong.' };
  }
  
  if (query.length > 500) {
    return { isValid: false, message: 'Pertanyaan terlalu panjang. Maksimal 500 karakter.' };
  }
  
  // Check for potentially harmful content
  const harmfulPatterns = [
    /delete|drop|truncate|update.*set/i,
    /script|javascript|eval/i,
    /<script|<iframe|<object/i
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(query)) {
      return { isValid: false, message: 'Pertanyaan mengandung konten yang tidak diizinkan.' };
    }
  }
  
  return { isValid: true };
}