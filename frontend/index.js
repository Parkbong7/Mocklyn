// ========================================================
// Mocklyn - Continuous AI Interview Coach Frontend Controller
// Session & Attempt Persistence with Adaptive AI
// ========================================================

const API_BASE_URL = "http://127.0.0.1:5000";

// --- Global State ---
let currentUser = null;
let authToken = null;
let currentSubject = "Python";
let currentAttemptId = null;
let currentQuestionIndex = 1;
let isSpeaking = false;
let currentAudio = null;

// Document Interview State
let currentDocData = null; // { title, filename, skills, projects, summary, questions }
let docUploadMode = "file"; // "file" or "text"

// Recording & Web Speech Recognition State
let mediaRecorder = null;
let recordingChunks = [];
let recordedBlob = null;
let speechRecognition = null;
let speechTranscript = "";

// --- DOM Elements ---
// Top Navigation & User Controls
const navPracticeBtn = document.getElementById("navPracticeBtn");
const navDashboardBtn = document.getElementById("navDashboardBtn");
const practiceView = document.getElementById("practiceView");
const dashboardView = document.getElementById("dashboardView");
const userProfileBadge = document.getElementById("userProfileBadge");
const candidateNameDisplay = document.getElementById("candidateNameDisplay");
const userInitial = document.getElementById("userInitial");
const logoutBtn = document.getElementById("logoutBtn");

// Sidebar & Topic Selection
const subjectBtns = document.querySelectorAll(".subject-btn");
const subjectBadge = document.getElementById("subjectBadge");
const subjectIcon = document.getElementById("subjectIcon");
const returningCandidateBadge = document.getElementById("returningCandidateBadge");

// Resume In-Progress Banner
const resumeBanner = document.getElementById("resumeBanner");
const resumeBannerText = document.getElementById("resumeBannerText");
const resumeInterviewBtn = document.getElementById("resumeInterviewBtn");
const discardInterviewBtn = document.getElementById("discardInterviewBtn");

// Practice View States
const welcomeState = document.getElementById("welcomeState");
const welcomeStartBtn = document.getElementById("welcomeStartBtn");
const interviewState = document.getElementById("interviewState");
const questionNum = document.getElementById("questionNum");
const speakingBubble = document.getElementById("speakingBubble");
const speakingText = document.getElementById("speakingText");
const currentQuestionText = document.getElementById("currentQuestionText");
const liveTranscriptBox = document.getElementById("liveTranscriptBox");
const answerTextInput = document.getElementById("answerTextInput");
const silentAnswerWarning = document.getElementById("silentAnswerWarning");

// Document Upload Panel Elements
const documentUploadPanel = document.getElementById("documentUploadPanel");
const tabDocFileBtn = document.getElementById("tabDocFileBtn");
const tabDocTextBtn = document.getElementById("tabDocTextBtn");
const docDropzoneArea = document.getElementById("docDropzoneArea");
const docFileInput = document.getElementById("docFileInput");
const docPasteArea = document.getElementById("docPasteArea");
const docPasteInput = document.getElementById("docPasteInput");
const docAnalyzePasteBtn = document.getElementById("docAnalyzePasteBtn");
const docAnalysisSpinner = document.getElementById("docAnalysisSpinner");
const docPreviewCard = document.getElementById("docPreviewCard");
const docPreviewTitle = document.getElementById("docPreviewTitle");
const docPreviewStats = document.getElementById("docPreviewStats");
const docSkillsList = document.getElementById("docSkillsList");
const docSummarySnippet = document.getElementById("docSummarySnippet");
const docStartInterviewBtn = document.getElementById("docStartInterviewBtn");
const docClearBtn = document.getElementById("docClearBtn");

// Recording & Action Controls
const startInterviewBtn = document.getElementById("startInterviewBtn");
const recordBtn = document.getElementById("recordBtn");
const micIcon = document.getElementById("micIcon");
const stopIcon = document.getElementById("stopIcon");
const recordingStatus = document.getElementById("recordingStatus");
const submitBtn = document.getElementById("submitBtn");
const endInterviewBtn = document.getElementById("endInterviewBtn");

// Feedback Section Elements
const feedbackSection = document.getElementById("feedbackSection");
const getFeedbackArea = document.getElementById("getFeedbackArea");
const getFeedbackBtn = document.getElementById("getFeedbackBtn");
const feedbackContent = document.getElementById("feedbackContent");
const feedbackAttemptBadge = document.getElementById("feedbackAttemptBadge");
const feedbackSubject = document.getElementById("feedbackSubject");
const feedbackSummaryText = document.getElementById("feedbackSummaryText");
const scoreValue = document.getElementById("scoreValue");
const comparisonBox = document.getElementById("comparisonBox");
const comparisonDeltaBadge = document.getElementById("comparisonDeltaBadge");
const comparisonImprovedText = document.getElementById("comparisonImprovedText");
const comparisonRecurringText = document.getElementById("comparisonRecurringText");
const feedbackStrengthsList = document.getElementById("feedbackStrengthsList");
const feedbackWeaknessesList = document.getElementById("feedbackWeaknessesList");
const feedbackText = document.getElementById("feedbackText");
const feedbackImprovementList = document.getElementById("feedbackImprovementList");
const viewInDashboardBtn = document.getElementById("viewInDashboardBtn");
const newInterviewBtn = document.getElementById("newInterviewBtn");

// Dashboard Elements
const dashboardStartBtn = document.getElementById("dashboardStartBtn");
const emptyStateStartBtn = document.getElementById("emptyStateStartBtn");
const statTotalAttempts = document.getElementById("statTotalAttempts");
const statAverageScore = document.getElementById("statAverageScore");
const statRecentScore = document.getElementById("statRecentScore");
const statScoreTrendBadge = document.getElementById("statScoreTrendBadge");
const statStrongestCategory = document.getElementById("statStrongestCategory");
const progressionContainer = document.getElementById("progressionContainer");
const progressionTrendSummary = document.getElementById("progressionTrendSummary");
const recurringStrengthsContainer = document.getElementById("recurringStrengthsContainer");
const recurringWeaknessesContainer = document.getElementById("recurringWeaknessesContainer");
const recommendedFocusList = document.getElementById("recommendedFocusList");
const attemptCountBadge = document.getElementById("attemptCountBadge");
const dashboardEmptyState = document.getElementById("dashboardEmptyState");
const attemptHistoryList = document.getElementById("attemptHistoryList");
const attemptCardTemplate = document.getElementById("attemptCardTemplate");

