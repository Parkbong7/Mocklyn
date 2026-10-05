import os
import io
import json
import re
from dotenv import load_dotenv

import pypdf
import docx

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Domain knowledge bank for intelligent contextual evaluation & questions
TOPIC_QUESTIONS = {
    "Python": [
        "To get started, how would you explain the difference between Python's list and tuple, and when would you choose one over the other in production?",
        "Building on that, how does Python's memory management and garbage collection handle circular references, and what role does the GIL play in multithreading?",
        "Can you explain how Python decorators work under the hood, and how you would implement a decorator that measures execution time?",
        "When designing high-throughput applications in Python, how do you decide between multiprocessing, threading, and asyncio?",
        "Finally, what are Python generators and iterators, and how do they help optimize memory when processing large datasets?"
    ],
    "Generative AI": [
        "Welcome! To begin, how would you explain the core difference between standard transformer self-attention and cross-attention mechanisms?",
        "Following up, what are the primary differences between fine-tuning a foundational LLM with LoRA versus utilizing Retrieval-Augmented Generation (RAG)?",
        "How do vector embeddings and similarity search algorithms like cosine similarity or HNSW work inside vector databases for semantic retrieval?",
        "When deploying LLMs to production, what strategies do you recommend to detect and mitigate hallucinations and prompt injections?",
        "To wrap up, how do agentic AI workflows with tool-calling and memory loops differ from traditional static prompt chaining?"
    ],
    "Self Introduction": [
        "Welcome! Please introduce yourself, highlighting your background, primary technical skills, and what drives your passion in engineering.",
        "That is great context. Can you walk me through the most technically challenging project you have worked on and your specific contributions?",
        "When faced with a tight deadline and ambiguous technical requirements, how do you prioritize tasks and communicate with stakeholders?",
        "Tell me about a time you made a significant mistake or had an architectural disagreement with a teammate, and how you resolved it.",
        "Looking forward, what technical skills or architectural domains are you most excited to master in your next role?"
    ],
    "English": [
        "Welcome to the professional communication interview! Please introduce yourself and describe your current day-to-day responsibilities.",
        "How do you articulate complex technical tradeoffs to non-technical business partners or executive stakeholders?",
        "Can you describe a situation where you had to give constructive, critical feedback to a colleague while preserving a strong relationship?",
        "When managing cross-functional projects across multiple time zones, what strategies ensure clear and asynchronous alignment?",
        "To conclude, what principles guide your presentation style when pitching an innovative technical solution to an audience?"
    ],
    "HTML": [
        "Let us start with the fundamentals: why is semantic HTML important for modern web accessibility (a11y) and SEO?",
        "How does the browser's critical rendering path work when parsing HTML, CSS, and executing synchronous vs asynchronous scripts?",
        "What are the differences between standard HTML5 storage options like localStorage, sessionStorage, IndexedDB, and cookies?",
        "How do responsive images using srcset, sizes, and the picture element improve page load performance and Core Web Vitals?",
        "To finish, what is the Shadow DOM, and how does encapsulation in HTML5 Web Components differ from standard DOM elements?"
    ],
    "CSS": [
        "To begin, how do you decide when to use CSS Grid versus CSS Flexbox for complex, modern responsive layouts?",
        "Can you explain the CSS box-sizing property, and how the CSS stacking context and z-index are established?",
        "How do CSS custom properties (variables) interact with the cascade and inheritance, and how do you leverage them for dynamic theming?",
        "What strategies do you use to optimize CSS performance and avoid layout thrashing and unnecessary repaints during animations?",
        "Finally, how do modern CSS features like container queries, clamp(), and subgrid change how we architect responsive components?"
    ]
}

