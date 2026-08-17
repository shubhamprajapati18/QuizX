const supabase = require('../config/supabase');

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

// 1. Get Faculty Dashboard Stats & Recent Activity
exports.getFacultyDashboardStats = async (req, res) => {
  try {
    const facultyId = req.faculty.id;

    // Fetch all quizzes for this faculty
    const { data: quizzes, error: quizErr } = await supabase
      .from('quizzes')
      .select('id, status, total_marks, created_at')
      .eq('faculty_id', facultyId);

    if (quizErr) throw quizErr;

    const quizIds = (quizzes || []).map(q => q.id);

    let totalSubmissions = 0;
    let totalParticipants = 0;
    let totalScoreSum = 0;
    let totalMaxScoreSum = 0;
    let recentSubmissions = [];

    if (quizIds.length > 0) {
      // Fetch attempts for these quizzes
      const { data: attempts, error: attErr } = await supabase
        .from('attempts')
        .select('id, quiz_id, participant_name, roll_number, department, total_score, max_score, percentage, status, created_at')
        .in('quiz_id', quizIds)
        .order('created_at', { ascending: false });

      if (!attErr && attempts) {
        totalSubmissions = attempts.filter(a => a.status === 'submitted' || a.status === 'timed_out').length;
        
        // Count unique participants by name/roll
        const uniqueParticipants = new Set(attempts.map(a => `${a.participant_name}-${a.roll_number || ''}`));
        totalParticipants = uniqueParticipants.size;

        const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'timed_out');
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

    return res.status(200).json({
      success: true,
      stats: {
        totalQuizzes,
        activeQuizzes,
        totalParticipants,
        totalSubmissions,
        avgScorePercentage
      },
      recentSubmissions
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute dashboard stats.' });
  }
};

// 2. Get All Quizzes for Authenticated Faculty
exports.getFacultyQuizzes = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { status, search } = req.query;

    let query = supabase
      .from('quizzes')
      .select(`
        *,
        questions (count),
        attempts (count)
      `)
      .eq('faculty_id', facultyId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: quizzes, error } = await query;

    if (error) throw error;

    // Transform counts cleanly
    const formattedQuizzes = (quizzes || []).map(q => ({
      ...q,
      question_count: q.questions ? q.questions[0]?.count || 0 : 0,
      participant_count: q.attempts ? q.attempts[0]?.count || 0 : 0
    }));

    return res.status(200).json({ success: true, quizzes: formattedQuizzes });
  } catch (error) {
    console.error('Fetch Quizzes Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch quizzes.' });
  }
};

// 3. Get Single Quiz Details (Faculty View with Questions & Answers)
exports.getQuizById = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { id } = req.params;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .single();

    if (error || !quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized.' });
    }

    // Fetch Questions ordered by order_index
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index', { ascending: true });

    if (qErr) throw qErr;

    return res.status(200).json({
      success: true,
      quiz: {
        ...quiz,
        questions: questions || []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving quiz details.' });
  }
};

// 4. Get Quiz Public Info for Student Access (No Correct Answers!)
exports.getQuizByCodePublic = async (req, res) => {
  try {
    const { quizCode } = req.params;

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
      .eq('quiz_code', quizCode.toUpperCase())
      .single();

    if (error || !quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found. Please verify the quiz code or link.' });
    }

    return res.status(200).json({
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
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving quiz.' });
  }
};

// 5. Create Quiz
exports.createQuiz = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
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
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Quiz title is required.' });
    }

    let code = generateQuizCode();
    // Ensure uniqueness
    const { data: existingCode } = await supabase.from('quizzes').select('id').eq('quiz_code', code).single();
    if (existingCode) {
      code = generateQuizCode();
    }

    // Calculate total marks
    const totalMarks = (questions || []).reduce((acc, q) => acc + (Number(q.marks) || 1), 0);

    const newQuiz = {
      quiz_code: code,
      faculty_id: facultyId,
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

    if (quizErr) {
      console.error('Create Quiz Error:', quizErr);
      return res.status(500).json({ success: false, message: 'Failed to create quiz record.', error: quizErr.message });
    }

    // Insert Questions if provided
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

      const { error: qErr } = await supabase.from('questions').insert(questionRecords);
      if (qErr) {
        console.error('Error inserting questions:', qErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully!',
      quiz: insertedQuiz
    });
  } catch (error) {
    console.error('Create Quiz Catch Error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating quiz.' });
  }
};

// 6. Update Quiz & Questions
exports.updateQuiz = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { id } = req.params;
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
    } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized.' });
    }

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
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to update quiz settings.' });
    }

    // Replace Questions if passed
    if (questions) {
      // Delete existing questions
      await supabase.from('questions').delete().eq('quiz_id', id);

      // Insert new question list
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

    return res.status(200).json({
      success: true,
      message: 'Quiz updated successfully!',
      quiz: updatedQuiz
    });
  } catch (error) {
    console.error('Update Quiz Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating quiz.' });
  }
};

// 7. Duplicate Quiz
exports.duplicateQuiz = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { id } = req.params;

    // Fetch original quiz
    const { data: originalQuiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .single();

    if (!originalQuiz) {
      return res.status(404).json({ success: false, message: 'Original quiz not found.' });
    }

    // Fetch original questions
    const { data: originalQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index', { ascending: true });

    let newCode = generateQuizCode();

    const clonedQuiz = {
      quiz_code: newCode,
      faculty_id: facultyId,
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

    return res.status(201).json({
      success: true,
      message: 'Quiz duplicated successfully!',
      quiz: newQuiz
    });
  } catch (error) {
    console.error('Duplicate Quiz Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to duplicate quiz.' });
  }
};

// 8. Publish / Unpublish / Toggle Status
exports.toggleQuizPublishStatus = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { id } = req.params;
    const { status, is_published } = req.body;

    const newStatus = status || (is_published ? 'live' : 'draft');

    const { data: updated, error } = await supabase
      .from('quizzes')
      .update({
        status: newStatus,
        is_published: newStatus === 'live' || newStatus === 'scheduled'
      })
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .select('*')
      .single();

    if (error || !updated) {
      return res.status(404).json({ success: false, message: 'Quiz not found or update failed.' });
    }

    return res.status(200).json({
      success: true,
      message: `Quiz status set to ${newStatus}.`,
      quiz: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update publish status.' });
  }
};

// 9. Delete Quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)
      .eq('faculty_id', facultyId);

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete quiz.' });
    }

    return res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting quiz.' });
  }
};