// Modal 1: Full Feedback Modal
const fullFeedbackModal = document.getElementById("fullFeedbackModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalDoneBtn = document.getElementById("modalDoneBtn");
const modalAttemptBadge = document.getElementById("modalAttemptBadge");
const modalSubject = document.getElementById("modalSubject");
const modalDate = document.getElementById("modalDate");
const modalScore = document.getElementById("modalScore");
const modalComparisonBox = document.getElementById("modalComparisonBox");
const modalScoreChange = document.getElementById("modalScoreChange");
const modalImprovedText = document.getElementById("modalImprovedText");
const modalRecurringText = document.getElementById("modalRecurringText");
const modalStrengthsList = document.getElementById("modalStrengthsList");
const modalWeaknessesList = document.getElementById("modalWeaknessesList");
const modalFeedbackText = document.getElementById("modalFeedbackText");
const modalTranscriptList = document.getElementById("modalTranscriptList");

// Modal 2: Auth (Login/Register) Modal
const loginModal = document.getElementById("loginModal");
const closeLoginBtn = document.getElementById("closeLoginBtn");
const tabLoginBtn = document.getElementById("tabLoginBtn");
const tabRegisterBtn = document.getElementById("tabRegisterBtn");
const fullNameGroup = document.getElementById("fullNameGroup");
const authFullName = document.getElementById("authFullName");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authErrorBanner = document.getElementById("authErrorBanner");
const authForm = document.getElementById("authForm");

// Subject Icon & Color Mapping
const subjectIconMap = {
    "Resume / Document": "fas fa-file-alt text-cyan-400",
    "Self Introduction": "fas fa-user text-blue-400",
    "Generative AI": "fas fa-brain text-purple-400",
    "Python": "fab fa-python text-yellow-400",
    "English": "fas fa-language text-green-400",
    "HTML": "fab fa-html5 text-orange-400",
    "CSS": "fab fa-css3-alt text-blue-400"
};

let authMode = "login"; // "login" or "register"


// ==========================================
// 1. AUTHENTICATION & SESSION MANAGEMENT
// ==========================================

function initAuth() {
    const storedUser = localStorage.getItem("mock_interview_user");
    const storedToken = localStorage.getItem("mock_interview_token");

    if (storedUser && storedToken) {
        try {
            currentUser = JSON.parse(storedUser);
            authToken = storedToken;
            updateUserDisplay();
            checkActiveAttempt();
        } catch (e) {
            console.error("Error parsing stored user:", e);
            openAuthModal("login");
        }
    } else {
        openAuthModal("login");
    }
}

function updateUserDisplay() {
    if (currentUser) {
        const displayName = currentUser.full_name || currentUser.username || "Candidate";
        candidateNameDisplay.textContent = displayName;
        userInitial.textContent = displayName.charAt(0).toUpperCase();
        closeLoginBtn.classList.remove("hidden");
    } else {
        candidateNameDisplay.textContent = "Sign In";
        userInitial.textContent = "?";
        closeLoginBtn.classList.add("hidden");
    }
}

function openAuthModal(mode = "login") {
    authMode = mode;
    authErrorBanner.classList.add("hidden");
    authErrorBanner.textContent = "";

    if (mode === "login") {
        tabLoginBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white";
        tabRegisterBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-zinc-400 hover:text-white";
        fullNameGroup.classList.add("hidden");
        authSubmitBtn.textContent = "Sign In";
    } else {
        tabRegisterBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white";
        tabLoginBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-zinc-400 hover:text-white";
        fullNameGroup.classList.remove("hidden");
        authSubmitBtn.textContent = "Create Account";
    }

    loginModal.classList.remove("hidden");
}

function closeAuthModal() {
    if (!currentUser) {
        authErrorBanner.textContent = "Please sign in or create an account to save your interview progress.";
        authErrorBanner.classList.remove("hidden");
        return;
    }
    loginModal.classList.add("hidden");
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    authErrorBanner.classList.add("hidden");
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = authMode === "login" ? "Signing In..." : "Creating Account...";

    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    const fullName = authFullName.value.trim();

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = authMode === "login" 
        ? { username, password } 
        : { username, password, full_name: fullName || username };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success && data.user) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem("mock_interview_user", JSON.stringify(currentUser));
            localStorage.setItem("mock_interview_token", authToken);

            updateUserDisplay();
            loginModal.classList.add("hidden");
            authForm.reset();

            checkActiveAttempt();
            if (!dashboardView.classList.contains("hidden")) {
                loadDashboard();
            }
        } else {
            authErrorBanner.textContent = data.error || "Authentication failed. Please check your credentials.";
            authErrorBanner.classList.remove("hidden");
        }
    } catch (err) {
        authErrorBanner.textContent = "Unable to connect to backend server. Ensure Flask is running on port 5000.";
        authErrorBanner.classList.remove("hidden");
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = authMode === "login" ? "Sign In" : "Create Account";
    }
}

