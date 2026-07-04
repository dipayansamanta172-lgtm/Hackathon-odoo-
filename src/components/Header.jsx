import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Bell } from 'lucide-react';
import styles from './Header.module.css';

export const Header = ({ title = "HRMS Global", userPhoto, userRole = "employee" }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Notifications — populated from backend
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (userRole === "admin") {
      navigate('/admin/profile');
    } else {
      navigate('/employee/profile');
    }
  };

  const handleToggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const dashboardPath = userRole === "admin" ? "/admin/dashboard" : "/employee/dashboard";

  return (
    <header className={styles.header}>
      <Link to={dashboardPath} className={styles.brand}>
        <div className={styles.logoIcon}>
          <LayoutGrid size={24} strokeWidth={2.5} />
        </div>
        <span className={styles.brandName}>{title}</span>
      </Link>
      
      <div className={styles.actions} ref={dropdownRef}>
        <button 
          type="button" 
          className={styles.notificationBtn} 
          onClick={handleToggleDropdown}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className={styles.badge}></span>}
        </button>

        {dropdownOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>Notifications</span>
              {unreadCount > 0 && (
                <button type="button" className={styles.markAllBtn} onClick={handleMarkAllRead}>
                  Mark all as read
                </button>
              )}
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.emptyState}>No notifications available.</div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <div className={styles.itemHeaderRow}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      {!n.read && <span className={styles.unreadDot}></span>}
                    </div>
                    <p className={styles.itemDesc}>{n.desc}</p>
                    <span className={styles.itemTime}>{n.time}</span>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className={styles.dropdownFooter}>
                <button type="button" className={styles.clearAllBtn} onClick={handleClearAll}>
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
        
        {userPhoto ? (
          <img 
            src={userPhoto} 
            alt="Profile" 
            className={styles.profileAvatar}
            onClick={handleAvatarClick}
          />
        ) : (
          <div 
            className={styles.profileAvatar}
            onClick={handleAvatarClick}
            style={{ 
              backgroundColor: 'var(--primary-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary-color)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            HR
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
