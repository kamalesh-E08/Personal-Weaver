import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import "./Layout.css";

const Layout = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <div className="layout">
            <div className={`layout-content ${isCollapsed ? "sidebar-collapsed" : ""}`}>
                {/* External toggle only when collapsed (arrow stays where it is now) */}
                {isCollapsed && (
                    <button
                        className="sidebar-toggle-external"
                        onClick={toggleSidebar}
                    >
                        <div className="hamburger-icon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                )}

                {/* Sidebar */}
                <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

                {/* Main Content */}
                <div className="main-content">
                    {children}
                </div>
            </div>
        </div>
  );
};

export default Layout;
