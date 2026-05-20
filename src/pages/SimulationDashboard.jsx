import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./SimulationDashboard.css";

const API_BASE = "https://safe-click-backend.vercel.app/api";

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function SimulationDashboard() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const token = localStorage.getItem("token");

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    campaignId || "",
  );
  const [campaign, setCampaign] = useState(null);
  const [summary, setSummary] = useState({});
  const [results, setResults] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/");
    }
  }, [navigate, token]);

  useEffect(() => {
    if (campaignId && campaignId !== selectedCampaignId) {
      setSelectedCampaignId(campaignId);
    }
  }, [campaignId, selectedCampaignId]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const response = await axios.get(`${API_BASE}/campaigns/campaigns`, {
          headers: authHeaders,
        });

        if (response.data?.success) {
          const orderedCampaigns = [...(response.data.data || [])].sort(
            (left, right) =>
              new Date(right.launchDate || right.createdAt || 0) -
              new Date(left.launchDate || left.createdAt || 0),
          );

          setCampaigns(orderedCampaigns);

          if (!selectedCampaignId && orderedCampaigns.length > 0) {
            const latestCampaignId = orderedCampaigns[0]._id;
            setSelectedCampaignId(latestCampaignId);
            navigate(`/simulation-results/${latestCampaignId}`, {
              replace: true,
            });
          }
        } else {
          toast.error(response.data?.message || "Failed to load campaigns");
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load campaigns",
        );
      } finally {
        setLoadingCampaigns(false);
      }
    };

    if (token) {
      fetchCampaigns();
    }
  }, [authHeaders, navigate, token]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedCampaignId) return;

      setLoadingResults(true);
      try {
        const response = await axios.get(
          `${API_BASE}/admins/campaign-results/${selectedCampaignId}`,
          {
            headers: authHeaders,
          },
        );

        if (response.data?.success) {
          setCampaign(response.data.data?.campaign || null);
          setSummary(response.data.data?.summary || {});
          setResults(response.data.data?.results || []);
        } else {
          toast.error(
            response.data?.message || "Failed to load simulation results",
          );
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load simulation results",
        );
      } finally {
        setLoadingResults(false);
      }
    };

    if (token && selectedCampaignId) {
      fetchResults();
    }
  }, [authHeaders, selectedCampaignId, token]);

  const handleCampaignChange = (event) => {
    const nextCampaignId = event.target.value;
    setSelectedCampaignId(nextCampaignId);
    if (nextCampaignId) {
      navigate(`/simulation-results/${nextCampaignId}`);
    }
  };

  const handleRefresh = () => {
    if (!selectedCampaignId) {
      return;
    }

    setLoadingResults(true);
    axios
      .get(`${API_BASE}/admins/campaign-results/${selectedCampaignId}`, {
        headers: authHeaders,
      })
      .then((response) => {
        if (response.data?.success) {
          setCampaign(response.data.data?.campaign || null);
          setSummary(response.data.data?.summary || {});
          setResults(response.data.data?.results || []);
        } else {
          toast.error(response.data?.message || "Failed to refresh results");
        }
      })
      .catch((error) => {
        toast.error(
          error.response?.data?.message || "Failed to refresh results",
        );
      })
      .finally(() => {
        setLoadingResults(false);
      });
  };

  const handleStopCampaign = async () => {
    if (!selectedCampaignId) {
      return;
    }

    const confirmed = window.confirm(
      "Stop this campaign? This will permanently delete the campaign and its simulation results.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingCampaign(true);
    try {
      const response = await axios.delete(
        `${API_BASE}/campaigns/campaigns/${selectedCampaignId}`,
        {
          headers: authHeaders,
        },
      );

      if (response.data?.success) {
        toast.success("Campaign stopped successfully");
        navigate("/campaigns");
      } else {
        toast.error(response.data?.message || "Failed to stop campaign");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to stop campaign");
    } finally {
      setDeletingCampaign(false);
    }
  };

  const statCards = [
    {
      label: "Total Target Users",
      value: summary.totalTargetUsers ?? 0,
      note: "Users targeted in the campaign",
      icon: "fa-users",
      accent: "#4a7fd4",
      progress: summary.totalTargetUsers ? 100 : 0,
    },
    {
      label: "Total Email Opened",
      value: summary.totalEmailOpened ?? 0,
      note: `Open rate ${summary.openRate ?? 0}%`,
      icon: "fa-envelope-open-text",
      accent: "#1f9d73",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.totalEmailOpened / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Total Link Clicked",
      value: summary.totalLinkClicked ?? 0,
      note: `Click rate ${summary.clickRate ?? 0}%`,
      icon: "fa-link",
      accent: "#e67e22",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.totalLinkClicked / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Pending Users",
      value: summary.pendingUsers ?? 0,
      note: "No interaction recorded yet",
      icon: "fa-hourglass-half",
      accent: "#8896ab",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.pendingUsers / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Engaged Users",
      value: summary.engagedUsers ?? 0,
      note: "Users who opened or clicked",
      icon: "fa-chart-line",
      accent: "#8b6df2",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.engagedUsers / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Desktop Devices",
      value: summary.desktopUsers ?? 0,
      note: "Interactions captured from desktops",
      icon: "fa-desktop",
      accent: "#0f766e",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.desktopUsers / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Mobile Devices",
      value: summary.mobileUsers ?? 0,
      note: "Interactions captured from mobile devices",
      icon: "fa-mobile-screen-button",
      accent: "#db7c26",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.mobileUsers / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Browser Logged",
      value: summary.resultsWithBrowser ?? 0,
      note: "Rows with browser metadata",
      icon: "fa-globe",
      accent: "#475569",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.resultsWithBrowser / summary.totalTargetUsers) * 100
          : 0,
    },
    {
      label: "Location Logged",
      value: summary.resultsWithLocation ?? 0,
      note: "Rows with location metadata",
      icon: "fa-location-dot",
      accent: "#be185d",
      progress:
        summary.totalTargetUsers > 0
          ? (summary.resultsWithLocation / summary.totalTargetUsers) * 100
          : 0,
    },
  ];

  return (
    <Sidebar>
      <div className="simulation-dashboard">
        <Toaster position="top-right" reverseOrder={false} />

        <section className="simulation-hero">
          <div className="simulation-hero__copy">
            <div className="simulation-kicker">
              <i className="fas fa-shield-halved"></i>
              Campaign Simulation Report
            </div>
            <h1 className="simulation-title">Simulation Results Dashboard</h1>
            <p className="simulation-subtitle">
              Review how the campaign performed, monitor open and click
              behavior, and inspect every tracked interaction in a detailed,
              responsive table.
            </p>
          </div>

          <div className="simulation-toolbar">
            <select
              className="simulation-select"
              value={selectedCampaignId}
              onChange={handleCampaignChange}
              disabled={loadingCampaigns}
            >
              <option value="">Select a campaign</option>
              {campaigns.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title || item.name || "Untitled Campaign"}
                </option>
              ))}
            </select>

            <button
              className="simulation-btn"
              type="button"
              onClick={handleRefresh}
              disabled={!selectedCampaignId || loadingResults}
            >
              <i className="fas fa-rotate-right"></i>
              {loadingResults ? "Refreshing..." : "Refresh"}
            </button>

            <button
              className="simulation-btn simulation-btn-danger"
              type="button"
              onClick={handleStopCampaign}
              disabled={!selectedCampaignId || deletingCampaign}
            >
              <i className="fas fa-ban"></i>
              {deletingCampaign ? "Stopping..." : "Stop Campaign"}
            </button>
          </div>
        </section>

        <section className="simulation-campaign-meta">
          <div className="simulation-meta-card">
            <span>Campaign</span>
            <strong>{campaign?.title || "-"}</strong>
          </div>
          <div className="simulation-meta-card">
            <span>Description</span>
            <strong>
              {campaign?.description || "No description provided"}
            </strong>
          </div>
          <div className="simulation-meta-card">
            <span>Launch Date</span>
            <strong>
              {formatDate(campaign?.launchDate || campaign?.createdAt)}
            </strong>
          </div>
          <div className="simulation-meta-card">
            <span>Email Template</span>
            <strong>{campaign?.emailTemplateId?.templateName || "-"}</strong>
          </div>
        </section>

        <section className="simulation-stats-grid">
          {statCards.map((card) => (
            <article
              key={card.label}
              className="simulation-stat-card"
              style={{ "--accent": card.accent, "--progress": card.progress }}
            >
              <div className="simulation-stat-top">
                <div className="simulation-stat-ring">
                  <div className="simulation-stat-ring__inner">
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                </div>

                <div className="simulation-stat-copy">
                  <span className="simulation-stat-label">{card.label}</span>
                  <p className="simulation-stat-value">{card.value}</p>
                </div>
              </div>

              <div className="simulation-stat-note">
                <i className="fas fa-circle-info"></i>
                <span>{card.note}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="simulation-panel">
          <div className="simulation-panel__head">
            <div>
              <h2 className="simulation-panel__title">Interaction Details</h2>
              <p className="simulation-panel__subtitle">
                Every targeted user and their current simulation state.
              </p>
            </div>
            <div className="simulation-cell-muted">
              {loadingResults
                ? "Loading data..."
                : `${results.length} row(s) shown`}
            </div>
          </div>

          <div className="simulation-table-wrap">
            <table className="table simulation-table align-middle">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Email Opened</th>
                  <th>Opened At</th>
                  <th>Link Clicked</th>
                  <th>Clicked At</th>
                  <th>Interaction Time</th>
                  <th>IP Address</th>
                  <th>Device Info</th>
                  <th>Operating System</th>
                  <th>Device Type</th>
                  <th>Browser</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="13">
                      <div className="simulation-empty">
                        <i className="fas fa-inbox"></i>
                        <h4>No simulation data found</h4>
                        <p>
                          {selectedCampaignId
                            ? "No interactions have been recorded yet for this campaign."
                            : "Choose a campaign to view its simulation summary."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((row) => {
                    const statusClass = row.linkClicked
                      ? "clicked"
                      : row.emailOpened
                        ? "opened"
                        : "pending";
                    const statusLabel = row.linkClicked
                      ? "Clicked"
                      : row.emailOpened
                        ? "Opened"
                        : "Pending";

                    return (
                      <tr key={row.id}>
                        <td className="simulation-user-cell">
                          <strong>{row.userName}</strong>
                          <span>{row.userEmail}</span>
                        </td>
                        <td>
                          <span
                            className={`simulation-status-badge ${statusClass}`}
                          >
                            <i className="fas fa-circle"></i>
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`simulation-flag-badge ${row.emailOpened ? "true opened" : "false"}`}
                          >
                            {row.emailOpened ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="simulation-datetime">
                          {formatDate(row.emailOpenedAt)}
                        </td>
                        <td>
                          <span
                            className={`simulation-flag-badge ${row.linkClicked ? "true clicked" : "false"}`}
                          >
                            {row.linkClicked ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="simulation-datetime">
                          {formatDate(row.clickedAt)}
                        </td>
                        <td className="simulation-datetime">
                          {formatDate(row.interactionTime)}
                        </td>
                        <td className="simulation-cell-muted">
                          {row.ipAddress}
                        </td>
                        <td className="simulation-cell-muted">
                          {row.deviceInfo}
                        </td>
                        <td className="simulation-cell-muted">
                          {row.operatingSystem}
                        </td>
                        <td>
                          <span
                            className={`simulation-flag-badge ${row.deviceType === "Unknown" ? "false" : "true opened"}`}
                          >
                            {row.deviceType || "Unknown"}
                          </span>
                        </td>
                        <td className="simulation-cell-muted">
                          {row.browser || "-"}
                        </td>
                        <td className="simulation-cell-muted">
                          {row.location?.area ||
                          row.location?.region ||
                          row.location?.country
                            ? [
                                row.location?.area,
                                row.location?.region,
                                row.location?.country,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Sidebar>
  );
}

export default SimulationDashboard;
