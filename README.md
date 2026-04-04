# SyncBoard MVP

## AI-Powered Meeting-to-Trello Ticket Automation

> Transform Google Meet conversations into Trello tickets in 60 seconds—automatically.

---

## 🎯 What This MVP Does

SyncBoard automatically converts meeting recordings into properly formatted Trello cards with:
- **Action item extraction** from natural conversation
- **User story generation** in proper agile format
- **Deadline detection** from temporal language ("by Friday" → ISO date)
- **Owner assignment** based on speaker identification
- **Priority labeling** based on context

### Core User Flow
```
Meeting Recording → Upload → Transcription → AI Analysis → Review → Trello Cards
          ↓              ↓           ↓             ↓          ↓
     Google Meet    Web UI     Whisper API    Groq LLM   User confirms
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Azure OpenAI API Key (for Whisper transcription)
- Groq API Key (free — for ticket analysis)
- AssemblyAI API Key (optional — for speaker diarization)
- Trello API Key and Token

### Installation

```bash
# Clone repository
git clone <repository-url>
cd syncboard-mvp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Configure environment
cp .env.example backend/.env
# Edit backend/.env with your API keys
```

### Environment Variables

Create a `backend/.env` file (see `.env.example` for reference):

```env
# Azure OpenAI (Whisper transcription)
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.services.ai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_WHISPER_DEPLOYMENT=whisper-1

# Groq (ticket analysis — free tier)
GROQ_API_KEY=gsk_your-groq-key
GROQ_MODEL=llama-3.3-70b-versatile

# AssemblyAI (optional — speaker diarization)
ASSEMBLYAI_API_KEY=your-assemblyai-key

# Trello
TRELLO_API_KEY=your-trello-api-key
TRELLO_TOKEN=your-trello-token

# Server
PORT=3001
NODE_ENV=development
```

### Running the Application

```bash
# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm start
```

Access the application at `http://localhost:3000`

---

## 📁 Project Structure

```
syncboard-mvp/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── FileUpload.jsx
│   │   │   ├── TranscriptViewer.jsx
│   │   │   ├── TicketReview.jsx
│   │   │   └── TicketCard.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   │   └── Dashboard.jsx
│   │   └── utils/            # Helper functions
│   └── package.json
├── backend/                  # Node.js/Express backend
│   ├── routes/
│   │   ├── upload.js         # File upload handling
│   │   ├── transcribe.js     # Transcription endpoints
│   │   ├── analyze.js        # AI analysis endpoints
│   │   └── trello.js         # Trello integration
│   ├── services/
│   │   ├── whisperService.js # OpenAI Whisper integration
│   │   ├── gptService.js     # GPT-4 analysis
│   │   └── trelloService.js  # Trello API wrapper
│   ├── utils/
│   │   └── prompts.js        # GPT-4 prompt templates
│   └── server.js
├── n8n-workflows/            # n8n automation workflows
│   └── meeting-to-trello.json
├── sample-data/              # Test meeting recordings
│   ├── sample-standup.mp3
│   └── expected-output.json
├── docs/
│   └── architecture.md
└── README.md
```

---

## 🔧 Technical Architecture

### AI Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNCBOARD AI PIPELINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Meeting Recording]                                         │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────┐                                        │
│  │  OpenAI Whisper │  Transcription                         │
│  │  (API)          │  Cost: $0.006/min                      │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  AssemblyAI     │  Speaker Diarization (Optional)        │
│  │  (Speaker ID)   │  Cost: $0.00025/sec                    │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  GPT-4o-mini    │  Action Item Extraction                │
│  │  (Analysis)     │  + User Story Generation               │
│  └────────┬────────┘  + Deadline Parsing                    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  Review UI      │  Human verification step               │
│  │  (React)        │  Edit/approve before publish           │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  Trello API     │  Card creation                         │
│  │  (Integration)  │  Assignments, labels, due dates        │
│  └─────────────────┘                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cost Per Meeting (1 hour)
| Service | Cost |
|---------|------|
| Whisper API | $0.36 |
| AssemblyAI | ~$0.90 |
| GPT-4o-mini | ~$0.20 |
| **Total** | **~$1.50** |

---

## 🎨 Key Features

### 1. Meeting Upload
- Drag & drop MP3/MP4/WAV files
- Progress indicator during processing
- Support for recordings up to 2 hours

### 2. AI Analysis
- Automatic action item detection
- User story format conversion
- Deadline extraction from natural language
- Priority inference from context

### 3. Review Interface
- Preview all extracted tickets
- Edit before publishing
- Approve/reject individual items
- Batch operations

### 4. Trello Integration
- Direct card creation
- Automatic member assignment
- Due date setting
- Label application

---

## ⚠️ Known Limitations

### Current MVP Constraints
1. **Accuracy**: 87-91% action item extraction (target: 95%)
2. **Single Integration**: Trello only (Jira, Linear planned for future)
3. **Audio Format**: MP3, WAV, MP4 only
4. **Meeting Length**: Up to 2 hours
5. **Language**: English only

### What This MVP Tests
- Do users trust AI-generated tickets enough to use them?
- Is the review step fast enough to provide value?
- What accuracy threshold is acceptable for different team types?

---

## 📊 Metrics We're Tracking

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Ticket Accuracy | 95%+ | Below this, users won't trust automation |
| Time to Tickets | <60 sec | Value prop depends on speed |
| Edit Rate | <20% | Measures if AI output is production-ready |
| Completion Rate | >80% | Are users finishing the flow? |

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Use sample data
# Upload sample-data/sample-standup.mp3
# Compare output to sample-data/expected-output.json
```

---

## 📝 Sample Data

The `sample-data/` folder contains:
- `sample-standup.mp3`: A simulated 10-minute standup meeting
- `expected-output.json`: The expected ticket extraction results

Use these to validate the pipeline works correctly.

---

## 🛣️ Roadmap (Post-MVP)

### Phase 1: Validation
- [ ] User testing with 5 startup teams
- [ ] Accuracy benchmarking
- [ ] UI/UX iteration based on feedback

### Phase 2: Expansion
- [ ] Jira integration
- [ ] Linear integration
- [ ] Slack notifications
- [ ] Google Calendar integration for auto-triggering

### Phase 3: Scale
- [ ] Real-time processing
- [ ] Custom prompts per team
- [ ] Team-specific vocabulary learning

---

## 👥 Team

- **Hussnain** (22I-1102) - Backend & AI Pipeline
- **Sohaib** (22I-0879) - Frontend & Integration
- **Hamdan Sajid** (22I-0872) - Research & Testing

**Supervisor**: Ms. Urooj Ghani

---

## 📄 License

This is a university course project for AIPD (AI Product Development) at FAST-NUCES.
