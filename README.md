# 🎙️ Mocklyn — Continuous AI Interview Coach

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13](https://img.shields.io/badge/Python-3.13-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL 14](https://img.shields.io/badge/PostgreSQL-14-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Mocklyn** is an end-to-end continuous AI mock interview coach engineered to provide attempt-level persistence, historical performance tracking, and progressive contextual feedback.

Unlike traditional single-session interview platforms that operate statelessly and treat every attempt in isolation, Mocklyn retains your interview history, remembers your previous strengths and weaknesses, and acts as a long-term AI mentor that gets to know you as you practice.

---

## 🌟 Key Features

### 1. 🧠 Continuous Coaching & Attempt-Level Memory
- **Attempt $N$ vs. Attempt $N-1$ Comparison**: Computes score trajectories ($\Delta\text{Score}$), identifies resolved weaknesses, and detects recurring technical gaps.
- **Adaptive Question Continuity**: On returning attempts, the AI coach greets you by recalling previous session weaknesses, actively reinforcing improvement areas.
- **Immutable History**: Completed attempts are stored non-destructively in PostgreSQL with full Q&A transcripts, strengths, weaknesses, and evaluations.

### 2. 📄 Resume & Document-Based Technical Interviews
- **Multi-Format Ingestion**: Upload `.pdf`, `.docx`, `.doc`, `.txt` or paste raw text.
- **In-Memory Skill & Project Extraction**: Decodes binary files using `pypdf` and `python-docx` without disk exposure, extracting tech stack competencies (FastAPI, Redis, Kubernetes, AWS, etc.).
- **Tailored 5-Question Interview Tracks**: Compiles custom interview questions specifically grounded in your documented project architectures and trade-offs.

### 3. 🎯 Objective Multi-Factor Evaluation
- **Zero-Point Silence Enforcement**: Strictly eliminates heuristic scoring inflation — complete silence or empty answers score **0/100** with objective audio/mic guidance and zero false compliments.
- **Multi-Factor Scoring**: Evaluates substantive responses against participation rates, technical keyword density, explanation depth, and architectural decision markers.

### 4. 🔊 Real-Time Voice Streaming & Interactive Transcription
- **Neural TTS Voice Streaming**: Integrates Murf AI Falcon neural voice streaming over chunked HTTP with browser `MediaSource` playback.
- **Web Speech API**: In-browser speech-to-text with an interactive, editable transcription buffer so you can speak or type/edit before submitting.

### 5. 📊 "My Journey" Candidate Dashboard
- Chronological score progression visualization ($0 \to 97$).
- Aggregated career readiness metrics: average score, total attempts, and domain competency.
- Individual attempt history cards with standalone modal feedback inspectors.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------------+
|                              PRESENTATION TIER (Browser Client)                         |
|  - HTML5 / Tailwind CSS Responsive Single-Page Application                              |
|  - MediaSource & SourceBuffer Chunked MP3 Player Engine                                 |
|  - Web Speech API Real-Time Audio Transcription Buffer (Editable Textarea)              |
|  - Dual View State Machine: "Practice Interview" & "My Journey" Dashboard               |
+-----------------------------------------------------------------------------------------+
                                             |
                              RESTful HTTP / JSON / Audio Chunks
                                             v
+-----------------------------------------------------------------------------------------+
|                                APPLICATION TIER (Flask Backend)                         |
|  - REST Routing with CORS & Custom Headers (X-Attempt-Id, X-Question-Text)              |
|  - Authentication Controller (Werkzeug SHA-256 Hashed Password Management)              |
|  - Document Extraction Engine (pypdf & python-docx In-Memory Binary Decoding)            |
|  - Speech Synthesis Bridge (Murf Falcon Neural TTS HTTP Chunk Streaming)                |
|  - AI Evaluation & Comparative Engine (Substantive Validation & Attempt Delta Scorer)   |
+-----------------------------------------------------------------------------------------+
                                             |
                               psycopg2-binary Connection Pool
                                             v
+-----------------------------------------------------------------------------------------+
|                                PERSISTENCE TIER (PostgreSQL 14)                         |
|  - users: User credentials, application UUIDs, and account metadata                     |
|  - sessions: Active login tokens and activity timestamps                                |
|  - attempts: Immutable attempt records with JSONB questions, answers, and evaluations   |
+-----------------------------------------------------------------------------------------+
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version 3.10+ (tested on Python 3.13)
- **PostgreSQL**: Version 14 or higher
- **Modern Browser**: Google Chrome or Microsoft Edge (for Web Speech API and MediaSource support)

---

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Parkbong7/Mocklyn.git
   cd Mocklyn
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` in the `backend/` folder to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your PostgreSQL connection string and API keys:
   ```env
   # PostgreSQL Connection
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/mock_interview_db"

   # Murf AI Key for voice streaming (optional, text fallback enabled)
   MURF_API_KEY="your_murf_api_key_here"

   # Google API Key (optional)
   GOOGLE_API_KEY="your_google_api_key_here"
   ```

5. **Initialize the Database**:
   Create the database in PostgreSQL if it doesn't already exist:
   ```sql
   CREATE DATABASE mock_interview_db;
   ```
   *(Tables are automatically created by `db.init_db()` upon starting the Flask application).*

---

### Running the Application

1. **Start the Flask Backend**:
   ```bash
   cd backend
   python app.py
   ```
   *The server starts on `http://127.0.0.1:5000`.*

2. **Launch the Frontend**:
   Simply open `frontend/index.html` in your browser:
   ```bash
   # On Windows:
   start ../frontend/index.html
   # Or open frontend/index.html directly in Chrome / Edge
   ```

---

## 📁 Repository Structure

```
Mocklyn/
├── backend/
│   ├── .env.example        # Environment variable template
│   ├── ai_engine.py        # Document parsing, multi-factor evaluation & comparative coach
│   ├── app.py              # Flask REST API routes, audio streaming & auth endpoints
│   └── db.py               # PostgreSQL connection pool, schema DDL & attempt queries
├── frontend/
│   ├── index.html          # Responsive single-page application layout
│   └── index.js            # Client state, audio player, speech recognition & dashboard
├── .gitignore              # Git ignore rules for secrets and caches
├── PROJECT_REPORT.md       # Comprehensive academic project report
├── Mocklyn_Project_Report.docx # Formatted Word Document project report
├── requirements.txt        # Python package dependencies
└── README.md               # Project documentation
```

---

## 🧪 Testing & Verification

Automated end-to-end tests verify system integrity:
- **Zero-Score Silence Handling**: Submitting silence returns strictly $0/100$.
- **Document Ingestion**: Verified in-memory extraction of skills from PDF and DOCX files.
- **Adaptive Memory**: Confirmed recall of Attempt $N-1$ weaknesses in Attempt $N$.
- **Database Persistence**: Confirmed non-destructive storage of attempt transcripts.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
