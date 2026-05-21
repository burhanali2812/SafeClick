import React, { useState } from "react";
import "./Sidebar.css";
import { useEffect } from "react";
import axios from "axios";
import { href, useNavigate } from "react-router-dom";
function Sidebar({ children }) {
  const [lengthOfPendingLeaves, setLengthOfPendingLeaves] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = token ? JSON.parse(atob(token.split(".")[1])).role : null;

  const [isOpen, setIsOpen] = useState(false);
  //   useEffect(() => {
  //     const fetchPendingLeaves = async () => {
  //       try {
  //         const res = await axios.get(
  //           `https://ec-backend-phi.vercel.app/api/leave/lengthOfPendingLeaves`,
  //           {
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //             },
  //           },
  //         );
  //         const data = res?.data || {};
  //         if (data.success) {
  //           setLengthOfPendingLeaves(data.pendingLeaves);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching pending leaves:", error);
  //       }
  //     };

  //     if (userRole === "admin" && token) {
  //       fetchPendingLeaves();
  //     }
  //   }, [userRole, token]);

  const handlelogOut = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const menu = {
    admin: [
    {
      title: "Dashboard",
      icon: "fa-solid fa-gauge",
      href: "/dashboard",
    },

    {
      title: "Users",
      icon: "fa-solid fa-users",
      href: "/users",
    },

    {
      title: "Email Templates",
      icon: "fa-solid fa-envelope",
      href: "/email-templates",
    },

    {
      title: "Campaigns",
      icon: "fa-solid fa-bullhorn",
      href: "/campaigns",
    },

    {
      title: "Simulation Results",
      icon: "fa-solid fa-chart-column",
      href: "/simulation-results",
    },

    {
      title: "Quizzes",
      icon: "fa-solid fa-question-circle",
      href: "/quizzes",
    },

 
      {
          title: "Logout",
          icon : "fa-solid fa-right-from-bracket",
        }
  ],
      user: [
        {
          title: "Dashboard",
          icon: "fa-solid fa-gauge",
          href: "/user-dashboard",
        },
        {
          title: "Solve Quiz",
          icon: "fa-solid fa-pen-to-square",
          href: "/solve-quiz",
        },
        {
          title: "Logout",
          icon : "fa-solid fa-right-from-bracket",
        }
      ],
  };
  const menuItems = userRole === "admin" ? menu.admin : menu.user;
  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="sb-layout">
      <header className="sb-mobile-topbar">
        <div className="sb-brand-wrap">
          <i className="fas fa-shield-alt"></i>
        </div>

        <div className="sb-topbar-center">
          <h5 className="mt-0 fw-semibold sb-mobile-title">Safe Click</h5>
        </div>

        <div className="sb-mobile-actions">
          <button
            className="sb-hamburger"
            onClick={toggleMenu}
            aria-label="Toggle sidebar menu"
            aria-expanded={isOpen}
            type="button"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </header>

      <aside className="sb-desktop-sidebar">
        <div className="sb-logo-container">
          <i className="fas fa-shield-alt"></i>
        </div>
        <div className="sb-header">
          <h1 className="mb-1 text-dark text-center fw-bold">Safe Click</h1>
        </div>

        <nav className="sb-nav">
          {menuItems
            .filter((item) => !item.onClick)
            .map((item) => (
              <a
                key={item.title}
                href={item.href || "#"}
                className="sb-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) {
                    item.onClick();
                    return;
                  }
                  if (item.href) {
                    navigate(item.href);
                  }
                }}
              >
                <i className={`fas ${item.icon}`}></i>
                <span className="sb-link-text">{item.title}</span>
              </a>
            ))}
        </nav>

        <div className="sb-footer">
          <button
            className="sb-logout-btn"
            type="button"
            onClick={handlelogOut}
          >
            <i className="fas fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </aside>

      <aside className={`sb-mobile-panel ${isOpen ? "open" : ""}`}>
        <div className="sb-mobile-panel-head">
          <h6 className="mb-0">Menu</h6>
          <button
            className="sb-close"
            onClick={closeMenu}
            aria-label="Close sidebar menu"
            type="button"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        <nav className="sb-nav sb-mobile-nav">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.href || "#"}
              className="sb-link"
              onClick={(e) => {
                e.preventDefault();
                if (item.onClick) {
                  item.onClick();
                  closeMenu();
                  return;
                }
                if (item.title === "Logout") {
                  item.onClick = handlelogOut;
                  item.onClick();
                  closeMenu();
                  return;
                }
                if (item.href) {
                  navigate(item.href);
                }
                closeMenu();
              }}
            >
              <i className={`fas ${item.icon}`}></i>
              <span className="sb-link-text">{item.title}</span>
            </a>
          ))}
        </nav>
      </aside>

      {isOpen && <div className="sb-overlay" onClick={closeMenu}></div>}

      <main className="sb-main-content">{children}</main>
    </div>
  );
}

export default Sidebar;
