import supabase from './supabase';
import bcrypt from 'bcryptjs/dist/bcrypt.js';
import { parseDocumentFile } from '../utils/documentParser';

// Helper to get current authenticated faculty user from localStorage
function getCurrentFaculty() {
  try {
    const saved = localStorage.getItem('quizx_faculty_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Generate unique 6-char alphanumeric code
function generateQuizCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Safely convert date inputs to ISO UTC string
function sanitizeDatetime(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// Helper to shuffle array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Unified API Service implementing direct Supabase operations
export const api = {
  // ==========================================
  // 1. AUTH API
  // ==========================================
  auth: {
    login: async ({ email, password }) => {
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const { data: faculty, error } = await supabase
        .from('faculties')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !faculty) {
        throw new Error('Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, faculty.password_hash);
      if (!isMatch) {
        throw new Error('Invalid email or password.');
      }

      const token = `token_${faculty.id}_${Date.now()}`;
      const facultyData = {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        institution: faculty.institution,
        department: faculty.department,
        role: faculty.role || 'faculty',
        created_at: faculty.created_at
      };

      return {
        success: true,
        message: 'Login successful!',
        token,
        faculty: facultyData
      };
    },

    register: async ({ name, email, password, institution, department }) => {
      if (!name || !email || !password) {
        throw new Error('Name, email, and password are required.');
      }

      const { data: existingUser } = await supabase
        .from('faculties')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists.');
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newFaculty = {
        name,
        email: email.toLowerCase().trim(),
        password_hash,
        institution: institution || 'Independent Educator',
        department: department || 'General',
        role: 'faculty'
      };

      const { data: inserted, error } = await supabase
        .from('faculties')
        .insert([newFaculty])
        .select('id, name, email, institution, department, role, created_at')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create faculty account in database.');
      }

      const token = `token_${inserted.id}_${Date.now()}`;

      return {
        success: true,
        message: 'Faculty account created successfully!',
        token,
        faculty: inserted
      };
    },

    getProfile: async () => {
      const current = getCurrentFaculty();
      if (!current?.id) {
        throw new Error('No active session found.');
      }

      const { data: faculty, error } = await supabase
        .from('faculties')
        .select('id, name, email, institution, department, role, avatar_url, created_at')
        .eq('id', current.id)
        .single();

      if (error || !faculty) {
        throw new Error('Faculty profile not found.');
      }

      return { success: true, faculty };
    },

    updateProfile: async ({ name, institution, department, currentPassword, newPassword }) => {
      const current = getCurrentFaculty();
      if (!current?.id) {
        throw new Error('Unauthorized');
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (institution) updateData.institution = institution;
      if (department) updateData.department = department;

      if (newPassword) {
        if (!currentPassword) {
          throw new Error('Current password is required to set a new password.');
        }

        const { data: faculty } = await supabase
          .from('faculties')
          .select('password_hash')
          .eq('id', current.id)
          .single();

        if (faculty) {
          const isMatch = await bcrypt.compare(currentPassword, faculty.password_hash);
          if (!isMatch) {
            throw new Error('Current password is incorrect.');
          }

          const salt = await bcrypt.genSalt(10);
          updateData.password_hash = await bcrypt.hash(newPassword, salt);
        }
      }

      const { data: updated, error } = await supabase
        .from('faculties')
        .update(updateData)
        .eq('id', current.id)
        .select('id, name, email, institution, department, role')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update profile.');
      }

      return { success: true, message: 'Profile updated successfully!', faculty: updated };
    }
  },

  // ==========================================
  // 2. FACULTY QUIZZES API
  // ==========================================
  quizzes: {
    getDashboardStats: async () => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { data: quizzes, error: quizErr } = await supabase
        .from('quizzes')
        .select('id, status, total_marks, created_at')
        .eq('faculty_id', current.id);

      if (quizErr) throw quizErr;

      const quizIds = (quizzes || []).map(q => q.id);
      let totalSubmissions = 0;
      let totalParticipants = 0;
      let totalScoreSum = 0;
      let totalMaxScoreSum = 0;
      let recentSubmissions = [];

      if (quizIds.length > 0) {
        const { data: attempts, error: attErr } = await supabase
          .from('attempts')
          .select('id, quiz_id, participant_name, roll_number, department, total_score, max_score, percentage, status, created_at')
          .in('quiz_id', quizIds)
          .order('created_at', { ascending: false });

        if (!attErr && attempts) {
          const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'timed_out');
          totalSubmissions = completedAttempts.length;

          const uniqueParticipants = new Set(attempts.map(a => `${a.participant_name}-${a.roll_number || ''}`));
          totalParticipants = uniqueParticipants.size;

          completedAttempts.forEach(a => {
            totalScoreSum += Number(a.total_score || 0);
            totalMaxScoreSum += Number(a.max_score || 0);
          });

          recentSubmissions = attempts.slice(0, 5);
        }
      }

      const totalQuizzes = quizzes ? quizzes.length : 0;
      const activeQuizzes = quizzes ? quizzes.filter(q => q.status === 'live').length : 0;
      const avgScorePercentage = totalSubmissions > 0 && totalMaxScoreSum > 0
        ? Math.round((totalScoreSum / totalMaxScoreSum) * 100)
        : 0;

      return {
        success: true,
        stats: {
          totalQuizzes,
          activeQuizzes,
          totalParticipants,
          totalSubmissions,
          avgScorePercentage
        },
        recentSubmissions
      };
    },

    getAll: async (params = {}) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      let query = supabase
        .from('quizzes')
        .select(`
          *,
          questions (count),
          attempts (count)
        `)
        .eq('faculty_id', current.id)
        .order('created_at', { ascending: false });

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      const { data: quizzes, error } = await query;
      if (error) throw error;

      const formattedQuizzes = (quizzes || []).map(q => ({
        ...q,
        question_count: q.questions ? q.questions[0]?.count || 0 : 0,
        participant_count: q.attempts ? q.attempts[0]?.count || 0 : 0
      }));

      return { success: true, quizzes: formattedQuizzes };
    },

    getById: async (id) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('faculty_id', current.id)
        .single();

      if (error || !quiz) {
        throw new Error('Quiz not found or unauthorized.');
      }

      const { data: questions, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true });

      if (qErr) throw qErr;

      return {
        success: true,
        quiz: {
          ...quiz,
          questions: questions || []
        }
      };
    },

    getByCodePublic: async (quizCode) => {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          quiz_code,
          title,
          description,
          instructions,
          duration_minutes,
          start_time,
          end_time,
          max_attempts,
          status,
          is_published,
          access_code,
          required_fields,
          total_marks,
          faculties (
            name,
            institution,
            department
          ),
          questions (count)
        `)
        .eq('quiz_code', quizCode.toUpperCase().trim())
        .single();

      if (error || !quiz) {
        throw new Error('Quiz not found. Please verify the quiz code or link.');
      }

      return {
        success: true,
        quiz: {
          id: quiz.id,
          quiz_code: quiz.quiz_code,
          title: quiz.title,
          description: quiz.description,
          instructions: quiz.instructions,
          duration_minutes: quiz.duration_minutes,
          start_time: quiz.start_time,
          end_time: quiz.end_time,
          max_attempts: quiz.max_attempts,
          status: quiz.status,
          is_published: quiz.is_published,
          has_access_code: !!quiz.access_code,
          required_fields: quiz.required_fields || ['name', 'roll_number', 'department'],
          total_marks: quiz.total_marks || 0,
          creator_name: quiz.faculties?.name || 'Educator',
          institution: quiz.faculties?.institution || 'Academic Institute',
          question_count: quiz.questions ? quiz.questions[0]?.count || 0 : 0
        }
      };
    },

    create: async (quizData) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const {
        title,
        description,
        instructions,
        duration_minutes,
        start_time,
        end_time,
        max_attempts,
        access_code,
        shuffle_questions,
        shuffle_options,
        show_score_immediately,
        show_correct_answers,
        required_fields,
        questions,
        status,
        is_published
      } = quizData;

      if (!title) throw new Error('Quiz title is required.');

      let code = generateQuizCode();
      const totalMarks = (questions || []).reduce((acc, q) => acc + (Number(q.marks) || 1), 0);

      const newQuiz = {
        quiz_code: code,
        faculty_id: current.id,
        title,
        description: description || '',
        instructions: instructions || '',
        duration_minutes: Number(duration_minutes) || 30,
        start_time: sanitizeDatetime(start_time),
        end_time: sanitizeDatetime(end_time),
        max_attempts: Number(max_attempts) || 1,
        status: status || 'draft',
        is_published: status === 'live' || status === 'scheduled' || !!is_published,
        access_code: access_code || null,
        shuffle_questions: !!shuffle_questions,
        shuffle_options: !!shuffle_options,
        show_score_immediately: show_score_immediately !== undefined ? show_score_immediately : true,
        show_correct_answers: show_correct_answers !== undefined ? show_correct_answers : true,
        required_fields: required_fields || ['name', 'roll_number', 'department'],
        total_marks: totalMarks
      };

      const { data: insertedQuiz, error: quizErr } = await supabase
        .from('quizzes')
        .insert([newQuiz])
        .select('*')
        .single();

      if (quizErr) throw quizErr;

      if (questions && questions.length > 0) {
        const questionRecords = questions.map((q, idx) => ({
          quiz_id: insertedQuiz.id,
          question_text: q.question_text || 'Untitled Question',
          question_type: q.question_type || 'mcq',
          options: q.options || [],
          correct_answer: q.correct_answer || (q.options && q.options[0] ? q.options[0].id : 'opt_1'),
          marks: Number(q.marks) || 1,
          order_index: idx,
          explanation: q.explanation || ''
        }));

        await supabase.from('questions').insert(questionRecords);
      }

      return {
        success: true,
        message: 'Quiz created successfully!',
        quiz: insertedQuiz
      };
    },

    update: async (id, quizData) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const {
        title,
        description,
        instructions,
        duration_minutes,
        start_time,
        end_time,
        max_attempts,
        access_code,
        shuffle_questions,
        shuffle_options,
        show_score_immediately,
        show_correct_answers,
        required_fields,
        questions,
        status,
        is_published
      } = quizData;

      const totalMarks = (questions || []).reduce((acc, q) => acc + (Number(q.marks) || 1), 0);

      const updateFields = {};
      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (instructions !== undefined) updateFields.instructions = instructions;
      if (duration_minutes !== undefined) updateFields.duration_minutes = Number(duration_minutes);
      if (start_time !== undefined) updateFields.start_time = sanitizeDatetime(start_time);
      if (end_time !== undefined) updateFields.end_time = sanitizeDatetime(end_time);
      if (max_attempts !== undefined) updateFields.max_attempts = Number(max_attempts);
      if (access_code !== undefined) updateFields.access_code = access_code || null;
      if (shuffle_questions !== undefined) updateFields.shuffle_questions = !!shuffle_questions;
      if (shuffle_options !== undefined) updateFields.shuffle_options = !!shuffle_options;
      if (show_score_immediately !== undefined) updateFields.show_score_immediately = !!show_score_immediately;
      if (show_correct_answers !== undefined) updateFields.show_correct_answers = !!show_correct_answers;
      if (required_fields !== undefined) updateFields.required_fields = required_fields;
      if (status !== undefined) updateFields.status = status;
      if (is_published !== undefined) updateFields.is_published = !!is_published;
      if (questions) updateFields.total_marks = totalMarks;

      const { data: updatedQuiz, error } = await supabase
        .from('quizzes')
        .update(updateFields)
        .eq('id', id)
        .eq('faculty_id', current.id)
        .select('*')
        .single();

      if (error) throw error;

      if (questions) {
        await supabase.from('questions').delete().eq('quiz_id', id);

        if (questions.length > 0) {
          const questionRecords = questions.map((q, idx) => ({
            quiz_id: id,
            question_text: q.question_text || 'Untitled Question',
            question_type: q.question_type || 'mcq',
            options: q.options || [],
            correct_answer: q.correct_answer || (q.options && q.options[0] ? q.options[0].id : 'opt_1'),
            marks: Number(q.marks) || 1,
            order_index: idx,
            explanation: q.explanation || ''
          }));
          await supabase.from('questions').insert(questionRecords);
        }
      }

      return {
        success: true,
        message: 'Quiz updated successfully!',
        quiz: updatedQuiz
      };
    },

    duplicate: async (id) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { data: originalQuiz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('faculty_id', current.id)
        .single();

      if (!originalQuiz) throw new Error('Original quiz not found.');

      const { data: originalQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true });

      const clonedQuiz = {
        quiz_code: generateQuizCode(),
        faculty_id: current.id,
        title: `${originalQuiz.title} (Copy)`,
        description: originalQuiz.description,
        instructions: originalQuiz.instructions,
        duration_minutes: originalQuiz.duration_minutes,
        start_time: null,
        end_time: null,
        max_attempts: originalQuiz.max_attempts,
        status: 'draft',
        is_published: false,
        access_code: originalQuiz.access_code,
        shuffle_questions: originalQuiz.shuffle_questions,
        shuffle_options: originalQuiz.shuffle_options,
        show_score_immediately: originalQuiz.show_score_immediately,
        show_correct_answers: originalQuiz.show_correct_answers,
        required_fields: originalQuiz.required_fields,
        total_marks: originalQuiz.total_marks
      };

      const { data: newQuiz, error: insertErr } = await supabase
        .from('quizzes')
        .insert([clonedQuiz])
        .select('*')
        .single();

      if (insertErr) throw insertErr;

      if (originalQuestions && originalQuestions.length > 0) {
        const clonedQuestions = originalQuestions.map(q => ({
          quiz_id: newQuiz.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks,
          order_index: q.order_index,
          explanation: q.explanation
        }));

        await supabase.from('questions').insert(clonedQuestions);
      }

      return {
        success: true,
        message: 'Quiz duplicated successfully!',
        quiz: newQuiz
      };
    },

    togglePublish: async (id, statusData) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const newStatus = statusData.status || (statusData.is_published ? 'live' : 'draft');

      const { data: updated, error } = await supabase
        .from('quizzes')
        .update({
          status: newStatus,
          is_published: newStatus === 'live' || newStatus === 'scheduled'
        })
        .eq('id', id)
        .eq('faculty_id', current.id)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `Quiz status set to ${newStatus}.`,
        quiz: updated
      };
    },

    delete: async (id) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id)
        .eq('faculty_id', current.id);

      if (error) throw error;

      return { success: true, message: 'Quiz deleted successfully.' };
    }
  },

  // ==========================================
  // 3. DOCUMENT IMPORT API
  // ==========================================
  import: {
    uploadDocument: async (formData) => {
      const file = formData.get('file') || formData.get('document');
      if (!file) throw new Error('No document file selected.');
      return await parseDocumentFile(file);
    }
  },

  // ==========================================
  // 4. STUDENT ATTEMPTS API
  // ==========================================
  attempts: {
    start: async ({ quizId, accessCode, name, email, rollNumber, department, year, college }) => {
      if (!quizId || !name) {
        throw new Error('Quiz ID and Student Name are required.');
      }

      const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizErr || !quiz) {
        throw new Error('Quiz not found.');
      }

      if (!quiz.is_published || quiz.status === 'closed' || quiz.status === 'archived' || quiz.status === 'draft') {
        throw new Error('This quiz is not currently accepting responses.');
      }

      if (quiz.access_code && quiz.access_code.trim() !== '') {
        if (!accessCode || accessCode.trim() !== quiz.access_code.trim()) {
          throw new Error('Invalid Quiz Access Passcode.');
        }
      }

      const now = new Date();
      if (quiz.start_time) {
        const startTime = new Date(quiz.start_time);
        if (startTime.getTime() - now.getTime() > 120000) {
          throw new Error(`This quiz has not started yet. (Scheduled for ${startTime.toLocaleString()})`);
        }
      }
      if (quiz.end_time) {
        const endTime = new Date(quiz.end_time);
        if (endTime.getTime() < now.getTime()) {
          throw new Error(`This quiz has closed. (Ended at ${endTime.toLocaleString()})`);
        }
      }

      // Check existing active attempt
      const { data: existingActive } = await supabase
        .from('attempts')
        .select('id, start_time, status')
        .eq('quiz_id', quiz.id)
        .eq('participant_name', name.trim())
        .eq('status', 'in_progress')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingActive) {
        const startTimeMs = new Date(existingActive.start_time).getTime();
        const allowedDurationMs = (quiz.duration_minutes || 30) * 60 * 1000;
        const deadlineMs = startTimeMs + allowedDurationMs;

        if (Date.now() < deadlineMs) {
          let { data: questions } = await supabase
            .from('questions')
            .select('id, question_text, question_type, options, marks, order_index')
            .eq('quiz_id', quiz.id)
            .order('order_index', { ascending: true });

          return {
            success: true,
            isResumed: true,
            attempt: {
              id: existingActive.id,
              quiz_id: quiz.id,
              quiz_title: quiz.title,
              instructions: quiz.instructions,
              duration_minutes: quiz.duration_minutes,
              start_time: existingActive.start_time,
              deadline: new Date(deadlineMs).toISOString(),
              show_score_immediately: quiz.show_score_immediately,
              show_correct_answers: quiz.show_correct_answers
            },
            questions: questions || []
          };
        }
      }

      const startTime = new Date().toISOString();
      const attemptRecord = {
        quiz_id: quiz.id,
        participant_name: name.trim(),
        participant_email: email || null,
        roll_number: rollNumber || null,
        department: department || null,
        year: year || null,
        college: college || null,
        start_time: startTime,
        status: 'in_progress'
      };

      const { data: insertedAttempt, error: attErr } = await supabase
        .from('attempts')
        .insert([attemptRecord])
        .select('*')
        .single();

      if (attErr) throw attErr;

      let { data: questions } = await supabase
        .from('questions')
        .select('id, question_text, question_type, options, marks, order_index')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      questions = questions || [];
      if (quiz.shuffle_questions) {
        questions = shuffleArray(questions);
      }
      if (quiz.shuffle_options) {
        questions = questions.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? shuffleArray(q.options) : q.options
        }));
      }

      const allowedDurationMs = (quiz.duration_minutes || 30) * 60 * 1000;
      const deadline = new Date(new Date(startTime).getTime() + allowedDurationMs).toISOString();

      return {
        success: true,
        attempt: {
          id: insertedAttempt.id,
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          instructions: quiz.instructions,
          duration_minutes: quiz.duration_minutes,
          start_time: startTime,
          deadline,
          show_score_immediately: quiz.show_score_immediately,
          show_correct_answers: quiz.show_correct_answers
        },
        questions
      };
    },

    getActive: async (attemptId) => {
      const { data: attempt, error: attErr } = await supabase
        .from('attempts')
        .select('*, quizzes(*)')
        .eq('id', attemptId)
        .single();

      if (attErr || !attempt) throw new Error('Attempt not found.');

      const quiz = attempt.quizzes;
      const startTimeMs = new Date(attempt.start_time).getTime();
      const allowedDurationMs = (quiz.duration_minutes || 30) * 60 * 1000;
      const deadline = new Date(startTimeMs + allowedDurationMs).toISOString();

      let { data: questions } = await supabase
        .from('questions')
        .select('id, question_text, question_type, options, marks, order_index')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      const { data: savedAnswers } = await supabase
        .from('answers')
        .select('question_id, selected_option')
        .eq('attempt_id', attemptId);

      const answersMap = {};
      (savedAnswers || []).forEach(a => {
        answersMap[a.question_id] = a.selected_option;
      });

      return {
        success: true,
        attempt: {
          id: attempt.id,
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          instructions: quiz.instructions,
          duration_minutes: quiz.duration_minutes,
          start_time: attempt.start_time,
          deadline,
          status: attempt.status,
          show_score_immediately: quiz.show_score_immediately,
          show_correct_answers: quiz.show_correct_answers
        },
        questions: questions || [],
        savedAnswers: answersMap
      };
    },

    saveResponse: async (attemptId, { questionId, selectedOption }) => {
      const { error } = await supabase
        .from('answers')
        .upsert(
          {
            attempt_id: attemptId,
            question_id: questionId,
            selected_option: selectedOption,
            answered_at: new Date().toISOString()
          },
          { onConflict: 'attempt_id,question_id' }
        );

      if (error) throw error;
      return { success: true };
    },

    syncBatch: async (attemptId, { answers }) => {
      if (!Array.isArray(answers) || answers.length === 0) return { success: true };

      const records = answers.map(a => ({
        attempt_id: attemptId,
        question_id: a.questionId,
        selected_option: a.selectedOption,
        answered_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('answers')
        .upsert(records, { onConflict: 'attempt_id,question_id' });

      if (error) throw error;
      return { success: true };
    },

    submit: async (attemptId) => {
      const { data: attempt, error: attErr } = await supabase
        .from('attempts')
        .select('*, quizzes(*)')
        .eq('id', attemptId)
        .single();

      if (attErr || !attempt) throw new Error('Attempt not found.');

      const quiz = attempt.quizzes;

      const { data: questions } = await supabase
        .from('questions')
        .select('id, correct_answer, marks')
        .eq('quiz_id', quiz.id);

      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('attempt_id', attemptId);

      const answerMap = new Map();
      (answers || []).forEach(a => answerMap.set(a.question_id, a));

      let totalScore = 0;
      let maxScore = 0;
      const gradedAnswers = [];

      (questions || []).forEach(q => {
        const qMarks = Number(q.marks) || 1;
        maxScore += qMarks;

        const studentAns = answerMap.get(q.id);
        const selected = studentAns?.selected_option || null;
        const isCorrect = selected !== null && selected === q.correct_answer;
        const awarded = isCorrect ? qMarks : 0;
        totalScore += awarded;

        gradedAnswers.push({
          attempt_id: attemptId,
          question_id: q.id,
          selected_option: selected,
          is_correct: isCorrect,
          marks_awarded: awarded,
          answered_at: studentAns?.answered_at || new Date().toISOString()
        });
      });

      if (gradedAnswers.length > 0) {
        await supabase
          .from('answers')
          .upsert(gradedAnswers, { onConflict: 'attempt_id,question_id' });
      }

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 100) / 100 : 0;

      const { data: updatedAttempt, error: updateErr } = await supabase
        .from('attempts')
        .update({
          status: 'submitted',
          end_time: new Date().toISOString(),
          total_score: totalScore,
          max_score: maxScore,
          percentage
        })
        .eq('id', attemptId)
        .select('*')
        .single();

      if (updateErr) throw updateErr;

      return {
        success: true,
        message: 'Quiz submitted successfully!',
        result: {
          attemptId: updatedAttempt.id,
          totalScore: updatedAttempt.total_score,
          maxScore: updatedAttempt.max_score,
          percentage: updatedAttempt.percentage,
          status: updatedAttempt.status,
          show_score_immediately: quiz.show_score_immediately,
          show_correct_answers: quiz.show_correct_answers
        }
      };
    },

    getResult: async (attemptId) => {
      const { data: attempt, error: attErr } = await supabase
        .from('attempts')
        .select('*, quizzes(*)')
        .eq('id', attemptId)
        .single();

      if (attErr || !attempt) throw new Error('Attempt not found.');

      const quiz = attempt.quizzes;

      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('attempt_id', attemptId);

      const answerMap = new Map();
      (answers || []).forEach(a => answerMap.set(a.question_id, a));

      const breakdown = (questions || []).map(q => {
        const a = answerMap.get(q.id);
        const item = {
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          selected_option: a ? a.selected_option : null,
          marks: q.marks,
          marks_awarded: a ? a.marks_awarded : 0,
          is_correct: a ? a.is_correct : false
        };

        if (quiz.show_correct_answers) {
          item.correct_answer = q.correct_answer;
          item.explanation = q.explanation;
        }

        return item;
      });

      return {
        success: true,
        attempt: {
          id: attempt.id,
          participant_name: attempt.participant_name,
          roll_number: attempt.roll_number,
          department: attempt.department,
          start_time: attempt.start_time,
          end_time: attempt.end_time,
          status: attempt.status,
          total_score: attempt.total_score,
          max_score: attempt.max_score,
          percentage: attempt.percentage
        },
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          show_score_immediately: quiz.show_score_immediately,
          show_correct_answers: quiz.show_correct_answers
        },
        breakdown
      };
    }
  },

  // ==========================================
  // 5. FACULTY RESULTS & ANALYTICS API
  // ==========================================
  results: {
    getAll: async (params = {}) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, title, quiz_code')
        .eq('faculty_id', current.id);

      const facultyQuizMap = new Map();
      (quizzes || []).forEach(q => facultyQuizMap.set(q.id, q));
      const facultyQuizIds = Array.from(facultyQuizMap.keys());

      if (facultyQuizIds.length === 0) {
        return { success: true, results: [], quizzes: [] };
      }

      let query = supabase
        .from('attempts')
        .select('*')
        .in('quiz_id', facultyQuizIds)
        .order('created_at', { ascending: false });

      if (params.quizId && params.quizId !== 'all') {
        query = query.eq('quiz_id', params.quizId);
      }
      if (params.department && params.department !== 'all') {
        query = query.ilike('department', `%${params.department}%`);
      }
      if (params.search) {
        query = query.or(`participant_name.ilike.%${params.search}%,roll_number.ilike.%${params.search}%,participant_email.ilike.%${params.search}%`);
      }

      const { data: attempts, error } = await query;
      if (error) throw error;

      const formattedResults = (attempts || []).map(att => {
        const qInfo = facultyQuizMap.get(att.quiz_id);
        return {
          ...att,
          quiz_title: qInfo ? qInfo.title : 'Unknown Quiz',
          quiz_code: qInfo ? qInfo.quiz_code : ''
        };
      });

      return {
        success: true,
        results: formattedResults,
        quizzes: quizzes || []
      };
    },

    getSubmissionDetail: async (attemptId) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { data: attempt, error: attErr } = await supabase
        .from('attempts')
        .select('*, quizzes!inner(*)')
        .eq('id', attemptId)
        .eq('quizzes.faculty_id', current.id)
        .single();

      if (attErr || !attempt) throw new Error('Submission not found or unauthorized.');

      const quiz = attempt.quizzes;

      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('attempt_id', attemptId);

      const answerMap = new Map();
      (answers || []).forEach(a => answerMap.set(a.question_id, a));

      const detailedBreakdown = (questions || []).map(q => {
        const a = answerMap.get(q.id);
        return {
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          selected_option: a ? a.selected_option : null,
          is_correct: a ? a.is_correct : false,
          marks_awarded: a ? a.marks_awarded : 0,
          marks: q.marks
        };
      });

      return {
        success: true,
        submission: {
          id: attempt.id,
          participant_name: attempt.participant_name,
          participant_email: attempt.participant_email,
          roll_number: attempt.roll_number,
          department: attempt.department,
          year: attempt.year,
          college: attempt.college,
          start_time: attempt.start_time,
          end_time: attempt.end_time,
          status: attempt.status,
          total_score: attempt.total_score,
          max_score: attempt.max_score,
          percentage: attempt.percentage,
          quiz_title: quiz.title,
          quiz_code: quiz.quiz_code,
          questions: detailedBreakdown
        }
      };
    },

    getAnalytics: async (quizId) => {
      const current = getCurrentFaculty();
      if (!current?.id) throw new Error('Unauthorized');

      const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('faculty_id', current.id)
        .single();

      if (quizErr || !quiz) throw new Error('Quiz not found.');

      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      const { data: attempts } = await supabase
        .from('attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .in('status', ['submitted', 'timed_out']);

      const attemptIds = (attempts || []).map(a => a.id);
      let answers = [];
      if (attemptIds.length > 0) {
        const { data: ansData } = await supabase
          .from('answers')
          .select('*')
          .in('attempt_id', attemptIds);
        answers = ansData || [];
      }

      const totalAttempts = (attempts || []).length;
      let totalScore = 0;
      let highestScore = 0;
      let lowestScore = totalAttempts > 0 ? 100 : 0;
      let scoreDistribution = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };

      (attempts || []).forEach(a => {
        const pct = Number(a.percentage || 0);
        totalScore += pct;
        if (pct > highestScore) highestScore = pct;
        if (pct < lowestScore) lowestScore = pct;

        if (pct <= 20) scoreDistribution['0-20%']++;
        else if (pct <= 40) scoreDistribution['21-40%']++;
        else if (pct <= 60) scoreDistribution['41-60%']++;
        else if (pct <= 80) scoreDistribution['61-80%']++;
        else scoreDistribution['81-100%']++;
      });

      const averageScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 10) / 10 : 0;

      // Question-level stats
      const questionStats = (questions || []).map(q => {
        const qAnswers = answers.filter(a => a.question_id === q.id);
        const correctCount = qAnswers.filter(a => a.is_correct).length;
        const totalAnswered = qAnswers.length;
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

        return {
          id: q.id,
          question_text: q.question_text,
          accuracy,
          correct_count: correctCount,
          total_answered: totalAnswered,
          difficulty: accuracy >= 70 ? 'Easy' : accuracy >= 40 ? 'Medium' : 'Hard'
        };
      });

      return {
        success: true,
        analytics: {
          quiz: {
            id: quiz.id,
            title: quiz.title,
            quiz_code: quiz.quiz_code,
            total_marks: quiz.total_marks
          },
          summary: {
            total_attempts: totalAttempts,
            average_score: averageScore,
            highest_score: highestScore,
            lowest_score: lowestScore,
            passing_rate: totalAttempts > 0 ? Math.round(((attempts.filter(a => Number(a.percentage || 0) >= 40).length) / totalAttempts) * 100) : 0
          },
          score_distribution: scoreDistribution,
          question_stats: questionStats
        }
      };
    }
  }
};

export default api;
