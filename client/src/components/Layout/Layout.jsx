import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useSidebar } from '../../context/SidebarContext';
import './Layout.css';

const Layout = ({ children }) => {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <div className="layout">
            <div className={`layout-content ${isCollapsed ? "sidebar-collapsed" : ""}`}>
                {/* Sidebar Toggle Button */}
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

                {/* Sidebar */}
                <Sidebar isCollapsed={isCollapsed} />

                {/* Main Content */}
                <div className="main-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
