import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { QuestionPaper, QuestionTypeInput } from '../models/Assignment.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const hasApiKey = apiKey.trim().length > 0;

let genAI: GoogleGenerativeAI | null = null;
if (hasApiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateQuestionPaper(
  title: string,
  questionTypes: QuestionTypeInput[],
  additionalInstructions?: string
): Promise<{ paper: QuestionPaper; answerKey: string[] }> {
  
  const totalQuestions = questionTypes.reduce((acc, q) => acc + q.count, 0);
  const totalMarks = questionTypes.reduce((acc, q) => acc + (q.count * q.marks), 0);

  if (genAI) {
    try {
      console.log(`🤖 Requesting AI question paper generation for: "${title}" via Gemini...`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const typesDescription = questionTypes
        .map((qt) => `- ${qt.type}: ${qt.count} questions, ${qt.marks} marks each`)
        .join('\n');

      const prompt = `
You are an expert exam creator. Your job is to create a beautifully structured and professional school question paper.

Assignment Details:
- Title: "${title}"
- Additional Instructions/Topic Context: "${additionalInstructions || 'None provided'}"
- Total Questions Needed: ${totalQuestions}
- Total Marks: ${totalMarks}

Required Questions Breakdown:
${typesDescription}

Please respond ONLY with a JSON object following this strict schema:
{
  "schoolName": "Delhi Public School, Bokaro Steel City",
  "subject": "<Determine the subject from the title and instructions, e.g., Physics, History, Math, English>",
  "className": "<Determine suitable Grade/Class from the context, default to 'Grade 8'>",
  "timeAllowed": "<Estimate suitable duration, e.g., '45 minutes' or '3 hours'>",
  "maxMarks": ${totalMarks},
  "instructions": "All questions are compulsory unless stated otherwise. Answer all parts of a question together.",
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "text": "<The text of the question. Ensure it matches the requested question type>",
          "difficulty": "Easy" | "Moderate" | "Hard",
          "marks": <marks for this type>
        }
      ]
    }
  ],
  "answerKey": [
    "1. Detailed solution or answer key description for question 1...",
    "2. Detailed solution or answer key description for question 2..."
  ]
}

Instructions for Questions:
1. Divide the questions into logical Sections (e.g., Section A for Multiple Choice Questions, Section B for Short Questions, etc.). Make sure every requested question type is created.
2. Group questions of the same type together in the same Section.
3. For each question, assign a suitable difficulty level (Easy, Moderate, or Hard) and the requested marks.
4. Ensure the questions are pedagogically sound, specific to the topic, and have varying difficulties.
5. Provide a detailed answerKey array where each item corresponds to the solution of the generated questions.
6. The total count and marks of questions in the JSON MUST match the requested counts and marks EXACTLY. Do not add extra questions or skip any.

Respond ONLY with the JSON document. Do not wrap in markdown blocks.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log('🤖 AI response received. Parsing JSON...');
      const parsed = JSON.parse(text);
      
      // Basic validation of parsed result
      if (parsed.schoolName && parsed.sections && Array.isArray(parsed.sections)) {
        return {
          paper: {
            schoolName: parsed.schoolName || 'Delhi Public School, Bokaro Steel City',
            subject: parsed.subject || 'General Assessment',
            className: parsed.className || 'Grade 8',
            timeAllowed: parsed.timeAllowed || '1 Hour',
            maxMarks: parsed.maxMarks || totalMarks,
            instructions: parsed.instructions || 'All questions are compulsory.',
            sections: parsed.sections.map((sec: any) => ({
              title: sec.title || 'Section',
              instruction: sec.instruction || 'Attempt all questions.',
              questions: (sec.questions || []).map((q: any) => ({
                text: q.text || 'Standard Question',
                difficulty: q.difficulty || 'Moderate',
                marks: Number(q.marks) || 1,
              })),
            })),
          },
          answerKey: parsed.answerKey || ['Answer key not generated.'],
        };
      }
      throw new Error('Invalid JSON structure returned by Gemini');
    } catch (error) {
      console.error('❌ AI generation failed, falling back to local procedural generator:', error);
    }
  } else {
    console.log('ℹ️ Gemini API key not set. Using local procedural generator.');
  }

  // High quality procedural generator fallback
  return generateMockPaper(title, questionTypes, additionalInstructions);
}

function generateMockPaper(
  title: string,
  questionTypes: QuestionTypeInput[],
  additionalInstructions?: string
): { paper: QuestionPaper; answerKey: string[] } {
  // Simple subject identification
  let subject = 'Science';
  if (/math|algebra|geometry|calculus/i.test(title + ' ' + (additionalInstructions || ''))) {
    subject = 'Mathematics';
  } else if (/english|grammar|literature|poem|essay/i.test(title + ' ' + (additionalInstructions || ''))) {
    subject = 'English';
  } else if (/history|civics|geography|social/i.test(title + ' ' + (additionalInstructions || ''))) {
    subject = 'Social Science';
  } else if (/electricity|physics|chemical|biology|magnet/i.test(title + ' ' + (additionalInstructions || ''))) {
    subject = 'Science (Physics/Chemistry)';
  } else if (/computer|programming|js|python|code/i.test(title + ' ' + (additionalInstructions || ''))) {
    subject = 'Computer Applications';
  }

  const sections: any[] = [];
  const answerKey: string[] = [];
  let questionNumber = 1;
  const alphabet = 'ABCDEFGH';

  questionTypes.forEach((qt, index) => {
    const sectionLetter = alphabet[index] || 'X';
    const sectionQuestions: any[] = [];
    
    // Generate questions based on type and title
    for (let i = 0; i < qt.count; i++) {
      const difficulty: 'Easy' | 'Moderate' | 'Hard' = 
        i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Moderate' : 'Hard';
      
      const qText = getMockQuestionText(subject, title, qt.type, i + 1, difficulty);
      sectionQuestions.push({
        text: qText,
        difficulty,
        marks: qt.marks
      });

      answerKey.push(
        `${questionNumber}. [${difficulty}] Correct response for: "${qText.substring(0, 40)}..." is to detail the underlying principles of ${title.split(' ')[0] || 'the subject'}, citing key parameters and formulas where applicable.`
      );
      questionNumber++;
    }

    sections.push({
      title: `Section ${sectionLetter}`,
      instruction: `Answer all questions of this section. Each question carries ${qt.marks} marks.`,
      questions: sectionQuestions,
    });
  });

  const totalMarks = questionTypes.reduce((acc, q) => acc + (q.count * q.marks), 0);
  const timeAllowed = totalMarks <= 20 ? '45 minutes' : totalMarks <= 50 ? '1.5 hours' : '3 hours';

  return {
    paper: {
      schoolName: 'Delhi Public School, Bokaro Steel City',
      subject,
      className: 'Grade 8',
      timeAllowed,
      maxMarks: totalMarks,
      instructions: 'All questions are compulsory. Use of calculators is prohibited. Write answers neatly.',
      sections,
    },
    answerKey,
  };
}

function getMockQuestionText(
  subject: string,
  title: string,
  type: string,
  num: number,
  difficulty: 'Easy' | 'Moderate' | 'Hard'
): string {
  const normType = type.toLowerCase();
  
  if (subject === 'Mathematics') {
    if (normType.includes('choice') || normType.includes('mcq')) {
      return `What is the value of x if 3x + ${num * 4} = ${num * 16}? (A) ${num * 4} (B) ${num * 3} (C) ${num * 2} (D) ${num}`;
    }
    if (normType.includes('numerical') || normType.includes('problem')) {
      return `Solve the following system of linear equations using matrix inversion or Cramer's Rule: 2x + 3y = ${num * 5} and 4x - y = ${num * 3}. Calculate the values of x and y.`;
    }
    if (normType.includes('short')) {
      return `State and prove the Pythagorean Theorem for a right-angled triangle with sides a, b, and hypotenuse c.`;
    }
    return `In a geometric progression, the 3rd term is ${num * 9} and the 6th term is ${num * 243}. Find the first term and the common ratio.`;
  }

  if (subject === 'English') {
    if (normType.includes('choice') || normType.includes('mcq')) {
      return `Identify the correct synonym for the word '${difficulty === 'Hard' ? 'Supercilious' : difficulty === 'Moderate' ? 'Benevolent' : 'Happy'}': (A) Arrogant (B) Kind (C) Sad (D) Loud`;
    }
    if (normType.includes('short')) {
      return `Explain the theme of the passage concerning "${title}" and how the author uses symbolism to convey isolation.`;
    }
    return `Draft an essay of 250 words describing the impact of digital media on reading habits of middle school children.`;
  }

  // Science/General default
  if (normType.includes('choice') || normType.includes('mcq')) {
    if (title.toLowerCase().includes('electricity')) {
      return `Which of the following materials is the best conductor of electricity? (A) Copper (B) Wood (C) Rubber (D) Glass`;
    }
    return `Which of the following is a key chemical reaction related to ${title}? (A) Oxidation (B) Reduction (C) Electrolysis (D) All of the above`;
  }
  
  if (normType.includes('short')) {
    if (title.toLowerCase().includes('electricity')) {
      return `State Ohm's Law. Write the mathematical relation between Voltage, Current, and Resistance.`;
    }
    return `Describe the experiment to demonstrate the chemical effects of electric current in water containing a few drops of sulphuric acid.`;
  }

  if (normType.includes('diagram') || normType.includes('graph')) {
    if (title.toLowerCase().includes('electricity')) {
      return `Draw a circuit diagram containing a battery of three cells, a plug key, an ammeter, a resistor of 5 ohms in series, and a voltmeter across the resistor.`;
    }
    return `Draw a neat labelled schematic diagram illustrating the electrolysis setup, showing the anode, cathode, electrolyte, and direction of current.`;
  }

  if (normType.includes('numerical')) {
    return `Calculate the total energy consumed in kilowatt-hours (kWh) when an electrical appliance of 1500W runs for 6 hours daily for a month of 30 days.`;
  }

  return `Explain the concept of ${title} in detail. Provide at least two practical applications of this process in modern industrial systems.`;
}
