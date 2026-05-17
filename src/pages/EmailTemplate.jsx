import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./EmailTemplate.css";

const API_BASE = "https://safe-click-backend.vercel.app/api/email-templates";

const initialForm = {
  templateName: "",
  subject: "",
  body: "",
};

function EmailTemplate() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const token = localStorage.getItem("token");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/getAllTemplates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        setTemplates(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Failed to load templates");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return templates;

    return templates.filter((template) => {
      const templateName = template.templateName?.toLowerCase() || "";
      const subject = template.subject?.toLowerCase() || "";
      const body = template.body?.toLowerCase() || "";
      return (
        templateName.includes(query) ||
        subject.includes(query) ||
        body.includes(query)
      );
    });
  }, [searchTerm, templates]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setSelectedTemplate(null);
    setFormData(initialForm);
    setModalMode("create");
  };

  const openViewModal = (template) => {
    setSelectedTemplate(template);
    setModalMode("view");
  };

  const openEditModal = (template) => {
    setSelectedTemplate(template);
    setFormData({
      templateName: template.templateName || "",
      subject: template.subject || "",
      body: template.body || "",
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedTemplate(null);
    setFormData(initialForm);
  };

  const validateForm = () => {
    if (!formData.templateName.trim()) {
      toast.error("Template name is required");
      return false;
    }
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return false;
    }
    if (!formData.body.trim()) {
      toast.error("Body is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const isEdit = modalMode === "edit" && selectedTemplate?._id;
      const response = await axios[isEdit ? "put" : "post"](
        isEdit
          ? `${API_BASE}/updateTemplate/${selectedTemplate._id}`
          : `${API_BASE}/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success) {
        toast.success(
          isEdit
            ? "Template updated successfully"
            : "Template created successfully",
        );
        closeModal();
        fetchTemplates();
      } else {
        toast.error(
          response.data?.message ||
            `Failed to ${isEdit ? "update" : "create"} template`,
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${modalMode === "edit" ? "update" : "create"} template`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    const confirmed = window.confirm(
      `Delete "${template.templateName}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(template._id);
    try {
      const response = await axios.delete(
        `${API_BASE}/deleteTemplate/${template._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        toast.error(response.data?.message || "Failed to delete template");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  };

  const stripHtml = (value) =>
    value
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "-";

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

  return (
    <Sidebar>
      <div className="email-template-page">
        <Toaster position="top-right" reverseOrder={false} />

        <div className="email-template-header">
          <div>
            <h1 className="email-template-title">
              <i className="fas fa-envelope-open-text"></i>
              Email Templates
            </h1>
            <p className="email-template-subtitle">
              Manage reusable email content for alerts, campaigns, and system
              notifications.
            </p>
          </div>

          <div className="email-template-header-actions">
            <button className="btn-soft" onClick={fetchTemplates} type="button">
              <i className="fas fa-rotate-right"></i>
              Refresh
            </button>
            <button
              className="btn-primary-soft"
              type="button"
              onClick={openCreateModal}
            >
              <i className="fas fa-plus"></i>
              Add New Template
            </button>
          </div>
        </div>

        <div className="email-template-toolbar">
          <div className="email-search-wrap">
            <i className="fas fa-magnifying-glass"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by template name, subject, or body..."
              className="email-search-input"
            />
          </div>
          <div className="email-template-count">
            {loading ? "Loading..." : `${filteredTemplates.length} template(s)`}
          </div>
        </div>

        <div className="email-table-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0 email-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Subject</th>
                  <th>Body Preview</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="email-empty-state">
                        Loading templates...
                      </div>
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="email-empty-state">
                        <i className="fas fa-inbox"></i>
                        <h4>No templates found</h4>
                        <p>
                          {searchTerm
                            ? "Try a different search term."
                            : "Create your first template to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => (
                    <tr key={template._id}>
                      <td>
                        <div className="email-cell-title">
                          {template.templateName}
                        </div>
                      </td>
                      <td>
                        <div className="email-cell-subject">
                          {template.subject}
                        </div>
                      </td>
                      <td>
                        <div
                          className="email-body-preview"
                          title={template.body}
                        >
                          {stripHtml(template.body).slice(0, 120) || "-"}
                          {stripHtml(template.body).length > 120 ? "..." : ""}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`email-status-badge ${template.isActive ? "active" : "inactive"}`}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{formatDate(template.createdAt)}</td>
                      <td>
                        <div className="email-row-actions">
                      
                          <button
                            type="button"
                            className="email-action-btn edit"
                            onClick={() => openEditModal(template)}
                          >
                            <i className="fas fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            className="email-action-btn delete"
                            onClick={() => handleDelete(template)}
                            disabled={deletingId === template._id}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalMode && (
          <div className="email-modal-backdrop" onClick={closeModal}>
            <div
              className="email-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="email-modal-header">
                <div>
                  <h3>
                    {modalMode === "view"
                      ? "Template Details"
                      : modalMode === "edit"
                        ? "Edit Template"
                        : "Add New Template"}
                  </h3>
                  <p>
                    {modalMode === "view"
                      ? "Review the stored template content."
                      : "Create a reusable email template with HTML or plain text."}
                  </p>
                </div>
                <button
                  type="button"
                  className="email-modal-close"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <i className="fas fa-xmark"></i>
                </button>
              </div>

              {modalMode === "view" ? (
                <div className="template-view-grid">
                  <div className="field-group">
                    <span>Template Name</span>
                    <div className="template-view-value">
                      {selectedTemplate?.templateName || "-"}
                    </div>
                  </div>
                  <div className="field-group">
                    <span>Subject</span>
                    <div className="template-view-value">
                      {selectedTemplate?.subject || "-"}
                    </div>
                  </div>
                  <div className="field-group template-view-full">
                    <span>Body</span>
                    <pre className="template-view-body">
                      {selectedTemplate?.body || "-"}
                    </pre>
                  </div>
                  <div className="email-form-actions">
                    <button
                      type="button"
                      className="btn-soft"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn-primary-soft"
                      onClick={() => openEditModal(selectedTemplate)}
                    >
                      <i className="fas fa-pen-to-square"></i>
                      Edit Template
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="email-template-form">
                  <div className="form-grid">
                    <label className="field-group">
                      <span>Template Name</span>
                      <input
                        type="text"
                        name="templateName"
                        value={formData.templateName}
                        onChange={handleChange}
                        placeholder="e.g. OTP Verification"
                      />
                    </label>

                    <label className="field-group">
                      <span>Subject</span>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. Your OTP for Safe Click"
                      />
                    </label>
                  </div>

                  <label className="field-group">
                    <span>Body</span>
                    <textarea
                      name="body"
                      value={formData.body}
                      onChange={handleChange}
                      rows="9"
                      placeholder="Write HTML or plain text here..."
                    />
                  </label>

                  <div className="email-form-actions">
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
                      {saving
                        ? modalMode === "edit"
                          ? "Updating..."
                          : "Saving..."
                        : modalMode === "edit"
                          ? "Update Template"
                          : "Save Template"}
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

export default EmailTemplate;
