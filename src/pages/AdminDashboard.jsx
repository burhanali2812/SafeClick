import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";

const API_BASE = "https://safe-click-backend.vercel.app/api/admins";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

const riskTone = (riskLevel) => {
  const normalized = String(riskLevel || "").toLowerCase();
  if (normalized === "high") return "danger";
  if (normalized === "medium") return "warning";
  return "success";
};

const statusTone = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "pending") return "warning";
  if (normalized === "blocked") return "danger";
  return "neutral";
};

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = token ? JSON.parse(atob(token.split(".")[1])).role : null;

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/");
      return;
    }

    if (userRole !== "admin") {
      toast.error("Access denied");
      navigate("/");
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_BASE}/summary`, {
          headers: authHeaders,
        });

        if (response.data?.success) {
          setDashboard(response.data.data || {});
        } else {
          setError(response.data?.message || "Failed to load admin dashboard");
        }
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to load admin dashboard";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authHeaders, navigate, token, userRole]);

  const summary = dashboard?.summary || {};
  const recentUsers = dashboard?.recentUsers || [];
  const recentCampaigns = dashboard?.recentCampaigns || [];
  const recentQuizzes = dashboard?.recentQuizzes || [];
  const recentTemplates = dashboard?.recentTemplates || [];
  const recentQuizAttempts = dashboard?.recentQuizAttempts || [];

  const overviewCards = [
    {
      label: "Total Users",
      value: summary.totalUsers,
      meta: "All registered accounts",
      tone: "primary",
      icon: "fa-users",
    },
    {
      label: "Active Users",
      value: summary.activeUsers,
      meta: "Accounts ready to use",
      tone: "success",
      icon: "fa-user-check",
    },
    {
      label: "Pending Users",
      value: summary.pendingUsers,
      meta: "Awaiting activation",
      tone: "warning",
      icon: "fa-user-clock",
    },
    {
      label: "Total Email Templates",
      value: summary.totalEmailTemplates,
      meta: `${formatNumber(summary.activeEmailTemplates)} active templates`,
      tone: "accent",
      icon: "fa-envelope",
    },
    {
      label: "Campaign Runs",
      value: summary.totalCampaignRuns,
      meta: "Created campaign executions",
      tone: "danger",
      icon: "fa-bullhorn",
    },
    {
      label: "Total Quizzes",
      value: summary.totalQuizzes,
      meta: "Quiz bank size",
      tone: "primary",
      icon: "fa-question-circle",
    },
    {
      label: "Quiz Attempts",
      value: summary.totalQuizAttempts,
      meta: `${formatNumber(summary.uniqueQuizSolvers)} unique users solved quizzes`,
      tone: "success",
      icon: "fa-clipboard-check",
    },
    {
      label: "Average Security Score",
      value: summary.averageSecurityScore,
      suffix: "%",
      meta: `Average risk score ${formatNumber(summary.averageRiskScore)}%`,
      tone: "neutral",
      icon: "fa-shield-halved",
    },
  ];

  const riskCards = [
    { label: "Low Risk", value: summary.lowRiskUsers, tone: "success" },
    { label: "Medium Risk", value: summary.mediumRiskUsers, tone: "warning" },
    { label: "High Risk", value: summary.highRiskUsers, tone: "danger" },
  ];

  const userStatusCards = [
    { label: "Active", value: summary.activeUsers, tone: "success" },
    { label: "Pending", value: summary.pendingUsers, tone: "warning" },
    { label: "Suspended", value: summary.suspendedUsers, tone: "neutral" },
    { label: "Blocked", value: summary.blockedUsers, tone: "danger" },
  ];

  return (
    <Sidebar>
      <div className="admin-dashboard-page">
        <Toaster position="top-right" />

        <section className="admin-hero-card">
          <div className="admin-hero-copy">
            <span className="admin-kicker">Admin Dashboard</span>
            <h1>Complete app overview in one place</h1>
            <p>
              Track users, campaigns, templates, quiz activity, and security risk across the full platform.
            </p>
          </div>

          <div className="admin-hero-metrics">
            <div>
              <span>Risk Score</span>
              <strong>{formatNumber(summary.averageRiskScore)}%</strong>
            </div>
            <div>
              <span>Total Users</span>
              <strong>{formatNumber(summary.totalUsers)}</strong>
            </div>
            <div>
              <span>Quiz Solvers</span>
              <strong>{formatNumber(summary.uniqueQuizSolvers)}</strong>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="admin-state-card">Loading admin summary...</section>
        ) : error ? (
          <section className="admin-state-card error">{error}</section>
        ) : (
          <>
            <section className="admin-overview-grid">
              {overviewCards.map((card) => (
                <article key={card.label} className={`admin-overview-card ${card.tone}`}>
                  <div className="admin-overview-icon">
                    <i className={`fa-solid ${card.icon}`}></i>
                  </div>
                  <span>{card.label}</span>
                  <strong>{formatNumber(card.value)}{card.suffix || ""}</strong>
                  <p>{card.meta}</p>
                </article>
              ))}
            </section>

            <section className="admin-dual-grid">
              <article className="admin-panel-card">
                <div className="admin-panel-head">
                  <div>
                    <h2>User Risk Distribution</h2>
                    <p>Security segmentation for the full user base.</p>
                  </div>
                </div>

                <div className="admin-bar-list">
                  {riskCards.map((item) => {
                    const totalRiskUsers =
                      (summary.lowRiskUsers || 0) +
                      (summary.mediumRiskUsers || 0) +
                      (summary.highRiskUsers || 0);
                    const width = totalRiskUsers
                      ? ((item.value || 0) / totalRiskUsers) * 100
                      : 0;

                    return (
                      <div key={item.label} className="admin-bar-item">
                        <div className="admin-bar-row">
                          <span>{item.label}</span>
                          <strong>{formatNumber(item.value)}</strong>
                        </div>
                        <div className="admin-bar-track">
                          <div
                            className={`admin-bar-fill ${item.tone}`}
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="admin-panel-card">
                <div className="admin-panel-head">
                  <div>
                    <h2>User Account Status</h2>
                    <p>Shows how many accounts are active versus waiting.</p>
                  </div>
                </div>

                <div className="admin-status-grid">
                  {userStatusCards.map((item) => (
                    <div key={item.label} className={`admin-status-card ${item.tone}`}>
                      <span>{item.label}</span>
                      <strong>{formatNumber(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="admin-table-card">
              <div className="admin-section-head">
                <div>
                  <h2>Recent Users</h2>
                  <p>Latest accounts with risk and security score details.</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="table admin-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Risk</th>
                      <th>Security Score</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="admin-empty-cell">
                          No users available.
                        </td>
                      </tr>
                    ) : (
                      recentUsers.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <strong>{user.name || "Unnamed User"}</strong>
                            <div className="admin-table-desc">{user.email || "-"}</div>
                          </td>
                          <td>
                            <span className={`admin-pill ${statusTone(user.accountStatus)}`}>
                              {user.accountStatus || "-"}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-pill ${riskTone(user.riskLevel)}`}>
                              {user.riskLevel || "-"}
                            </span>
                          </td>
                          <td>{formatNumber(user.securityScore)}%</td>
                          <td>{formatDate(user.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-table-card">
              <div className="admin-section-head">
                <div>
                  <h2>Recent Campaign Runs</h2>
                  <p>Recent phishing campaigns created by the admin team.</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="table admin-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Template</th>
                      <th>Target Users</th>
                      <th>Launch Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="admin-empty-cell">
                          No campaigns available.
                        </td>
                      </tr>
                    ) : (
                      recentCampaigns.map((campaign) => (
                        <tr key={campaign.id}>
                          <td>
                            <strong>{campaign.title || "Campaign"}</strong>
                            <div className="admin-table-desc">
                              {campaign.description || "No description provided."}
                            </div>
                          </td>
                          <td>{campaign.templateName || "-"}</td>
                          <td>{formatNumber(campaign.targetUsers)}</td>
                          <td>{formatDate(campaign.launchDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-dual-grid">
              <article className="admin-table-card">
                <div className="admin-section-head">
                  <div>
                    <h2>Recent Quizzes</h2>
                    <p>Latest quiz inventory added to the platform.</p>
                  </div>
                </div>

                <div className="admin-table-wrap compact">
                  <table className="table admin-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Quiz</th>
                        <th>Questions</th>
                        <th>Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuizzes.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="admin-empty-cell">
                            No quizzes available.
                          </td>
                        </tr>
                      ) : (
                        recentQuizzes.map((quiz) => (
                          <tr key={quiz._id}>
                            <td>
                              <strong>{quiz.title || "Quiz"}</strong>
                              <div className="admin-table-desc">{quiz.difficultyLevel || "-"}</div>
                            </td>
                            <td>{Array.isArray(quiz.questions) ? quiz.questions.length : 0}</td>
                            <td>
                              <span className={`admin-pill ${quiz.isPublished ? "success" : "neutral"}`}>
                                {quiz.isPublished ? "Published" : "Draft"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="admin-table-card">
                <div className="admin-section-head">
                  <div>
                    <h2>Recent Quiz Attempts</h2>
                    <p>Latest user quiz submissions across the app.</p>
                  </div>
                </div>

                <div className="admin-table-wrap compact">
                  <table className="table admin-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Quiz</th>
                        <th>Score</th>
                        <th>Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuizAttempts.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="admin-empty-cell">
                            No quiz attempts available.
                          </td>
                        </tr>
                      ) : (
                        recentQuizAttempts.map((attempt) => (
                          <tr key={attempt._id}>
                            <td>
                              <strong>{attempt.userId?.name || "Unknown User"}</strong>
                              <div className="admin-table-desc">{attempt.userId?.email || "-"}</div>
                            </td>
                            <td>{attempt.quizTitle || "Quiz Attempt"}</td>
                            <td>{formatNumber(attempt.score)}</td>
                            <td>{formatNumber(attempt.correctPercentage)}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>

            <section className="admin-table-card">
              <div className="admin-section-head">
                <div>
                  <h2>Recent Email Templates</h2>
                  <p>Latest templates used for email campaigns.</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="table admin-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="admin-empty-cell">
                          No email templates available.
                        </td>
                      </tr>
                    ) : (
                      recentTemplates.map((template) => (
                        <tr key={template._id}>
                          <td>
                            <strong>{template.templateName || "Template"}</strong>
                            <div className="admin-table-desc">{template.subject || "-"}</div>
                          </td>
                          <td>
                            <span className={`admin-pill ${template.isActive ? "success" : "neutral"}`}>
                              {template.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{formatDate(template.createdAt)}</td>
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

export default AdminDashboard;