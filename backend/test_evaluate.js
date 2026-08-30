const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
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
                    }
                  },
                  pageNumber: { type: SchemaType.NUMBER }
                },
                required: ["id", "number", "text", "totalMarks", "awardedMarks", "isCorrect", "feedback", "pageNumber"]
              }
            }
          }
        }
      }
    });

    const result = await model.generateContent("Give me a JSON object with one question.");
    console.log(result.response.text());
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
