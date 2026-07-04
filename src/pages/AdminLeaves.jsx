import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Modal } from '../components/UIElements';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import styles from './AdminLeaves.module.css';

export const AdminLeaves = () => {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [teamAvailability, setTeamAvailability] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leavesRes, availRes] = await Promise.all([
          api.getLeaves(),
          api.getTeamAvailability(),
        ]);
        setLeaves(Array.isArray(leavesRes) ? leavesRes : []);
        setTeamAvailability(Array.isArray(availRes) ? availRes : []);
      } catch (err) {
        console.error('Failed to fetch leaves data:', err);
        setLeaves([]);
        setTeamAvailability([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.updateLeaveStatus(id, status);
      if (res.success !== false) {
        setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
        showToast(`Leave request ${status.toLowerCase()} successfully!`, 'success');
      }
    } catch {
      showToast('Failed to update leave status.', 'danger');
    }
  };

  const handleApprove = (id) => handleUpdateStatus(id, 'Approved');
  const handleReject = (id) => handleUpdateStatus(id, 'Rejected');

  const getLeaveBadgeVariant = (type) => {
    switch (type) {
      case 'Sick Leave': return 'danger';
      case 'Personal': return 'warning';
      default: return 'success';
    }
  };

  // Filter leaves depending on selected tab
  const filteredLeaves = leaves.filter(l => l.status === activeTab);
  
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className={styles.container}>
      {/* Title */}
      <div className={styles.welcomeSection}>
        <h2 className={styles.welcomeTitle}>Leave Approval Management</h2>
        <p className={styles.welcomeSub}>
          Manage employee absence requests and maintain team productivity.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <button 
            type="button"
            className={`${styles.tab} ${activeTab === 'Pending' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            Pending
            <span className={styles.tabCount}>{pendingCount}</span>
          </button>
          
          <button 
            type="button"
            className={`${styles.tab} ${activeTab === 'Approved' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('Approved')}
          >
            Approved
            <span className={styles.tabCount}>{approvedCount}</span>
          </button>

          <button 
            type="button"
            className={`${styles.tab} ${activeTab === 'Rejected' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('Rejected')}
          >
            Rejected
            <span className={styles.tabCount}>{rejectedCount}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Leaves List */}
      <div className={styles.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Loading leave requests...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
            No {activeTab.toLowerCase()} leave requests found.
          </div>
        ) : (
          filteredLeaves.map((leave) => (
            <div key={leave.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.employeeMeta}>
                  {leave.employeePhoto && (
                    <img src={leave.employeePhoto} alt={leave.employeeName} className={styles.avatar} />
                  )}
                  <div className={styles.nameInfo}>
                    <span className={styles.name}>{leave.employeeName}</span>
                    {leave.role && <span className={styles.role}>{leave.role}</span>}
                  </div>
                </div>
                
                <Badge variant={getLeaveBadgeVariant(leave.type)}>{leave.type}</Badge>
              </div>

              <div className={styles.dateRow}>
                <Calendar className={styles.dateIcon} size={14} />
                <span>
                  {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: '2-digit' })} — {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ({leave.days} {leave.days === 1 ? 'working day' : 'working days'})
                </span>
              </div>

              {leave.reason && (
                <div className={styles.noteBlock}>
                  "{leave.reason}"
                </div>
              )}

              {leave.status === 'Pending' && (
                <div className={styles.cardActions}>
                  <button 
                    type="button" 
                    className={styles.btnApprove}
                    onClick={() => handleApprove(leave.id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>
                  <button 
                    type="button" 
                    className={styles.btnReject}
                    onClick={() => handleReject(leave.id)}
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Team Availability Overview */}
      <div className={styles.availabilityCard}>
        <div className={styles.widgetTitleRow}>
          <h3 className={styles.widgetTitle}>Team Availability Overview</h3>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotAvailable}`}></span>
              <span>Available</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotLeave}`}></span>
              <span>On Leave</span>
            </div>
          </div>
        </div>

        <div className={styles.availabilityStrip}>
          {teamAvailability.length === 0 ? (
            <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
              No team availability data.
            </div>
          ) : (
            teamAvailability.map((avail, idx) => (
              <div 
                key={idx} 
                className={styles.dayBubble}
                onClick={() => setSelectedAvailabilityDay(avail)}
              >
                <span className={styles.dayName}>{avail.day}</span>
                <div className={`${styles.dateCircle} ${avail.isToday ? styles.dateCircleActive : ''}`}>
                  {avail.date}
                </div>
                <span 
                  className={styles.statusDot}
                  style={{ 
                    backgroundColor: avail.status === 'available' 
                      ? 'var(--success)' 
                      : avail.status === 'on_leave' 
                        ? 'var(--danger)' 
                        : 'transparent' 
                  }}
                ></span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approval Velocity Indigo Card */}
      <div className={styles.velocityCard}>
        <span className={styles.velocityLabel}>Approval Velocity</span>
        <h3 className={styles.velocityValue}>--</h3>
        <p className={styles.velocitySub}>
          Average time to resolve a leave request. Data will populate from backend.
        </p>
        <div className={styles.velocityFooter}>
          <span>Total Pending</span>
          <span>{pendingCount}</span>
        </div>
      </div>

      {/* Team Availability Modal */}
      <Modal
        isOpen={selectedAvailabilityDay !== null}
        onClose={() => setSelectedAvailabilityDay(null)}
        title={`Team Availability — ${selectedAvailabilityDay ? `${selectedAvailabilityDay.day} ${selectedAvailabilityDay.date}` : ''}`}
      >
        <div className={styles.availabilityList}>
          {selectedAvailabilityDay && selectedAvailabilityDay.employees && selectedAvailabilityDay.employees.length > 0 ? (
            selectedAvailabilityDay.employees.map((emp, index) => (
              <div key={index} className={styles.availabilityItem}>
                {emp.avatar && <img src={emp.avatar} alt={emp.name} className={styles.availAvatar} />}
                <span className={styles.availName}>{emp.name}</span>
                <span className={`${styles.availStatus} ${emp.status === 'Available' ? styles.availGreen : styles.availRed}`}>
                  {emp.status === 'Available' ? '✓ Available' : `✗ ${emp.status}`}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              No employee availability data for this day.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeaves;
