# SyncBoard MVP - Architecture Documentation

## Overview

SyncBoard is an AI-powered system that automatically converts meeting recordings into formatted Trello tickets. This document describes the technical architecture, design decisions, and implementation details.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYNCBOARD MVP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   Frontend   │───▶│   Backend    │───▶│  AI Services │───▶│   Trello   │ │
│  │   (React)    │    │  (Express)   │    │ (OpenAI API) │    │    API     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └────────────┘ │
│         │                   │                   │                           │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  File Upload │    │   Sessions   │    │   Whisper    │                   │
│  │  Drag & Drop │    │   Storage    │    │   GPT-4o     │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend (React 18)

**Purpose:** User interface for uploading recordings, reviewing extracted tickets, and publishing to Trello.

**Key Components:**
- `FileUpload.jsx` - Drag-and-drop file upload with validation
- `TranscriptViewer.jsx` - Display transcription with timestamps
- `TicketReview.jsx` - Review and edit extracted tickets
- `TicketCard.jsx` - Individual ticket display with edit capabilities
- `TrelloConfig.jsx` - Board and list selection for publishing

**State Management:**
- React useState hooks for local state
- Stage-based flow control (upload → transcribe → analyze → review → publish)

**Styling:**
- Custom CSS with CSS variables for theming
- Dark mode design optimized for productivity

### 2. Backend (Node.js/Express)

**Purpose:** API server handling file uploads, orchestrating AI services, and managing Trello integration.

**Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Handle file uploads |
| POST | `/api/transcribe` | Trigger Whisper transcription |
| POST | `/api/analyze` | Extract action items via GPT-4 |
| GET | `/api/trello/boards` | List user's Trello boards |
| GET | `/api/trello/boards/:id/lists` | Get lists for a board |
| POST | `/api/trello/cards/bulk` | Create multiple Trello cards |

**Middleware:**
- `multer` - File upload handling (500MB limit)
- `cors` - Cross-origin request support
- Custom error handling middleware

### 3. AI Services

#### Whisper Service (`whisperService.js`)
- Calls OpenAI Whisper API for audio transcription
- Supports MP3, WAV, MP4, WebM formats
- Returns text with segment timestamps
- Cost: $0.006/minute of audio

#### GPT Service (`gptService.js`)
- Extracts action items from transcript
- Generates user stories in agile format
- Parses natural language deadlines to ISO dates
- Infers priority from context
- Cost: ~$0.20 per meeting (GPT-4o-mini)

**Prompt Engineering:**
- System prompts optimized for action item extraction
- JSON output mode for structured responses
- Confidence scoring (0.5-1.0 threshold)
- Temperature: 0.3 for consistent output

### 4. Trello Service (`trelloService.js`)

**Features:**
- Board and list enumeration
- Member matching (name → ID)
- Card creation with descriptions, due dates, labels
- Bulk card creation with rate limiting
- Assignee auto-matching

**Rate Limiting:**
- 100ms delay between card creations
- Respects Trello API limits (100 req/10 sec)

---

## Data Flow

### Complete Processing Pipeline

```
1. USER UPLOADS AUDIO FILE
   │
   ▼
2. FILE VALIDATION
   - Type check (MP3/WAV/MP4/WebM)
   - Size check (< 500MB)
   - Store in uploads/
   │
   ▼
3. WHISPER TRANSCRIPTION
   - Send to OpenAI Whisper API
   - Receive text + segments
   - Calculate cost
   │
   ▼
4. GPT-4 ANALYSIS
   - Extract action items
   - Generate user stories
   - Parse deadlines
   - Assign priorities
   │
   ▼
5. USER REVIEW
   - Display extracted tickets
   - Allow edit/approve/reject
   - Configure Trello destination
   │
   ▼
6. TRELLO PUBLISHING
   - Match assignees to members
   - Create cards in selected list
   - Return card URLs
```

---

## Key Design Decisions

### 1. Batch Processing Over Real-Time

**Decision:** Process meetings after they end, not in real-time.

