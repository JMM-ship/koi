"use client";

import { FiSearch, FiBell, FiMoon, FiSun } from "react-icons/fi";
import { useState } from "react";

const TopBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className="dashboard-topbar">
      <div className="topbar-left">
        <h1 className="page-title">Dashboard</h1>
        <div className="breadcrumb">
          <span className="breadcrumb-icon">🏠</span>
          <span className="breadcrumb-text">Adam's Team</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">FOLDER</span>
          <span className="breadcrumb-arrow">▼</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Type to search..." 
            className="search-input"
          />
        </div>

        <button className="topbar-icon-btn">
          <FiBell className="icon" />
        </button>

        <button 
          className="topbar-icon-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <FiSun className="icon" /> : <FiMoon className="icon" />}
        </button>

        <button className="premium-btn">
          <span className="premium-icon">⭐</span>
          <span>PREMIUM</span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;