const http = require('http');

function requestJson(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function testPersistenceFlow() {
  console.log('=== TESTING QUIZX ATTEMPT PERSISTENCE & RECOVERY ===');

  // 1. Faculty Login
  const login = await requestJson('/api/auth/login', 'POST', {
    email: 'professor@university.edu',
    password: 'password123'
  });
  const token = login.body.token;

  // 2. Create Live Quiz
  const quizRes = await requestJson('/api/quizzes', 'POST', {
    title: 'Persistence Test Exam ' + Date.now(),
    duration_minutes: 45,
    status: 'live',
    is_published: true,
    questions: [
      { question_text: 'What is 10 + 10?', options: [{ id: 'opt_1', text: '20' }, { id: 'opt_2', text: '30' }], correct_answer: 'opt_1', marks: 2 },
      { question_text: 'What is the capital of France?', options: [{ id: 'opt_a', text: 'Paris' }, { id: 'opt_b', text: 'London' }], correct_answer: 'opt_a', marks: 2 }
    ]
  }, token);

  const quiz = quizRes.body.quiz;
  console.log('1. Live Quiz Created. Code:', quiz.quiz_code);

  // 3. Start Student Attempt
  const attemptRes = await requestJson('/api/attempts/start', 'POST', {
    quizId: quiz.id,
    name: 'Persistent Student'
  });

  const attemptId = attemptRes.body.attempt.id;
  const q1Id = attemptRes.body.questions[0].id;
  const q2Id = attemptRes.body.questions[1].id;
  console.log('2. Student Attempt Started. Attempt ID:', attemptId);

  // 4. Progressive Answer Save
  await requestJson(`/api/attempts/${attemptId}/save-response`, 'POST', {
    questionId: q1Id,
    selectedOption: 'opt_1'
  });
  console.log('3. Answer 1 Saved Progressively.');

  // 5. Batch Sync Answer 2 (Offline Sync Recovery)
  await requestJson(`/api/attempts/${attemptId}/sync-batch`, 'POST', {
    answers: [{ questionId: q2Id, selectedOption: 'opt_a' }]
  });
  console.log('4. Answer 2 Batch Synced.');

  // 6. Test Active Attempt Recovery (Page Refresh Simulation)
  const activeRes = await requestJson(`/api/attempts/${attemptId}/active`, 'GET');
  console.log('5. Active Attempt Restored on Refresh:');
  console.log('   - Remaining Seconds:', activeRes.body.attempt.remainingSeconds);
  console.log('   - Saved Answers:', activeRes.body.savedAnswers);

  const answersRestored = activeRes.body.savedAnswers[q1Id] === 'opt_1' && activeRes.body.savedAnswers[q2Id] === 'opt_a';
  if (answersRestored && activeRes.body.attempt.remainingSeconds > 0) {
    console.log('✅ ALL PERSISTENCE TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ PERSISTENCE TEST FAILED:', activeRes.body);
  }
}

testPersistenceFlow();
