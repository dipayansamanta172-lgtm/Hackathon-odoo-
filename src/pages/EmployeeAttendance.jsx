import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Search, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  LogIn, 
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../components/UIElements';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import styles from './EmployeeAttendance.module.css';

export const EmployeeAttendance = () => {
  const { showToast } = useToast();
  const [time, setTime] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('--:-- --');
  const [checkOutTime, setCheckOutTime] = useState('--:-- --');
  
  // Navigation & Logs states
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Available months (last 3 months for navigation)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  const monthsData = getMonthOptions();

  // Advanced Filter panel states
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Dynamic real-time clock counter
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
      setTime(strTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch attendance logs from API when month changes
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const data = await api.getMyAttendance({ month: selectedMonth });
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch attendance logs:', err);
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [selectedMonth]);

  // Combined Filters Logic
  useEffect(() => {
    let result = [...logs];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => 
        (log.date && log.date.toLowerCase().includes(q)) || 
        (log.status && log.status.toLowerCase().includes(q)) || 
        (log.checkIn && log.checkIn.toLowerCase().includes(q)) ||
        (log.checkOut && log.checkOut.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== 'All') {
      result = result.filter(log => log.status === filterStatus);
    }

    if (filterStartDate) {
      result = result.filter(log => log.date >= filterStartDate);
    }
    if (filterEndDate) {
      result = result.filter(log => log.date <= filterEndDate);
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, filterStatus, filterStartDate, filterEndDate]);

  // Clock in/out handlers
  const handleToggleCheck = async (action) => {
    try {
      if (action === 'in') {
        const res = await api.checkIn();
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckedIn(true);
        setCheckInTime(res?.checkIn || nowTime);
        setCheckOutTime('--:-- --');
        showToast('Successfully Checked In!', 'success');
        // Refresh logs
        const data = await api.getMyAttendance({ month: selectedMonth });
        setLogs(Array.isArray(data) ? data : []);
      } else if (action === 'out') {
        const res = await api.checkOut();
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckedIn(false);
        setCheckOutTime(res?.checkOut || nowTime);
        showToast('Successfully Checked Out!', 'info');
        // Refresh logs
        const data = await api.getMyAttendance({ month: selectedMonth });
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Check-in/out failed:', err);
      showToast('Action failed. Please try again.', 'danger');
    }
  };

  const handlePrevMonth = () => {
    const currentIndex = monthsData.findIndex(m => m.value === selectedMonth);
    if (currentIndex < monthsData.length - 1) {
      setSelectedMonth(monthsData[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = monthsData.findIndex(m => m.value === selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(monthsData[currentIndex - 1].value);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterStartDate('');
    setFilterEndDate('');
    showToast('Filters reset successfully', 'info');
  };

  // Helper calculations for summary cards
  const calculateTotalMinutes = (field) => {
    return logs.reduce((total, log) => {
      const timeStr = log[field] || '0h 00m';
      const hoursMatch = timeStr.match(/(\d+)h/);
      const minsMatch = timeStr.match(/(\d+)m/);
      const hrs = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
      return total + (hrs * 60 + mins);
    }, 0);
  };

  const formatMinutes = (totalMins) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const daysPresentCount = logs.filter(log => log.status === 'Present' || log.status === 'Half Day').length;
  const leavesCount = logs.filter(log => log.status === 'Leave').length;
  const totalWorkingHours = formatMinutes(calculateTotalMinutes('hours'));
  const totalExtraHours = formatMinutes(calculateTotalMinutes('extra'));

  // Today's formatted date string
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className={styles.container}>
      {/* Live Status Card */}
      <div className={styles.statusCard}>
        <div className={styles.liveHeader}>
          <span className={styles.liveLabel}>Live Status • {todayFormatted}</span>
          <Badge variant={checkedIn ? 'success' : 'warning'}>{checkedIn ? 'ON TIME' : 'NOT CHECKED IN'}</Badge>
        </div>
        
        <div className={styles.timeRow}>
          <span className={styles.timeText}>{time}</span>
        </div>
        
        <p className={styles.statusMessage}>
          {checkedIn ? 'You are currently clocked in.' : 'You have not checked in yet today.'}
        </p>

        {/* Dual clocking items */}
        <div className={styles.clockActions}>
          <button 
            type="button" 
            className={`${styles.clockBtn} ${checkedIn ? styles.clockBtnActive : ''}`}
            onClick={() => handleToggleCheck('in')}
          >
            <div className={styles.clockIconCircle}>
              <LogIn size={20} />
            </div>
            <span className={styles.clockLabel}>Check In</span>
            <span className={styles.clockValue}>{checkInTime}</span>
          </button>

          <button 
            type="button" 
            className={`${styles.clockBtn} ${!checkedIn && checkOutTime !== '--:-- --' ? styles.clockBtnActive : ''}`}
            onClick={() => handleToggleCheck('out')}
          >
            <div className={styles.clockIconCircle}>
              <LogOut size={20} />
            </div>
            <span className={styles.clockLabel}>Check Out</span>
            <span className={styles.clockValue}>{checkOutTime}</span>
          </button>
        </div>
      </div>

      {/* Avg hours and Rate Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ backgroundColor: '#eff6ff', color: 'var(--primary-color)' }}>
            <Clock size={20} />
          </div>
          <div className={styles.metricMeta}>
            <span className={styles.metricLabel}>Avg. Work Hours</span>
            <span className={styles.metricValue}>{daysPresentCount > 0 ? formatMinutes(Math.floor(calculateTotalMinutes('hours') / daysPresentCount)) : '--'}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ backgroundColor: '#ecfdf5', color: 'var(--success)' }}>
            <Calendar size={20} />
          </div>
          <div className={styles.metricMeta}>
            <span className={styles.metricLabel}>Days Present</span>
            <span className={styles.metricValue}>{daysPresentCount}</span>
          </div>
        </div>
      </div>

      {/* Upgraded Logs Card with Monthly Navigation and filters */}
      <div className={styles.logsCard}>
        <div className={styles.logsHeaderRow}>
          <h3 className={styles.logsTitle}>Attendance Logs</h3>
          
          {/* Monthly navigation strip */}
          <div className={styles.monthNav}>
            <button 
              type="button" 
              className={styles.navArrowBtn} 
              onClick={handlePrevMonth}
              disabled={selectedMonth === monthsData[monthsData.length - 1]?.value}
              style={{ opacity: selectedMonth === monthsData[monthsData.length - 1]?.value ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.monthSelect}
            >
              {monthsData.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <button 
              type="button" 
              className={styles.navArrowBtn} 
              onClick={handleNextMonth}
              disabled={selectedMonth === monthsData[0]?.value}
              style={{ opacity: selectedMonth === monthsData[0]?.value ? 0.5 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Days Present</span>
            <span className={styles.summaryValue}>{daysPresentCount}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Leave Count</span>
            <span className={styles.summaryValue}>{leavesCount} days</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Work Hours</span>
            <span className={styles.summaryValue}>{totalWorkingHours}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Overtime</span>
            <span className={styles.summaryValue} style={{ color: 'var(--primary-color)' }}>{totalExtraHours}</span>
          </div>
        </div>

        {/* Filter Controls bar */}
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} size={16} />
            <input 
              type="text" 
              placeholder="Search logs by keyword..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button 
            type="button"
            className={`${styles.filterBtn} ${filterPanelOpen ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          >
            <SlidersHorizontal size={16} />
            <span>Filter Options</span>
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {filterPanelOpen && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Start Date</span>
              <input 
                type="date" 
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>End Date</span>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Attendance Status</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Half Day">Half Day</option>
                <option value="Leave">Leave</option>
              </select>
            </div>

            <button 
              type="button" 
              className={styles.filterResetBtn}
              onClick={handleResetFilters}
            >
              <RefreshCw size={14} style={{ marginRight: '6px' }} />
              Reset All
            </button>
          </div>
        )}

        {/* Logs Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>DATE</th>
                <th className={styles.th}>CHECK IN</th>
                <th className={styles.th}>CHECK OUT</th>
                <th className={styles.th}>WORK HOURS</th>
                <th className={styles.th}>EXTRA HOURS</th>
                <th className={styles.th}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    No attendance records available.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className={`${styles.td} ${styles.tdDate}`}>
                      {new Date(log.date).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className={styles.td}>{log.checkIn || '--'}</td>
                    <td className={styles.td}>{log.checkOut || '--'}</td>
                    <td className={`${styles.td} ${styles.tdHours}`}>{log.hours || '0h 00m'}</td>
                    <td className={styles.td} style={{ color: log.extra && log.extra !== '0h 00m' ? 'var(--primary-color)' : 'inherit' }}>
                      {log.extra || '0h 00m'}
                    </td>
                    <td className={styles.td}>
                      <Badge variant={log.status === 'Present' ? 'success' : log.status === 'Half Day' ? 'warning' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.paginationRow}>
          <span>Showing {filteredLogs.length} records</span>
          <div className={styles.paginationBtns}>
            <button type="button" className={styles.pageBtn}>Previous</button>
            <button type="button" className={styles.pageBtn}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
