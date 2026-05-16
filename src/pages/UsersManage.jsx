import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UsersManage.css";
import Sidebar from "../components/Sidebar";
import { ToastBar, toast } from "react-hot-toast";

function UsersManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch users
  const fetchUsers = async (page = 1) => {
    setLoadingUsers(true);
  
    try {
      const params = {
        page,
        limit: 10,
        role: filterRole || undefined,
        accountStatus: filterStatus || undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key],
      );

      const response = await axios.get("http://localhost:5000/api/users", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUsers(response.data.users);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.pages);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [filterRole, filterStatus]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    toast.dismiss();
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
 
    return true;
  };

  // Handle add user
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        {
          name: formData.name,
          email: formData.email,
          password: "", // Set empty password to trigger default password and pending status    
         
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setShowModal(false);
        setFormData({ name: "", email: "" });
        fetchUsers(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchUsers(currentPage);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10b981";
      case "suspended":
        return "#f59e0b";
      case "blocked":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // Get risk level color
  const getRiskColor = (risk) => {
    switch (risk) {
      case "low":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "high":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <Sidebar>
           <div className="users-manage-container">
      <div className="users-header">
        <div className="users-title-section">
          <h1 className="users-title">
            <i className="fas fa-users"></i>
            User Management
          </h1>
          <p className="users-subtitle">
            Manage all system users and their security profiles
          </p>
        </div>
        <button className="btn-add-user" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i>
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <div className="filter-group">
          <label htmlFor="filterRole">Role</label>
          <select
            id="filterRole"
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filterStatus">Status</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="searchTerm">Search</label>
          <input
            id="searchTerm"
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

    

      {/* Users Table */}
      <div className="users-table-wrapper">
        {loadingUsers ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No users found</h3>
            <p>Add your first user to get started</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Security Score</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="user-row">
                  <td className="user-name">
                    <div className="user-avatar">
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <span>{user.name}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge badge-role">
                      {user.role === "admin" ? (
                        <i className="fas fa-crown"></i>
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{ width: `${user.securityScore}%` }}
                      ></div>
                      <span className="score-text">
                        {user.securityScore}/100
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: getRiskColor(user.riskLevel) }}
                    >
                      {user.riskLevel}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getStatusColor(user.accountStatus),
                      }}
                    >
                      {user.accountStatus}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" title="Edit user">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        title="Delete user"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loadingUsers && users.length > 0 && (
        <div className="pagination">
          <button
            className="btn-pagination"
            onClick={() => fetchUsers(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i>
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-pagination"
            onClick={() => fetchUsers(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button
                className="btn-close"
                onClick={() => !submitting && setShowModal(false)}
                disabled={submitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="modal-form">
              

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </Sidebar>
  );
}

export default UsersManage;
