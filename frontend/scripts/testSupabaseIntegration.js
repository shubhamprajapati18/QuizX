import { createClient } from '@supabase/supabase-js';
import assert from 'assert';

const SUPABASE_URL = 'https://ctukkfgzyzkpghgjvpwl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dWtrZmd6eXprcGdoZ2p2cHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTM1NDMsImV4cCI6MjEwMTg2OTU0M30.tUWHUYAm8cHViJCxqicMy0jg5xWT80VuTRteVl-AtoA';

console.log('--- Testing Frontend Direct Supabase Integration ---\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  // Test 1: Fetch Faculties
  console.log('Test 1: Querying faculties table...');
  const { data: faculties, error: facErr } = await supabase.from('faculties').select('id, name, email').limit(2);
  assert.strictEqual(facErr, null, 'Faculty query error');
  assert.ok(faculties && faculties.length > 0, 'No faculties returned');
  console.log(`✓ Fetched ${faculties.length} faculty records successfully.\n`);

  // Test 2: Fetch Quizzes
  console.log('Test 2: Querying quizzes table with relations...');
  const { data: quizzes, error: qErr } = await supabase
    .from('quizzes')
    .select(`
      id,
      quiz_code,
      title,
      questions (count),
      attempts (count)
    `)
    .limit(3);

  assert.strictEqual(qErr, null, 'Quiz query error');
  assert.ok(quizzes && quizzes.length > 0, 'No quizzes returned');
  console.log(`✓ Fetched ${quizzes.length} quiz records with relational counts:`);
  quizzes.forEach(q => console.log(`  - [${q.quiz_code}] ${q.title} (Questions: ${q.questions?.[0]?.count || 0}, Attempts: ${q.attempts?.[0]?.count || 0})`));
  console.log('');

  // Test 3: Public Quiz Code lookup
  console.log('Test 3: Querying public quiz by code...');
  const targetCode = quizzes[0].quiz_code;
  const { data: publicQuiz, error: pubErr } = await supabase
    .from('quizzes')
    .select('id, quiz_code, title, duration_minutes, faculties(name, institution)')
    .eq('quiz_code', targetCode)
    .single();

  assert.strictEqual(pubErr, null, 'Public quiz query error');
  assert.strictEqual(publicQuiz.quiz_code, targetCode, 'Quiz code mismatch');
  console.log(`✓ Retrieved public quiz [${publicQuiz.quiz_code}] "${publicQuiz.title}" by ${publicQuiz.faculties?.name || 'Educator'}.\n`);

  console.log('ALL SUPABASE DIRECT INTEGRATION TESTS PASSED CLEANLY! 🎉');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
