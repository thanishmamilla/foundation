// Trigger nodemon reload to pick up new MongoDB Atlas & Gemini API credentials
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isMongoConnected } from './db.js';
import { AssignmentModel, InMemoryAssignmentStore } from './models/Assignment.js';
import { setupWebSocket } from './websocket.js';
import { initQueue, addGenerationJob, isRedisAvailable } from './queues/generationQueue.js';
import { initWorker } from './workers/generationWorker.js';
import { generatePDF } from './services/pdfService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
// 1. Get all assignments
app.get('/api/assignments', async (req: Request, res: Response) => {
  try {
    let assignments;
    if (isMongoConnected()) {
      assignments = await AssignmentModel.find().sort({ createdAt: -1 });
    } else {
      assignments = await InMemoryAssignmentStore.find();
    }
    return res.json(assignments);
  } catch (error) {
    console.error('Failed to get assignments:', error);
    return res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

// 2. Get single assignment
app.get('/api/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let assignment;
    
    if (isMongoConnected()) {
      assignment = await AssignmentModel.findById(id);
    } else {
      assignment = await InMemoryAssignmentStore.findById(id);
    }

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    return res.json(assignment);
  } catch (error) {
    console.error('Failed to get assignment:', error);
    return res.status(500).json({ error: 'Failed to retrieve assignment.' });
  }
});

// 3. Create new assignment
app.post('/api/assignments', async (req: Request, res: Response) => {
  try {
    const { title, dueDate, questionTypes, additionalInstructions } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Assignment title is required and must be a valid string.' });
    }

    if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
      return res.status(400).json({ error: 'Question types config is required and must contain at least one row.' });
    }

    for (let i = 0; i < questionTypes.length; i++) {
      const q = questionTypes[i];
      if (!q.type || typeof q.type !== 'string' || q.type.trim() === '') {
        return res.status(400).json({ error: `Question type at index ${i} must have a valid name.` });
      }
      if (q.count === undefined || typeof q.count !== 'number' || q.count <= 0) {
        return res.status(400).json({ error: `Question type "${q.type}" must have a count greater than 0.` });
      }
      if (q.marks === undefined || typeof q.marks !== 'number' || q.marks <= 0) {
        return res.status(400).json({ error: `Question type "${q.type}" must have marks greater than 0.` });
      }
    }

    const assignmentData = {
      title,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      questionTypes: questionTypes.map((q: any) => ({
        type: q.type.trim(),
        count: Number(q.count),
        marks: Number(q.marks),
      })),
      additionalInstructions: additionalInstructions ? additionalInstructions.trim() : undefined,
      status: 'pending',
    };

    let assignment;
    if (isMongoConnected()) {
      assignment = await AssignmentModel.create(assignmentData);
    } else {
      assignment = await InMemoryAssignmentStore.create(assignmentData);
    }

    // Add generating background job
    const id = assignment._id.toString();
    await addGenerationJob(id);

    return res.status(201).json(assignment);
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// 4. Delete assignment
app.delete('/api/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let deleted;

    if (isMongoConnected()) {
      deleted = await AssignmentModel.findByIdAndDelete(id);
    } else {
      deleted = await InMemoryAssignmentStore.findByIdAndDelete(id);
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    return res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete assignment:', error);
    return res.status(500).json({ error: 'Failed to delete assignment.' });
  }
});

// 5. Regenerate question paper
app.post('/api/assignments/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let assignment;

    if (isMongoConnected()) {
      assignment = await AssignmentModel.findById(id);
    } else {
      assignment = await InMemoryAssignmentStore.findById(id);
    }

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const updates = {
      status: 'pending',
      error: null,
      paper: null,
      answerKey: null,
    };

    if (isMongoConnected()) {
      await AssignmentModel.findByIdAndUpdate(id, updates);
    } else {
      await InMemoryAssignmentStore.findByIdAndUpdate(id, updates);
    }

    // Add generating background job
    await addGenerationJob(id);

    return res.json({ success: true, message: 'Regeneration started.' });
  } catch (error) {
    console.error('Failed to regenerate assignment:', error);
    return res.status(500).json({ error: 'Failed to trigger regeneration.' });
  }
});

// 6. Download assignment as PDF
app.get('/api/assignments/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let assignment;

    if (isMongoConnected()) {
      assignment = await AssignmentModel.findById(id);
    } else {
      assignment = await InMemoryAssignmentStore.findById(id);
    }

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    if (assignment.status !== 'completed' || !assignment.paper) {
      return res.status(400).json({ error: 'Assignment is not fully generated yet.' });
    }

    const pdfBuffer = await generatePDF(assignment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assessment_${id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF download.' });
  }
});

// Create Server
const server = createServer(app);

// Setup WebSockets
setupWebSocket(server);

// Start Database, Queues, and Server
async function startServer() {
  // 1. Connect MongoDB (Falls back gracefully)
  await connectDB();
  
  // 2. Initialize Queue (Checks Redis and Falls back gracefully)
  await initQueue();
  
  // 3. Initialize Worker (If Redis is active)
  initWorker(isRedisAvailable());

  // 4. Listen
  server.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`🔌 WebSockets server active alongside HTTP server.`);
  });
}

startServer().catch((err) => {
  console.error('🔥 Server crashed on startup:', err);
});
