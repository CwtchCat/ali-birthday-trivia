// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  text: string;
}

type Judgment = "yes" | "close" | "no" | null;

interface QuestionState {
  answer: string;
  judgment: Judgment;
}

interface AppState {
  page: "start" | "name" | "quiz" | "results";
  playerName: string;
  currentQuestion: number;  // 0-indexed
  score: number;
  questionStates: QuestionState[];
}

// ─── Configuration ────────────────────────────────────────────────────────────

const QUIZ_DATE = "February 18th, 2026";

const QUESTIONS: Question[] = [
  { text: "If Ali could have one animal follow her around for a week, what would it be and why?" },
  { text: "What are the three types of happy skiing? (Bluebird powder, Backcountry adventure, Downhill tricks)" },
  { text: "Where would Ali most love to take her bike for a long ride?" },
  { text: "If Ali were at the ocean right now, what would she be doing?" },
  { text: "What is Ali most likely knitting while watching or listening to something cozy?" },
  { text: "What bread or dough creation make Ali feel the most proud when it turns out just right?" },
  { text: "What is the official catchphrase of 'ALI 27'?" },
  { text: "What kind of scene does Ali most like to paint with watercolors?" },
  { text: "Surfed it. Climbed it. Biked it. Hiked it. What's Ali's next Adevnture Badge?" },
  { text: "What does Ali like most about 'The Alchemist'?" },
  { text: "If Ali could leave tomorrow for one place - no planning stress - where would she go?" },
  { text: "What small, ordinary thing brings Ali joy that other people might overlook?" },
];

const JUDGMENT_POINTS: Record<NonNullable<Judgment>, number> = {
  yes: 100,
  close: 50,
  no: 0,
};

const MAX_SCORE = QUESTIONS.length * 100;

// ─── State ────────────────────────────────────────────────────────────────────

