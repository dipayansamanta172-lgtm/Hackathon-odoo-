import React, { useState, useEffect } from 'react';
import { Badge, Button } from '../components/UIElements';
import { useToast } from '../context/ToastContext';
import { Search, RotateCcw, Calendar } from 'lucide-react';
import { api } from '../services/api';
import styles from './AdminAttendance.module.css';

export const AdminAttendance = () => {
  const { showToast } = useToast();

  // Default to today's date in YYYY-MM-DD format
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Attendance records for the selected date
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Fetch attendance records from the API whenever the selected date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const data = await api.getAttendanceByDate(selectedDate);
        setAttendanceRecords(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to fetch attendance records:', err);
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDate]);

  // Reset pagination to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterDept]);

  // Status modify handler - calls API & updates local state
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.updateAttendanceStatus(id, newStatus, selectedDate);
      const updatedId = res.id || id;
      setAttendanceRecords(prev => prev.map(rec => {
        if (rec.id === id) {
          let checkIn = rec.checkIn;
          let checkOut = rec.checkOut;
          let hours = rec.hours;
          let extra = rec.extra;

          if (newStatus === 'Present') {
            checkIn = '09:00 AM';
            checkOut = '05:30 PM';
            hours = '8h 30m';
            extra = '0h 30m';
          } else if (newStatus === 'Late') {
            checkIn = '09:40 AM';
            checkOut = '05:30 PM';
            hours = '7h 50m';
            extra = '0h 00m';
          } else if (newStatus === 'Half Day') {
            checkIn = '09:00 AM';
            checkOut = '01:00 PM';
            hours = '4h 00m';
            extra = '0h 00m';
          } else if (newStatus === 'Leave' || newStatus === 'Absent') {
            checkIn = '--';
            checkOut = '--';
            hours = '0h 00m';
            extra = '0h 00m';
          }

          return { ...rec, id: updatedId, status: newStatus, checkIn, checkOut, hours, extra };
        }
        return rec;
      }));
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status. Please try again.', 'danger');
    }
  };

  // Filters and search logic
  const filteredRecords = attendanceRecords.filter(rec => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === '' || 
      (rec.name && rec.name.toLowerCase().includes(query)) ||
      (rec.id && rec.id.toLowerCase().includes(query)) ||
      (rec.department && rec.department.toLowerCase().includes(query));

    const matchesStatus = filterStatus === 'All' || rec.status === filterStatus;
    const matchesDept = filterDept === 'All' || rec.department === filterDept;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate dynamic stats from loaded records
  const totalEmployees = attendanceRecords.length;
  const countPresent = attendanceRecords.filter(r => r.status === 'Present').length;
  const countLate = attendanceRecords.filter(r => r.status === 'Late').length;
  const countHalfDay = attendanceRecords.filter(r => r.status === 'Half Day').length;
  const countLeave = attendanceRecords.filter(r => r.status === 'Leave').length;
  const countAbsent = attendanceRecords.filter(r => r.status === 'Absent').length;

  // Average work hours calculation
  const getAverageWorkHours = () => {
    const presentRecords = attendanceRecords.filter(r => r.checkIn && r.checkIn !== '--');
    if (presentRecords.length === 0) return '0h 00m';

    const totalMinutes = presentRecords.reduce((total, r) => {
      const match = r.hours && r.hours.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        return total + (parseInt(match[1]) * 60 + parseInt(match[2]));
      }
      return total;
    }, 0);

    const avgMinutes = Math.floor(totalMinutes / presentRecords.length);
    const hrs = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  };

  const avgWorkHours = getAverageWorkHours();

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Late': return 'warning';
      case 'Half Day': return 'warning';
      case 'Leave': return 'info';
      case 'Absent': return 'danger';
      default: return 'success';
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterDept('All');
    showToast('Filters cleared', 'info');
  };

  // Formatted date string for KPI panel
  const getFormattedDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateObj = new Date(dateStr);
    return isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.container}>
      {/* Picker Row header controls */}
      <div className={styles.pickerRow}>
        <h2 className={styles.title}>Date-Based Attendance viewer</h2>
        
        <div className={styles.datePickerWrapper}>
          <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
          <span className={styles.dateLabel}>Select Registry Date:</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.dateInput} 
          />
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total headcount</span>
          <span className={styles.summaryValue}>{totalEmployees}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Present</span>
          <span className={styles.summaryValue} style={{ color: 'var(--success)' }}>{countPresent}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Late Arrivals</span>
          <span className={styles.summaryValue} style={{ color: 'var(--warning-dark)' }}>{countLate}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Half Days</span>
          <span className={styles.summaryValue} style={{ color: 'var(--primary-color)' }}>{countHalfDay}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Approved Leaves</span>
          <span className={styles.summaryValue} style={{ color: 'var(--info)' }}>{countLeave}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Absentees</span>
          <span className={styles.summaryValue} style={{ color: 'var(--danger)' }}>{countAbsent}</span>
        </div>
        <div className={styles.summaryCard} style={{ gridColumn: 'span 2' }}>
          <span className={styles.summaryLabel}>Average Work Hours</span>
          <span className={styles.summaryValue}>{avgWorkHours}</span>
        </div>
      </div>

      {/* Query Filters Bar */}
      <div className={styles.card}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Filter Records</h3>
        <div className={styles.filterRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by Employee Name, ID, or Department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Leave">Leave</option>
            <option value="Absent">Absent</option>
          </select>

          <select 
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Departments</option>
            <option value="ENGINEERING">Engineering</option>
            <option value="HUMAN RESOURCES">Human Resources</option>
            <option value="FINANCE">Finance</option>
            <option value="SALES">Sales</option>
            <option value="MARKETING">Marketing</option>
            <option value="PRODUCT">Product</option>
          </select>

          <button 
            type="button" 
            className={styles.resetBtn} 
            onClick={handleResetFilters}
          >
            <RotateCcw size={14} style={{ marginRight: '6px' }} />
            Reset
          </button>
        </div>
      </div>

      {/* Table Card Grid */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Attendance registry log: {getFormattedDate(selectedDate)}
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Showing {filteredRecords.length} records
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Loading attendance records...
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Employee</th>
                  <th className={styles.th}>Department</th>
                  <th className={styles.th}>Check-In</th>
                  <th className={styles.th}>Check-Out</th>
                  <th className={styles.th}>Hours</th>
                  <th className={styles.th}>Extra Hours</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      No attendance records available.
                    </td>
                  </tr>
                ) : (
                  currentRecords.map(rec => (
                    <tr key={rec.id}>
                      <td className={styles.td}>
                        <div className={styles.empCell}>
                          {rec.photo && (
                            <img src={rec.photo} alt={rec.name} className={styles.avatar} />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className={styles.empName}>{rec.name}</span>
                            <span className={styles.empId}>{rec.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.deptBadge}>{rec.department}</span>
                      </td>
                      <td className={styles.td}>{rec.checkIn || '--'}</td>
                      <td className={styles.td}>{rec.checkOut || '--'}</td>
                      <td className={styles.td} style={{ fontWeight: 600 }}>{rec.hours || '0h 00m'}</td>
                      <td className={styles.td} style={{ color: rec.extra && rec.extra !== '0h 00m' ? 'var(--primary-color)' : 'inherit' }}>
                        {rec.extra || '0h 00m'}
                      </td>
                      <td className={styles.td}>
                        <Badge variant={getStatusBadgeVariant(rec.status)}>{rec.status}</Badge>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionRow} style={{ justifyContent: 'flex-end' }}>
                          <Button 
                            variant="outline" 
                            className={styles.btnAction}
                            onClick={() => handleUpdateStatus(rec.id, 'Present')}
                          >
                            Present
                          </Button>
                          <Button 
                            variant="outline" 
                            className={styles.btnAction}
                            onClick={() => handleUpdateStatus(rec.id, 'Late')}
                          >
                            Late
                          </Button>
                          <Button 
                            variant="outline" 
                            className={styles.btnAction}
                            onClick={() => handleUpdateStatus(rec.id, 'Absent')}
                            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                          >
                            Absent
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <span>Page {currentPage} of {totalPages}</span>
            <div className={styles.paginationBtns}>
              <button 
                type="button" 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNo => (
                <button
                  key={pageNo}
                  type="button"
                  className={`${styles.pageBtn} ${currentPage === pageNo ? styles.pageBtnActive : ''}`}
                  onClick={() => setCurrentPage(pageNo)}
                >
                  {pageNo}
                </button>
              ))}

              <button 
                type="button" 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;