# Known technology keywords across domains for document skill extraction
TECH_KEYWORDS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css",
    # Frameworks & Libraries
    "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "fastapi", "spring boot", ".net", "pytorch", "tensorflow", "keras", "pandas", "numpy", "scikit-learn",
    # Databases & Storage
    "postgresql", "mysql", "mongodb", "redis", "cassandra", "dynamodb", "elasticsearch", "sqlite", "oracle", "snowflake", "bigquery",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "jenkins", "github actions", "linux", "nginx", "kafka", "rabbitmq",
    # Architecture & Concepts
    "microservices", "rest api", "graphql", "grpc", "distributed systems", "system design", "rag", "llm", "transformers", "embeddings", "vector search", "agile", "scrum"
]


# ==========================================
# 1. DOCUMENT / RESUME PARSING & INTERVIEW
# ==========================================

def extract_document_text(file_stream_or_bytes, filename="document"):
    """
    Extracts raw text content from PDF, DOCX, or TXT file bytes or streams.
    """
    if isinstance(file_stream_or_bytes, bytes):
        stream = io.BytesIO(file_stream_or_bytes)
    else:
        stream = file_stream_or_bytes

    ext = os.path.splitext(filename)[1].lower()
    text = ""

    try:
        if ext == ".pdf":
            reader = pypdf.PdfReader(stream)
            pages_text = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            text = "\n".join(pages_text)
        elif ext in [".docx", ".doc"]:
            doc = docx.Document(stream)
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            text = "\n".join(paragraphs)
        else:
            if hasattr(stream, "read"):
                raw = stream.read()
            else:
                raw = stream
            text = raw.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error extracting document {filename}: {e}")
        text = ""

    return text.strip()

def analyze_document(text, filename="Document"):
    """
    Analyzes document text, extracts skills, projects, candidate summary,
    and generates 5 customized interview questions based on the candidate's document.
    """
    if not text:
        text = "Technical professional with software engineering and computing experience."

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    raw_lower = text.lower()

    # Determine title / candidate name
    candidate_title = "Candidate Resume"
    if lines:
        first_line = lines[0]
        if len(first_line) < 60 and not any(kw in first_line.lower() for kw in ["resume", "curriculum", "page", "email", "http"]):
            candidate_title = first_line
        else:
            candidate_title = os.path.splitext(os.path.basename(filename))[0]

    # Detect skills
    detected_skills = []
    for kw in TECH_KEYWORDS:
        # Match as word boundary
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, raw_lower):
            detected_skills.append(kw.title() if len(kw) > 3 else kw.upper())

    if not detected_skills:
        detected_skills = ["Software Architecture", "Problem Solving", "System Engineering"]

    # Detect projects or experience highlights
    project_mentions = []
    for line in lines:
        l_low = line.lower()
        if any(trigger in l_low for trigger in ["project", "built", "developed", "architected", "engineered", "designed"]):
            if 15 < len(line) < 160:
                project_mentions.append(line)
        if len(project_mentions) >= 3:
            break

    # Construct 5 tailored interview questions based on the document
    top_skills = detected_skills[:4]
    skill_str = ", ".join(top_skills)

    proj_ref = project_mentions[0] if project_mentions else "your most technically challenging project"
    if len(proj_ref) > 80:
        proj_ref = proj_ref[:80] + "..."

    q1 = f"I've reviewed your document highlighting experience in {skill_str}. To start, could you introduce yourself and walk me through {proj_ref}?"
    
    skill_1 = top_skills[0] if len(top_skills) > 0 else "your core stack"
    skill_2 = top_skills[1] if len(top_skills) > 1 else "supporting technologies"
    q2 = f"In your work leveraging {skill_1} and {skill_2}, what were some of the key technical decisions and trade-offs you made during implementation?"
    
    q3 = f"Can you describe a critical performance bottleneck, concurrency challenge, or production bug you resolved while building systems described in your document?"
    
    skill_3 = top_skills[2] if len(top_skills) > 2 else "cloud infrastructure"
    q4 = f"When architecting scalable, resilient workflows with {skill_3}, how do you approach fault tolerance, data consistency, and observability?"
    
    q5 = f"Looking at the accomplishments in your document, if you had the opportunity to re-architect that system today, what newer architectural patterns or tools would you incorporate?"

    questions = [q1, q2, q3, q4, q5]

    return {
        "title": candidate_title,
        "candidate_name": candidate_title,
        "candidate_title": candidate_title,
        "filename": filename,
        "word_count": len(text.split()),
        "skills": detected_skills[:12],
        "projects": project_mentions,
        "summary": f"Analyzed {filename} ({len(text.split())} words). Identified core competencies: {', '.join(detected_skills[:6])}.",
        "questions": questions
    }


