import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { tools, handleToolCall } from './ai-tools';
import { chunkContext } from './context-retrieval';
import type { ExamAttempt } from './types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Enhanced AI analysis with Function Calling (Tool Use)
 */
export async function analyzeWithEnhancedPrompt(
  userQuery: string,
  _options: {
    maxContextSize?: number; // Kept for interface compatibility
    useSmartRetrieval?: boolean; // Kept for interface compatibility
    includeRecommendations?: boolean;
  } = {}
): Promise<{
  response: string;
  contextUsed: string[];
  dataSize: number;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{
            text: `Anda adalah Asisten Analisis Data Pendidikan untuk SDN TUGU 1.
Tugas anda adalah menjawab pertanyaan guru/staf dengan data yang AKURAT dari database.

ATURAN:
1. JANGAN MENJAWAB jika anda tidak yakin atau tidak punya data. Gunakan TOOLS yang tersedia untuk mencari data.
2. Jika ditanya "Siapa yang..." atau "Berapa nilai...", GUNAKAN TOOL yang relevan. Jangan mengarang.
3. Setelah mendapat data dari tool, rangkai jawaban dalam Bahasa Indonesia yang sopan dan profesional.
4. Jika hasil tool kosong, katakan "Maaf, tidak ditemukan data yang sesuai."` }]
        },
        {
          role: "model",
          parts: [{ text: "Baik, saya mengerti. Saya akan menggunakan tools yang tersedia untuk mencari data akurat sebelum menjawab pertanyaan Anda." }]
        }
      ]
    });

    const result = await chat.sendMessage(userQuery);
    const response = result.response;
    const usedTools: string[] = [];

    // Simple loop to handle multiple turns of function calling if needed
    // Note: complex chains might need a recursive function or while loop.
    // Here we handle one level of tool use (User -> AI -> Tool -> AI -> Answer)
    // Modify to WHILE loop for multi-step agents.

    let currentResponse = response;
    let maxTurns = 5;

    while (currentResponse.functionCalls() && maxTurns > 0) {
      maxTurns--;
      const calls = currentResponse.functionCalls();
      if (!calls) break;

      const functionResponses = [];

      for (const call of calls) {
        usedTools.push(call.name);
        console.log(`Calling tool: ${call.name}`);

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiResponse = await handleToolCall(call.name, call.args as any);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: apiResponse }
            }
          });
        } catch (err) {
          console.error(`Tool execution failed:`, err);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: "Failed to execute tool" }
            }
          });
        }
      }

      // Send tool results back to the model
      const result2 = await chat.sendMessage(functionResponses);
      currentResponse = result2.response;
    }

    return {
      response: currentResponse.text(),
      contextUsed: usedTools,
      dataSize: 0 // Not relevant with tools
    };

  } catch (error) {
    console.error('Error in enhanced AI analysis:', error);
    throw new Error('Terjadi kesalahan saat memproses permintaan Anda.');
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    // Build query
    let attemptsQuery = query(collection(db, 'examAttempts'));
    const constraints = [];

    if (examId) {
      constraints.push(where('examId', '==', examId));
    }

    if (classFilter) {
      constraints.push(where('studentClass', '==', classFilter));
    }

    if (constraints.length > 0) {
      attemptsQuery = query(collection(db, 'examAttempts'), ...constraints);
    }

    const snapshot = await getDocs(attemptsQuery);
    let filteredAttempts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        submittedAt: data.submittedAt instanceof Date ? data.submittedAt : data.submittedAt?.toDate()
      } as ExamAttempt;
    });

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
- Sangat Baik (≥90%): ${excellent} siswa (${(excellent / totalAttempts * 100).toFixed(0)}%)
- Baik (75-89%): ${good} siswa (${(good / totalAttempts * 100).toFixed(0)}%)
- Cukup (60-74%): ${average} siswa (${(average / totalAttempts * 100).toFixed(0)}%)
- Perlu Perbaikan (<60%): ${poor} siswa (${(poor / totalAttempts * 100).toFixed(0)}%)

PERFORMA TERTINGGI:
${topPerformers.map((attempt, i) => `${i + 1}. ${attempt.studentName} (${attempt.studentClass}): ${attempt.score}%`).join('\n')}

PERFORMA TERENDAH:
${bottomPerformers.map((attempt, i) => `${i + 1}. ${attempt.studentName} (${attempt.studentClass}): ${attempt.score}%`).join('\n')}

DETAIL PERCOBAAN TERBARU:
${filteredAttempts.slice(0, 10).map((attempt, i) =>
      `${i + 1}. ${attempt.studentName} (${attempt.studentClass}) - ${attempt.examTitle}: ${attempt.score}% (${Math.floor(attempt.timeSpent / 60)} menit)`
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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

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