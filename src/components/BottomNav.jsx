import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CheckSquare, Users, CalendarDays, Plus } from 'lucide-react';
import styles from './BottomNav.module.css';

export const BottomNav = ({ userRole = "employee", onFabClick }) => {
  const links = userRole === "admin" 
    ? [
        { path: "/admin/dashboard", label: "Home", icon: Home },
        { path: "/admin/attendance", label: "Attend", icon: CheckSquare },
        { path: "/admin/employees", label: "Staff", icon: Users },
        { path: "/admin/leaves", label: "Leaves", icon: CalendarDays }
      ]
    : [
        { path: "/employee/dashboard", label: "Home", icon: Home },
        { path: "/employee/attendance", label: "Attend", icon: CheckSquare },
        { path: "/employee/profile", label: "Profile", icon: Users }, // Staff links to Profile on employee side
        { path: "/employee/leave", label: "Leaves", icon: CalendarDays }
      ];

  return (
    <nav className={styles.bottomNav}>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink 
            key={link.path}
            to={link.path}
            className={({ isActive }) => 
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <div className={styles.iconWrapper}>
              <Icon size={20} />
            </div>
            <span>{link.label}</span>
          </NavLink>
        );
      })}

      {userRole === "admin" && onFabClick && (
        <button 
          className={styles.addButton} 
          onClick={onFabClick}
          aria-label="Add Employee"
        >
          <Plus size={24} />
        </button>
      )}
    </nav>
  );
};

export default BottomNav;
