# VedaAI Assessment Creator – Full Stack Coding Assignment

VedaAI is a modern AI-powered question paper and assessment creator built for teachers to quickly draft structured exams with answer keys. The system uses a job queue workflow to run AI generations in the background and pushes updates to the teacher in real time using WebSockets.

---

## 🌟 Standout Features (What Makes This Implementation Special)

### 1. 🖨️ Professional Print-Ready PDF Export
* **High-Fidelity Layout**: Generates standard exam papers with formatted school headers, double-line separators, student info sections (Name, Roll Number, Section), and section-wise splits (Section A, Section B, Section C).
* **Smart Visibility (Exam vs. Answer Key)**: Difficulty tags (Easy, Moderate, Hard) are **hidden** on the student-facing exam paper (just like a real exam) but **visible** on the teacher's Answer Key sheet.
* **Stream-Based Buffer**: Generated PDFs are compiled using `pdfkit` and served directly as downloadable streams, ensuring memory efficiency on the server.

### 2. 📱 Flexible & Responsive High-Fidelity UI
* **Figma-Perfect Design**: Implements modern typography (Inter/Outfit), clean card layouts, custom orange outlines, and high-quality button hover transitions.
* **Adaptive Navigation**:
  * **Desktop**: Features a left-hand navigation sidebar with an active state highlighter.
  * **Mobile**: Automatically collapses into a sleek bottom tab-navigation bar and a floating action button (FAB) for creating new assignments, optimizing viewport real estate.
* **Interactive Controls**: Users can dynamically build question papers using numeric click counters, live validation (no empty/negative values), and real-time generation progress indicators.

### 3. ⚡ Resilient Backend & Caching
* **Upstash Redis + BullMQ Queue**: Implements an asynchronous job queue using **BullMQ** to process heavy AI question generation requests off the main thread. This ensures the Node.js server stays highly responsive even under high load.
* **Secure TLS Connection**: Fully configured to connect to cloud Redis instances (like Upstash) using the secure `rediss://` protocol.
* **Failover Engine (Graceful Out-of-the-Box Fallbacks)**:
  * **MongoDB Failover**: If MongoDB is not running locally, the backend automatically switches to a high-speed local In-Memory Database store.
  * **Redis / BullMQ Failover**: If Redis is offline, the backend executes an asynchronous In-Memory scheduling task mimicking the BullMQ queues, allowing reviewers to test the app instantly without setting up Redis.
  * **AI Service Failover**: If no Gemini API key is supplied, a procedural mock AI service generates rich topic-appropriate papers and answer keys locally.

### 4. 🧠 Upgraded AI Model & Slicing
* **Gemini 2.5 Flash Integration**: Upgraded the integration to use the latest `gemini-2.5-flash` model, ensuring fast response times, high structured format adherence, and preventing 404 API errors caused by deprecated model endpoints.

---

## 📁 Repository Structure

```
├── backend/
│   ├── src/
│   │   ├── models/            # Mongoose Schema & In-Memory Store
│   │   ├── services/          # Gemini AI generation & PDFkit layout
│   │   ├── queues/            # BullMQ definition & local task worker
│   │   ├── workers/           # BullMQ job worker
│   │   ├── db.ts              # MongoDB connections
│   │   ├── websocket.ts       # WebSocket server and subscription logic
│   │   └── server.ts          # Express API routes and server bootstrap
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/               # Next.js Pages (Dashboard, Form, Output)
    │   ├── components/        # Sidebar, Header
    │   └── store/             # Zustand state management
    ├── package.json
    └── tsconfig.json
```

---

## 🏁 Setup Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)
- *(Optional)* MongoDB and Redis (If running, the backend connects automatically. If not, the application triggers local memory fallbacks).

### 1. Backend Setup
Navigate to the `backend` folder, set up your environment variables, and start the server:

```bash
cd backend
# Create/Configure .env
# If you have a Gemini API key:
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
# Otherwise, the app uses a rich topic-based procedural fallback!

# Install dependencies and start development server
npm install --legacy-peer-deps
npm run dev
```
The backend server runs on `http://localhost:5000` and initializes the WebSocket gateway.

### 2. Frontend Setup
Open a separate terminal window, navigate to the `frontend` folder, and start the Next.js dev server:

```bash
cd frontend
npm install
npm run dev
```
The Next.js app runs on `http://localhost:3000`. Open it in your web browser.