**Rationale:**
- User research showed 60-second delay is acceptable
- Reduces architectural complexity by 10x
- No WebSocket infrastructure needed
- Lower error rate and easier debugging

### 2. Mandatory Review Step

**Decision:** Users must review tickets before publishing.

**Rationale:**
- Trust research: 95% accuracy threshold for automation
- Current accuracy: 87-91%
- Review adds 1-3 minutes but increases completion by 40%+
- Users can edit, approve, or reject individual items

### 3. GPT-4o-mini Over Fine-Tuning

**Decision:** Use prompted GPT-4o-mini instead of fine-tuned model.

**Rationale:**
- Prompting achieves acceptable accuracy (87-91%)
- Fine-tuning would delay MVP by 4-6 weeks
- Easier to iterate on prompts
- Lower upfront cost, higher per-request cost (acceptable at MVP scale)

### 4. Trello-Only Integration

**Decision:** Support only Trello in MVP, not Jira/Linear/Notion.

**Rationale:**
- 80% of target segment (seed-Series A startups) uses Trello
- Each integration adds 2-3 weeks development time
- Validates core value proposition faster
- Can add integrations post-validation

---

## Error Handling

### Frontend
- Stage-based error recovery
- User-friendly error messages
- Retry capability for failed operations

### Backend
- Centralized error middleware
- Structured error responses
- Logging for debugging

### AI Services
- Retry logic for transient failures
- Graceful degradation (skip user stories if conversion fails)
- Cost tracking for monitoring

---

## Security Considerations

### Current MVP State
- API keys stored in environment variables
- No authentication (single-user MVP)
- File uploads validated and sandboxed

### Production Requirements (Post-MVP)
- User authentication (OAuth 2.0)
- API rate limiting per user
- Encrypted file storage
- Audit logging
- GDPR compliance for EU users

---

## Performance Characteristics

| Operation | Typical Duration | Notes |
|-----------|------------------|-------|
| File Upload | 2-10 seconds | Depends on file size |
| Transcription | 30-60 seconds | For 30-min meeting |
| AI Analysis | 5-15 seconds | Depends on transcript length |
| Trello Publishing | 1-2 seconds | Per card (rate limited) |
| **Total** | **~60-90 seconds** | For typical 30-min meeting |

---

## Cost Analysis

### Per Meeting (1 hour)

| Service | Cost |
|---------|------|
| Whisper API | $0.36 |
| GPT-4o-mini | $0.20 |
| AssemblyAI (optional) | $0.90 |
| **Total** | **$0.56 - $1.46** |

### Monthly Estimate (50 meetings)

| Scenario | Cost |
|----------|------|
| Without speaker ID | $28 |
| With speaker ID | $73 |

---

## Testing Strategy

### Unit Tests
- GPT prompt parsing
- Deadline conversion
- Priority inference
- Trello card formatting

### Integration Tests
- Full pipeline execution
- Trello API integration
- Error handling paths

### Sample Data
- `sample-data/expected-output.json` - Reference extraction results
- Used for regression testing

---

## Future Roadmap

### Phase 2: Validation
- [ ] User testing with 5 startup teams
- [ ] Accuracy benchmarking
- [ ] UI/UX iteration

### Phase 3: Expansion
- [ ] Jira integration
- [ ] Linear integration
- [ ] Slack notifications
- [ ] Google Calendar auto-trigger

### Phase 4: Scale
- [ ] Real-time processing option
- [ ] Custom prompt templates
- [ ] Team-specific vocabulary learning
- [ ] Enterprise SSO

---

## Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "multer": "^1.4.5-lts.1",
  "openai": "^4.20.0",
  "axios": "^1.6.0",
  "dotenv": "^16.3.1"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-scripts": "5.0.1"
}
```

---

## Team

- **Hussnain** (22I-1102) - Backend & AI Pipeline
- **Sohaib** (22I-0879) - Frontend & Integration  
- **Hamdan Sajid** (22I-0872) - Research & Testing

**Supervisor:** Ms. Urooj Ghani  
**Institution:** FAST-NUCES Islamabad  
**Course:** AI Product Development (AIPD) - Spring 2026