# ==========================================
# 2. CONTINUOUS COACH MEMORY & QUESTION FLOW
# ==========================================

def build_compact_history(past_attempts):
    """
    Synthesizes up to 3 past attempts into a compact 100-word coaching context.
    """
    if not past_attempts:
        return "CANDIDATE HISTORY: First interview attempt. No previous attempts recorded."

    history_lines = ["CANDIDATE HISTORY:"]
    for att in past_attempts[:3]:
        num = att.get("attempt_number", 1)
        sub = att.get("interview_type", "Interview")
        score = att.get("score", 0)
        st = att.get("strengths") or []
        if isinstance(st, str):
            try: st = json.loads(st)
            except: st = [st]
        wk = att.get("weaknesses") or []
        if isinstance(wk, str):
            try: wk = json.loads(wk)
            except: wk = [wk]

        history_lines.append(
            f"- Attempt #{num} ({sub}): Score {score}/100. Strengths: {', '.join(st[:2]) or 'None noted'}. "
            f"Needs Work: {', '.join(wk[:2]) or 'None noted'}."
        )

    return "\n".join(history_lines)

def generate_first_question(subject, past_attempts=None, custom_questions=None):
    if custom_questions and len(custom_questions) > 0:
        base_q = custom_questions[0]
    else:
        questions = TOPIC_QUESTIONS.get(subject, TOPIC_QUESTIONS.get("Python"))
        base_q = questions[0]

    if past_attempts and len(past_attempts) > 0:
        last = past_attempts[0]
        last_wk = last.get("weaknesses") or []
        if isinstance(last_wk, str):
            try: last_wk = json.loads(last_wk)
            except: last_wk = [last_wk]
        wk_str = last_wk[0] if last_wk else "detailed technical explanations"
        return f"Welcome back! In your last session we noted room to strengthen {wk_str}. Let's jump in: {base_q}"
    else:
        return f"Welcome! Let's get started with your {subject} interview. {base_q}"

def generate_next_question(subject, q_idx, previous_q, candidate_answer, past_attempts=None, custom_questions=None):
    if custom_questions and len(custom_questions) >= q_idx:
        target_q = custom_questions[q_idx - 1]
    else:
        questions = TOPIC_QUESTIONS.get(subject, TOPIC_QUESTIONS.get("Python"))
        target_q = questions[min(q_idx - 1, len(questions) - 1)]

    # Natural conversation acknowledgment
    clean = candidate_answer.strip().lower()
    if not is_valid_substantive_answer(candidate_answer):
        ack = "Understood. Let's move on to the next question: "
    elif len(candidate_answer.split()) < 15:
        ack = "Thanks for the concise answer. Moving forward: "
    else:
        ack = "Thank you for that detailed explanation. Moving forward: "

    return f"{ack}{target_q}"


# ==========================================
# 3. DYNAMIC & UNBIASED SCORING ENGINE
# ==========================================

def is_valid_substantive_answer(ans):
    """
    Detects if an answer is an actual response rather than empty silence,
    microphone noise, or boilerplate placeholder.
    """
    if not ans or not isinstance(ans, str):
        return False
    clean = ans.strip().lower()

    if not clean:
        return False

    placeholders = [
        "(candidate did not provide an answer)",
        "(spoken audio response recorded)",
        "(no response provided)",
        "(no answer provided)",
        "candidate provided spoken response",
        "answer recorded successfully. ready for evaluation.",
        "answer recorded successfully.",
        "listening for your voice...",
        "listening to your voice... speak your response clearly.",
        "listening...",
        "n/a", "none", "idk", "pass", "no idea", "skip"
    ]

    if clean in placeholders:
        return False

    if clean.startswith("listening") or clean.startswith("answer recorded"):
        return False

    words = clean.split()
    if len(words) < 3:
        # 1 or 2 words (like "yes", "ok", "hi") is not an interview answer
        return False

    return True

