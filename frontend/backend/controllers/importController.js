const crypto = require('crypto');
const { extractTextFromBuffer, parseQuestionsFromText } = require('../utils/documentParser');

exports.parseDocumentFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Calculate SHA-256 hash of document buffer for deterministic document fingerprinting
    const docHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const importSessionId = `doc_imp_${Date.now()}_${docHash.substring(0, 10)}`;

    console.log(`Processing uploaded document: ${originalname} (${mimetype}) | Hash: ${docHash.substring(0, 12)} | Session: ${importSessionId}`);

    const rawText = await extractTextFromBuffer(buffer, mimetype);
    const extractedQuestions = parseQuestionsFromText(rawText);

    if (extractedQuestions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract multiple-choice questions automatically from this file. Please verify file format or create questions manually.',
        rawTextPreview: rawText.substring(0, 300)
      });
    }

    // Tag each question with source provenance metadata
    const taggedQuestions = extractedQuestions.map((q, idx) => ({
      ...q,
      source_metadata: {
        import_session_id: importSessionId,
        doc_name: originalname,
        doc_hash: docHash,
        parsed_at: new Date().toISOString(),
        question_index: idx + 1
      }
    }));

    return res.status(200).json({
      success: true,
      importSessionId,
      docHash,
      filename: originalname,
      extractedCount: taggedQuestions.length,
      questions: taggedQuestions
    });
  } catch (error) {
    console.error('Document import error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process and parse document file.', error: error.message });
  }
};

