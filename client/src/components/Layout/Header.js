import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>🏠 Active Rooms Detection</h1>
        <div className="user-info">
          <span className="user-welcome">
            Welcome, {user.username}
            {user.role === 'admin' && (
              <span className="admin-badge">👑 Admin</span>
            )}
          </span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;