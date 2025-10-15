'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Question, Exam } from '@/lib/types';

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    subject: '',
    difficulty: 'medium',
    explanation: '',
  });

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (examId) {
      fetchQuestions(examId);
    }
  }, [examId]);

  const fetchExams = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      const examsData: Exam[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Exam));
      setExams(examsData);

      if (examId) {
        const exam = examsData.find((e) => e.id === examId);
        setSelectedExam(exam || null);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (id: string) => {
    try {
      const q = query(
        collection(db, 'questions'),
        where('examId', '==', id),
        orderBy('questionNumber', 'asc')
      );
      const snapshot = await getDocs(q);
      const questionsData: Question[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Question));
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleExamChange = (id: string) => {
    router.push(`/questions?examId=${id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) {
      alert('Please select an exam first');
      return;
    }

    try {
      const questionNumber = editingQuestion ? editingQuestion.questionNumber : questions.length + 1;

      if (editingQuestion) {
        await updateDoc(doc(db, 'questions', editingQuestion.id), {
          ...formData,
        });
      } else {
        await addDoc(collection(db, 'questions'), {
          ...formData,
          examId,
          questionNumber,
          subject: selectedExam?.subject || formData.subject,
          createdAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      resetForm();
      fetchQuestions(examId);
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      subject: question.subject,
      difficulty: question.difficulty || 'medium',
      explanation: question.explanation || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      fetchQuestions(examId!);
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const resetForm = () => {
    setFormData({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      subject: selectedExam?.subject || '',
      difficulty: 'medium',
      explanation: '',
    });
    setEditingQuestion(null);
  };

  const openCreateModal = () => {
    if (!examId) {
      alert('Please select an exam first');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Questions Management</h1>

        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Exam
            </label>
            <select
              value={examId || ''}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Choose an exam --</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.subject})
                </option>
              ))}
            </select>
          </div>

          {examId && (
            <button
              onClick={openCreateModal}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Add Question
            </button>
          )}
        </div>
      </div>

      {examId && selectedExam && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 p-4">
          <h3 className="font-medium text-slate-900">{selectedExam.title}</h3>
          <p className="text-sm text-slate-600 mt-1">
            Total Questions: {questions.length} / {selectedExam.totalQuestions}
          </p>
        </div>
      )}

      {examId ? (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
              No questions yet. Add your first question to get started.
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                        {question.difficulty || 'medium'}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium">{question.questionText}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(question)}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {question.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md border ${
                        idx === question.correctAnswer
                          ? 'bg-green-50 border-green-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-600 mr-2">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className={idx === question.correctAnswer ? 'text-green-900' : 'text-slate-900'}>
                        {option}
                      </span>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Explanation: </span>
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          Please select an exam to view and manage questions
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Question Text
                </label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter your question here"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === idx}
                        onChange={() => setFormData({ ...formData, correctAnswer: idx })}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-slate-600 w-8">
                        {String.fromCharCode(65 + idx)}.
                      </label>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[idx] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-slate-900
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Select the radio button for the correct answer</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Explanation (Optional)
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Explain why the answer is correct"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium
                           hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500
                           focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
