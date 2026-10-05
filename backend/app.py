import os
import json
import base64
import urllib.parse
import requests
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import db
import ai_engine

load_dotenv()

MURF_API_KEY = os.getenv("MURF_API_KEY")

app = Flask(__name__)
CORS(app, expose_headers=["X-Attempt-Id", "X-Question-Number", "X-Interview-Complete", "X-Returning-Candidate", "X-Question-Text"])

# Ensure DB tables are ready on launch
try:
    db.init_db()
    print("PostgreSQL Database initialized successfully.")
except Exception as e:
    print("Database init error:", e)

@app.route("/", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "app": "Mocklyn AI Interview Platform"}), 200

def stream_audio(text):
    """
    Streams audio chunk from Murf API if available; otherwise yields empty.
    """
    if not MURF_API_KEY or not MURF_API_KEY.strip():
        return
    BASE_URL = "https://global.api.murf.ai/v1/speech/stream"
    payload = {
        "text": text,
        "voiceId": "en-US-natalie",
        "model": "FALCON",
        "multiNativeLocale": "en-US",
        "sampleRate": 24000,
        "format": "MP3",
    }
    headers = {
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY
    }
    try:
        response = requests.post(
            BASE_URL,
            headers=headers,
            data=json.dumps(payload),
            stream=True,
            timeout=10
        )
        if response.status_code == 200:
            for chunk in response.iter_content(chunk_size=4096):
                if chunk:
                    yield base64.b64encode(chunk).decode("utf-8") + "\n"
    except Exception as e:
        print("Murf streaming error (handled gracefully):", e)


# ==========================================
# AUTHENTICATION ROUTES (PostgreSQL Sessions)
# ==========================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or username).strip()

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400

    user = db.register_user(username, password, full_name)
    if not user:
        return jsonify({"success": False, "error": "Username already exists"}), 409

    token = db.create_session(user["user_id"])
    return jsonify({
        "success": True,
        "user": user,
        "token": token
    })

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400

    user = db.authenticate_user(username, password)
    if not user:
        return jsonify({"success": False, "error": "Invalid username or password"}), 401

    token = db.create_session(user["user_id"])
    return jsonify({
        "success": True,
        "user": user,
        "token": token
    })

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if token:
        db.delete_session(token)
    return jsonify({"success": True})

@app.route("/api/auth/me", methods=["GET"])
def get_me():
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    user = db.get_user_by_token(token)
    if not user:
        return jsonify({"success": False, "error": "Invalid or expired session"}), 401
    return jsonify({"success": True, "user": user})


# ==========================================
# DOCUMENT / RESUME INTERVIEW ANALYSIS
# ==========================================

@app.route("/api/document/analyze", methods=["POST"])
def analyze_document():
    text = ""
    filename = "document"

    if "file" in request.files:
        file_obj = request.files["file"]
        filename = file_obj.filename or "document"
        file_bytes = file_obj.read()
        text = ai_engine.extract_document_text(file_bytes, filename)
    elif request.is_json:
        data = request.json or {}
        text = data.get("text", "")
        filename = data.get("filename", "pasted_document.txt")

    if not text or not text.strip():
        return jsonify({"success": False, "error": "No readable text found in the uploaded file or input."}), 400

    doc_info = ai_engine.analyze_document(text, filename)
    return jsonify({
        "success": True,
        "document": doc_info
    })


# ==========================================
# INTERVIEW LIFECYCLE & CONTINUOUS COACHING
# ==========================================

