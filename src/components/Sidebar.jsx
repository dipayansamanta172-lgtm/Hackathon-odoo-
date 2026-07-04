import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Users, 
  CalendarDays, 
  Wallet, 
  User, 
  LayoutGrid, 
  LogOut 
} from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar = ({ userRole = "employee", employeeData }) => {
  const navigate = useNavigate();

  const links = userRole === "admin"
    ? [
        { path: "/admin/dashboard", label: "Dashboard", icon: Home },
        { path: "/admin/attendance", label: "Attendance", icon: CheckSquare },
        { path: "/admin/employees", label: "Employees", icon: Users },
        { path: "/admin/leaves", label: "Leaves Approval", icon: CalendarDays },
        { path: "/admin/payroll", label: "Payroll Run", icon: Wallet },
        { path: "/admin/profile", label: "Profile", icon: User }
      ]
    : [
        { path: "/employee/dashboard", label: "Dashboard", icon: Home },
        { path: "/employee/attendance", label: "Attendance", icon: CheckSquare },
        { path: "/employee/leave", label: "Leaves", icon: CalendarDays },
        { path: "/employee/salary", label: "Salary slips", icon: Wallet },
        { path: "/employee/profile", label: "My Profile", icon: User }
      ];

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore API fail on client logout cleanup
    }
    localStorage.removeItem('hrms_token');
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate(userRole === 'admin' ? '/admin/profile' : '/employee/profile');
  };

  const brandName = userRole === "admin" ? "HRMS Global" : "Nexus HR";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topSection}>
        <Link to={links[0].path} className={styles.brand}>
          <div className={styles.brandIcon}>
            <LayoutGrid size={24} strokeWidth={2.5} />
          </div>
          <span>{brandName}</span>
        </Link>

        <nav className={styles.navList}>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className={styles.bottomSection}>
        {employeeData && (
          <div className={styles.profileCard} onClick={handleProfileClick}>
            <img src={employeeData.photo} alt={employeeData.name} className={styles.avatar} />
            <div className={styles.meta}>
              <span className={styles.name}>{employeeData.name}</span>
              <span className={styles.role}>
                {userRole === 'admin' ? 'HR Administrator' : employeeData.role}
              </span>
            </div>
          </div>
        )}

        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
