import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, CalendarCheck2, Wallet, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import RecentActivityList from '../components/RecentActivityList';
import { api } from '../services/api';
import styles from './EmployeeDashboard.module.css';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [s, a] = await Promise.all([
          api.getEmployeeStats(),
          api.getEmployeeActivity(),
        ]);
        setStats(s || null);
        setActivities(Array.isArray(a) ? a : []);
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setStats(null);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const handleActivityClick = (act) => {
    if (act.type === 'payroll') {
      navigate('/employee/salary');
    } else if (act.type === 'leave_approve') {
      navigate('/employee/leave');
    } else {
      navigate('/employee/attendance');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Banner Greeting */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeLeft}>
          <h2 className={styles.welcomeTitle}>Good morning</h2>
          <p className={styles.welcomeSubtitle}>Here's your work summary for today.</p>
        </div>
      </div>

      {/* KPI stats metrics row */}
      <div className={styles.statsRow}>
        <StatCard 
          icon={Calendar}
          value={stats?.presentDays ?? '--'}
          label="Present Days"
          iconVariant="success"
        />
        <StatCard 
          icon={CalendarCheck2}
          value={stats?.leavesTaken ?? '--'}
          label="Leaves Taken"
          iconVariant="danger"
        />
        <StatCard 
          icon={Clock}
          value={stats?.pendingRequests ?? '--'}
          label="Pending Requests"
          iconVariant="warning"
        />
      </div>

      {/* Quick Actions Panel */}
      <div className={styles.actionsCard}>
        <h3 className={styles.actionsTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button 
            type="button" 
            className={styles.actionBtn} 
            onClick={() => handleQuickAction('/employee/profile')}
          >
            <div className={styles.actionIconWrapper}>
              <User size={22} />
            </div>
            <span className={styles.actionLabel}>Profile</span>
          </button>
          
          <button 
            type="button" 
            className={styles.actionBtn} 
            onClick={() => handleQuickAction('/employee/attendance')}
          >
            <div className={styles.actionIconWrapper}>
              <Calendar size={22} />
            </div>
            <span className={styles.actionLabel}>Attend</span>
          </button>
          
          <button 
            type="button" 
            className={styles.actionBtn} 
            onClick={() => handleQuickAction('/employee/leave')}
          >
            <div className={styles.actionIconWrapper}>
              <CalendarCheck2 size={22} />
            </div>
            <span className={styles.actionLabel}>Leave</span>
          </button>
          
          <button 
            type="button" 
            className={styles.actionBtn} 
            onClick={() => handleQuickAction('/employee/salary')}
          >
            <div className={styles.actionIconWrapper}>
              <Wallet size={22} />
            </div>
            <span className={styles.actionLabel}>Salary</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivityList 
        title="Recent Activity" 
        activities={activities} 
        interactive={true} 
        onItemClick={handleActivityClick}
      />
    </div>
  );
};

export default EmployeeDashboard;
