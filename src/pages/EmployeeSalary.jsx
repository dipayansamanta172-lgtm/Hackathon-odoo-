import React, { useState, useEffect } from 'react';
import { Badge, Modal, Button } from '../components/UIElements';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import { Wallet, Banknote, CalendarDays } from 'lucide-react';
import styles from './EmployeeSalary.module.css';

export const EmployeeSalary = () => {
  const [payroll, setPayroll] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedPay, setSelectedPay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [payrollRes, profileRes] = await Promise.all([
          api.getPayroll(),
          api.getEmployeeProfile()
        ]);
        setPayroll(Array.isArray(payrollRes) ? payrollRes : []);
        setProfile(profileRes || null);
      } catch (err) {
        console.error('Failed to fetch salary data:', err);
        setPayroll([]);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectPayslip = (pay) => {
    setSelectedPay(pay);
    setModalOpen(true);
  };

  const getDashboardStats = () => {
    if (!profile) {
      return { current: '--', next: '--', previous: '--' };
    }

    const now = new Date();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentYearNum = now.getFullYear();

    // Check if employee joined this month
    let joinedThisMonth = false;
    if (profile.join_date) {
      const join = new Date(profile.join_date);
      if (join.getFullYear() === currentYearNum && (join.getMonth() + 1) === currentMonthNum) {
        joinedThisMonth = true;
      }
    }

    // 1. Current Month Salary
    const currentSlip = payroll.find(p => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const matchLabel = `${monthNames[currentMonthNum - 1]} ${currentYearNum}`;
      return p.month === matchLabel && p.status === 'Approved';
    });
    const currentVal = currentSlip 
      ? `$${currentSlip.net.toLocaleString()}` 
      : profile.net_salary 
        ? `$${parseFloat(profile.net_salary).toLocaleString()} (Est.)`
        : '--';

    // 2. Next Expected Salary
    const nextVal = profile.net_salary 
      ? `$${parseFloat(profile.net_salary).toLocaleString()}` 
      : '--';

    // 3. Previous Salary
    let prevVal = '--';
    if (joinedThisMonth) {
      prevVal = 'No previous salary available (Employee joined this month)';
    } else {
      let prevMonth = currentMonthNum - 1;
      let prevYear = currentYearNum;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const prevMatchLabel = `${monthNames[prevMonth - 1]} ${prevYear}`;
      const prevSlip = payroll.find(p => p.month === prevMatchLabel && p.status === 'Approved');
      
      if (prevSlip) {
        prevVal = `$${prevSlip.net.toLocaleString()}`;
      } else {
        prevVal = 'No previous salary slip available';
      }
    }

    return { current: currentVal, next: nextVal, previous: prevVal };
  };

  const stats = getDashboardStats();

  return (
    <div className={styles.container}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Salary slips</h2>

      {/* Salary KPI Dashboard Cards */}
      <div className={styles.statsRow}>
        <StatCard 
          icon={Wallet}
          value={stats.current}
          label="Current Month Salary"
          iconVariant="primary"
        />
        <StatCard 
          icon={Banknote}
          value={stats.next}
          label="Next Expected Salary"
          iconVariant="success"
        />
        <StatCard 
          icon={CalendarDays}
          value={stats.previous}
          label="Previous Salary"
          iconVariant={stats.previous.startsWith('No') ? 'warning' : 'info'}
        />
      </div>

      <div className={styles.card}>
        <h3 className={styles.title}>Payslips History</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Loading salary records...
          </div>
        ) : payroll.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
            No salary slips available.
          </div>
        ) : (
          <div className={styles.list}>
            {payroll.map((pay) => (
              <div key={pay.id} className={styles.item} onClick={() => handleSelectPayslip(pay)}>
                <div className={styles.itemDetails}>
                  <span className={styles.month}>{pay.month}</span>
                  <span className={styles.amountText}>Net Paid: <strong className={styles.amount}>${pay.net?.toLocaleString()}</strong></span>
                </div>
                <div className={styles.rightSection}>
                  <Badge variant="success">{pay.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Salary Slip Modal */}
      {selectedPay && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Payslip - ${selectedPay.month}`}
          footer={
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className={styles.modalDetails}>
            <div className={styles.modalSection}>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Release Date</span>
                <span className={styles.modalRowVal}>{selectedPay.date}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Status</span>
                <span className={styles.modalRowVal}>
                  <Badge variant="success">{selectedPay.status}</Badge>
                </span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className={styles.modalSection} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '6px' }}>Earnings</h4>
              
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Basic Salary</span>
                <span className={styles.modalRowVal}>${(selectedPay.basic || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>HRA (House Rent Allowance)</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.hra || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Standard Allowance</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.standardAllowance || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Travel Allowance</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.travel || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Leave Travel Allowance (LTA)</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.lta || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Performance Bonus</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.bonus || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Fixed Allowance</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.fixedAllowance || 0).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Other Allowances</span>
                <span className={styles.modalRowVal}>+ ${(selectedPay.details?.otherAllowances || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className={styles.modalSection} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '6px' }}>Deductions</h4>
              
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Provident Fund (PF)</span>
                <span className={styles.modalRowVal} style={{ color: 'var(--danger)' }}>
                  - ${(selectedPay.details?.pf || 0).toLocaleString()}
                </span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Professional Tax</span>
                <span className={styles.modalRowVal} style={{ color: 'var(--danger)' }}>
                  - ${(selectedPay.details?.tax || 0).toLocaleString()}
                </span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Income Tax</span>
                <span className={styles.modalRowVal} style={{ color: 'var(--danger)' }}>
                  - ${(selectedPay.details?.incomeTax || 0).toLocaleString()}
                </span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalRowLabel}>Other deductions</span>
                <span className={styles.modalRowVal} style={{ color: 'var(--danger)' }}>
                  - ${(selectedPay.details?.otherDeductions || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Summary calculations */}
            <div className={styles.modalSection} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div className={styles.modalRow} style={{ fontWeight: 600 }}>
                <span className={styles.modalRowLabel}>Gross Salary</span>
                <span className={styles.modalRowVal}>${(selectedPay.basic + selectedPay.allowances).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow} style={{ fontWeight: 600 }}>
                <span className={styles.modalRowLabel}>(-) Total Deductions</span>
                <span className={styles.modalRowVal} style={{ color: 'var(--danger)' }}>
                  - ${selectedPay.deductions.toLocaleString()}
                </span>
              </div>
              
              <div className={`${styles.modalRow} ${styles.totalRow}`}>
                <span>Net Salary</span>
                <span style={{ color: 'var(--primary-color)' }}>
                  ${(selectedPay.basic + selectedPay.allowances - selectedPay.deductions).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeSalary;
