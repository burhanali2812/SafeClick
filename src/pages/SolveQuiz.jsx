import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./SolveQuiz.css";

const API_BASE = "https://safe-click-backend.vercel.app/api/quizzes";

const difficultyOptions = [
  { key: "easy", label: "Easy", icon: "fa-circle-check" },
  { key: "medium", label: "Medium", icon: "fa-layer-group" },
  { key: "difficult", label: "Difficult", icon: "fa-triangle-exclamation" },
  { key: "mix", label: "Mix", icon: "fa-shuffle" },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const normalizeDifficultyKey = (quiz) => {
  const value = String(
    quiz?.difficultyKey || quiz?.difficultyLevel || "easy",
  ).toLowerCase();
  if (value === "medium" || value === "intermediate") return "medium";
  if (value === "difficult" || value === "advanced" || value === "hard")
    return "difficult";
  return "easy";
};

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const buildQuestionPool = (quizzes) => {
  const grouped = {
    easy: [],
    medium: [],
    difficult: [],
  };

  quizzes.forEach((quiz) => {
    const quizDifficulty = normalizeDifficultyKey(quiz);
    const quizQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];

    quizQuestions.forEach((question, questionIndex) => {
      const normalizedQuestion = {
        id: `${quiz._id}-${questionIndex}`,
        quizId: quiz._id,
        quizTitle: quiz.title,
        quizDifficulty,
        questionText: question.questionText || "",
        options: Array.isArray(question.options)
          ? question.options.filter(Boolean)
          : [],
        correctAnswer: question.correctAnswer || "",
        points: Number(question.points) || 1,
      };

      grouped[quizDifficulty].push(normalizedQuestion);
    });
  });

  return grouped;
};

const selectQuestions = (groupedPool, selectedDifficulty, requestedCount) => {
  const targetCount = clamp(Number(requestedCount) || 1, 1, 15);

  if (selectedDifficulty === "mix") {
    const easy = shuffle(groupedPool.easy);
    const medium = shuffle(groupedPool.medium);
    const difficult = shuffle(groupedPool.difficult);
    const buckets = [easy, medium, difficult];
    const selected = [];
    let cursor = 0;

    while (
      selected.length < targetCount &&
      buckets.some((bucket) => bucket.length > 0)
    ) {
      const bucket = buckets[cursor % buckets.length];
      if (bucket.length > 0) {
        selected.push(bucket.shift());
      }
      cursor += 1;
    }

    return selected;
  }

  return shuffle(groupedPool[selectedDifficulty] || []).slice(0, targetCount);
};

