import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./CampaignTemplate.css";

const API_BASE = "https://safe-click-backend.vercel.app/api/campaigns";
const TEMPLATE_API =
  "https://safe-click-backend.vercel.app/api/email-templates";
const USER_API = "https://safe-click-backend.vercel.app/api/users";

const initialForm = {
  name: "",
  description: "",
  emailTemplateId: "",
  targetedUsers: [],
};

function CampaignTemplate() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/campaigns`, {
        headers: authHeaders,
      });

      if (response.data?.success) {
        setCampaigns(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Failed to load campaigns");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await axios.get(`${TEMPLATE_API}/getAllTemplates`, {
        headers: authHeaders,
      });

      if (response.data?.success) {
        setEmailTemplates(response.data.data || []);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load email templates",
      );
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${USER_API}?limit=1000`, {
        headers: authHeaders,
      });

      if (response.data?.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    fetchCampaigns();
    fetchEmailTemplates();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCampaigns = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return campaigns;

    return campaigns.filter((campaign) => {
      const name =
        campaign.title?.toLowerCase() || campaign.name?.toLowerCase() || "";
      const description = campaign.description?.toLowerCase() || "";
      const templateName =
        campaign.emailTemplateId?.templateName?.toLowerCase() || "";
      return (
        name.includes(query) ||
        description.includes(query) ||
        templateName.includes(query)
      );
    });
  }, [campaigns, searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (e) => {
    const values = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setFormData((prev) => ({ ...prev, targetedUsers: values }));
  };

  const toggleTargetUser = (userId) => {
    setFormData((prev) => {
      const exists = prev.targetedUsers.includes(userId);
      return {
        ...prev,
        targetedUsers: exists
          ? prev.targetedUsers.filter((id) => id !== userId)
          : [...prev.targetedUsers, userId],
      };
    });
  };

  const openCreateModal = () => {
    setSelectedCampaign(null);
    setFormData(initialForm);
    setModalMode("create");
  };

  const openViewModal = (campaign) => {
    setSelectedCampaign(campaign);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCampaign(null);
    setFormData(initialForm);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      return false;
    }
    if (!formData.emailTemplateId) {
      toast.error("Please choose an email template");
      return false;
    }
    if (!formData.targetedUsers.length) {
      toast.error("Please select at least one targeted user");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE}/create-campaign`,
        {
          ...formData,
          targetedUsers: formData.targetedUsers,
        },
        {
          headers: authHeaders,
        },
      );

      if (response.data?.success) {
        toast.success("Campaign created successfully");
        closeModal();
        navigate(`/simulation-results/${response.data.data._id}`);
      } else {
        toast.error(response.data?.message || "Failed to create campaign");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaign) => {
    const confirmed = window.confirm(
      `Delete campaign \"${campaign.title || campaign.name || "Campaign"}\"?`,
    );
    if (!confirmed) return;

    setDeletingId(campaign._id);
    try {
      const response = await axios.delete(
        `${API_BASE}/campaigns/${campaign._id}`,
        {
          headers: authHeaders,
        },
      );

      if (response.data?.success) {
        toast.success("Campaign deleted successfully");
        fetchCampaigns();
      } else {
        toast.error(response.data?.message || "Failed to delete campaign");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

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

  const getUserName = (id) => {
    const user = users.find((item) => item._id === id);
    return user ? `${user.name} (${user.email})` : id;
  };

  const getSelectedTemplateName = (id) => {
    const template = emailTemplates.find((item) => item._id === id);
    return (
      template?.templateName ||
      selectedCampaign?.emailTemplateId?.templateName ||
      "-"
    );
  };

  return (
    <Sidebar>
      <div className="campaign-page">
        <Toaster position="top-right" reverseOrder={false} />

        <div className="campaign-header">
          <div>
            <h1 className="campaign-title">
              <i className="fas fa-bullhorn"></i>
              Campaign Templates
            </h1>
            <p className="campaign-subtitle">
              Create and manage phishing simulation campaigns with targeted
              email templates.
            </p>
          </div>

          <div className="campaign-actions">
            <button className="btn-soft" type="button" onClick={fetchCampaigns}>
              <i className="fas fa-rotate-right"></i>
              Refresh
            </button>
            <button
              className="btn-primary-soft"
              type="button"
              onClick={openCreateModal}
            >
              <i className="fas fa-plus"></i>
              Add New Campaign
            </button>
          </div>
        </div>

        <div className="campaign-toolbar">
          <div className="campaign-search-wrap">
            <i className="fas fa-magnifying-glass"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by campaign name, description, or email template..."
              className="campaign-search-input"
            />
          </div>
          <div className="campaign-count">
            {loading ? "Loading..." : `${filteredCampaigns.length} campaign(s)`}
          </div>
        </div>

        <div className="campaign-table-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0 campaign-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Description</th>
                  <th>Email Template</th>
                  <th>Target Users</th>
                  <th>Launch Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="campaign-empty-state">
                        Loading campaigns...
                      </div>
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="campaign-empty-state">
                        <i className="fas fa-inbox"></i>
                        <h4>No campaigns found</h4>
                        <p>
                          {searchTerm
                            ? "Try a different search term."
                            : "Create your first campaign to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const campaignName = campaign.title || campaign.name || "-";
                    const templateName =
                      campaign.emailTemplateId?.templateName || "-";
                    const targetedUsers = Array.isArray(campaign.targetUsers)
                      ? campaign.targetUsers
                      : Array.isArray(campaign.targetedUsers)
                        ? campaign.targetedUsers
                        : [];

                    return (
                      <tr key={campaign._id}>
                        <td>
                          <div className="campaign-cell-title">
                            {campaignName}
                          </div>
                        </td>
                        <td>
                          <div className="campaign-cell-desc">
                            {campaign.description || "-"}
                          </div>
                        </td>
                        <td>
                          <div className="campaign-cell-template">
                            {templateName}
                          </div>
                        </td>
                        <td>
                          <div className="campaign-target-users">
                            <span className="campaign-count-pill">
                              {targetedUsers.length} user(s)
                            </span>
                            <div className="campaign-target-preview">
                              {targetedUsers.slice(0, 2).map((id) => (
                                <span key={id}>{getUserName(id)}</span>
                              ))}
                              {targetedUsers.length > 2 ? (
                                <span>+{targetedUsers.length - 2} more</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          {formatDate(
                            campaign.launchDate || campaign.createdAt,
                          )}
                        </td>
                        <td>
                          <div className="campaign-row-actions">
                            <button
                              type="button"
                              className="campaign-action-btn view"
                              onClick={() => openViewModal(campaign)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              type="button"
                              className="campaign-action-btn delete"
                              onClick={() => handleDelete(campaign)}
                              disabled={deletingId === campaign._id}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalMode && (
          <div className="campaign-modal-backdrop" onClick={closeModal}>
            <div
              className="campaign-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="campaign-modal-header">
                <div>
                  <h3>
                    {modalMode === "view"
                      ? "Campaign Details"
                      : "Add New Campaign"}
                  </h3>
                  <p>
                    {modalMode === "view"
                      ? "Review campaign information and targeting."
                      : "Create a campaign with a template and targeted users."}
                  </p>
                </div>
                <button
                  type="button"
                  className="campaign-modal-close"
                  onClick={closeModal}
                >
                  <i className="fas fa-xmark"></i>
                </button>
              </div>

              {modalMode === "view" ? (
                <div className="campaign-view-grid">
                  <div className="field-group">
                    <span>Campaign Name</span>
                    <div className="campaign-view-value">
                      {selectedCampaign?.title || selectedCampaign?.name || "-"}
                    </div>
                  </div>
                  <div className="field-group">
                    <span>Email Template</span>
                    <div className="campaign-view-value">
                      {selectedCampaign?.emailTemplateId?.templateName || "-"}
                    </div>
                  </div>
                  <div className="field-group campaign-view-full">
                    <span>Description</span>
                    <div className="campaign-view-value campaign-view-long">
                      {selectedCampaign?.description || "-"}
                    </div>
                  </div>
                  <div className="field-group campaign-view-full">
                    <span>Targeted Users</span>
                    <div className="campaign-view-value campaign-view-long">
                      {(selectedCampaign?.targetUsers || []).map((id) => (
                        <span key={id} className="campaign-user-chip">
                          {getUserName(id)}
                        </span>
                      ))}
                      {!selectedCampaign?.targetUsers?.length && "-"}
                    </div>
                  </div>
                  <div className="campaign-form-actions">
                    <button
                      type="button"
                      className="btn-soft"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="campaign-form">
                  <div className="form-grid">
                    <label className="field-group">
                      <span>Campaign Name</span>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Security Awareness Spring 2026"
                      />
                    </label>

                    <label className="field-group">
                      <span>Email Template</span>
                      <select
                        name="emailTemplateId"
                        value={formData.emailTemplateId}
                        onChange={handleChange}
                      >
                        <option value="">Choose a template</option>
                        {emailTemplates.map((template) => (
                          <option key={template._id} value={template._id}>
                            {template.templateName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="field-group">
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Describe this campaign and its purpose..."
                    />
                  </label>

                  <label className="field-group">
                    <span>Targeted Users</span>
                    <div className="campaign-user-btn-grid">
                      {users.length === 0 ? (
                        <div className="campaign-user-empty">
                          No users available.
                        </div>
                      ) : (
                        users.map((user) => {
                          const isSelected = formData.targetedUsers.includes(
                            user._id,
                          );

                          return (
                            <button
                              key={user._id}
                              type="button"
                              className={`btn ${isSelected ? "btn-primary" : "btn-outline-dark"} campaign-user-btn`}
                              onClick={() => toggleTargetUser(user._id)}
                            >
                              <span className="campaign-user-btn-name">
                                {user.name}
                              </span>
                              <span className="campaign-user-btn-email">
                                {user.email}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <small className="field-help">
                      Click users to toggle selection.
                    </small>
                  </label>

                  <div className="campaign-form-actions">
                    <button
                      type="button"
                      className="btn-soft"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-soft"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Create Campaign"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default CampaignTemplate;
