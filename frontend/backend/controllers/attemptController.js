const supabase = require('../config/supabase');

// Helper to shuffle array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 1. Start Quiz Attempt (with duplicate active attempt check)
exports.startAttempt = async (req, res) => {
  try {
    const { quizId, accessCode, name, email, rollNumber, department, year, college } = req.body;

    if (!quizId || !name) {
      return res.status(400).json({ success: false, message: 'Quiz ID and Student Name are required.' });
    }

    // Fetch Quiz
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizErr || !quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (!quiz.is_published || quiz.status === 'closed' || quiz.status === 'archived' || quiz.status === 'draft') {
      return res.status(400).json({ success: false, message: 'This quiz is not currently accepting responses.' });
    }

    // Check Access Code if required
    if (quiz.access_code && quiz.access_code.trim() !== '') {
      if (!accessCode || accessCode.trim() !== quiz.access_code.trim()) {
        return res.status(401).json({ success: false, message: 'Invalid Quiz Access Passcode.' });
      }
    }

    // Check time window with 2-minute tolerance buffer for timezone/clock skew
    const now = new Date();
    if (quiz.start_time) {
      const startTime = new Date(quiz.start_time);
      if (startTime.getTime() - now.getTime() > 120000) {
        const timeStr = startTime.toLocaleString();
        return res.status(400).json({
          success: false,
          message: `This quiz has not started yet. (Scheduled to start at ${timeStr})`
        });
      }
    }
    if (quiz.end_time) {
      const endTime = new Date(quiz.end_time);
      if (endTime.getTime() < now.getTime()) {
        const endStr = endTime.toLocaleString();
        return res.status(400).json({
          success: false,
          message: `This quiz has closed. (Ended at ${endStr})`
        });
      }
    }

    // Prevent duplicate attempts: Check if student already has an active attempt in progress
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

        return res.status(200).json({
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
        });
      }
    }

    // Create new Attempt record with server timestamp
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

    if (attErr) {
      console.error('Start attempt error:', attErr);
      return res.status(500).json({ success: false, message: 'Failed to start quiz attempt.' });
    }

    // Fetch Questions
    let { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, question_text, question_type, options, marks, order_index')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    if (qErr) throw qErr;

    questions = questions || [];

    if (quiz.shuffle_questions) {
      questions = shuffleArray(questions);
    }
    if (quiz.shuffle_options) {
      questions = questions.map(q => ({
        ...q,
        options: shuffleArray(q.options || [])
      }));
    }

    const allowedDurationMs = (quiz.duration_minutes || 30) * 60 * 1000;
    const deadline = new Date(new Date(startTime).getTime() + allowedDurationMs).toISOString();

    return res.status(201).json({
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
    });
  } catch (error) {
    console.error('Start attempt catch error:', error);
    return res.status(500).json({ success: false, message: 'Server error starting attempt.' });
  }
};

// 2. Get Active Attempt Details & Restorable Answers (Resume on Refresh)
exports.getActiveAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    if (!attemptId) {
      return res.status(400).json({ success: false, message: 'Attempt ID is required.' });
    }

    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .single();

    if (attErr || !attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const quiz = attempt.quizzes;

    if (attempt.status !== 'in_progress') {
      return res.status(200).json({
        success: true,
        status: attempt.status,
        isCompleted: true,
        attempt: { id: attempt.id, quiz_id: attempt.quiz_id }
      });
    }

    // Calculate deadline strictly from server start_time + duration_minutes
    const startTimeMs = new Date(attempt.start_time).getTime();
    const durationMs = (quiz.duration_minutes || 30) * 60 * 1000;
    const deadlineMs = startTimeMs + durationMs;
    const nowMs = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));

    if (remainingSeconds <= 0) {
      await supabase.from('attempts').update({ status: 'timed_out' }).eq('id', attempt.id);
      return res.status(200).json({
        success: true,
        status: 'timed_out',
        isCompleted: true,
        message: 'Exam duration has expired.',
        attempt: { id: attempt.id, quiz_id: attempt.quiz_id }
      });
    }

    // Fetch questions
    let { data: questions } = await supabase
      .from('questions')
      .select('id, question_text, question_type, options, marks, order_index')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    questions = questions || [];

    // Fetch existing saved answers for this attempt
    const { data: savedAnswers } = await supabase
      .from('answers')
      .select('question_id, selected_option, answered_at')
      .eq('attempt_id', attempt.id);

    const answersMap = {};
    (savedAnswers || []).forEach(a => {
      answersMap[a.question_id] = a.selected_option;
    });

    return res.status(200).json({
      success: true,
      status: 'in_progress',
      isCompleted: false,
      attempt: {
        id: attempt.id,
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        instructions: quiz.instructions,
        duration_minutes: quiz.duration_minutes,
        start_time: attempt.start_time,
        deadline: new Date(deadlineMs).toISOString(),
        remainingSeconds,
        participant_name: attempt.participant_name,
        show_score_immediately: quiz.show_score_immediately,
        show_correct_answers: quiz.show_correct_answers
      },
      questions,
      savedAnswers: answersMap
    });
  } catch (error) {
    console.error('getActiveAttempt error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving active attempt.' });
  }
};

