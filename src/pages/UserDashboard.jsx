import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./UserDashboard.css";

const API_BASE = "https://safe-click-backend.vercel.app/api/users";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const formatSeconds = (value) => {
  const seconds = Math.max(0, Math.round(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const riskTone = (riskLevel) => {
  const normalized = String(riskLevel || "").toLowerCase();
  if (normalized === "high") return "danger";
  if (normalized === "medium") return "warning";
  return "success";
};

function UserDashboard() {
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_BASE}/dashboard-summary`, {
          headers: authHeaders,
        });

        if (response.data?.success) {
          setDashboard(response.data);
        } else {
          setError(response.data?.message || "Failed to load dashboard");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
        toast.error(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboard();
    } else {
      setError("Please login again to view your dashboard");
      setLoading(false);
    }
  }, [authHeaders, token]);

  const user = dashboard?.user;
  const recentAttempts = dashboard?.recentAttempts || [];

  const statCards = [
    {
      label: "Security Score",
      value: `${formatNumber(user?.securityScore)}%`,
      meta: "Overall safety rating",
      tone: "primary",
      ringValue: `${formatNumber(user?.securityScore)}%`,
    },
    {
      label: "Risk Level",
      value: user?.riskLevel || "low",
      meta: "Current account risk",
      tone: riskTone(user?.riskLevel),
      ringValue: user?.riskLevel || "low",
    },
    {
      label: "Link Clicks",
      value: formatNumber(user?.totalLinksClicked),
      meta: "Tracked phishing clicks",
      tone: "danger",
      ringValue: formatNumber(user?.totalLinksClicked),
    },
    {
      label: "Email Opens",
      value: formatNumber(user?.totalEmailsOpened),
      meta: "Tracked email opens",
      tone: "warning",
      ringValue: formatNumber(user?.totalEmailsOpened),
    },
    {
      label: "Quiz Conduct",
      value: formatNumber(user?.totalQuizConduct),
      meta: "Total quiz attempts",
      tone: "accent",
      ringValue: formatNumber(user?.totalQuizConduct),
    },
    {
      label: "Questions Solved",
      value: formatNumber(user?.totalQuestionsSolved),
      meta: "All answered questions",
      tone: "success",
      ringValue: formatNumber(user?.totalQuestionsSolved),
    },
    {
      label: "Correct Answers",
      value: formatNumber(user?.totalCorrect),
      meta: "Total correct responses",
      tone: "success",
      ringValue: formatNumber(user?.totalCorrect),
    },
    {
      label: "Wrong Answers",
      value: formatNumber(user?.totalWrong),
      meta: "Total incorrect responses",
      tone: "danger",
      ringValue: formatNumber(user?.totalWrong),
    },
    {
      label: "Avg. Solving Time",
      value: formatSeconds(user?.avgSolvingTime / 1000),
      meta: "Average completion time",
      tone: "primary",
      ringValue: formatSeconds(user?.avgSolvingTime / 1000),
    },
    {
      label: "Avg. Quiz Points",
      value: Number(user?.avgQuizPoints || 0).toFixed(1),
      meta: "Average score per attempt",
      tone: "accent",
      ringValue: Number(user?.avgQuizPoints || 0).toFixed(1),
    },
  ];

  return (
    <Sidebar>
      <div className="user-dashboard-page">
        <Toaster position="top-right" />

        <section className="user-hero-card">
          <div>
            <span className="user-kicker">User Dashboard</span>
            <h1>Your security and quiz performance overview</h1>
            <p>
              Track your phishing exposure, quiz participation, correctness, and speed in one place.
            </p>
          </div>

          <div className="user-profile-summary">
            <div className="user-avatar-circle">
              <span>{String(user?.name || "U").charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.email || "No email available"}</span>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="user-state-card">Loading dashboard...</section>
        ) : error ? (
          <section className="user-state-card error">{error}</section>
        ) : (
          <>
            <section className="user-metric-grid" style={{ marginTop: "25px" }}>
              {statCards.map((card) => (
                <article key={card.label} className={`user-metric-card ${card.tone}`}>
                  <div className="user-metric-ring">
                    <span>{card.ringValue}</span>
                  </div>
                  <div className="user-metric-body">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <p>{card.meta}</p>
                  </div>
                </article>
              ))}
            </section>

            <section className="user-highlight-grid" style={{ marginTop: "25px" }}>
              <article className="user-highlight-card">
                <span>Name</span>
                <strong>{user?.name || "-"}</strong>
              </article>
              <article className="user-highlight-card">
                <span>Email</span>
                <strong>{user?.email || "-"}</strong>
              </article>
              <article className="user-highlight-card">
                <span>Risk Status</span>
                <strong className={`risk-pill ${riskTone(user?.riskLevel)}`}>{user?.riskLevel || "low"}</strong>
              </article>
            </section>

            <section className="user-table-card" style={{ marginTop: "25px" }}>
              <div className="user-section-head">
                <div>
                  <h2>Recent Quiz Attempts</h2>
                  <p>Latest submissions with scores, timing, and accuracy.</p>
                </div>
              </div>

              <div className="user-table-wrap">
                <table className="table user-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Mode</th>
                      <th>Score</th>
                      <th>Correct</th>
                      <th>Wrong</th>
                      <th>Questions</th>
                      <th>Time</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="user-empty-cell">No quiz attempts yet.</td>
                      </tr>
                    ) : (
                      recentAttempts.map((attempt) => (
                        <tr key={attempt._id}>
                          <td>
                            <strong>{attempt.quizTitle || "Quiz Attempt"}</strong>
                            <div className="user-table-desc">{attempt.attemptDate ? new Date(attempt.attemptDate).toLocaleDateString() : "-"}</div>
                          </td>
                          <td>{attempt.quizMode || "single"}</td>
                          <td>{attempt.score || 0}</td>
                          <td>{attempt.correctAnswers || 0}</td>
                          <td>{attempt.wrongAnswers || 0}</td>
                          <td>{attempt.totalQuestions || 0}</td>
                          <td>{formatSeconds((attempt.completionTime || 0) / 1000)}</td>
                          <td>{attempt.correctPercentage || 0}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </Sidebar>
  );
}

export default UserDashboard;
