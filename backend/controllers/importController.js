const { extractTextFromBuffer, parseQuestionsFromText } = require('../utils/documentParser');

exports.parseDocumentFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
    }

    const { buffer, originalname, mimetype } = req.file;

    console.log(`Processing uploaded document: ${originalname} (${mimetype})`);

    const rawText = await extractTextFromBuffer(buffer, mimetype);
    const extractedQuestions = parseQuestionsFromText(rawText);

    if (extractedQuestions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract multiple-choice questions automatically from this file. Please verify file format or create questions manually.',
        rawTextPreview: rawText.substring(0, 300)
      });
    }

    return res.status(200).json({
      success: true,
      filename: originalname,
      extractedCount: extractedQuestions.length,
      questions: extractedQuestions
    });
  } catch (error) {
    console.error('Document import error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process and parse document file.', error: error.message });
  }
};