async function handleLogout() {
    if (confirm("Are you sure you want to log out? Your attempt history is safely preserved in your profile.")) {
        try {
            if (authToken) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${authToken}` }
                });
            }
        } catch (e) {
            console.warn("Logout notification error:", e);
        }

        currentUser = null;
        authToken = null;
        localStorage.removeItem("mock_interview_user");
        localStorage.removeItem("mock_interview_token");
        resetToWelcome();
        updateUserDisplay();
        openAuthModal("login");
    }
}


// ==========================================
// 2. NAVIGATION & VIEW SWITCHING
// ==========================================

function switchTab(viewName) {
    if (viewName === "practice") {
        practiceView.classList.remove("hidden");
        dashboardView.classList.add("hidden");
        navPracticeBtn.className = "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow";
        navDashboardBtn.className = "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 text-gray-400 hover:text-white";
    } else if (viewName === "dashboard") {
        practiceView.classList.add("hidden");
        dashboardView.classList.remove("hidden");
        navDashboardBtn.className = "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow";
        navPracticeBtn.className = "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 text-gray-400 hover:text-white";
        loadDashboard();
    }
}


// ==========================================
// 3. TOPIC & DOCUMENT INTERVIEW WORKFLOW
// ==========================================

function selectSubject(subject) {
    currentSubject = subject;
    subjectBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.subject === subject);
    });

    if (subject === "Resume / Document") {
        welcomeStartBtn.textContent = "Upload Document to Start";
        subjectBadge.textContent = currentDocData ? currentDocData.title : "Document Interview";
        subjectIcon.className = "fas fa-file-alt text-cyan-400 text-xl";
    } else {
        welcomeStartBtn.textContent = `Start ${subject} Interview`;
        subjectBadge.textContent = subject;
        subjectIcon.className = (subjectIconMap[subject] || "fas fa-code") + " text-xl";
    }
}

function showInterviewPanel(subject) {
    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    selectSubject(subject);

    // If Document Interview selected, route to Document Upload Panel first!
    if (subject === "Resume / Document" && !currentDocData) {
        welcomeState.classList.add("hidden");
        interviewState.classList.add("hidden");
        feedbackSection.classList.add("hidden");
        documentUploadPanel.classList.remove("hidden");
        return;
    }

    welcomeState.classList.add("hidden");
    documentUploadPanel.classList.add("hidden");
    interviewState.classList.remove("hidden");
    feedbackSection.classList.add("hidden");

    questionNum.textContent = "1";
    currentQuestionIndex = 1;
    currentAttemptId = null;

    speakingBubble.classList.add("hidden");
    startInterviewBtn.classList.remove("hidden");
    recordBtn.classList.add("hidden");
    recordBtn.disabled = true;
    submitBtn.classList.add("hidden");
    submitBtn.disabled = true;
    endInterviewBtn.disabled = true;
    returningCandidateBadge.classList.add("hidden");
    liveTranscriptBox.classList.add("hidden");
    answerTextInput.value = "";
    silentAnswerWarning.classList.add("hidden");

    if (subject === "Resume / Document" && currentDocData) {
        currentQuestionText.textContent = `Document analyzed: "${currentDocData.title}". Click "Start Interview" to begin your customized 5-question interview.`;
    } else {
        currentQuestionText.textContent = `Ready to begin your ${subject} interview. Click "Start Interview" to connect with coach Natalie.`;
    }
    recordingStatus.textContent = "Click Start Interview to begin";
}

function resetToWelcome() {
    isSpeaking = false;
    mediaRecorder = null;
    recordingChunks = [];
    recordedBlob = null;
    speechTranscript = "";

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    welcomeState.classList.remove("hidden");
    interviewState.classList.add("hidden");
    documentUploadPanel.classList.add("hidden");
    feedbackSection.classList.add("hidden");
    resumeBanner.classList.add("hidden");

    recordBtn.classList.remove("bg-red-500", "text-white", "recording-active");
    recordBtn.classList.add("bg-zinc-800/80", "text-gray-400");
    micIcon.classList.remove("hidden");
    stopIcon.classList.add("hidden");
    submitBtn.classList.add("hidden");
    speakingBubble.classList.add("hidden");
    liveTranscriptBox.classList.add("hidden");
    answerTextInput.value = "";
    silentAnswerWarning.classList.add("hidden");
    getFeedbackArea.classList.remove("hidden");
    feedbackContent.classList.add("hidden");
    getFeedbackBtn.textContent = "Generate Continuous Feedback";
    getFeedbackBtn.disabled = false;
}


// ==========================================
// 4. DOCUMENT UPLOAD & PARSING CONTROLLER
// ==========================================

function switchDocTab(mode) {
    docUploadMode = mode;
    if (mode === "file") {
        tabDocFileBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-gradient-to-r from-cyan-600 to-blue-600 text-white";
        tabDocTextBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-zinc-400 hover:text-white";
        docDropzoneArea.classList.remove("hidden");
        docPasteArea.classList.add("hidden");
    } else {
        tabDocTextBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-gradient-to-r from-cyan-600 to-blue-600 text-white";
        tabDocFileBtn.className = "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-zinc-400 hover:text-white";
        docPasteArea.classList.remove("hidden");
        docDropzoneArea.classList.add("hidden");
    }
}

async function handleDocFileUpload(file) {
    if (!file) return;

    docAnalysisSpinner.classList.remove("hidden");
    docPreviewCard.classList.add("hidden");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/document/analyze`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success && data.document) {
            displayDocPreview(data.document);
        } else {
            alert(data.error || "Failed to analyze document. Please check the file format.");
        }
    } catch (err) {
        console.error("Document analysis error:", err);
        alert("Failed to connect to backend server. Make sure Flask is running on port 5000.");
    } finally {
        docAnalysisSpinner.classList.add("hidden");
    }
}

