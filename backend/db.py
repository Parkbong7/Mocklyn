import os
import json
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:kaiazer07@localhost:5432/mock_interview_db")

def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(64) UNIQUE NOT NULL,
            username VARCHAR(64) UNIQUE NOT NULL,
            password_hash VARCHAR(256) NOT NULL,
            full_name VARCHAR(128),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            session_token VARCHAR(128) PRIMARY KEY,
            user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS attempts (
            attempt_id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
            attempt_number INTEGER NOT NULL,
            interview_type VARCHAR(64) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            current_question INTEGER DEFAULT 1,
            questions JSONB NOT NULL DEFAULT '[]'::jsonb,
            answers JSONB NOT NULL DEFAULT '[]'::jsonb,
            score INTEGER DEFAULT 0,
            strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
            weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
            improvement_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
            summary TEXT DEFAULT '',
            feedback TEXT DEFAULT '',
            comparison JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        """)
        conn.commit()
    conn.close()

def register_user(username, password, full_name=""):
    username = username.strip().lower()
    user_id = "usr_" + uuid.uuid4().hex[:12]
    pw_hash = generate_password_hash(password)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (user_id, username, password_hash, full_name) VALUES (%s, %s, %s, %s) RETURNING user_id, username, full_name, created_at;",
                (user_id, username, pw_hash, full_name or username.capitalize())
            )
            user = cur.fetchone()
            conn.commit()
            return dict(user)
    except psycopg2.IntegrityError:
        conn.rollback()
        return None
    finally:
        conn.close()

def authenticate_user(username, password):
    username = username.strip().lower()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE username = %s;", (username,))
            user = cur.fetchone()
            if user and check_password_hash(user["password_hash"], password):
                return {
                    "user_id": user["user_id"],
                    "username": user["username"],
                    "full_name": user["full_name"],
                    "created_at": str(user["created_at"])
                }
            return None
    finally:
        conn.close()

def create_session(user_id):
    token = "sess_" + uuid.uuid4().hex
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO sessions (session_token, user_id) VALUES (%s, %s);", (token, user_id))
            conn.commit()
            return token
    finally:
        conn.close()

def get_user_by_token(session_token):
    if not session_token:
        return None
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            SELECT u.user_id, u.username, u.full_name, u.created_at 
            FROM sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.session_token = %s;
            """, (session_token,))
            user = cur.fetchone()
            if user:
                cur.execute("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE session_token = %s;", (session_token,))
                conn.commit()
                return dict(user)
            return None
    finally:
        conn.close()

def delete_session(session_token):
    if not session_token:
        return
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE session_token = %s;", (session_token,))
            conn.commit()
    finally:
        conn.close()

def create_attempt(user_id, interview_type, first_question):
    attempt_id = "att_" + uuid.uuid4().hex[:12]
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Count past completed attempts for user to assign sequential attempt_number
            cur.execute("SELECT COUNT(*) as count FROM attempts WHERE user_id = %s;", (user_id,))
            count = cur.fetchone()["count"]
            attempt_number = count + 1

            questions_json = json.dumps([first_question])
            answers_json = json.dumps([])

            cur.execute("""
            INSERT INTO attempts (
                attempt_id, user_id, attempt_number, interview_type, status,
                current_question, questions, answers
            ) VALUES (%s, %s, %s, %s, 'in_progress', 1, %s::jsonb, %s::jsonb)
            RETURNING *;
            """, (attempt_id, user_id, attempt_number, interview_type, questions_json, answers_json))
            row = cur.fetchone()
            conn.commit()
            return dict(row)
    finally:
        conn.close()