function SolveQuiz() {
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [step, setStep] = useState("setup");
  const [difficulty, setDifficulty] = useState("easy");
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  const selectedQuestion = selectedQuestions[currentIndex];
  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key],
  ).length;
  const totalQuestions = selectedQuestions.length;
  const progressPercent = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (step !== "taking") return undefined;

    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          clearTimer();
          if (!submittedRef.current) {
            handleSubmit(true);
          }
          return 0;
        }
        return currentTime - 1;
      });
    }, 1000);

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE, {
        headers: authHeaders,
        params: { isPublished: true },
      });
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to load quizzes");
        return;
      }

      const quizzes = response.data.quizzes || [];
      const groupedPool = buildQuestionPool(quizzes);
      const selected = selectQuestions(groupedPool, difficulty, questionCount);

      if (!selected.length) {
        toast.error("No questions found for the selected difficulty");
        return;
      }

      setSelectedQuestions(selected);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setStartedAt(Date.now());
      setTimeLeft(Math.max(90, selected.length * 45));
      submittedRef.current = false;
      setStep("taking");
      toast.success(`${selected.length} questions ready`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const computeLocalResult = () => {
    const detailed = selectedQuestions.map((question) => {
      const userAnswer = answers[question.id] || "";
      const isCorrect =
        String(userAnswer).trim() === String(question.correctAnswer).trim();

      return {
        ...question,
        userAnswer,
        isCorrect,
      };
    });

    const correctCount = detailed.filter((item) => item.isCorrect).length;
    const wrongCount = detailed.length - correctCount;
    const score = detailed.reduce(
      (total, item) => total + (item.isCorrect ? item.points : 0),
      0,
    );
    const maxScore = detailed.reduce((total, item) => total + item.points, 0);
    const scorePercent = maxScore ? Math.round((score / maxScore) * 100) : 0;

    return {
      detailed,
      correctCount,
      wrongCount,
      score,
      maxScore,
      scorePercent,
      totalQuestions: detailed.length,
      timeTaken: startedAt
        ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
        : 0,
      sourceQuizIds: Array.from(new Set(detailed.map((item) => item.quizId))),
      quizMode: difficulty === "mix" ? "mix" : "single",
      quizTitle:
        difficulty === "mix"
          ? "Mixed Difficulty Quiz"
          : `${difficultyOptions.find((item) => item.key === difficulty)?.label || "Quiz"} Quiz`,
      difficultyLevel: difficulty,
    };
  };

  const handleSubmit = async (force = false) => {
    if (submittedRef.current && !force) return;
    if (!force && totalQuestions === 0) return;

    submittedRef.current = true;
    clearTimer();
    setSubmitting(true);

    const localResult = computeLocalResult();
    setResult(localResult);
    setStep("results");

    const answersPayload = selectedQuestions.reduce((accumulator, question) => {
      accumulator[question.id] = answers[question.id] || "";
      return accumulator;
    }, {});

    try {
      const response = await axios.post(
        `${API_BASE}/submit-quiz`,
        {
          quizMode: localResult.quizMode,
          quizTitle: localResult.quizTitle,
          difficultyLevel: localResult.difficultyLevel,
          answers: answersPayload,
          questions: selectedQuestions,
          sourceQuizIds: localResult.sourceQuizIds,
          startTime: startedAt || Date.now(),
        },
        { headers: authHeaders },
      );

      if (response.data?.success && response.data?.summary) {
        setResult((current) => ({
          ...current,
          ...response.data.summary,
        }));
        toast.success("Quiz submitted and saved successfully");
      } else {
        toast.success("Quiz submitted successfully");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Quiz saved locally, but server submission failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    clearTimer();
    setStep("setup");
    setSelectedQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setStartedAt(null);
    setTimeLeft(0);
    setResult(null);
    submittedRef.current = false;
  };

  const renderSetup = () => (
    <div className="solve-shell solve-setup-shell">
      <div className="solve-hero">
        <div>
          <span className="solve-kicker">User Quiz Challenge</span>
          <h1>Choose a difficulty mix and start a timed quiz</h1>
          <p>
            Pick Easy, Medium, Difficult, or Mix. Questions are randomly drawn
            from published quizzes, with a maximum of 15 per attempt.
          </p>
        </div>

        <div className="solve-hero-card">
          <div className="solve-hero-stat">
            <strong>15</strong>
            <span>Maximum questions</span>
          </div>
          <div className="solve-hero-stat">
            <strong>45s</strong>
            <span>Per question timer</span>
          </div>
        </div>
      </div>

      <div className="solve-card-grid">
        {difficultyOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`solve-choice-card ${difficulty === option.key ? "active" : ""}`}
            onClick={() => setDifficulty(option.key)}
          >
            <i className={`fas ${option.icon}`}></i>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <div className="solve-form-card">
        <div className="solve-field-group">
          <label htmlFor="questionCount">Number of questions</label>
          <input
            id="questionCount"
            type="number"
            min="1"
            max="15"
            value={questionCount}
            onChange={(event) =>
              setQuestionCount(clamp(event.target.value, 1, 15))
            }
          />
          <small>Choose between 1 and 15 questions.</small>
        </div>

        <div className="solve-form-summary">
          <div>
            <span>Selected difficulty</span>
            <strong>
              {difficultyOptions.find((item) => item.key === difficulty)?.label}
            </strong>
          </div>
          <div>
            <span>Session time limit</span>
            <strong>
              {formatClock(
                Math.max(90, clamp(Number(questionCount) || 1, 1, 15) * 45),
              )}
            </strong>
          </div>
        </div>

        <button
          className="solve-primary-btn"
          type="button"
          onClick={loadQuiz}
          disabled={loading}
        >
          {loading ? "Loading Questions..." : "Start Quiz"}
        </button>
      </div>
    </div>
  );

  const renderTaking = () => (
    <div className="solve-shell solve-taking-shell">
      <div className="solve-header-bar">
        <div>
          <span className="solve-kicker">Timed Session</span>
          <h2>{result?.quizTitle || "Quiz in progress"}</h2>
        </div>

        <div className="solve-timer-card">
          <span>Time left</span>
          <strong>{formatClock(timeLeft)}</strong>
        </div>
      </div>

      <div className="solve-progress-card">
        <div className="solve-progress-labels">
          <span>
            {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="solve-progress-track">
          <div
            className="solve-progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {selectedQuestion && (
        <div className="solve-question-card">
          <div className="solve-question-head">
            <span className="solve-question-chip">
              Question {currentIndex + 1}
            </span>
            <span className="solve-question-source">
              {selectedQuestion.quizTitle}
            </span>
          </div>

          <h3>{selectedQuestion.questionText}</h3>

          <div className="solve-option-grid">
            {selectedQuestion.options.map((option, optionIndex) => {
              const isSelected = answers[selectedQuestion.id] === option;
              return (
                <label
                  key={`${selectedQuestion.id}-${optionIndex}`}
                  className={`solve-option-card ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={selectedQuestion.id}
                    value={option}
                    checked={isSelected}
                    onChange={() =>
                      handleAnswerSelect(selectedQuestion.id, option)
                    }
                  />
                  <span className="solve-option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="solve-option-text">{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="solve-footer">
        <div className="solve-question-dots">
          {selectedQuestions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              className={`solve-dot ${index === currentIndex ? "active" : ""} ${answers[question.id] ? "answered" : ""}`}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="solve-action-row">
          <button
            type="button"
            className="solve-secondary-btn"
            onClick={handleReset}
          >
            Exit
          </button>
          <button
            type="button"
            className="solve-secondary-btn"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          >
            Previous
          </button>
          {currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              className="solve-primary-btn"
              onClick={() =>
                setCurrentIndex((value) =>
                  Math.min(totalQuestions - 1, value + 1),
                )
              }
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="solve-primary-btn"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    const summaryCards = [
      {
        label: "Total Questions",
        value: result?.totalQuestions || 0,
        icon: "fa-list-check",
        tone: "neutral",
      },
      {
        label: "Correct",
        value: result?.correctCount || 0,
        icon: "fa-circle-check",
        tone: "success",
      },
      {
        label: "Wrong",
        value: result?.wrongCount || 0,
        icon: "fa-circle-xmark",
        tone: "danger",
      },
      {
        label: "Score",
        value: `${result?.score || 0}/${result?.maxScore || 0}`,
        icon: "fa-award",
        tone: "primary",
      },
      {
        label: "Accuracy",
        value: `${result?.scorePercent || 0}%`,
        icon: "fa-bullseye",
        tone: "accent",
      },
    ];

    return (
      <div className="solve-shell solve-results-shell">
        <div className="solve-results-hero">
          <div>
            <span className="solve-kicker">Quiz Completed</span>
            <h2>{result?.quizTitle || "Your result is ready"}</h2>
            <p>
              Review every answer below. Correct responses are marked in green
              and incorrect responses in red.
            </p>
          </div>

          <div className="solve-score-ring">
            <strong>{result?.scorePercent || 0}%</strong>
            <span>Overall score</span>
          </div>
        </div>

        <div className="solve-summary-grid">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className={`solve-summary-card ${card.tone}`}
            >
              <i className={`fas ${card.icon}`}></i>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="solve-result-list">
          {(result?.detailed || []).map((question, index) => (
            <article
              key={question.id}
              className={`solve-result-card ${question.isCorrect ? "correct" : "wrong"}`}
            >
              <div className="solve-result-head">
                <div>
                  <span className="solve-result-index">
                    Question {index + 1}
                  </span>
                  <h3>{question.questionText}</h3>
                </div>
                <span
                  className={`solve-result-badge ${question.isCorrect ? "correct" : "wrong"}`}
                >
                  {question.isCorrect ? "Correct" : "Wrong"}
                </span>
              </div>

              <div className="solve-result-meta">
                <div>
                  <span>Your answer</span>
                  <strong>{question.userAnswer || "No answer selected"}</strong>
                </div>
                <div>
                  <span>Correct answer</span>
                  <strong>{question.correctAnswer}</strong>
                </div>
                <div>
                  <span>Points</span>
                  <strong>{question.points}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="solve-action-row result-actions">
          <button
            type="button"
            className="solve-secondary-btn"
            onClick={handleReset}
          >
            Take Another Quiz
          </button>
          <button
            type="button"
            className="solve-primary-btn"
            onClick={handleReset}
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  };

  return (
    <Sidebar>
      <div className="solve-page">
        <Toaster position="top-right" />
        {step === "setup" && renderSetup()}
        {step === "taking" && renderTaking()}
        {step === "results" && renderResults()}
      </div>
    </Sidebar>
  );
}

export default SolveQuiz;