async function handleDocTextAnalyze() {
    const text = docPasteInput.value.trim();
    if (!text || text.length < 20) {
        alert("Please paste substantive resume or document text (at least 20 characters).");
        return;
    }

    docAnalysisSpinner.classList.remove("hidden");
    docPreviewCard.classList.add("hidden");

    try {
        const response = await fetch(`${API_BASE_URL}/api/document/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, filename: "Pasted_Document.txt" })
        });

        const data = await response.json();

        if (data.success && data.document) {
            displayDocPreview(data.document);
        } else {
            alert(data.error || "Failed to analyze pasted text.");
        }
    } catch (err) {
        console.error("Document text analysis error:", err);
        alert("Failed to analyze pasted text.");
    } finally {
        docAnalysisSpinner.classList.add("hidden");
    }
}

function displayDocPreview(doc) {
    currentDocData = doc;
    docPreviewTitle.textContent = doc.title || doc.filename || "Uploaded Document";
    docPreviewStats.textContent = `${doc.word_count || 0} words extracted | ${doc.skills ? doc.skills.length : 0} technical domains identified`;

    docSkillsList.innerHTML = "";
    (doc.skills || []).forEach((sk) => {
        const span = document.createElement("span");
        span.className = "text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md font-medium";
        span.textContent = sk;
        docSkillsList.appendChild(span);
    });

    docSummarySnippet.textContent = doc.summary || "Ready to begin tailored 5-question interview.";
    docPreviewCard.classList.remove("hidden");
}

function clearDocData() {
    currentDocData = null;
    docFileInput.value = "";
    docPasteInput.value = "";
    docPreviewCard.classList.add("hidden");
}


// ==========================================
// 5. AUDIO STREAMING & MURF INTEGRATION
// ==========================================

function handleAudioStream(response, onComplete) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let mediaSource = null;
    let audioUrl = null;
    let sourceBuffer = null;
    let queue = [];
    let isSourceBufferReady = false;
    let hasAudioChunks = false;

    const supportsMediaSource = window.MediaSource && MediaSource.isTypeSupported("audio/mpeg");

    if (supportsMediaSource) {
        try {
            mediaSource = new MediaSource();
            audioUrl = URL.createObjectURL(mediaSource);
            currentAudio = new Audio(audioUrl);
            currentAudio.play().catch(() => {});

            mediaSource.addEventListener("sourceopen", () => {
                try {
                    sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                    isSourceBufferReady = true;
                    while (queue.length > 0 && !sourceBuffer.updating) {
                        sourceBuffer.appendBuffer(queue.shift());
                    }
                    sourceBuffer.addEventListener("updateend", () => {
                        if (queue.length > 0 && !sourceBuffer.updating) {
                            sourceBuffer.appendBuffer(queue.shift());
                        }
                    });
                } catch (err) {
                    console.warn("SourceBuffer creation error:", err);
                }
            });

            currentAudio.onended = () => {
                isSpeaking = false;
                speakingBubble.classList.add("hidden");
                enableRecordingControls();
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                if (onComplete) onComplete();
            };

            currentAudio.onerror = () => {
                isSpeaking = false;
                speakingBubble.classList.add("hidden");
                enableRecordingControls();
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                if (onComplete) onComplete();
            };
        } catch (e) {
            console.warn("MediaSource init fallback:", e);
        }
    }

    speakingBubble.classList.remove("hidden");
    speakingText.textContent = "Natalie is speaking...";
    isSpeaking = true;
    recordBtn.disabled = true;
    recordingStatus.textContent = "Natalie is asking the question...";

    function processChunk({ done, value }) {
        if (done) {
            if (mediaSource && mediaSource.readyState === "open") {
                try {
                    mediaSource.endOfStream();
                } catch (e) {}
            }
            if (!hasAudioChunks) {
                isSpeaking = false;
                speakingBubble.classList.add("hidden");
                enableRecordingControls();
                if (onComplete) onComplete();
            }
            return;
        }

        const textChunk = decoder.decode(value, { stream: true });
        textChunk.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed) {
                try {
                    const binaryString = atob(trimmed);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    hasAudioChunks = true;

                    if (isSourceBufferReady && sourceBuffer && !sourceBuffer.updating) {
                        sourceBuffer.appendBuffer(bytes);
                    } else {
                        queue.push(bytes);
                    }
                } catch (e) {
                    console.error("Base64 audio chunk decode error:", e);
                }
            }
        });

        reader.read().then(processChunk).catch(() => {
            isSpeaking = false;
            speakingBubble.classList.add("hidden");
            enableRecordingControls();
            if (onComplete) onComplete();
        });
    }

    reader.read().then(processChunk).catch(() => {
        isSpeaking = false;
        speakingBubble.classList.add("hidden");
        enableRecordingControls();
        if (onComplete) onComplete();
    });
}

function enableRecordingControls() {
    recordBtn.disabled = false;
    recordBtn.classList.remove("hidden");
    endInterviewBtn.disabled = false;
    liveTranscriptBox.classList.remove("hidden");
    recordingStatus.textContent = "Click the microphone to record, or type your answer directly";
}

function disableRecordingControls() {
    recordBtn.disabled = true;
    submitBtn.disabled = true;
    submitBtn.classList.add("hidden");
}


// ==========================================
// 6. VOICE RECORDING & LIVE SPEECH RECOGNITION
// ==========================================

function initSpeechRecognition() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
        try {
            speechRecognition = new SpeechRecognitionClass();
            speechRecognition.continuous = true;
            speechRecognition.interimResults = true;
            speechRecognition.lang = "en-US";

            speechRecognition.onresult = (event) => {
                let interim = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        speechTranscript += event.results[i][0].transcript + " ";
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                const display = (speechTranscript + interim).trim();
                if (display) {
                    answerTextInput.value = display;
                    silentAnswerWarning.classList.add("hidden");
                }
            };

            speechRecognition.onerror = (e) => {
                console.warn("SpeechRecognition notice:", e.error);
            };
        } catch (e) {
            console.warn("SpeechRecognition not initialized:", e);
        }
    }
}

async function startRecording() {
    silentAnswerWarning.classList.add("hidden");
    liveTranscriptBox.classList.remove("hidden");

    if (speechRecognition) {
        try {
            speechRecognition.start();
        } catch (e) {}
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: "audio/webm;codecs=opus" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = "audio/webm";
        }

        mediaRecorder = new MediaRecorder(stream, options);
        recordingChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordingChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(recordingChunks, { type: "audio/webm" });
            stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();

        recordBtn.classList.remove("bg-zinc-800/80", "text-gray-400");
        recordBtn.classList.add("bg-red-500", "text-white", "recording-active");
        micIcon.classList.add("hidden");
        stopIcon.classList.remove("hidden");
        recordingStatus.textContent = "Listening to your voice... Speak your response clearly.";
        submitBtn.classList.add("hidden");
        endInterviewBtn.disabled = true;
    } catch (err) {
        console.warn("Microphone unavailable. Direct typing supported.", err);
        recordingStatus.textContent = "Recording active (You can also type your answer directly)";
        recordBtn.classList.add("bg-red-500", "text-white", "recording-active");
        micIcon.classList.add("hidden");
        stopIcon.classList.remove("hidden");
    }
}

function stopRecording() {
    if (speechRecognition) {
        try {
            speechRecognition.stop();
        } catch (e) {}
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }

    recordBtn.classList.remove("bg-red-500", "text-white", "recording-active");
    recordBtn.classList.add("bg-zinc-800/80", "text-gray-400");
    micIcon.classList.remove("hidden");
    stopIcon.classList.add("hidden");
    recordingStatus.textContent = "Response recorded. You can edit your text above, then click 'Submit Answer'.";
    submitBtn.classList.remove("hidden");
    submitBtn.disabled = false;
    endInterviewBtn.disabled = false;
}


// ==========================================
// 7. INTERVIEW LIFECYCLE API CALLS
// ==========================================

async function startInterview(resumeAttemptId = null) {
    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    startInterviewBtn.classList.add("hidden");
    recordBtn.classList.remove("hidden");
    recordBtn.disabled = true;
    recordingStatus.textContent = "Connecting to coach Natalie...";

    const isDocInterview = currentSubject === "Resume / Document" && currentDocData;
    const interviewSubject = isDocInterview 
        ? `Doc: ${currentDocData.title.slice(0, 50)}` 
        : currentSubject;

    const payload = {
        subject: interviewSubject,
        user_id: currentUser.user_id,
        resume_attempt_id: resumeAttemptId,
        custom_questions: isDocInterview ? currentDocData.questions : null,
        document_skills: isDocInterview ? currentDocData.skills : null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/start-interview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        currentAttemptId = response.headers.get("X-Attempt-Id");
        const qNum = response.headers.get("X-Question-Number") || "1";
        const isReturning = response.headers.get("X-Returning-Candidate") === "true";
        const encodedQuestion = response.headers.get("X-Question-Text");

        if (currentAttemptId) {
            localStorage.setItem(`mock_interview_active_${currentUser.user_id}`, currentAttemptId);
        }

        currentQuestionIndex = parseInt(qNum, 10) || 1;
        questionNum.textContent = currentQuestionIndex;

        if (isReturning) {
            returningCandidateBadge.classList.remove("hidden");
        } else {
            returningCandidateBadge.classList.add("hidden");
        }

        if (encodedQuestion) {
            try {
                currentQuestionText.textContent = decodeURIComponent(encodedQuestion);
            } catch (e) {
                currentQuestionText.textContent = encodedQuestion;
            }
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/plain")) {
            handleAudioStream(response, () => {
                enableRecordingControls();
            });
        } else {
            const data = await response.json();
            if (data.question) {
                currentQuestionText.textContent = data.question;
            }
            enableRecordingControls();
        }
    } catch (error) {
        console.error("Start interview error:", error);
        recordingStatus.textContent = "Failed to connect to backend server. Make sure app.py is running.";
        recordBtn.classList.add("hidden");
        startInterviewBtn.classList.remove("hidden");
    }
}

async function submitAnswer() {
    if (!currentAttemptId) {
        alert("Session lost. Please restart the interview.");
        return;
    }

    const answerText = answerTextInput.value.trim();

    // Check if the candidate provided no response
    if (!answerText) {
        if (silentAnswerWarning.classList.contains("hidden")) {
            silentAnswerWarning.classList.remove("hidden");
            recordingStatus.textContent = "No answer detected! Click Submit again to confirm submitting a blank response (0 pts).";
            return;
        }
    }

    silentAnswerWarning.classList.add("hidden");
    disableRecordingControls();
    recordingStatus.textContent = "Transcribing & analyzing your answer...";

    const formData = new FormData();
    formData.append("attempt_id", currentAttemptId);
    formData.append("transcript_text", answerText); // Send exact user text (empty if blank)

    if (recordedBlob && recordedBlob.size > 3000) {
        formData.append("audio", recordedBlob, "answer.webm");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/submit-answer`, {
            method: "POST",
            body: formData
        });

        const contentType = response.headers.get("content-type");
        const isComplete = response.headers.get("X-Interview-Complete") === "true";
        const nextQNum = response.headers.get("X-Question-Number");
        const encodedQuestion = response.headers.get("X-Question-Text");

        if (nextQNum) {
            currentQuestionIndex = parseInt(nextQNum, 10);
            questionNum.textContent = Math.min(currentQuestionIndex, 5);
        }

        if (encodedQuestion) {
            try {
                currentQuestionText.textContent = decodeURIComponent(encodedQuestion);
            } catch (e) {
                currentQuestionText.textContent = encodedQuestion;
            }
        }

        // Reset buffers for next question
        recordedBlob = null;
        recordingChunks = [];
        speechTranscript = "";
        answerTextInput.value = "";
        silentAnswerWarning.classList.add("hidden");

        if (contentType && contentType.includes("text/plain")) {
            handleAudioStream(response, () => {
                if (isComplete) {
                    showFeedbackSection();
                } else {
                    enableRecordingControls();
                }
            });
        } else {
            if (isComplete) {
                showFeedbackSection();
            } else {
                enableRecordingControls();
            }
        }
    } catch (error) {
        console.error("Submit answer error:", error);
        recordingStatus.textContent = "Connection error while submitting. Please retry.";
        enableRecordingControls();
    }
}