def get_attempt(attempt_id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM attempts WHERE attempt_id = %s;", (attempt_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def get_active_attempt(user_id, interview_type=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if interview_type:
                cur.execute("""
                SELECT * FROM attempts 
                WHERE user_id = %s AND status = 'in_progress' AND interview_type = %s
                ORDER BY created_at DESC LIMIT 1;
                """, (user_id, interview_type))
            else:
                cur.execute("""
                SELECT * FROM attempts 
                WHERE user_id = %s AND status = 'in_progress'
                ORDER BY created_at DESC LIMIT 1;
                """, (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def update_attempt_progress(attempt_id, answer_text, next_question=None, is_complete=False):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT questions, answers, current_question FROM attempts WHERE attempt_id = %s;", (attempt_id,))
            curr = cur.fetchone()
            if not curr:
                return None
            
            answers = curr["answers"] if isinstance(curr["answers"], list) else json.loads(curr["answers"] or "[]")
            questions = curr["questions"] if isinstance(curr["questions"], list) else json.loads(curr["questions"] or "[]")
            answers.append(answer_text)

            new_q_idx = curr["current_question"] + 1

            if next_question and not is_complete:
                questions.append(next_question)

            cur.execute("""
            UPDATE attempts SET 
                answers = %s::jsonb,
                questions = %s::jsonb,
                current_question = %s
            WHERE attempt_id = %s
            RETURNING *;
            """, (json.dumps(answers), json.dumps(questions), min(new_q_idx, 5), attempt_id))
            row = cur.fetchone()
            conn.commit()
            return dict(row)
    finally:
        conn.close()

def save_attempt_feedback(attempt_id, score, summary, strengths, weaknesses, feedback, improvement_areas, comparison):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            UPDATE attempts SET
                status = 'completed',
                completed_at = CURRENT_TIMESTAMP,
                score = %s,
                summary = %s,
                strengths = %s::jsonb,
                weaknesses = %s::jsonb,
                feedback = %s,
                improvement_areas = %s::jsonb,
                comparison = %s::jsonb
            WHERE attempt_id = %s
            RETURNING *;
            """, (
                score, summary, json.dumps(strengths), json.dumps(weaknesses),
                feedback, json.dumps(improvement_areas), json.dumps(comparison), attempt_id
            ))
            row = cur.fetchone()
            conn.commit()
            return dict(row)
    finally:
        conn.close()

def get_user_attempts(user_id, limit=50):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            SELECT * FROM attempts 
            WHERE user_id = %s 
            ORDER BY attempt_number DESC, created_at DESC 
            LIMIT %s;
            """, (user_id, limit))
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        conn.close()

def get_previous_completed_attempts(user_id, before_attempt_id=None, limit=3):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if before_attempt_id:
                cur.execute("""
                SELECT * FROM attempts 
                WHERE user_id = %s AND status = 'completed' AND attempt_id != %s
                ORDER BY completed_at DESC, created_at DESC LIMIT %s;
                """, (user_id, before_attempt_id, limit))
            else:
                cur.execute("""
                SELECT * FROM attempts 
                WHERE user_id = %s AND status = 'completed'
                ORDER BY completed_at DESC, created_at DESC LIMIT %s;
                """, (user_id, limit))
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        conn.close()

def get_user_profile(user_id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            SELECT * FROM attempts 
            WHERE user_id = %s AND status = 'completed'
            ORDER BY attempt_number ASC;
            """, (user_id,))
            attempts = [dict(r) for r in cur.fetchall()]

            if not attempts:
                return {
                    "total_attempts": 0,
                    "average_score": 0,
                    "recent_score": 0,
                    "score_trend": 0,
                    "recurring_strengths": [],
                    "recurring_weaknesses": [],
                    "strongest_category": "N/A",
                    "weakest_category": "N/A",
                    "recommended_focus_areas": ["Complete your first interview to generate personalized coaching insights."],
                    "score_history": []
                }

            scores = [a["score"] for a in attempts]
            total_attempts = len(attempts)
            average_score = round(sum(scores) / total_attempts, 1)
            recent_score = scores[-1]
            first_score = scores[0]
            score_trend = recent_score - (scores[-2] if len(scores) > 1 else first_score)

            # Analyze subject categories
            subject_scores = {}
            for a in attempts:
                sub = a["interview_type"]
                subject_scores.setdefault(sub, []).append(a["score"])
            
            sub_avgs = {s: sum(vals)/len(vals) for s, vals in subject_scores.items()}
            strongest_category = max(sub_avgs, key=sub_avgs.get) if sub_avgs else "N/A"
            weakest_category = min(sub_avgs, key=sub_avgs.get) if sub_avgs else "N/A"

            # Tally strengths and weaknesses
            from collections import Counter
            all_strengths = []
            all_weaknesses = []
            all_improvements = []

            for a in attempts:
                st = a["strengths"] if isinstance(a["strengths"], list) else json.loads(a["strengths"] or "[]")
                wk = a["weaknesses"] if isinstance(a["weaknesses"], list) else json.loads(a["weaknesses"] or "[]")
                imp = a["improvement_areas"] if isinstance(a["improvement_areas"], list) else json.loads(a["improvement_areas"] or "[]")
                all_strengths.extend(st)
                all_weaknesses.extend(wk)
                all_improvements.extend(imp)

            strength_counts = Counter(all_strengths)
            weakness_counts = Counter(all_weaknesses)
            improvement_counts = Counter(all_improvements)

            recurring_strengths = [item for item, c in strength_counts.most_common(4)]
            recurring_weaknesses = [item for item, c in weakness_counts.most_common(4)]
            recommended_focus = [item for item, c in improvement_counts.most_common(3)]
            if not recommended_focus:
                recommended_focus = recurring_weaknesses[:2]

            score_history = [
                {
                    "attempt_number": a["attempt_number"],
                    "interview_type": a["interview_type"],
                    "score": a["score"],
                    "created_at": str(a["created_at"])
                }
                for a in attempts
            ]

            return {
                "total_attempts": total_attempts,
                "average_score": average_score,
                "recent_score": recent_score,
                "score_trend": score_trend,
                "recurring_strengths": recurring_strengths,
                "recurring_weaknesses": recurring_weaknesses,
                "strongest_category": strongest_category,
                "weakest_category": weakest_category,
                "recommended_focus_areas": recommended_focus,
                "score_history": score_history,
                "progression": score_history
            }
    finally:
        conn.close()
