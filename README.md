# VedaAI Assessment Creator – Full Stack Coding Assignment

VedaAI is a modern AI-powered question paper and assessment creator built for teachers to quickly draft structured exams with answer keys. The system uses a job queue workflow to run AI generations in the background and pushes updates to the teacher in real time using WebSockets.

---

## 🚀 Key Features

1. **Structured Assignment Form**: Capture assignment title, due date, additional guidelines, optional file attachment, and dynamic question breakdowns (MCQs, short answer, numerical, etc.).
2. **AI Question Generation**: Constructs tailored system prompts for Gemini, parses the structured response (JSON), and creates well-spaced questions grouped by Section (A, B, etc.) with matching difficulty tags (Easy, Moderate, Hard) and marks.
3. **Background Job Queue**: Uses **BullMQ** (powered by Redis) for async background worker processing.
4. **Real-time WebSockets**: Streams generation progress indicators (0% -> 100%) and instant UI updates without manual polling or page reloads.
5. **Print-ready PDF Export**: Formats exam sheets professionally using `pdfkit` (complete with school headers, student info dotted lines, and section divisions).
6. **Graceful Fallbacks**:
   - **Mongoose / MongoDB Failover**: Automatically pivots to a high-speed In-Memory storage service if MongoDB is inactive on the host.
   - **BullMQ / Redis Failover**: Automatically runs an asynchronous In-Memory scheduler mimicking queues if Redis is offline, allowing immediate reviewer execution out-of-the-box.
   - **Gemini SDK Failover**: Dynamically generates rich topic-specific papers and answer keys locally if the Gemini API key is not configured.

---

## 🌟 Standout Strengths & Implementations (Extra Highlights)

### 🖨️ Professional PDF Export (Exam-Ready Formatting)
* **Standard Exam Styling**: PDF generated via `pdfkit` includes formal school/college name placeholders, standard test info, name/roll number input fields, and clean double-border separator styling.
* **Smart Sheet Separation**: Difficulty badges (Easy, Moderate, Hard) are hidden on the student-facing Question Paper to maintain standard exam integrity, while remaining fully visible on the teacher's Answer Key.
* **Stream Efficiency**: Transmits the PDF as a stream directly from the server buffer, reducing memory consumption.

### 📱 Adaptive & Responsive High-Fidelity UI
* **Pixel-Perfect Figma Representation**: Mimics the exact fonts (Inter & Outfit), spacing, colors, and layout borders.
* **Responsive Layouts**:
  * **Desktop Layout**: Features a persistent left-hand navigation sidebar with active state highlights.
  * **Mobile Layout**: Automatically transitions to a bottom navigation tab bar + a floating action button (FAB) to maximize workspace usability on smaller screens.
* **Robust Validation**: Forms perform full runtime checks to block negative or empty numbers.

### ⚡ Advanced Caching, Job Queueing & Secure Upstash TLS
* **BullMQ & Caching**: Offloads intensive generation tasks to BullMQ workers, ensuring the Express app process remains responsive and free from timeouts.
* **Secure TLS Connection**: Fully configured to connect securely to remote Upstash Redis clusters using the `rediss://` protocol prefix.
* **Gemini 2.5 Upgrade**: Upgraded to the modern `gemini-2.5-flash` model, ensuring fast response speeds, reliable JSON output structure, and protection against deprecated model endpoints.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router, TypeScript), Zustand (State), Vanilla CSS
- **Backend**: Node.js, Express (TypeScript), MongoDB/Mongoose, Redis, BullMQ, WebSockets (`ws`), `pdfkit`
- **AI**: Gemini API (`@google/generative-ai` SDK, configured with `gemini-2.5-flash`)

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

---

## 📖 UI Design Details

- **Assignments Dashboard**: Interactive panels showcasing all papers, active creation badges, card actions (View, Delete), and a responsive layout.
- **Create Assignment Page**: Includes file-attachment area, date selectors, dynamic question type additions with custom numeric counters, and total question/marks aggregators.
- **Question Paper Page**: A paper-white exam grid with proper typography, dotted lines for student details, difficulty labels (Easy, Moderate, Hard), and floating banner action bars to download the PDF document.