async function endInterview() {
    if (!confirm("End this interview early and generate continuous coaching feedback?")) return;

    disableRecordingControls();
    endInterviewBtn.disabled = true;
    recordingStatus.textContent = "Ending interview and finalizing coaching report...";

    await getFeedback();
}

function showFeedbackSection() {
    feedbackSection.classList.remove("hidden");
    getFeedbackArea.classList.remove("hidden");
    feedbackContent.classList.add("hidden");
    endInterviewBtn.disabled = true;
    disableRecordingControls();
    recordingStatus.textContent = "Interview completed! Ready for feedback.";
    hideSpeakingBubble();
}

async function getFeedback() {
    if (!currentAttemptId) return;

    showFeedbackSection();
    getFeedbackBtn.textContent = "Analyzing Performance & Progress...";
    getFeedbackBtn.disabled = true;

    const payload = {
        attempt_id: currentAttemptId,
        document_skills: currentDocData ? currentDocData.skills : null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/get-feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success && data.feedback) {
            if (currentUser) {
                localStorage.removeItem(`mock_interview_active_${currentUser.user_id}`);
            }
            resumeBanner.classList.add("hidden");
            displayFeedback(data.feedback);
        } else {
            getFeedbackBtn.textContent = "Error Generating - Retry";
            getFeedbackBtn.disabled = false;
        }
    } catch (error) {
        console.error("Get feedback error:", error);
        getFeedbackBtn.textContent = "Connection Error - Retry";
        getFeedbackBtn.disabled = false;
    }
}

