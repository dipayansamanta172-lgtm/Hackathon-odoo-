import React, { useState, useEffect } from 'react';
import { Badge, Button, Input } from '../components/UIElements';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import styles from './EmployeeLeave.module.css';

export const EmployeeLeave = () => {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaveType, setLeaveType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoadingLeaves(true);
      try {
        const [leavesList, attendanceList] = await Promise.all([
          api.getMyLeaves(),
          api.getMyAttendance()
        ]);
        setLeaves(Array.isArray(leavesList) ? leavesList : []);
        setAttendance(Array.isArray(attendanceList) ? attendanceList : []);
        
        // Also fetch employee profile to estimate leave balances dynamically
        const profile = await api.getEmployeeProfile();
        if (profile) {
          setLeaveBalances({
            paid: 12 - leavesList.filter(l => l.type === 'Vacation' && l.status === 'Approved').reduce((sum, l) => sum + l.days, 0),
            sick: 6 - leavesList.filter(l => l.type === 'Sick Leave' && l.status === 'Approved').reduce((sum, l) => sum + l.days, 0),
            casual: 4 - leavesList.filter(l => l.type === 'Casual Leave' && l.status === 'Approved').reduce((sum, l) => sum + l.days, 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch calendar/leave details:', err);
        setLeaves([]);
        setAttendance([]);
      } finally {
        setLoadingLeaves(false);
      }
    };
    fetchCalendarData();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      showToast('Please fill out all fields.', 'danger');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const newLeave = {
        type: leaveType,
        startDate,
        endDate,
        days: diffDays,
        reason,
      };

      const res = await api.applyLeave(newLeave);
      if (res.success || res.leave || res.id) {
        const addedLeave = res.leave || res;
        setLeaves([addedLeave, ...leaves]);
        setStartDate('');
        setEndDate('');
        setReason('');
        showToast('Leave application submitted successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to submit leave:', err);
      showToast('Failed to submit leave.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'warning';
    }
  };

  // Generate calendar months list
  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();

  const getDayStatus = (monthIndex, day) => {
    const dateObj = new Date(currentYear, monthIndex, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check if this date overlaps with any approved leave
    const hasApprovedLeave = leaves.some(l => {
      if (l.status !== 'Approved') return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return dateObj >= start && dateObj <= end;
    });

    if (hasApprovedLeave) return styles.leave;
    
    // 2. Future dates
    if (dateObj > today) return styles.future;

    // 3. Check weekends
    const dow = dateObj.getDay();
    const isWeekend = (dow === 0 || dow === 6);

    // 4. Check if attendance record exists in database
    const dateString = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const attRecord = attendance.find(a => a.date === dateString);

    if (attRecord) {
      if (attRecord.status === 'Present') return styles.present;
      if (attRecord.status === 'Half Day') return styles.halfDay;
      if (attRecord.status === 'Late') return styles.halfDay; // Late is yellow
      if (attRecord.status === 'Leave') return styles.leave;
      if (attRecord.status === 'Absent') return styles.leave;
    }

    // 5. Weekends remain weekends
    if (isWeekend) return styles.weekend;

    // 6. Past weekdays without attendance are not recorded
    return styles.notRecorded;
  };

  const renderMonthCalendar = (monthIndex) => {
    const totalDays = new Date(currentYear, monthIndex + 1, 0).getDate();
    let startDayOfWeek = new Date(currentYear, monthIndex, 1).getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const cells = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className={`${styles.dayCell} ${styles.empty}`} />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const statusClass = getDayStatus(monthIndex, day);
      cells.push(
        <div key={day} className={`${styles.dayCell} ${statusClass}`}>
          {day}
        </div>
      );
    }

    return (
      <div key={monthIndex} className={styles.monthBlock}>
        <h4 className={styles.monthName}>{monthsList[monthIndex]}</h4>
        <div className={styles.daysHeader}>
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>
        <div className={styles.daysGrid}>
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Leave Management</h2>

      {/* Accrued Balances */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Paid Leave Available</span>
          <span className={styles.statVal}>{leaveBalances?.paid ?? '--'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Sick Leave Available</span>
          <span className={styles.statVal}>{leaveBalances?.sick ?? '--'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Casual Leave Available</span>
          <span className={styles.statVal}>{leaveBalances?.casual ?? '--'}</span>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        {/* Left Side: 12-Month Yearly Calendar */}
        <div className={styles.calendarCard}>
          <div className={styles.calendarTitleRow}>
            <h3 className={styles.calendarTitle}>Attendance &amp; Absence Tracker ({currentYear})</h3>
            
            {/* Color Legend */}
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotPresent}`}></span>
                <span>Present</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotLeave}`}></span>
                <span>On Leave</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotWeekend}`}></span>
                <span>Weekend</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotNotRecorded}`} style={{ backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1' }}></span>
                <span>Not Recorded</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotFuture}`}></span>
                <span>Future</span>
              </div>
            </div>
          </div>

          <div className={styles.yearGrid}>
            {monthsList.map((_, idx) => renderMonthCalendar(idx))}
          </div>
        </div>

        {/* Right Side: Apply Form & Recent Activity */}
        <div className={styles.rightCard}>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>Request Time Off</h3>
            <form className={styles.form} onSubmit={handleApplyLeave}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Leave Type</label>
                <select 
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className={styles.select}
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal">Personal</option>
                  <option value="Casual Leave">Casual Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input 
                  label="Start Date" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  required 
                />
                <Input 
                  label="End Date" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Reason Note</label>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for requesting time off..."
                  className={styles.textarea}
                  required
                />
              </div>

              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </div>

          <div className={styles.historyCard}>
            <h3 className={styles.formTitle}>Recent Applications</h3>
            <div className={styles.historyList}>
              {loadingLeaves ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Loading leave requests...
                </div>
              ) : leaves.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  No leave requests found.
                </div>
              ) : (
                leaves.map((l) => (
                  <div key={l.id} className={styles.historyItem}>
                    <div className={styles.historyMeta}>
                      <span className={styles.historyType}>{l.type} ({l.days} days)</span>
                      <span className={styles.historyDates}>{l.startDate} — {l.endDate}</span>
                    </div>
                    <Badge variant={getStatusVariant(l.status)}>{l.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeave;