def evaluate_interview(subject, questions, answers, past_attempts=None, document_skills=None):
    """
    Rigorously evaluates candidate responses with an unbiased, multi-factor rubric:
    1. Participation Rate (0-40 pts): Unanswered/silent questions receive 0 pts.
    2. Technical Content & Vocabulary (0-35 pts): Domain-specific concepts used accurately.
    3. Explanatory Depth & Practical Trade-offs (0-25 pts): Detail, structure, examples.

    If candidate did NOT speak at all, score is strictly 0/100 (never 55!).
    """
    total_questions = max(len(questions), 1)

    # Check validity of each answer
    valid_answers = []
    empty_indices = []

    for idx, ans in enumerate(answers):
        if is_valid_substantive_answer(ans):
            valid_answers.append(ans)
        else:
            empty_indices.append(idx + 1)

    num_valid = len(valid_answers)

    # -----------------------------------------------------------------
    # CASE 1: Candidate did not speak or provide substantive answers
    # -----------------------------------------------------------------
    if num_valid == 0:
        final_score = 0
        strengths = [
            "Attendance logged for the interview session.",
            "Platform interface navigation completed."
        ]
        weaknesses = [
            "No verbal or written responses were provided for any of the questions.",
            "Unable to evaluate technical knowledge, architectural depth, or problem-solving without candidate answers.",
            "Microphone was either muted, disconnected, or no speech was detected."
        ]
        summary = f"Completed interview session with 0 out of {total_questions} questions answered. Score: 0/100. No substantive answers were provided for evaluation."
        feedback = (
            "You attended the session but did not provide spoken or written answers to any of the questions. "
            "To receive an accurate technical evaluation, demonstrate your skills, and track your growth across sessions, "
            "you must actively respond to each question. Please ensure your microphone is unmuted and browser permissions are granted, "
            "or type your responses before submitting."
        )
        improvement_areas = [
            "Check microphone settings and ensure browser audio permissions are granted.",
            "Actively attempt each interview question, even if you need to talk through your reasoning out loud.",
            "Practice articulating technical concepts with specific project examples."
        ]

        comparison = {}
        if past_attempts and len(past_attempts) > 0:
            prev = past_attempts[0]
            prev_score = prev.get("score", 0)
            comparison = {
                "previous_attempt_number": prev.get("attempt_number", 1),
                "previous_score": prev_score,
                "current_score": 0,
                "score_change": 0 - prev_score,
                "score_delta": 0 - prev_score,
                "improved_areas": [],
                "recurring_weaknesses": ["Non-participation / lack of verbal answers during session"],
                "note": "Score dropped due to no answers being provided in this session."
            }
        else:
            comparison = {
                "is_first_attempt": True,
                "note": "Initial baseline recorded as 0/100 due to absence of candidate answers."
            }

        return {
            "score": final_score,
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "feedback": feedback,
            "improvement_areas": improvement_areas,
            "comparison": comparison
        }

    # -----------------------------------------------------------------
    # CASE 2: Partial or Full Substantive Answers Provided
    # -----------------------------------------------------------------
    # 1. Participation score (up to 40 pts)
    participation_score = (num_valid / total_questions) * 40

    # 2. Vocabulary & Technical keywords (up to 35 pts)
    combined_valid_text = " ".join(valid_answers).lower()

    # Determine keywords from domain or document
    if document_skills and len(document_skills) > 0:
        kw_list = [s.lower() for s in document_skills]
    else:
        subject_keywords = {
            "Python": ["list", "tuple", "dict", "gil", "thread", "asyncio", "decorator", "generator", "memory", "yield", "complexity", "class", "garbage", "process"],
            "Generative AI": ["attention", "transformer", "lora", "rag", "embedding", "vector", "hallucination", "prompt", "token", "weights", "agent", "hnsw"],
            "Self Introduction": ["experience", "project", "architecture", "team", "challenge", "scale", "performance", "communication", "leadership", "design", "impact"],
            "English": ["stakeholder", "collaboration", "clarity", "feedback", "presentation", "alignment", "communication", "objective", "resolution", "strategic"],
            "HTML": ["semantic", "dom", "accessibility", "a11y", "seo", "render", "storage", "performance", "component", "shadow", "critical"],
            "CSS": ["grid", "flexbox", "box-sizing", "cascade", "variables", "animation", "responsive", "media", "repaint", "stacking", "subgrid"]
        }
        kw_list = subject_keywords.get(subject, subject_keywords["Python"])

    kw_hits = sum(1 for k in kw_list if k in combined_valid_text)
    vocab_score = min((kw_hits / max(len(kw_list) * 0.4, 3)) * 35, 35)

    # 3. Depth, Structure & Trade-offs (up to 25 pts)
    total_valid_words = sum(len(a.split()) for a in valid_answers)
    avg_words_per_valid = total_valid_words / num_valid

    if avg_words_per_valid >= 40:
        depth_score = 25
    elif avg_words_per_valid >= 25:
        depth_score = 19
    elif avg_words_per_valid >= 15:
        depth_score = 13
    else:
        depth_score = 7

    # Bonus for trade-offs / architectural considerations
    has_tradeoffs = any(term in combined_valid_text for term in ["trade-off", "tradeoff", "performance", "scale", "memory", "latency", "bottleneck", "alternative"])
    if has_tradeoffs:
        depth_score = min(depth_score + 3, 25)

    raw_score = int(participation_score + vocab_score + depth_score)
    final_score = min(max(raw_score, 10), 98)

    # Cap if questions were skipped
    if num_valid < total_questions:
        final_score = min(final_score, int((num_valid / total_questions) * 100))

    # Derive Strengths based on actual answers
    strengths = []
    if avg_words_per_valid >= 35:
        strengths.append(f"Thorough and articulate responses (averaging {int(avg_words_per_valid)} words per answered question)")
    elif avg_words_per_valid >= 20:
        strengths.append("Clear and concise communication with direct explanations")
    else:
        strengths.append("Addressed the core questions directly without unnecessary rambling")

    if kw_hits >= 4:
        strengths.append(f"Strong command of core {subject} terminology and concepts (e.g. used terms like {[k for k in kw_list if k in combined_valid_text][:3]})")
    elif kw_hits >= 2:
        strengths.append(f"Demonstrated foundational understanding of key {subject} principles")

    if has_tradeoffs:
        strengths.append("Actively considered engineering trade-offs, performance implications, or real-world constraints")

    if not strengths:
        strengths.append("Willingness to respond to technical interview prompts")

    # Derive Weaknesses based on actual performance
    weaknesses = []
    if empty_indices:
        weaknesses.append(f"Did not provide answers for {len(empty_indices)} of {total_questions} questions (Questions {', '.join(map(str, empty_indices))})")

    if avg_words_per_valid < 25:
        weaknesses.append(f"Responses were relatively brief (averaging {int(avg_words_per_valid)} words); technical interviewers look for deeper explanations")

    if kw_hits < 3:
        weaknesses.append(f"Limited integration of precise technical terminology or architectural keywords")

    if not has_tradeoffs:
        weaknesses.append("Did not explicitly discuss architectural trade-offs, edge cases, or failure modes")

    if not weaknesses:
        weaknesses.append("Could further enrich answers with live code walkthroughs and quantitative impact metrics")

    # Actionable improvement areas
    improvement_areas = []
    if empty_indices:
        improvement_areas.append(f"Ensure all {total_questions} questions are attempted. An incomplete answer with your problem-solving thoughts is always better than silence.")
    if avg_words_per_valid < 30:
        improvement_areas.append("Use the STAR framework (Situation, Task, Action, Result) to expand short answers into comprehensive engineering narratives.")
    if not has_tradeoffs:
        improvement_areas.append("Proactively discuss alternative architectural patterns and trade-offs before concluding your answer.")
    improvement_areas.append(f"Deepen knowledge in advanced {subject} internals, particularly concurrency, memory characteristics, and scalability.")

    # Dynamic feedback text
    quality_phrase = (
        "an exceptional and comprehensive display of technical mastery" if final_score >= 88 else
        "a solid, dependable performance demonstrating good fundamentals" if final_score >= 70 else
        "a promising start with several notable areas for technical growth" if final_score >= 45 else
        "a partial attempt requiring substantially more detail and participation"
    )

    feedback = (
        f"In this {subject} session, you delivered {quality_phrase}. "
        f"You answered {num_valid} of {total_questions} questions, averaging {int(avg_words_per_valid)} words per response. "
        + (f"Your answers accurately highlighted key concepts such as {', '.join([k for k in kw_list if k in combined_valid_text][:3])}. " if kw_hits >= 2 else "")
        + (f"However, leaving questions {', '.join(map(str, empty_indices))} unanswered directly impacted your overall score. " if empty_indices else "")
        + "To advance to top-tier performance, consistently analyze the trade-offs of your choices and ground every explanation in real-world production experience."
    )

    summary = f"Answered {num_valid}/{total_questions} questions on {subject} with an overall score of {final_score}/100."

    # Comparative analysis against historical attempts
    comparison = {}
    if past_attempts and len(past_attempts) > 0:
        prev = past_attempts[0]
        prev_score = prev.get("score", final_score)
        prev_weaknesses = prev.get("weaknesses") or []
        if isinstance(prev_weaknesses, str):
            try: prev_weaknesses = json.loads(prev_weaknesses)
            except: prev_weaknesses = [prev_weaknesses]

        prev_strengths = prev.get("strengths") or []
        if isinstance(prev_strengths, str):
            try: prev_strengths = json.loads(prev_strengths)
            except: prev_strengths = [prev_strengths]

        score_change = final_score - prev_score

        # Identify improved areas: previous weaknesses that candidate did better on
        improved = []
        recurring = []
        for pw in prev_weaknesses:
            pw_low = pw.lower()
            if "brief" in pw_low and avg_words_per_valid >= 28:
                improved.append("Answer depth & detail significantly improved")
            elif "not provide answer" in pw_low and num_valid == total_questions:
                improved.append("Completed and answered all interview questions without skipping")
            elif "trade-off" in pw_low and has_tradeoffs:
                improved.append("Addressed architectural trade-offs and performance implications")
            elif "terminology" in pw_low and kw_hits >= 3:
                improved.append(f"More fluent and accurate use of technical {subject} vocabulary")
            else:
                recurring.append(pw)

        if not improved and score_change > 0:
            improved.append("Overall technical confidence and response pacing")

        consistent_str = [s for s in strengths if any(ps.lower() in s.lower() or s.lower() in ps.lower() for ps in prev_strengths)]
        if not consistent_str and prev_strengths:
            consistent_str = [prev_strengths[0]]

        comparison = {
            "previous_attempt_number": prev.get("attempt_number", 1),
            "previous_score": prev_score,
            "current_score": final_score,
            "score_change": score_change,
            "score_delta": score_change,
            "improved_areas": improved,
            "recurring_weaknesses": recurring[:2] if recurring else ["Continue expanding technical depth under pressure"],
            "new_weaknesses": [w for w in weaknesses if w not in recurring][:2],
            "consistent_strengths": consistent_str[:2]
        }
    else:
        comparison = {
            "is_first_attempt": True,
            "note": "This is your initial baseline interview. Future attempts will compare against this score to highlight improvements and recurring patterns."
        }

    return {
        "score": final_score,
        "summary": summary,
        "strengths": strengths[:3],
        "weaknesses": weaknesses[:3],
        "feedback": feedback,
        "improvement_areas": improvement_areas[:3],
        "comparison": comparison
    }