function displayFeedback(feedback) {
    feedbackSubject.textContent = `${feedback.subject || currentSubject} Interview`;
    feedbackAttemptBadge.textContent = `Attempt #${feedback.attempt_number || 1}`;
    scoreValue.textContent = feedback.candidate_score !== undefined ? feedback.candidate_score : 0;
    feedbackSummaryText.textContent = feedback.summary || "Coaching evaluation successfully saved to your profile.";

    // Strengths
    feedbackStrengthsList.innerHTML = "";
    (feedback.strengths || []).forEach((str) => {
        const li = document.createElement("li");
        li.textContent = str;
        feedbackStrengthsList.appendChild(li);
    });

    // Weaknesses
    feedbackWeaknessesList.innerHTML = "";
    (feedback.weaknesses || []).forEach((wk) => {
        const li = document.createElement("li");
        li.textContent = wk;
        feedbackWeaknessesList.appendChild(li);
    });

    // Coach Feedback & Improvements
    feedbackText.textContent = feedback.feedback || "Detailed coaching analysis completed.";
    feedbackImprovementList.innerHTML = "";
    const improvements = feedback.improvement_areas || (feedback.areas_of_improvement ? [feedback.areas_of_improvement] : []);
    improvements.forEach((imp) => {
        const li = document.createElement("li");
        li.textContent = imp;
        feedbackImprovementList.appendChild(li);
    });

    // Comparative Analysis vs Previous Attempt
    if (feedback.comparison && (feedback.comparison.previous_score != null || feedback.comparison.score_delta != null)) {
        comparisonBox.classList.remove("hidden");
        const delta = feedback.comparison.score_delta !== undefined ? feedback.comparison.score_delta : (feedback.comparison.score_change || 0);
        const sign = delta >= 0 ? "+" : "";
        comparisonDeltaBadge.textContent = `${sign}${delta} pts`;
        comparisonDeltaBadge.className = delta >= 0 
            ? "text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
            : "text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400";

        const improved = feedback.comparison.improved_areas;
        comparisonImprovedText.textContent = Array.isArray(improved) 
            ? (improved.length ? improved.join(", ") : "Maintained consistent execution")
            : (improved || "Maintained baseline");

        const recurring = feedback.comparison.recurring_weaknesses;
        comparisonRecurringText.textContent = Array.isArray(recurring)
            ? (recurring.length ? recurring.join(", ") : "No recurring weaknesses detected!")
            : (recurring || "None detected");
    } else {
        comparisonBox.classList.add("hidden");
    }

    getFeedbackArea.classList.add("hidden");
    feedbackContent.classList.remove("hidden");
}

function hideSpeakingBubble() {
    speakingBubble.classList.add("hidden");
}


// ==========================================
// 8. CONTINUOUS COACH DASHBOARD & HISTORY
// ==========================================

async function loadDashboard() {
    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    try {
        const [profileRes, historyRes] = await Promise.all([
            fetch(`${API_BASE_URL}/profile/${currentUser.user_id}`),
            fetch(`${API_BASE_URL}/history/${currentUser.user_id}`)
        ]);

        const profileData = await profileRes.json();
        const historyData = await historyRes.json();

        const profile = (profileData.success && profileData.profile) ? profileData.profile : {};
        const history = (historyData.success && historyData.history) ? historyData.history : [];

        renderDashboardStats(profile, history);
        renderScoreProgression(history);
        renderRecurringInsights(profile);
        renderAttemptHistory(history);
    } catch (err) {
        console.error("Dashboard data load error:", err);
    }
}

function renderDashboardStats(profile, history) {
    statTotalAttempts.textContent = profile.total_attempts || 0;
    statAverageScore.textContent = profile.average_score || 0;
    statRecentScore.textContent = profile.recent_score || 0;
    statStrongestCategory.textContent = profile.strongest_category || "N/A";

    if (history.length >= 2) {
        const latest = history[0].score || 0;
        const prev = history[1].score || 0;
        const diff = latest - prev;
        const sign = diff >= 0 ? "+" : "";
        statScoreTrendBadge.textContent = `${sign}${diff} pts vs prior`;
        statScoreTrendBadge.className = diff >= 0
            ? "text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
            : "text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400";
    } else if (history.length === 1) {
        statScoreTrendBadge.textContent = "Baseline Attempt";
        statScoreTrendBadge.className = "text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300";
    } else {
        statScoreTrendBadge.textContent = "No Data";
        statScoreTrendBadge.className = "text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400";
    }
}

function renderScoreProgression(history) {
    progressionContainer.innerHTML = "";

    if (!history || history.length === 0) {
        progressionContainer.innerHTML = `<p class="text-xs text-zinc-500 italic py-4">No attempt scores recorded yet. Complete your first interview to track your score progression over time.</p>`;
        progressionTrendSummary.textContent = "Awaiting First Attempt";
        return;
    }

    const chronological = [...history].reverse();
    const scores = chronological.map(a => a.score);
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const netGrowth = lastScore - firstScore;

    progressionTrendSummary.textContent = chronological.length > 1
        ? `Net Trajectory: ${netGrowth >= 0 ? "+" : ""}${netGrowth} pts (${scores.join(" → ")})`
        : `Baseline Score: ${firstScore}/100`;

    chronological.forEach((attempt) => {
        const barWrapper = document.createElement("div");
        barWrapper.className = "flex flex-col items-center gap-2 group cursor-pointer flex-1 max-w-[80px]";
        barWrapper.title = `Attempt #${attempt.attempt_number} (${attempt.interview_type}): ${attempt.score}/100`;
        barWrapper.addEventListener("click", () => openFullFeedbackModal(attempt.attempt_id));

        const scoreLabel = document.createElement("span");
        scoreLabel.className = "text-[11px] font-bold text-white group-hover:text-purple-400 transition";
        scoreLabel.textContent = attempt.score;

        const barTrack = document.createElement("div");
        barTrack.className = "w-full h-28 bg-zinc-950 rounded-xl p-1 flex items-end border border-zinc-800/80 group-hover:border-purple-500/50 transition";

        const barFill = document.createElement("div");
        const heightPercent = Math.max(8, Math.min(100, attempt.score));
        barFill.style.height = `${heightPercent}%`;
        barFill.className = attempt.score >= 80
            ? "w-full rounded-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
            : attempt.score >= 60
            ? "w-full rounded-lg bg-gradient-to-t from-purple-600 to-indigo-400 transition-all duration-500"
            : attempt.score > 0
            ? "w-full rounded-lg bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500"
            : "w-full rounded-lg bg-red-800/60 transition-all duration-500";

        barTrack.appendChild(barFill);

        const attemptLabel = document.createElement("span");
        attemptLabel.className = "text-[10px] text-zinc-400 font-medium truncate w-full text-center";
        attemptLabel.textContent = `#${attempt.attempt_number} ${attempt.interview_type.slice(0, 4)}`;

        barWrapper.appendChild(scoreLabel);
        barWrapper.appendChild(barTrack);
        barWrapper.appendChild(attemptLabel);
        progressionContainer.appendChild(barWrapper);
    });
}