const state: AppState = {
  page: "start",
  playerName: "",
  currentQuestion: 0,
  score: 0,
  questionStates: QUESTIONS.map(() => ({ answer: "", judgment: null })),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(): string {
  return QUIZ_DATE;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function resultEmoji(score: number): string {
  const pct = score / MAX_SCORE;
  if (pct >= 0.9) return "🏆";
  if (pct >= 0.7) return "🥈";
  if (pct >= 0.5) return "🥉";
  return "🎉";
}

function resultMessage(score: number, name: string): string {
  const pct = score / MAX_SCORE;
  if (pct >= 0.9) return `Incredible, ${name}! You really know them inside out. Gold star performance! ⭐`;
  if (pct >= 0.7) return `Well done, ${name}! You clearly know them pretty well — a solid effort!`;
  if (pct >= 0.5) return `Not bad, ${name}! Half the answers were spot on — there's still plenty to learn about them!`;
  return `Keep at it, ${name}! Now you have a great excuse to spend more time getting to know them better! 😄`;
}

function recalculateScore(): number {
  return state.questionStates.reduce((total, qs) => {
    return total + (qs.judgment !== null ? JUDGMENT_POINTS[qs.judgment] : 0);
  }, 0);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function render(): void {
  const app = document.getElementById("app")!;
  switch (state.page) {
    case "start":   app.innerHTML = renderStartPage();   break;
    case "name":    app.innerHTML = renderNamePage();    break;
    case "quiz":    app.innerHTML = renderQuizPage();    break;
    case "results": app.innerHTML = renderResultsPage(); break;
  }
  attachListeners();
}

// ── Start Page ─────────────────────────────────────────────────────────────────

function renderStartPage(): string {
  return `
    <div class="card">
      <div class="start-emoji">🎂</div>
      <h1 class="start-title">Ali's Birthday Trivia</h1>
      <h2 class="start-title">Full Send & Stoked</h2>
      <p class="start-date">${formatDate()}</p>
      <button class="btn btn-primary" id="btn-proceed">
        Proceed &nbsp;🎉
      </button>
    </div>
  `;
}

// ── Name Page ──────────────────────────────────────────────────────────────────

function renderNamePage(): string {
  return `
    <div class="card">
      <h2 class="page-title">Who's Playing?</h2>
      <p class="page-subtitle">Enter your name to get started.</p>
      <label for="player-name">Your name</label>
      <input
        type="text"
        id="player-name"
        placeholder="e.g. Alex"
        value="${escapeHtml(state.playerName)}"
        autocomplete="off"
        maxlength="40"
      />
      <button
        class="btn btn-primary"
        id="btn-start"
        ${state.playerName.trim() === "" ? "disabled" : ""}
      >
        Start Quiz &nbsp;🚀
      </button>
    </div>
  `;
}

// ── Quiz Page ──────────────────────────────────────────────────────────────────

function renderQuizPage(): string {
  const q = state.currentQuestion;
  const qs = state.questionStates[q];
  const progress = ((q + 1) / QUESTIONS.length) * 100;
  const selectedYes = qs.judgment === "yes" ? "selected" : "";
  const selectedClose  = qs.judgment === "close"  ? "selected" : "";
  const selectedNo  = qs.judgment === "no"  ? "selected" : "";
  const isFirst = q === 0;
  const isLast  = q === QUESTIONS.length - 1;

  return `
    <div class="card">
      <div class="quiz-header">
        <span class="question-badge">Question ${q + 1} / ${QUESTIONS.length}</span>
        <div class="score-display">
          <span class="score-label">Score</span>
          <span class="score-value" id="score-value">${state.score}</span>
        </div>
      </div>

      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${progress}%"></div>
      </div>

      <p class="question-text">${escapeHtml(QUESTIONS[q].text)}</p>

      <div class="answer-input">
        <label for="answer-input">Your answer</label>
        <input
          type="text"
          id="answer-input"
          placeholder="Type your answer here…"
          value="${escapeHtml(qs.answer)}"
          autocomplete="off"
          maxlength="200"
        />
      </div>

      <div class="judgment-label">How well did you do on this one?</div>
      <div class="judgment-row">
        <button class="btn-judgment btn-yes ${selectedYes}" data-judgment="yes">
          <span class="j-icon">✅</span>
          <span>Yes</span>
          <span class="j-pts">+100 pts</span>
        </button>
        <button class="btn-judgment btn-close ${selectedClose}" data-judgment="close">
          <span class="j-icon">😐</span>
          <span>Close</span>
          <span class="j-pts">+50 pts</span>
        </button>
        <button class="btn-judgment btn-no ${selectedNo}" data-judgment="no">
          <span class="j-icon">❌</span>
          <span>No</span>
          <span class="j-pts">+0 pts</span>
        </button>
      </div>

      <div class="nav-row">
        <button class="btn btn-secondary" id="btn-back" ${isFirst ? "disabled" : ""}>
          ← Back
        </button>
        <button class="btn btn-primary" id="btn-next">
          ${isLast ? "See Results 🏆" : "Next →"}
        </button>
      </div>
    </div>
  `;
}

// ── Results Page ───────────────────────────────────────────────────────────────

function renderResultsPage(): string {
  const emoji = resultEmoji(state.score);
  const msg   = resultMessage(state.score, state.playerName);

  const summaryItems = QUESTIONS.map((q, i) => {
    const qs = state.questionStates[i];
    const badge =
      qs.judgment === "yes" ? "✅" :
      qs.judgment === "close"  ? "😐" :
      qs.judgment === "no"  ? "❌" : "—";
    return `
      <div class="summary-item">
        <span class="s-q">Q${i + 1}</span>
        <span class="s-text">
          <em>${escapeHtml(q.text)}</em>
          ${qs.answer ? `<br><span style="color:var(--text-secondary);">"${escapeHtml(qs.answer)}"</span>` : ""}
        </span>
        <span class="s-badge">${badge}</span>
      </div>
    `;
  }).join("");

  return `
    <div class="card">
      <div class="result-emoji">${emoji}</div>
      <h2 class="result-title">Quiz Complete!</h2>
      <p class="result-name">Well played, ${escapeHtml(state.playerName)}!</p>

      <div class="result-score-box">
        <div class="result-score-number">${state.score}</div>
        <div class="result-score-max">out of ${MAX_SCORE} points</div>
      </div>

      <p class="result-message">${msg}</p>

      <div class="answers-summary">
        <h3>Your Answers</h3>
        ${summaryItems}
      </div>

      <button class="btn btn-primary" id="btn-restart">
        Play Again &nbsp;🔄
      </button>
    </div>
  `;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

function attachListeners(): void {
  switch (state.page) {
    case "start":
      document.getElementById("btn-proceed")?.addEventListener("click", () => {
        state.page = "name";
        render();
      });
      break;

    case "name": {
      const nameInput  = document.getElementById("player-name") as HTMLInputElement;
      const startBtn   = document.getElementById("btn-start") as HTMLButtonElement;

      nameInput.focus();

      nameInput.addEventListener("input", () => {
        state.playerName = nameInput.value;
        startBtn.disabled = state.playerName.trim() === "";
      });

      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && state.playerName.trim() !== "") beginQuiz();
      });

      startBtn.addEventListener("click", () => {
        if (state.playerName.trim() !== "") beginQuiz();
      });
      break;
    }

    case "quiz": {
      const answerInput = document.getElementById("answer-input") as HTMLInputElement;

      answerInput.focus();

      // Save answer text as user types
      answerInput.addEventListener("input", () => {
        state.questionStates[state.currentQuestion].answer = answerInput.value;
      });

      // Judgment buttons
      document.querySelectorAll<HTMLButtonElement>(".btn-judgment").forEach((btn) => {
        btn.addEventListener("click", () => {
          const judgment = btn.dataset.judgment as NonNullable<Judgment>;
          applyJudgment(judgment);
        });
      });

      document.getElementById("btn-back")?.addEventListener("click", () => {
        if (state.currentQuestion > 0) {
          state.currentQuestion--;
          render();
        }
      });

      document.getElementById("btn-next")?.addEventListener("click", () => {
        if (state.currentQuestion < QUESTIONS.length - 1) {
          state.currentQuestion++;
          render();
        } else {
          // Last question → show results
          state.page = "results";
          render();
        }
      });
      break;
    }

    case "results":
      document.getElementById("btn-restart")?.addEventListener("click", () => {
        resetState();
        render();
      });
      break;
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function beginQuiz(): void {
  state.playerName = state.playerName.trim();
  state.score = 0;
  state.currentQuestion = 0;
  state.questionStates = QUESTIONS.map(() => ({ answer: "", judgment: null }));
  state.page = "quiz";
  render();
}

function applyJudgment(judgment: NonNullable<Judgment>): void {
  const qs = state.questionStates[state.currentQuestion];

  // Toggle off if already selected
  if (qs.judgment === judgment) {
    qs.judgment = null;
  } else {
    qs.judgment = judgment;
  }

  // Recalculate total score from all question states
  state.score = recalculateScore();

  // Re-render the quiz page with updated state
  render();

  // Animate the score counter
  requestAnimationFrame(() => {
    const scoreEl = document.getElementById("score-value");
    if (scoreEl) {
      scoreEl.classList.add("pop");
      setTimeout(() => scoreEl.classList.remove("pop"), 300);
    }
  });
}

function resetState(): void {
  state.page = "start";
  state.playerName = "";
  state.currentQuestion = 0;
  state.score = 0;
  state.questionStates = QUESTIONS.map(() => ({ answer: "", judgment: null }));
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

render();
