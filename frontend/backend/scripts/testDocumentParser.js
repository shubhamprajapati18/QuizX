const { parseQuestionsFromText, preprocessText } = require('../utils/documentParser');
const assert = require('assert');

console.log('--- Running Document Parser Tests ---\n');

// Test Case 1: Standard Question paper (DOCX auto-numbered list format extracted with numbers restored)
const docxSample1 = `
1. What is the main purpose of React?
A) Database management
B) Building user interfaces
C) Server-side routing only
D) Operating system kernel
Answer: B

2. Which hook is used for state management in React components?
A) useEffect
B) useContext
C) useState
D) useReducer
Ans: C

3. Which of the following is NOT a JavaScript data type?
A. String
B. Boolean
C. Float
D. Symbol
Answer: C
`;

const res1 = parseQuestionsFromText(docxSample1);
console.log(`Test 1 (DOCX Auto-numbered list format): Parsed ${res1.length} questions.`);
assert.strictEqual(res1.length, 3, 'Test 1 failed: Should extract 3 questions');
assert.strictEqual(res1[0].options.length, 4, 'Test 1 Q1 failed: Should have 4 options');
assert.strictEqual(res1[0].correct_answer, 'opt_2', 'Test 1 Q1 correct answer failed');
assert.strictEqual(res1[1].options.length, 4, 'Test 1 Q2 failed: Should have 4 options');
assert.strictEqual(res1[1].correct_answer, 'opt_3', 'Test 1 Q2 correct answer failed');
console.log('✓ Test 1 Passed!\n');

// Test Case 2: Single-line options format (e.g. A) Opt1   B) Opt2   C) Opt3   D) Opt4)
const docxSample2 = `
Q1: What does HTML stand for?
A) HyperText Markup Language   B) HighText Machine Language   C) Hyperlink Text Language   D) Home Tool Markup Language
Answer: A

Q2: Which CSS property changes text color?
A. font-color   B. text-color   C. color   D. style-color
Answer: C
`;

const res2 = parseQuestionsFromText(docxSample2);
console.log(`Test 2 (Single-line options format): Parsed ${res2.length} questions.`);
assert.strictEqual(res2.length, 2, 'Test 2 failed: Should extract 2 questions');
assert.strictEqual(res2[0].options.length, 4, 'Test 2 Q1 failed: Should extract 4 single-line options');
assert.strictEqual(res2[0].options[0].text, 'HyperText Markup Language');
assert.strictEqual(res2[0].options[1].text, 'HighText Machine Language');
assert.strictEqual(res2[1].options.length, 4, 'Test 2 Q2 failed: Should extract 4 single-line options');
assert.strictEqual(res2[1].correct_answer, 'opt_3', 'Test 2 Q2 correct answer failed');
console.log('✓ Test 2 Passed!\n');

// Test Case 3: Auto-numbered DOCX without question numbers, with duplicate option key reset
const docxSample3 = `
What is Node.js?
A) JavaScript Runtime
B) Database Engine
C) CSS Framework
D) Web Browser

What is Express.js?
A) Database ORM
B) Web Application Framework for Node.js
C) Template Engine
D) Programming Language
`;

const res3 = parseQuestionsFromText(docxSample3);
console.log(`Test 3 (DOCX Without explicit Q numbers & duplicate key boundary): Parsed ${res3.length} questions.`);
assert.strictEqual(res3.length, 2, 'Test 3 failed: Should extract 2 questions despite missing Q numbers');
assert.strictEqual(res3[0].options.length, 4, 'Test 3 Q1 failed');
assert.strictEqual(res3[1].options.length, 4, 'Test 3 Q2 failed');
console.log('✓ Test 3 Passed!\n');

// Test Case 4: Global Answer Key at bottom of document
const docxSample4 = `
Q1. Which HTTP method is idempotent?
A) POST
B) GET
C) PATCH
D) CONNECT

Q2. What status code represents 200 OK?
A) 404
B) 500
C) 200
D) 301

Answer Key:
1. B
2. C
`;

const res4 = parseQuestionsFromText(docxSample4);
console.log(`Test 4 (Global Answer Key at end): Parsed ${res4.length} questions.`);
assert.strictEqual(res4.length, 2, 'Test 4 failed');
assert.strictEqual(res4[0].correct_answer, 'opt_2', 'Test 4 Q1 answer key failed');
assert.strictEqual(res4[1].correct_answer, 'opt_3', 'Test 4 Q2 answer key failed');
console.log('✓ Test 4 Passed!\n');

// Test Case 5: Completely un-numbered DOCX question blocks (No Q1. or A) prefixes)
const docxSample5 = `
What is the primary function of HTML?
Hypertext Markup Language
High Text Machine Language
Hyperlink Transfer Text
Home Tool Markup

What does CSS stand for?
Cascading Style Sheets
Computer Style System
Control Sheet Style
Creative Styling System
`;

const res5 = parseQuestionsFromText(docxSample5);
console.log(`Test 5 (Completely un-numbered DOCX question blocks): Parsed ${res5.length} questions.`);
assert.strictEqual(res5.length, 2, 'Test 5 failed: Should extract 2 questions from un-numbered blocks');
assert.strictEqual(res5[0].options.length, 4, 'Test 5 Q1 failed');
assert.strictEqual(res5[1].options.length, 4, 'Test 5 Q2 failed');
console.log('✓ Test 5 Passed!\n');

console.log('ALL DOCUMENT PARSER TESTS PASSED SUCCESSFULLY! 🎉');

