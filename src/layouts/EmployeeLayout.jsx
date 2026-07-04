import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import { api } from '../services/api';
import styles from './EmployeeLayout.module.css';

export const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getEmployeeProfile();
        if (data) {
          if (data.user_role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            setProfile(data);
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Failed to load profile context for layout:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // Dynamically map route paths to header titles
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.includes('/employee/attendance')) return "Attendance";
    if (path.includes('/employee/leave')) return "Leaves";
    if (path.includes('/employee/salary')) return "Salary";
    if (path.includes('/employee/profile')) return "Profile";
    return "Nexus HR"; // Default for dashboard
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontWeight: 600, 
        color: 'var(--text-muted)' 
      }}>
        Loading Workspace...
      </div>
    );
  }

  // Fallback defaults if profile is null but somehow bypasses redirect
  const employeeData = {
    name: profile?.name || 'Employee',
    photo: profile?.photo || '',
    role: profile?.role || 'Staff Member'
  };

  return (
    <div className={styles.layout}>
      <Sidebar userRole="employee" employeeData={employeeData} />
      
      <div className={styles.contentWrapper}>
        <Header 
          title={getHeaderTitle()} 
          userPhoto={employeeData.photo} 
          userRole="employee" 
        />
        
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
      
      <BottomNav userRole="employee" />
    </div>
  );
};

export default EmployeeLayout;
