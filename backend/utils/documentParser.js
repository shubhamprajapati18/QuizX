const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from uploaded PDF or DOCX file buffer
 */
async function extractTextFromBuffer(buffer, mimetype) {
  if (mimetype.includes('pdf')) {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (mimetype.includes('wordprocessingml') || mimetype.includes('docx') || mimetype.includes('doc')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    // Fallback to plain text
    return buffer.toString('utf-8');
  }
}

/**
 * Smart Regex Parser to convert plain text question paper into structured questions & options
 */
function parseQuestionsFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Normalize line endings
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  const questions = [];
  let currentQuestion = null;

  // Regex patterns
  const questionHeaderRegex = /^(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s+(.*)/i;
  const optionRegex = /^(?:[\(\[]?([A-Da-d1-4])[\.\)\]]\s*|\b([A-Da-d])[\.\)]\s*)(.*)/;
  const answerHeaderRegex = /^(?:Answer|Ans|Correct Answer|Correct)\s*[:\-]?\s*([A-Da-d1-4]|.*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line starts a new question (e.g. "1. What is...", "Q2: Explain...")
    const qMatch = line.match(questionHeaderRegex);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        questions.push(finalizeQuestion(currentQuestion));
      }
      currentQuestion = {
        question_text: qMatch[1] || line,
        options: [],
        correct_answer: '',
        marks: 1
      };
      continue;
    }

    // Check if line is an option (e.g. "A) React", "B. Vue", "(C) Angular")
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      const optKey = (optMatch[1] || optMatch[2] || '').toUpperCase();
      const optText = optMatch[3] || line;
      currentQuestion.options.push({
        id: `opt_${currentQuestion.options.length + 1}`,
        text: optText,
        key: optKey
      });
      continue;
    }

    // Check if line indicates correct answer (e.g. "Answer: B")
    const ansMatch = line.match(answerHeaderRegex);
    if (ansMatch && currentQuestion) {
      currentQuestion.correct_answer = ansMatch[1].trim();
      continue;
    }

    // If currentQuestion exists and line isn't a new Q/Option, append to current question text or last option
    if (currentQuestion) {
      if (currentQuestion.options.length === 0) {
        currentQuestion.question_text += ' ' + line;
      } else {
        // append to last option text
        const lastOpt = currentQuestion.options[currentQuestion.options.length - 1];
        lastOpt.text += ' ' + line;
      }
    } else {
      // Create first question if text starts without Q1 prefix
      if (line.length > 5 && !line.toLowerCase().startsWith('quiz') && !line.toLowerCase().startsWith('test')) {
        currentQuestion = {
          question_text: line,
          options: [],
          correct_answer: '',
          marks: 1
        };
      }
    }
  }

  if (currentQuestion && currentQuestion.options.length >= 2) {
    questions.push(finalizeQuestion(currentQuestion));
  }

  // Fallback: If no structured questions were found via regex, chunk text into 4-line blocks
  if (questions.length === 0 && lines.length >= 5) {
    let tempQ = null;
    lines.forEach((l, idx) => {
      if (idx % 5 === 0) {
        if (tempQ) questions.push(finalizeQuestion(tempQ));
        tempQ = { question_text: l, options: [], correct_answer: '', marks: 1 };
      } else if (tempQ && tempQ.options.length < 4) {
        tempQ.options.push({
          id: `opt_${tempQ.options.length + 1}`,
          text: l
        });
      }
    });
    if (tempQ && tempQ.options.length >= 2) {
      questions.push(finalizeQuestion(tempQ));
    }
  }

  return questions;
}

function finalizeQuestion(q) {
  // If correct_answer was matched by letter (e.g. "A", "B"), map it to option ID
  let correctId = q.options[0]?.id || 'opt_1';

  if (q.correct_answer) {
    const matchedOpt = q.options.find(
      opt => opt.key === q.correct_answer.toUpperCase() || opt.text.toLowerCase().includes(q.correct_answer.toLowerCase())
    );
    if (matchedOpt) {
      correctId = matchedOpt.id;
    }
  }

  // Clean up option keys from options array
  const cleanOptions = q.options.map((opt, i) => ({
    id: opt.id || `opt_${i + 1}`,
    text: opt.text
  }));

  return {
    question_text: q.question_text,
    question_type: 'mcq',
    options: cleanOptions,
    correct_answer: correctId,
    marks: Number(q.marks) || 1,
    explanation: ''
  };
}

module.exports = {
  extractTextFromBuffer,
  parseQuestionsFromText
};