function renderRecurringInsights(profile) {
    // Recurring Strengths
    recurringStrengthsContainer.innerHTML = "";
    const strengths = profile.recurring_strengths || [];
    if (strengths.length > 0) {
        strengths.forEach((str) => {
            const span = document.createElement("span");
            span.className = "text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg";
            span.textContent = `✓ ${str}`;
            recurringStrengthsContainer.appendChild(span);
        });
    } else {
        recurringStrengthsContainer.innerHTML = `<span class="text-xs text-zinc-500 italic">No recurring strengths recorded yet.</span>`;
    }

    // Recurring Weaknesses
    recurringWeaknessesContainer.innerHTML = "";
    const weaknesses = profile.recurring_weaknesses || [];
    if (weaknesses.length > 0) {
        weaknesses.forEach((wk) => {
            const span = document.createElement("span");
            span.className = "text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg";
            span.textContent = `⚠ ${wk}`;
            recurringWeaknessesContainer.appendChild(span);
        });
    } else {
        recurringWeaknessesContainer.innerHTML = `<span class="text-xs text-zinc-500 italic">No recurring weaknesses detected.</span>`;
    }

    // Recommended Focus
    recommendedFocusList.innerHTML = "";
    const recommendations = weaknesses.length > 0
        ? weaknesses.map(w => `Focus on strengthening ${w}.`)
        : ["Continue practicing across different technical subjects to maintain consistency."];

    recommendations.forEach((rec) => {
        const li = document.createElement("li");
        li.textContent = rec;
        recommendedFocusList.appendChild(li);
    });
}

