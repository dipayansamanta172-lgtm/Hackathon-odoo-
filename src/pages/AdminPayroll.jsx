import React, { useState, useEffect } from 'react';
import { Badge, Button } from '../components/UIElements';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import styles from './AdminPayroll.module.css';

export const AdminPayroll = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payroll Budget States
  const [payrollBudget, setPayrollBudget] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState('');

  useEffect(() => {
    const fetchPayroll = async () => {
      setLoading(true);
      try {
        const [payrollData, budgetData] = await Promise.all([
          api.getAdminPayroll(),
          api.getPayrollBudget()
        ]);
        setEmployees(Array.isArray(payrollData) ? payrollData : []);
        setPayrollBudget(budgetData ? budgetData.budget : 0);
        setTempBudget(String(budgetData ? budgetData.budget : 0));
      } catch (err) {
        console.error('Failed to fetch payroll data:', err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  const handleSaveBudget = async () => {
    try {
      const numeric = parseFloat(tempBudget);
      if (isNaN(numeric) || numeric < 0) {
        showToast('Please enter a valid positive number for the budget.', 'warning');
        return;
      }
      const res = await api.updatePayrollBudget(numeric);
      setPayrollBudget(res.budget);
      setIsEditing(false);
      showToast('Payroll budget updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update budget:', err);
      showToast('Failed to save budget changes.', 'danger');
    }
  };

  const handleApproveEmployeePayroll = async (id) => {
    try {
      await api.approvePayroll(id);
      setEmployees(prev => prev.map(emp => {
        if (emp.id === id) {
          return { ...emp, status: 'Approved' };
        }
        return emp;
      }));
      showToast(`Payroll approved for employee ${id}!`, 'success');
    } catch (err) {
      console.error('Failed to approve payroll:', err);
      showToast('Failed to approve payroll. Please try again.', 'danger');
    }
  };

  const countApproved = employees.filter(e => e.status === 'Approved').length;
  const payrollStatus = employees.length === 0
    ? 'No Data'
    : countApproved === 0 
      ? 'Pending Approval' 
      : countApproved === employees.length 
        ? 'Fully Approved & Paid' 
        : `Partially Approved (${countApproved}/${employees.length})`;

  const currentMonthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Payroll Management</h2>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Budget</span>
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>$</span>
              <input 
                type="number" 
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                style={{
                  width: '120px',
                  padding: '6px 10px',
                  fontSize: '0.9rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
              <Button variant="primary" onClick={handleSaveBudget} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Save
              </Button>
              <Button variant="outline" onClick={() => { setIsEditing(false); setTempBudget(String(payrollBudget)); }} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span className={styles.statVal}>
                ${payrollBudget.toLocaleString()}
              </span>
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  textDecoration: 'underline'
                }}
              >
                Edit Budget
              </button>
            </div>
          )}
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Status</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '4px' }}>
            {payrollStatus}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.cardTitle}>{currentMonthYear} Run</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Loading payroll data...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
            No payroll records available.
          </div>
        ) : (
          <div className={styles.list}>
            {employees.map((emp) => (
              <div key={emp.id} className={styles.item}>
                <div className={styles.empMeta}>
                  {emp.photo && (
                    <img src={emp.photo} alt={emp.name} className={styles.avatar} />
                  )}
                  <div className={styles.empDetails}>
                    <span className={styles.empName}>{emp.name}</span>
                    <span className={styles.empRole}>{emp.role}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className={styles.amountSection}>
                    <span className={styles.amount}>{emp.salary || '--'}</span>
                    <Badge variant={emp.status === 'Approved' ? 'success' : 'warning'}>
                      {emp.status || 'Pending'}
                    </Badge>
                  </div>
                  
                  {emp.status !== 'Approved' ? (
                    <Button 
                      variant="primary" 
                      onClick={() => handleApproveEmployeePayroll(emp.id)} 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      disabled 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Approved
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayroll;
