import { Request, Response } from 'express';
import multer from 'multer';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Set up in-memory storage for multer
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const evaluateHandler = async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the backend .env file.' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.questionPaper || !files.answerSheet) {
      return res.status(400).json({ error: 'Both questionPaper and answerSheet files are required.' });
    }

    const questionPaper = files.questionPaper[0];
    const answerSheet = files.answerSheet[0];

    // Initialize Gemini 1.5 Pro which is more accurate for complex spatial understanding and tight bounding boxes
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            questions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  number: { type: SchemaType.STRING },
                  text: { type: SchemaType.STRING },
                  totalMarks: { type: SchemaType.NUMBER },
                  awardedMarks: { type: SchemaType.NUMBER },
                  studentAnswer: { type: SchemaType.STRING, nullable: true },
                  isCorrect: { type: SchemaType.BOOLEAN },
                  feedback: { type: SchemaType.STRING },
                  boundingBox: {
                    type: SchemaType.OBJECT,
                    nullable: true,
                    properties: {
                      ymin: { type: SchemaType.NUMBER },
                      xmin: { type: SchemaType.NUMBER },
                      ymax: { type: SchemaType.NUMBER },
                      xmax: { type: SchemaType.NUMBER }
                    },
                    required: ["ymin", "xmin", "ymax", "xmax"]
                  },
                  pageNumber: { type: SchemaType.NUMBER }
                },
                required: ["id", "number", "text", "totalMarks", "awardedMarks", "isCorrect", "feedback", "pageNumber", "boundingBox"]
              }
            }
          }
        }
      }
    });

    const prompt = `
You are an expert AI teacher's assistant. You have been provided with two documents:
1. A Question Paper (Image or PDF)
2. A Student's Handwritten Answer Sheet (Image or PDF)

Your task is to carefully extract the questions, map them to the student's answers, grade them, and provide the exact bounding box coordinates of where the student's answer is located on the Answer Sheet.

Follow these rules:
1. Extract every question in the correct printed order from the Question Paper.
2. Treat labelled sub-parts as separate questions (e.g., 11(a) and 11(b) are two entries).
3. Preserve original numbering.
4. Extract the student's answer from the Answer Sheet. If a question is unanswered, leave studentAnswer null.
5. Provide a TIGHT bounding box [ymin, xmin, ymax, xmax] strictly wrapping the student's answer text on the Answer Sheet. These coordinates must be normalized values between 0 and 1000 RELATIVE TO THE SPECIFIC PAGE of the Answer Sheet where the answer is found (where [0,0] is the top-left of that page and [1000,1000] is the bottom-right). Do not include the Question Paper in your coordinate space. For example: [200, 150, 400, 850].
6. Grade the answer (isCorrect: true/false) and award marks based on the totalMarks indicated for that question.
7. Provide brief AI feedback.
8. If the student has written an answer that does not correspond to any question on the question paper, create an entry with a unique id, number as 'Extra', text as 'Unmatched Answer', totalMarks as 0, and extract the student's answer as usual, with a bounding box and feedback.

Return ONLY a JSON object strictly following this schema:
{
  "questions": [
    {
      "id": "unique-string-id",
      "number": "1(a)",
      "text": "Question text...",
      "totalMarks": 2,
      "awardedMarks": 2,
      "studentAnswer": "The extracted text of what the student wrote...",
      "isCorrect": true,
      "feedback": "Great job!",
      "boundingBox": { "ymin": 200, "xmin": 150, "ymax": 400, "xmax": 850 },
      "pageNumber": 1
    }
  ]
}
`;

    // Convert multer buffers to base64 inlineData format for Gemini
    const questionPaperPart = {
      inlineData: {
        data: questionPaper.buffer.toString("base64"),
        mimeType: questionPaper.mimetype
      },
    };

    const answerSheetPart = {
      inlineData: {
        data: answerSheet.buffer.toString("base64"),
        mimeType: answerSheet.mimetype
      },
    };

    console.log("Sending documents to Gemini for extraction and mapping...");
    const result = await model.generateContent([prompt, questionPaperPart, answerSheetPart]);
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON. Gemini usually returns clean JSON, but we clean it just in case
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsedData = JSON.parse(jsonStr);
    
    return res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Failed to evaluate documents. Ensure Gemini API key is valid.' });
  }
};