// 3. Progressive Auto-Save Answer
exports.saveResponse = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption } = req.body;

    if (!attemptId || !questionId) {
      return res.status(400).json({ success: false, message: 'Attempt ID and Question ID are required.' });
    }

    const { data: attempt } = await supabase
      .from('attempts')
      .select('id, status')
      .eq('id', attemptId)
      .single();

    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Attempt is no longer active.' });
    }

    const answerObj = {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option: selectedOption || '',
      answered_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('answers')
      .upsert(answerObj, { onConflict: 'attempt_id,question_id' });

    if (error) {
      console.error('Save response error:', error);
      return res.status(500).json({ success: false, message: 'Failed to save response.' });
    }

    return res.status(200).json({ success: true, message: 'Response saved progressively.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error saving answer.' });
  }
};

// 4. Batch Sync Answers (Reconnection / Offline recovery)
exports.syncBatch = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOption }

    if (!attemptId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Attempt ID and array of answers are required.' });
    }

    const { data: attempt } = await supabase
      .from('attempts')
      .select('id, status')
      .eq('id', attemptId)
      .single();

    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Attempt is no longer active.' });
    }

    const records = answers.map(a => ({
      attempt_id: attemptId,
      question_id: a.questionId,
      selected_option: a.selectedOption || '',
      answered_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('answers')
      .upsert(records, { onConflict: 'attempt_id,question_id' });

    if (error) {
      console.error('syncBatch error:', error);
      return res.status(500).json({ success: false, message: 'Failed to batch sync answers.' });
    }

    return res.status(200).json({ success: true, message: 'Answers batch synchronized successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error syncing batch answers.' });
  }
};

// 5. Final Submission & Evaluation
exports.submitAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('*, quizzes (*)')
      .eq('id', attemptId)
      .single();

    if (attErr || !attempt) {
      return res.status(404).json({ success: false, message: 'Attempt record not found.' });
    }

    if (attempt.status === 'submitted') {
      return res.status(200).json({
        success: true,
        message: 'Attempt was already submitted.',
        attemptId: attempt.id
      });
    }

    // Fetch all questions for this quiz
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', attempt.quiz_id);

    // Fetch all student saved answers
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('attempt_id', attempt.id);

    const answersMap = {};
    (answers || []).forEach(a => {
      answersMap[a.question_id] = a;
    });

    let totalScore = 0;
    let maxScore = 0;

    (questions || []).forEach(q => {
      const qMarks = Number(q.marks) || 1;
      maxScore += qMarks;

      const studentAns = answersMap[q.id];
      if (studentAns) {
        const isCorrect = studentAns.selected_option === q.correct_answer;
        const marksAwarded = isCorrect ? qMarks : 0;
        if (isCorrect) totalScore += qMarks;

        supabase
          .from('answers')
          .update({ is_correct: isCorrect, marks_awarded: marksAwarded })
          .eq('id', studentAns.id)
          .then();
      }
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const endTime = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('attempts')
      .update({
        status: 'submitted',
        end_time: endTime,
        total_score: totalScore,
        max_score: maxScore,
        percentage: Number(percentage.toFixed(2))
      })
      .eq('id', attemptId);

    if (updateErr) {
      console.error('Submit attempt update error:', updateErr);
      return res.status(500).json({ success: false, message: 'Failed to record attempt submission.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz attempt submitted successfully.',
      attemptId,
      totalScore,
      maxScore,
      percentage: Number(percentage.toFixed(2))
    });
  } catch (error) {
    console.error('Submit attempt catch error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting attempt.' });
  }
};

// 6. Get Student Result & Detailed Breakdown
exports.getStudentResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('*, quizzes (*)')
      .eq('id', attemptId)
      .single();

    if (attErr || !attempt) {
      return res.status(404).json({ success: false, message: 'Attempt result not found.' });
    }

    const quiz = attempt.quizzes;

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', attempt.quiz_id)
      .order('order_index', { ascending: true });

    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('attempt_id', attempt.id);

    const answersMap = {};
    (answers || []).forEach(a => {
      answersMap[a.question_id] = a;
    });

    const questionBreakdown = (questions || []).map(q => {
      const studentAns = answersMap[q.id];
      return {
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        marks: q.marks,
        selected_option: studentAns ? studentAns.selected_option : null,
        correct_answer: quiz.show_correct_answers ? q.correct_answer : null,
        is_correct: studentAns ? studentAns.is_correct : false,
        marks_awarded: studentAns ? studentAns.marks_awarded : 0,
        explanation: quiz.show_correct_answers ? q.explanation : null
      };
    });

    return res.status(200).json({
      success: true,
      result: {
        attemptId: attempt.id,
        quizTitle: quiz.title,
        quizCode: quiz.quiz_code,
        participantName: attempt.participant_name,
        participantEmail: attempt.participant_email,
        rollNumber: attempt.roll_number,
        department: attempt.department,
        startTime: attempt.start_time,
        endTime: attempt.end_time,
        status: attempt.status,
        totalScore: attempt.total_score,
        maxScore: attempt.max_score,
        percentage: attempt.percentage,
        showScoreImmediately: quiz.show_score_immediately,
        showCorrectAnswers: quiz.show_correct_answers,
        questions: quiz.show_correct_answers || quiz.show_score_immediately ? questionBreakdown : []
      }
    });
  } catch (error) {
    console.error('getStudentResult error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving result.' });
  }
};
