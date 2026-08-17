const http = require('http');

// Helper to make JSON request
function postJson(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
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
    req.write(payload);
    req.end();
  });
}

async function runTest() {
  console.log('--- Testing Quiz Creation & Student Attempt Flow ---');

  // 1. Login Faculty
  const loginRes = await postJson('/api/auth/login', {
    email: 'professor@university.edu',
    password: 'password123'
  });

  if (!loginRes.body.success) {
    console.error('Login failed:', loginRes.body);
    return;
  }
  const token = loginRes.body.token;
  console.log('Faculty logged in successfully.');

  // 2. Create Live Quiz with start_time = now
  const nowIso = new Date().toISOString();
  const createRes = await postJson('/api/quizzes', {
    title: 'Test Live Exam ' + Date.now(),
    description: 'Automated test quiz',
    duration_minutes: 30,
    start_time: nowIso,
    status: 'live',
    is_published: true,
    questions: [
      {
        question_text: 'What is 2 + 2?',
        options: [{ id: 'opt_1', text: '4' }, { id: 'opt_2', text: '5' }],
        correct_answer: 'opt_1',
        marks: 1
      }
    ]
  }, token);

  console.log('Create quiz res status:', createRes.status, 'quiz:', JSON.stringify(createRes.body.quiz));
  const quiz = createRes.body.quiz;

  // 3. Start Student Attempt
  const attemptRes = await postJson('/api/attempts/start', {
    quizId: quiz.id,
    name: 'Student Test User',
    rollNumber: 'ROLL-101',
    department: 'CSE'
  });

  console.log('Start attempt res status:', attemptRes.status, 'success:', attemptRes.body.success, 'msg:', attemptRes.body.message);

  if (attemptRes.body.success) {
    console.log('✅ SUCCESS! Student attempt started without "has not started yet" error!');
  } else {
    console.error('❌ FAILED:', attemptRes.body);
  }
}

runTest();
