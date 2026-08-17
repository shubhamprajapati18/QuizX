const supabase = require('../config/supabase');

// 1. Get Faculty Results List (with Filters)
exports.getFacultyResults = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { quizId, department, search } = req.query;

    // Fetch quiz IDs owned by faculty
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title, quiz_code')
      .eq('faculty_id', facultyId);

    const facultyQuizMap = new Map();
    (quizzes || []).forEach(q => facultyQuizMap.set(q.id, q));

    const facultyQuizIds = Array.from(facultyQuizMap.keys());

    if (facultyQuizIds.length === 0) {
      return res.status(200).json({ success: true, results: [], quizzes: [] });
    }

    let query = supabase
      .from('attempts')
      .select('*')
      .in('quiz_id', facultyQuizIds)
      .order('created_at', { ascending: false });

    if (quizId && quizId !== 'all') {
      query = query.eq('quiz_id', quizId);
    }

    if (department && department !== 'all') {
      query = query.ilike('department', `%${department}%`);
    }

    if (search) {
      query = query.or(`participant_name.ilike.%${search}%,roll_number.ilike.%${search}%,participant_email.ilike.%${search}%`);
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

    return res.status(200).json({
      success: true,
      results: formattedResults,
      quizzes: quizzes || []
    });
  } catch (error) {
    console.error('Fetch Results Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student results.' });
  }
};

// 2. Get Detailed Submission View for Faculty Inspection
exports.getSubmissionDetail = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { attemptId } = req.params;

    // Fetch attempt + verify faculty ownership via quiz
    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('*, quizzes!inner(*)')
      .eq('id', attemptId)
      .eq('quizzes.faculty_id', facultyId)
      .single();

    if (attErr || !attempt) {
      return res.status(404).json({ success: false, message: 'Submission not found or unauthorized.' });
    }

    const quiz = attempt.quizzes;

    // Fetch questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    // Fetch student's answers
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('attempt_id', attemptId);

    const answerMap = new Map();
    (answers || []).forEach(a => answerMap.set(a.question_id, a));

    const questionBreakdown = (questions || []).map(q => {
      const studentAns = answerMap.get(q.id);
      return {
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        explanation: q.explanation,
        selected_option: studentAns ? studentAns.selected_option : null,
        is_correct: studentAns ? studentAns.is_correct : false,
        marks_awarded: studentAns ? studentAns.marks_awarded : 0
      };
    });

    return res.status(200).json({
      success: true,
      submission: {
        id: attempt.id,
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        participant_name: attempt.participant_name,
        participant_email: attempt.participant_email,
        roll_number: attempt.roll_number,
        department: attempt.department,
        year: attempt.year,
        college: attempt.college,
        total_score: attempt.total_score,
        max_score: attempt.max_score,
        percentage: attempt.percentage,
        status: attempt.status,
        start_time: attempt.start_time,
        end_time: attempt.end_time,
        questions: questionBreakdown
      }
    });
  } catch (error) {
    console.error('Submission detail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve submission details.' });
  }
};

// 3. Get Comprehensive Quiz Analytics
exports.getQuizAnalytics = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { quizId } = req.params;

    // Fetch quiz & verify ownership
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('faculty_id', facultyId)
      .single();

    if (quizErr || !quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized.' });
    }

    // Fetch all attempts for this quiz
    const { data: attempts } = await supabase
      .from('attempts')
      .select('*')
      .eq('quiz_id', quizId);

    const completedAttempts = (attempts || []).filter(a => a.status === 'submitted' || a.status === 'timed_out');
    const totalParticipants = (attempts || []).length;
    const completedCount = completedAttempts.length;

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = completedCount > 0 ? Number(completedAttempts[0].total_score || 0) : 0;
    let passedCount = 0; // >= 50%

    completedAttempts.forEach(a => {
      const score = Number(a.total_score || 0);
      totalScore += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;
      if (Number(a.percentage || 0) >= 50) passedCount++;
    });

    const averageScore = completedCount > 0 ? Number((totalScore / completedCount).toFixed(1)) : 0;
    const passPercentage = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0;

    // Fetch questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    // Fetch all answers for these attempts
    const attemptIds = completedAttempts.map(a => a.id);
    let answers = [];
    if (attemptIds.length > 0) {
      const { data: ansData } = await supabase
        .from('answers')
        .select('*')
        .in('attempt_id', attemptIds);
      answers = ansData || [];
    }

    // Map question statistics
    const questionAnalytics = (questions || []).map(q => {
      const qAnswers = answers.filter(a => a.question_id === q.id);
      const answeredCount = qAnswers.length;
      const correctCount = qAnswers.filter(a => a.is_correct).length;
      const accuracyRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

      // Option selection breakdown
      const optionDistribution = {};
      (q.options || []).forEach(opt => {
        const count = qAnswers.filter(a => a.selected_option === opt.id || a.selected_option === opt.text).length;
        optionDistribution[opt.text] = count;
      });

      return {
        id: q.id,
        question_text: q.question_text,
        marks: q.marks,
        correct_answer: q.correct_answer,
        answered_count: answeredCount,
        correct_count: correctCount,
        incorrect_count: answeredCount - correctCount,
        accuracy_rate: accuracyRate,
        option_distribution: optionDistribution
      };
    });

    return res.status(200).json({
      success: true,
      analytics: {
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        quiz_code: quiz.quiz_code,
        total_marks: quiz.total_marks,
        total_participants: totalParticipants,
        completed_attempts: completedCount,
        average_score: averageScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
        pass_percentage: passPercentage,
        questions: questionAnalytics
      }
    });
  } catch (error) {
    console.error('Quiz Analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute analytics.' });
  }
};