function renderAttemptHistory(history) {
    attemptHistoryList.innerHTML = "";
    attemptCountBadge.textContent = `${history.length} completed attempt${history.length === 1 ? "" : "s"}`;

    if (!history || history.length === 0) {
        dashboardEmptyState.classList.remove("hidden");
        return;
    }

    dashboardEmptyState.classList.add("hidden");

    history.forEach((item) => {
        const cardNode = attemptCardTemplate.content.cloneNode(true);

        cardNode.querySelector(".attempt-number-badge").textContent = `Attempt #${item.attempt_number}`;
        cardNode.querySelector(".attempt-subject-badge").textContent = item.interview_type;
        cardNode.querySelector(".attempt-date").textContent = new Date(item.created_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const scoreEl = cardNode.querySelector(".attempt-score");
        scoreEl.textContent = `${item.score}/100`;
        scoreEl.className = item.score >= 80 
            ? "attempt-score text-lg font-bold text-emerald-400"
            : item.score >= 60
            ? "attempt-score text-lg font-bold text-purple-300"
            : item.score > 0
            ? "attempt-score text-lg font-bold text-amber-400"
            : "attempt-score text-lg font-bold text-red-400";

        cardNode.querySelector(".attempt-summary").textContent = item.summary || "Coaching session recorded in your profile.";

        const strengthsText = Array.isArray(item.strengths) ? item.strengths.join(", ") : item.strengths;
        cardNode.querySelector(".attempt-strengths").textContent = strengthsText || "Consistent foundational knowledge.";

        const weaknessesText = Array.isArray(item.weaknesses) ? item.weaknesses.join(", ") : item.weaknesses;
        cardNode.querySelector(".attempt-weaknesses").textContent = weaknessesText || "Minor depth enhancements.";

        // Comparative row if present
        const compRow = cardNode.querySelector(".attempt-comparison-row");
        const compText = cardNode.querySelector(".attempt-comparison-text");
        const compBadge = cardNode.querySelector(".attempt-comparison-badge");

        if (item.comparison && (item.comparison.previous_score != null || item.comparison.score_delta != null)) {
            compRow.classList.remove("hidden");
            const delta = item.comparison.score_delta !== undefined ? item.comparison.score_delta : (item.comparison.score_change || 0);
            const sign = delta >= 0 ? "+" : "";
            compBadge.textContent = `${sign}${delta} pts vs Attempt #${item.attempt_number - 1}`;
            compBadge.className = delta >= 0 ? "attempt-comparison-badge text-emerald-400 font-bold" : "attempt-comparison-badge text-red-400 font-bold";

            const imp = item.comparison.improved_areas;
            compText.textContent = Array.isArray(imp) && imp.length 
                ? `Improved: ${imp.join(", ")}` 
                : "Continuous progress evaluation";
        }

        const viewFeedbackBtn = cardNode.querySelector(".view-feedback-btn");
        viewFeedbackBtn.addEventListener("click", () => openFullFeedbackModal(item.attempt_id));

        attemptHistoryList.appendChild(cardNode);
    });
}


// ==========================================
// 9. FULL FEEDBACK MODAL (PER ATTEMPT)
// ==========================================

async function openFullFeedbackModal(attemptId) {
    try {
        const response = await fetch(`${API_BASE_URL}/attempt/${attemptId}`);
        const data = await response.json();

        if (!data.success || !data.attempt) {
            alert("Could not load attempt details.");
            return;
        }

        const attempt = data.attempt;

        modalAttemptBadge.textContent = `Attempt #${attempt.attempt_number}`;
        modalSubject.textContent = `${attempt.interview_type} Full Evaluation`;
        modalDate.textContent = new Date(attempt.created_at).toLocaleString();
        modalScore.textContent = `${attempt.score}/100`;

        if (attempt.comparison && (attempt.comparison.previous_score != null || attempt.comparison.score_delta != null)) {
            modalComparisonBox.classList.remove("hidden");
            const delta = attempt.comparison.score_delta !== undefined ? attempt.comparison.score_delta : (attempt.comparison.score_change || 0);
            const sign = delta >= 0 ? "+" : "";
            modalScoreChange.textContent = `${sign}${delta} pts`;
            modalScoreChange.className = delta >= 0
                ? "text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
                : "text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400";

            const imp = attempt.comparison.improved_areas;
            modalImprovedText.textContent = Array.isArray(imp)
                ? (imp.length ? imp.join(", ") : "Maintained strong consistent baseline.")
                : (imp || "Consistent baseline.");

            const rec = attempt.comparison.recurring_weaknesses;
            modalRecurringText.textContent = Array.isArray(rec)
                ? (rec.length ? rec.join(", ") : "No recurring weaknesses detected!")
                : (rec || "None detected");
        } else {
            modalComparisonBox.classList.add("hidden");
        }

        // Strengths
        modalStrengthsList.innerHTML = "";
        const strengths = Array.isArray(attempt.strengths) ? attempt.strengths : [];
        strengths.forEach((s) => {
            const li = document.createElement("li");
            li.textContent = s;
            modalStrengthsList.appendChild(li);
        });

        // Weaknesses
        modalWeaknessesList.innerHTML = "";
        const weaknesses = Array.isArray(attempt.weaknesses) ? attempt.weaknesses : [];
        weaknesses.forEach((w) => {
            const li = document.createElement("li");
            li.textContent = w;
            modalWeaknessesList.appendChild(li);
        });

        // Feedback
        modalFeedbackText.textContent = attempt.feedback || "Detailed coaching analysis completed.";

        // Question-by-Question Transcript
        modalTranscriptList.innerHTML = "";
        const questions = Array.isArray(attempt.questions) ? attempt.questions : [];
        const answers = Array.isArray(attempt.answers) ? attempt.answers : [];

        questions.forEach((q, idx) => {
            const qaCard = document.createElement("div");
            qaCard.className = "bg-zinc-950 p-4 rounded-xl border border-zinc-800/80";

            const qTitle = document.createElement("p");
            qTitle.className = "text-xs font-semibold text-purple-300 mb-1";
            qTitle.textContent = `Q${idx + 1}: ${q}`;

            const ans = answers[idx];
            const ansText = document.createElement("p");
            ansText.className = "text-xs text-zinc-300 pl-3 border-l-2 border-zinc-700 italic";
            ansText.textContent = ans ? `Answer: "${ans}"` : "Answer: (No spoken or written response provided - 0 pts)";

            qaCard.appendChild(qTitle);
            qaCard.appendChild(ansText);
            modalTranscriptList.appendChild(qaCard);
        });

        fullFeedbackModal.classList.remove("hidden");
    } catch (err) {
        console.error("Open full feedback error:", err);
    }
}

function closeFullFeedbackModal() {
    fullFeedbackModal.classList.add("hidden");
}


// ==========================================
// 10. RESUME UNFINISHED SESSIONS
// ==========================================

async function checkActiveAttempt() {
    if (!currentUser) return;

    const activeId = localStorage.getItem(`mock_interview_active_${currentUser.user_id}`);
    if (!activeId) {
        resumeBanner.classList.add("hidden");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/attempt/${activeId}`);
        const data = await response.json();

        if (data.success && data.attempt && data.attempt.status === "in_progress") {
            const attempt = data.attempt;
            resumeBannerText.textContent = `You have an unfinished ${attempt.interview_type} interview (Question ${attempt.current_question}/5).`;
            resumeBanner.classList.remove("hidden");

            resumeInterviewBtn.onclick = () => {
                switchTab("practice");
                selectSubject(attempt.interview_type);
                showInterviewPanel(attempt.interview_type);
                startInterview(attempt.attempt_id);
            };

            discardInterviewBtn.onclick = () => {
                localStorage.removeItem(`mock_interview_active_${currentUser.user_id}`);
                resumeBanner.classList.add("hidden");
            };
        } else {
            localStorage.removeItem(`mock_interview_active_${currentUser.user_id}`);
            resumeBanner.classList.add("hidden");
        }
    } catch (e) {
        console.warn("Active attempt check error:", e);
    }
}


// ==========================================
// 11. EVENT LISTENERS
// ==========================================

// Navigation
navPracticeBtn.addEventListener("click", () => switchTab("practice"));
navDashboardBtn.addEventListener("click", () => switchTab("dashboard"));
viewInDashboardBtn.addEventListener("click", () => switchTab("dashboard"));
dashboardStartBtn.addEventListener("click", () => {
    switchTab("practice");
    resetToWelcome();
});
emptyStateStartBtn.addEventListener("click", () => {
    switchTab("practice");
    resetToWelcome();
});

// Subject selection
subjectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const selected = btn.dataset.subject;
        resetToWelcome();
        selectSubject(selected);
        showInterviewPanel(selected);
    });
});

welcomeStartBtn.addEventListener("click", () => {
    showInterviewPanel(currentSubject);
});

// Document Upload Listeners
tabDocFileBtn.addEventListener("click", () => switchDocTab("file"));
tabDocTextBtn.addEventListener("click", () => switchDocTab("text"));
docDropzoneArea.addEventListener("click", () => docFileInput.click());

docFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleDocFileUpload(file);
});

// Drag & drop on dropzone
docDropzoneArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    docDropzoneArea.classList.add("border-cyan-400", "bg-cyan-950/20");
});
docDropzoneArea.addEventListener("dragleave", () => {
    docDropzoneArea.classList.remove("border-cyan-400", "bg-cyan-950/20");
});
docDropzoneArea.addEventListener("drop", (e) => {
    e.preventDefault();
    docDropzoneArea.classList.remove("border-cyan-400", "bg-cyan-950/20");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleDocFileUpload(e.dataTransfer.files[0]);
    }
});

docAnalyzePasteBtn.addEventListener("click", handleDocTextAnalyze);
docClearBtn.addEventListener("click", clearDocData);

docStartInterviewBtn.addEventListener("click", () => {
    if (!currentDocData) {
        alert("Please upload or paste a document first.");
        return;
    }
    showInterviewPanel("Resume / Document");
    startInterview();
});

// Interview Actions
startInterviewBtn.addEventListener("click", () => startInterview());

recordBtn.addEventListener("click", () => {
    if (isSpeaking || recordBtn.disabled) return;

    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        startRecording();
    } else {
        stopRecording();
    }
});

submitBtn.addEventListener("click", submitAnswer);
endInterviewBtn.addEventListener("click", endInterview);
getFeedbackBtn.addEventListener("click", getFeedback);
newInterviewBtn.addEventListener("click", resetToWelcome);

// Modal 1: Full Feedback Modal
closeModalBtn.addEventListener("click", closeFullFeedbackModal);
modalDoneBtn.addEventListener("click", closeFullFeedbackModal);

// Modal 2: Auth Modal
userProfileBadge.addEventListener("click", () => {
    if (!currentUser) openAuthModal("login");
});
logoutBtn.addEventListener("click", handleLogout);
closeLoginBtn.addEventListener("click", closeAuthModal);
tabLoginBtn.addEventListener("click", () => openAuthModal("login"));
tabRegisterBtn.addEventListener("click", () => openAuthModal("register"));
authForm.addEventListener("submit", handleAuthSubmit);

// Global Keydown (Escape closes modal)
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (!fullFeedbackModal.classList.contains("hidden")) {
            closeFullFeedbackModal();
        }
        if (!loginModal.classList.contains("hidden") && currentUser) {
            closeAuthModal();
        }
    }
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
    initSpeechRecognition();
    initAuth();
});