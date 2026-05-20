import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./QuizManage.css";

const API_BASE = "https://safe-click-backend.vercel.app/api/quizzes";

const difficultyOptions = [
  { key: "easy", label: "Easy", apiValue: "Beginner" },
  { key: "medium", label: "Medium", apiValue: "Intermediate" },
  { key: "difficult", label: "Difficult", apiValue: "Advanced" },
];

const blankQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
});

const blankQuizForm = () => ({
  title: "",
  description: "",
  difficultyLevel: "easy",
  timeLimit: 30,
  isPublished: false,
  questions: [blankQuestion()],
});

const mapApiQuiz = (quiz) => ({
  ...quiz,
  difficultyLevel: quiz.difficultyKey || "easy",
});

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

function QuizManage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = token ? JSON.parse(atob(token.split(".")[1])).role : null;

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("single");
  const [bulkPayload, setBulkPayload] = useState(`[
  {
    "title": "Phishing Awareness Basics",
    "description": "Intro quiz for users",
    "difficultyLevel": "easy",
    "timeLimit": 20,
    "isPublished": true,
    "questions": [
      {
        "questionText": "What should you do with suspicious links?",
        "options": ["Click immediately", "Verify first", "Share it", "Ignore the sender"],
        "correctAnswer": "Verify first",
        "points": 1
      }
    ]
  }
]`);
  const [formMode, setFormMode] = useState("create");
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [formData, setFormData] = useState(blankQuizForm());

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (difficultyFilter !== "all") params.difficultyLevel = difficultyFilter;
      if (publishedFilter !== "all")
        params.isPublished = publishedFilter === "published";
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await axios.get(API_BASE, {
        headers: authHeaders,
        params,
      });

      if (response.data?.success) {
        setQuizzes((response.data.quizzes || []).map(mapApiQuiz));
      } else {
        toast.error(response.data?.message || "Failed to load quizzes");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/");
      return;
    }

    if (userRole && userRole !== "admin") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }

    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) {
      fetchQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficultyFilter, publishedFilter]);

  const filteredQuizzes = quizzes;

  const stats = useMemo(() => {
    const easy = quizzes.filter(
      (quiz) => quiz.difficultyLevel === "easy",
    ).length;
    const medium = quizzes.filter(
      (quiz) => quiz.difficultyLevel === "medium",
    ).length;
    const difficult = quizzes.filter(
      (quiz) => quiz.difficultyLevel === "difficult",
    ).length;
    const published = quizzes.filter((quiz) => quiz.isPublished).length;

    return { total: quizzes.length, easy, medium, difficult, published };
  }, [quizzes]);

  const resetForm = () => {
    setFormMode("create");
    setEditingQuizId(null);
    setFormData(blankQuizForm());
  };

  const openEditQuiz = (quiz) => {
    setFormMode("edit");
    setEditingQuizId(quiz._id);
    setFormData({
      title: quiz.title || "",
      description: quiz.description || "",
      difficultyLevel: quiz.difficultyLevel || "easy",
      timeLimit: quiz.timeLimit || 30,
      isPublished: Boolean(quiz.isPublished),
      questions:
        Array.isArray(quiz.questions) && quiz.questions.length
          ? quiz.questions.map((question) => ({
              questionText: question.questionText || "",
              options: Array.isArray(question.options)
                ? [...question.options, "", "", "", ""].slice(0, 4)
                : ["", "", "", ""],
              correctAnswer: question.correctAnswer || "",
              points: question.points || 1,
            }))
          : [blankQuestion()],
    });
    setActiveTab("single");
  };

  const updateQuestion = (questionIndex, field, value) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      nextQuestions[questionIndex] = {
        ...nextQuestions[questionIndex],
        [field]: value,
      };
      return { ...prev, questions: nextQuestions };
    });
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setFormData((prev) => {
      const nextQuestions = [...prev.questions];
      const nextOptions = [...nextQuestions[questionIndex].options];
      nextOptions[optionIndex] = value;
      nextQuestions[questionIndex] = {
        ...nextQuestions[questionIndex],
        options: nextOptions,
      };
      return { ...prev, questions: nextQuestions };
    });
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, blankQuestion()],
    }));
  };

  const removeQuestion = (questionIndex) => {
    setFormData((prev) => {
      const nextQuestions = prev.questions.filter(
        (_, index) => index !== questionIndex,
      );
      return {
        ...prev,
        questions: nextQuestions.length ? nextQuestions : [blankQuestion()],
      };
    });
  };

  const handleSingleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      difficultyLevel: formData.difficultyLevel,
      timeLimit: Number(formData.timeLimit) || 30,
      isPublished: formData.isPublished,
      questions: formData.questions.map((question) => ({
        questionText: question.questionText.trim(),
        options: question.options
          .map((option) => option.trim())
          .filter(Boolean),
        correctAnswer: question.correctAnswer.trim(),
        points: Number(question.points) || 1,
      })),
    };

    if (
      payload.questions.some(
        (question) =>
          !question.questionText ||
          question.options.length < 2 ||
          !question.correctAnswer,
      )
    ) {
      toast.error(
        "Each question needs text, at least 2 options, and a correct answer",
      );
      return;
    }

    setSaving(true);
    try {
      const response =
        formMode === "edit"
          ? await axios.put(`${API_BASE}/${editingQuizId}`, payload, {
              headers: authHeaders,
            })
          : await axios.post(`${API_BASE}/create-quiz`, payload, {
              headers: authHeaders,
            });

      if (response.data?.success) {
        toast.success(response.data?.message || "Quiz saved successfully");
        resetForm();
        fetchQuizzes();
      } else {
        toast.error(response.data?.message || "Failed to save quiz");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSubmit = async (event) => {
    event.preventDefault();

    let parsed;
    try {
      parsed = JSON.parse(bulkPayload);
    } catch (error) {
      toast.error("Bulk payload must be valid JSON");
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast.error("Bulk payload must be an array of quizzes");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE}/bulk-create`,
        { quizzes: parsed },
        { headers: authHeaders },
      );

      if (response.data?.success) {
        toast.success(
          response.data?.message || "Bulk quizzes created successfully",
        );
        fetchQuizzes();
      } else {
        toast.error(response.data?.message || "Bulk create failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quiz) => {
    const confirmed = window.confirm(`Delete quiz \"${quiz.title}\"?`);
    if (!confirmed) return;

    setDeletingId(quiz._id);
    try {
      const response = await axios.delete(`${API_BASE}/${quiz._id}`, {
        headers: authHeaders,
      });

      if (response.data?.success) {
        toast.success("Quiz deleted successfully");
        fetchQuizzes();
      } else {
        toast.error(response.data?.message || "Failed to delete quiz");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    } finally {
      setDeletingId(null);
    }
  };

  const difficultyBadge = (difficultyLevel) => {
    if (difficultyLevel === "medium") return "quiz-badge medium";
    if (difficultyLevel === "difficult") return "quiz-badge difficult";
    return "quiz-badge easy";
  };

  return (
    <Sidebar>
      <div className="quiz-manage-page">
        <Toaster position="top-right" />

        <section className="quiz-hero">
          <div>
            <span className="quiz-kicker">Quiz Management</span>
            <h1 className="quiz-title">
              Create, bulk import, edit, and organize quizzes
            </h1>
            <p className="quiz-subtitle">
              Manage all quiz content from one admin dashboard with lightweight
              cards, filtering, and full CRUD controls.
            </p>
          </div>

          <div className="quiz-hero-actions">
            <button
              className="quiz-btn secondary"
              type="button"
              onClick={fetchQuizzes}
            >
              <i className="fas fa-rotate-right"></i>
              Refresh
            </button>
            <button
              className="quiz-btn primary"
              type="button"
              onClick={resetForm}
            >
              <i className="fas fa-plus"></i>
              New Quiz
            </button>
          </div>
        </section>

        <section className="quiz-stats-grid">
          <article className="quiz-stat-card">
            <span>Total Quizzes</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="quiz-stat-card">
            <span>Easy</span>
            <strong>{stats.easy}</strong>
          </article>
          <article className="quiz-stat-card">
            <span>Medium</span>
            <strong>{stats.medium}</strong>
          </article>
          <article className="quiz-stat-card">
            <span>Difficult</span>
            <strong>{stats.difficult}</strong>
          </article>
          <article className="quiz-stat-card">
            <span>Published</span>
            <strong>{stats.published}</strong>
          </article>
        </section>

        <section className="quiz-toolbar">
          <div className="quiz-search-wrap">
            <i className="fas fa-magnifying-glass"></i>
            <input
              type="text"
              className="quiz-search-input"
              placeholder="Search quizzes by title or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="quiz-mini-btn"
              type="button"
              onClick={fetchQuizzes}
            >
              Search
            </button>
          </div>

          <div className="quiz-filters">
            <select
              className="quiz-select"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="all">All difficulty</option>
              {difficultyOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="quiz-select"
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>

            <button
              className="quiz-mini-btn"
              type="button"
              onClick={fetchQuizzes}
            >
              Apply Filters
            </button>
          </div>
        </section>

        <section className="quiz-section-grid">
          <div className="quiz-panel">
            <div className="quiz-panel-head">
              <div>
                <h2>{formMode === "edit" ? "Edit Quiz" : "Create Quiz"}</h2>
                <p>
                  Build questions one by one with options and correct answers.
                </p>
              </div>
              {formMode === "edit" && (
                <button
                  className="quiz-mini-btn ghost"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form className="quiz-form" onSubmit={handleSingleSubmit}>
              <div className="quiz-form-grid">
                <label className="quiz-field">
                  <span>Quiz Title</span>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter quiz title"
                  />
                </label>

                <label className="quiz-field">
                  <span>Difficulty</span>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        difficultyLevel: e.target.value,
                      }))
                    }
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="quiz-field">
                  <span>Time Limit (minutes)</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.timeLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeLimit: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="quiz-field checkbox-field">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPublished: e.target.checked,
                      }))
                    }
                  />
                  <span>Publish immediately</span>
                </label>

                <label className="quiz-field quiz-span-2">
                  <span>Description</span>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Short description for the quiz"
                  />
                </label>
              </div>

              <div className="quiz-questions-header">
                <h3>Questions</h3>
                <button
                  className="quiz-mini-btn"
                  type="button"
                  onClick={addQuestion}
                >
                  <i className="fas fa-plus"></i>
                  Add Question
                </button>
              </div>

              <div className="quiz-question-list">
                {formData.questions.map((question, questionIndex) => (
                  <article key={questionIndex} className="quiz-question-card">
                    <div className="quiz-question-card-head">
                      <strong>Question {questionIndex + 1}</strong>
                      {formData.questions.length > 1 && (
                        <button
                          className="quiz-icon-btn danger"
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>

                    <div className="quiz-form-grid question-grid">
                      <label className="quiz-field quiz-span-2">
                        <span>Question Text</span>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "questionText",
                              e.target.value,
                            )
                          }
                          placeholder="Enter question text"
                        />
                      </label>

                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="quiz-field">
                          <span>Option {optionIndex + 1}</span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateQuestionOption(
                                questionIndex,
                                optionIndex,
                                e.target.value,
                              )
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        </label>
                      ))}

                      <label className="quiz-field">
                        <span>Correct Answer</span>
                        <select
                          value={question.correctAnswer}
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "correctAnswer",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select the correct option</option>
                          {question.options
                            .filter((option) => option.trim())
                            .map((option, optionIndex) => (
                              <option
                                key={`${questionIndex}-${optionIndex}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label className="quiz-field">
                        <span>Points</span>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "points",
                              e.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>

              <button
                className="quiz-btn primary full-width"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : formMode === "edit"
                    ? "Update Quiz"
                    : "Create Quiz"}
              </button>
            </form>
          </div>

          <div className="quiz-panel">
            <div className="quiz-panel-head">
              <div>
                <h2>Bulk Add</h2>
                <p>Paste a JSON array of quizzes for fast bulk creation.</p>
              </div>
              <button
                className="quiz-mini-btn ghost"
                type="button"
                onClick={() => setActiveTab("bulk")}
              >
                Use Bulk Mode
              </button>
            </div>

            <div className="quiz-tabs">
              <button
                type="button"
                className={`quiz-tab ${activeTab === "single" ? "active" : ""}`}
                onClick={() => setActiveTab("single")}
              >
                Single / Edit
              </button>
              <button
                type="button"
                className={`quiz-tab ${activeTab === "bulk" ? "active" : ""}`}
                onClick={() => setActiveTab("bulk")}
              >
                Bulk JSON
              </button>
            </div>

            {activeTab === "bulk" ? (
              <form className="quiz-form" onSubmit={handleBulkSubmit}>
                <label className="quiz-field">
                  <span>Bulk JSON Payload</span>
                  <textarea
                    className="quiz-bulk-textarea"
                    value={bulkPayload}
                    onChange={(e) => setBulkPayload(e.target.value)}
                    placeholder="Paste array of quizzes here"
                  />
                </label>
                <button
                  className="quiz-btn primary full-width"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Importing..." : "Import Bulk Quizzes"}
                </button>
              </form>
            ) : (
              <div className="quiz-bulk-help">
                <p>
                  Switch to bulk mode to import multiple quizzes at once using
                  the JSON sample already filled in.
                </p>
                <div className="quiz-json-sample">
                  <code>{`[{ title, description, difficultyLevel, timeLimit, isPublished, questions: [...] }]`}</code>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="quiz-results-section">
          <div className="quiz-section-head">
            <div>
              <h2>Quiz Cards</h2>
              <p>Quick view of all quizzes using the active filter set.</p>
            </div>
            <div className="quiz-count-pill">
              {loading ? "Loading..." : `${filteredQuizzes.length} quiz(s)`}
            </div>
          </div>

          <div className="quiz-cards-grid">
            {filteredQuizzes.length === 0 ? (
              <div className="quiz-empty-state">
                <i className="fas fa-inbox"></i>
                <h4>No quizzes found</h4>
                <p>Try different filters or create a new quiz.</p>
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                <article key={quiz._id} className="quiz-card">
                  <div className="quiz-card-top">
                    <div>
                      <span className={difficultyBadge(quiz.difficultyLevel)}>
                        {difficultyOptions.find(
                          (option) => option.key === quiz.difficultyLevel,
                        )?.label || "Easy"}
                      </span>
                      <h3>{quiz.title}</h3>
                    </div>
                    <span
                      className={`quiz-status ${quiz.isPublished ? "published" : "draft"}`}
                    >
                      {quiz.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="quiz-card-description">
                    {quiz.description || "No description provided."}
                  </p>

                  <div className="quiz-card-meta">
                    <span>
                      <i className="fas fa-list-check"></i>{" "}
                      {quiz.questions?.length || 0} Questions
                    </span>
                    <span>
                      <i className="fas fa-clock"></i> {quiz.timeLimit || 30}{" "}
                      min
                    </span>
                    <span>
                      <i className="fas fa-calendar"></i>{" "}
                      {formatDate(quiz.createdAt)}
                    </span>
                  </div>

                  <div className="quiz-card-actions">
                    <button
                      className="quiz-mini-btn"
                      type="button"
                      onClick={() => openEditQuiz(quiz)}
                    >
                      <i className="fas fa-pen"></i>
                      Edit
                    </button>
                    <button
                      className="quiz-mini-btn danger"
                      type="button"
                      onClick={() => handleDelete(quiz)}
                      disabled={deletingId === quiz._id}
                    >
                      {deletingId === quiz._id ? (
                        "Deleting..."
                      ) : (
                        <>
                          <i className="fas fa-trash"></i>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="quiz-table-section">
          <div className="quiz-section-head">
            <div>
              <h2>Quiz Table</h2>
              <p>Sorted by the current search and filter criteria.</p>
            </div>
          </div>

          <div className="quiz-table-wrap">
            <table className="table quiz-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Questions</th>
                  <th>Time Limit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="quiz-empty-cell">
                      Loading quizzes...
                    </td>
                  </tr>
                ) : filteredQuizzes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="quiz-empty-cell">
                      No quizzes match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredQuizzes.map((quiz) => (
                    <tr key={quiz._id}>
                      <td>
                        <strong>{quiz.title}</strong>
                        <div className="quiz-table-desc">
                          {quiz.description || "-"}
                        </div>
                      </td>
                      <td>
                        <span className={difficultyBadge(quiz.difficultyLevel)}>
                          {difficultyOptions.find(
                            (option) => option.key === quiz.difficultyLevel,
                          )?.label || "Easy"}
                        </span>
                      </td>
                      <td>{quiz.questions?.length || 0}</td>
                      <td>{quiz.timeLimit || 30} min</td>
                      <td>
                        <span
                          className={`quiz-status ${quiz.isPublished ? "published" : "draft"}`}
                        >
                          {quiz.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>{formatDate(quiz.createdAt)}</td>
                      <td>
                        <div className="quiz-row-actions">
                          <button
                            className="quiz-mini-btn"
                            type="button"
                            onClick={() => openEditQuiz(quiz)}
                          >
                            Edit
                          </button>
                          <button
                            className="quiz-mini-btn danger"
                            type="button"
                            onClick={() => handleDelete(quiz)}
                            disabled={deletingId === quiz._id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Sidebar>
  );
}

export default QuizManage;