@app.route("/start-interview", methods=["POST"])
def start_interview():
    data = request.json or {}
    subject = (data.get("subject") or "Python").strip()
    user_id = (data.get("user_id") or "guest").strip()
    resume_attempt_id = data.get("resume_attempt_id")
    custom_questions = data.get("custom_questions") # 5 tailored questions from document
    document_skills = data.get("document_skills")

    # If resuming an in-progress attempt
    if resume_attempt_id:
        existing = db.get_attempt(resume_attempt_id)
        if existing and existing["status"] == "in_progress" and existing["user_id"] == user_id:
            questions = existing["questions"] if isinstance(existing["questions"], list) else json.loads(existing["questions"] or "[]")
            curr_q = questions[-1] if questions else f"Welcome back. Let us continue your {subject} interview."
            resp = Response(stream_audio(curr_q), mimetype="text/plain")
            resp.headers["X-Attempt-Id"] = existing["attempt_id"]
            resp.headers["X-Question-Number"] = str(existing["current_question"])
            resp.headers["X-Interview-Complete"] = "false"
            resp.headers["X-Returning-Candidate"] = "true"
            resp.headers["X-Question-Text"] = urllib.parse.quote(curr_q)
            return resp

    # Fetch past completed attempts for this candidate to provide continuous context
    past_attempts = db.get_previous_completed_attempts(user_id, limit=3)
    is_returning = len(past_attempts) > 0

    first_question = ai_engine.generate_first_question(subject, past_attempts, custom_questions=custom_questions)
    attempt = db.create_attempt(user_id, subject, first_question)

    # If custom questions were provided for document interview, pre-populate all questions
    if custom_questions and len(custom_questions) == 5:
        all_q = [first_question] + custom_questions[1:]
        conn = db.get_connection()
        with conn.cursor() as cur:
            cur.execute("UPDATE attempts SET questions = %s WHERE attempt_id = %s", (json.dumps(all_q), attempt["attempt_id"]))
            conn.commit()
        conn.close()

    print(f"\n[Started Attempt #{attempt['attempt_number']} ({attempt['attempt_id']}) on {subject} for {user_id}]")
    print(f"[Question 1] {first_question}")

    resp = Response(stream_audio(first_question), mimetype="text/plain")
    resp.headers["X-Attempt-Id"] = attempt["attempt_id"]
    resp.headers["X-Question-Number"] = "1"
    resp.headers["X-Interview-Complete"] = "false"
    resp.headers["X-Returning-Candidate"] = "true" if is_returning else "false"
    resp.headers["X-Question-Text"] = urllib.parse.quote(first_question)
    return resp


@app.route("/submit-answer", methods=["POST"])
def submit_answer():
    attempt_id = request.form.get("attempt_id") or request.headers.get("X-Attempt-Id")
    if not attempt_id:
        if request.is_json:
            attempt_id = request.json.get("attempt_id")

    if not attempt_id:
        return jsonify({"error": "Missing attempt_id"}), 400

    attempt = db.get_attempt(attempt_id)
    if not attempt:
        return jsonify({"error": "Attempt not found"}), 404

    # Extract answer transcript
    transcript_text = request.form.get("transcript_text", "").strip()
    if not transcript_text and request.is_json:
        transcript_text = request.json.get("transcript_text", "").strip()

    if not transcript_text:
        audio_file = request.files.get("audio")
        if audio_file:
            transcript_text = "(Spoken audio response recorded)"
        else:
            transcript_text = ""

    current_q_idx = attempt["current_question"]
    is_complete = current_q_idx >= 5

    questions = attempt["questions"] if isinstance(attempt["questions"], list) else json.loads(attempt["questions"] or "[]")
    prev_q = questions[current_q_idx - 1] if len(questions) >= current_q_idx else ""
    subject = attempt["interview_type"]

    next_q = None
    if not is_complete:
        next_q_idx = current_q_idx + 1
        past_attempts = db.get_previous_completed_attempts(attempt["user_id"], before_attempt_id=attempt_id, limit=3)
        if len(questions) >= next_q_idx:
            next_q = ai_engine.generate_next_question(subject, next_q_idx, prev_q, transcript_text, past_attempts, custom_questions=questions)
        else:
            next_q = ai_engine.generate_next_question(subject, next_q_idx, prev_q, transcript_text, past_attempts)
        speech_text = next_q
    else:
        speech_text = "That concludes our 5 interview questions! Click Get Feedback to see your personalized coaching breakdown."

    # Record answer in database
    if len(questions) <= current_q_idx and next_q:
        updated_attempt = db.update_attempt_progress(attempt_id, transcript_text, next_q, is_complete)
    else:
        answers = attempt["answers"] if isinstance(attempt["answers"], list) else json.loads(attempt["answers"] or "[]")
        answers.append(transcript_text)
        new_status = 'completed' if is_complete else 'in_progress'
        new_q_idx = min(current_q_idx + 1, 5)
        conn = db.get_connection()
        with conn.cursor() as cur:
            if is_complete:
                cur.execute("""
                    UPDATE attempts 
                    SET answers = %s::jsonb, current_question = %s, status = %s, completed_at = CURRENT_TIMESTAMP
                    WHERE attempt_id = %s
                """, (json.dumps(answers), new_q_idx, new_status, attempt_id))
            else:
                cur.execute("""
                    UPDATE attempts 
                    SET answers = %s::jsonb, current_question = %s, status = %s
                    WHERE attempt_id = %s
                """, (json.dumps(answers), new_q_idx, new_status, attempt_id))
            conn.commit()
        conn.close()

    resp = Response(stream_audio(speech_text), mimetype="text/plain")
    resp.headers["X-Attempt-Id"] = attempt_id
    resp.headers["X-Question-Number"] = str(min(current_q_idx + 1, 5))
    resp.headers["X-Interview-Complete"] = "true" if is_complete else "false"
    resp.headers["X-Question-Text"] = urllib.parse.quote(speech_text)
    return resp


@app.route("/get-feedback", methods=["POST"])
def get_feedback():
    data = request.json or {}
    attempt_id = data.get("attempt_id") or request.headers.get("X-Attempt-Id")
    document_skills = data.get("document_skills")

    if not attempt_id:
        return jsonify({"success": False, "error": "Missing attempt_id"}), 400

    attempt = db.get_attempt(attempt_id)
    if not attempt:
        return jsonify({"success": False, "error": "Attempt not found"}), 404

    # If already evaluated and completed, return stored feedback
    if attempt["status"] == "completed" and attempt.get("score", 0) > 0:
        return jsonify({
            "success": True,
            "feedback": {
                "attempt_id": attempt["attempt_id"],
                "attempt_number": attempt["attempt_number"],
                "subject": attempt["interview_type"],
                "candidate_score": attempt["score"],
                "summary": attempt["summary"],
                "strengths": attempt["strengths"] if isinstance(attempt["strengths"], list) else json.loads(attempt["strengths"] or "[]"),
                "weaknesses": attempt["weaknesses"] if isinstance(attempt["weaknesses"], list) else json.loads(attempt["weaknesses"] or "[]"),
                "feedback": attempt["feedback"],
                "areas_of_improvement": ", ".join(attempt["improvement_areas"]) if isinstance(attempt["improvement_areas"], list) else attempt["improvement_areas"],
                "improvement_areas": attempt["improvement_areas"] if isinstance(attempt["improvement_areas"], list) else json.loads(attempt["improvement_areas"] or "[]"),
                "comparison": attempt["comparison"] if isinstance(attempt["comparison"], dict) else json.loads(attempt["comparison"] or "{}")
            }
        })

    questions = attempt["questions"] if isinstance(attempt["questions"], list) else json.loads(attempt["questions"] or "[]")
    answers = attempt["answers"] if isinstance(attempt["answers"], list) else json.loads(attempt["answers"] or "[]")

    past_attempts = db.get_previous_completed_attempts(attempt["user_id"], before_attempt_id=attempt_id, limit=3)

    evaluation = ai_engine.evaluate_interview(
        subject=attempt["interview_type"],
        questions=questions,
        answers=answers,
        past_attempts=past_attempts,
        document_skills=document_skills
    )

    saved = db.save_attempt_feedback(
        attempt_id=attempt_id,
        score=evaluation["score"],
        summary=evaluation["summary"],
        strengths=evaluation["strengths"],
        weaknesses=evaluation["weaknesses"],
        feedback=evaluation["feedback"],
        improvement_areas=evaluation["improvement_areas"],
        comparison=evaluation["comparison"]
    )

    return jsonify({
        "success": True,
        "feedback": {
            "attempt_id": saved["attempt_id"],
            "attempt_number": saved["attempt_number"],
            "subject": saved["interview_type"],
            "candidate_score": saved["score"],
            "summary": saved["summary"],
            "strengths": evaluation["strengths"],
            "weaknesses": evaluation["weaknesses"],
            "feedback": saved["feedback"],
            "areas_of_improvement": ", ".join(evaluation["improvement_areas"]),
            "improvement_areas": evaluation["improvement_areas"],
            "comparison": evaluation["comparison"]
        }
    })


@app.route("/history/<user_id>", methods=["GET"])
def get_user_history(user_id):
    user_id = (user_id or "guest").strip()
    attempts = db.get_user_attempts(user_id)
    return jsonify({
        "success": True,
        "user_id": user_id,
        "history": attempts
    })


@app.route("/attempt/<attempt_id>", methods=["GET"])
def get_attempt_detail(attempt_id):
    attempt = db.get_attempt(attempt_id)
    if not attempt:
        return jsonify({"success": False, "error": "Attempt not found"}), 404
    return jsonify({
        "success": True,
        "attempt": attempt
    })


@app.route("/profile/<user_id>", methods=["GET"])
def get_profile(user_id):
    user_id = (user_id or "guest").strip()
    profile = db.get_user_profile(user_id)
    return jsonify({
        "success": True,
        "user_id": user_id,
        "profile": profile
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
