import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button, Input, Modal } from '../components/UIElements';
import EmployeeCard from '../components/EmployeeCard';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import styles from './AdminEmployees.module.css';

export const AdminEmployees = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [staffStats, setStaffStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state for new employee
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [dept, setDept] = useState('ENGINEERING');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    // Check if '?add=true' query parameter is present to open the modal
    if (searchParams.get('add') === 'true') {
      setModalOpen(true);
      // Clean query parameter after opening
      setSearchParams({});
    }

    const fetchEmployees = async () => {
      try {
        const list = await api.getEmployees({ search: searchQuery, department: selectedDept });
        setEmployees(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setEmployees([]);
      }
    };

    const fetchStaffStats = async () => {
      try {
        const data = await api.getStaffStats();
        setStaffStats(data || null);
      } catch (err) {
        console.error('Failed to fetch staff stats:', err);
        setStaffStats(null);
      }
    };

    fetchEmployees();
    fetchStaffStats();
  }, [searchParams, setSearchParams, searchQuery, selectedDept]);

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    const newEmp = {
      name,
      role,
      department: dept,
      email,
      photo: photo || null,
    };

    try {
      const res = await api.addEmployee(newEmp);
      if (res.success || res.employee) {
        setEmployees([...employees, res.employee || res]);
        setModalOpen(false);
        setName('');
        setRole('');
        setEmail('');
        setPhoto('');
        showToast('New employee added successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to add employee:', err);
      showToast('Failed to add employee. Please try again.', 'danger');
    }
  };

  const handleToggleStatus = async (emp) => {
    const updated = employees.map(item => {
      if (item.id === emp.id) {
        return {
          ...item,
          status: item.status === 'Active' ? 'On Leave' : 'Active'
        };
      }
      return item;
    });
    setEmployees(updated);
  };

  const handleViewEmployee = (emp) => {
    navigate(`/admin/employees/${emp.id}`);
  };

  const handleEditEmployee = (emp) => {
    navigate(`/admin/employees/${emp.id}`);
  };

  return (
    <div className={styles.container}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Staff Directory</h2>

      {/* Search and Filters */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search by name, role, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={styles.select}
            style={{ padding: '10px' }}
          >
            <option value="">All Departments</option>
            <option value="ENGINEERING">Engineering</option>
            <option value="PRODUCT">Product</option>
            <option value="HUMAN RESOURCES">HR</option>
            <option value="FINANCE">Finance</option>
          </select>
          
          <button 
            type="button" 
            className={styles.filterBtn}
            onClick={() => setSelectedDept('')}
          >
            <SlidersHorizontal size={16} />
            <span>Reset</span>
          </button>
        </div>

        <Button 
          variant="primary" 
          onClick={() => setModalOpen(true)}
          fullWidth
        >
          <Plus size={18} />
          Add Employee
        </Button>
      </div>

      {/* Staff Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statHeader}>Total Staff</span>
          <div className={styles.statValueWrapper}>
            <span className={styles.statValue}>{staffStats?.totalStaff ?? '--'}</span>
            {staffStats?.totalStaffChange && (
              <span className={styles.statChange}>{staffStats.totalStaffChange}</span>
            )}
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statHeader}>Active Now</span>
          <div className={styles.statValueWrapper}>
            <span className={styles.statValue}>{staffStats?.activeNow ?? '--'}</span>
            {staffStats?.activeNowRate && (
              <span className={styles.statChange} style={{ color: 'var(--success)' }}>
                {staffStats.activeNowRate}
              </span>
            )}
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statHeader}>On Leave</span>
          <div className={styles.statValueWrapper}>
            <span className={styles.statValue}>{staffStats?.onLeave ?? '--'}</span>
            {staffStats?.onLeaveRate && (
              <span className={styles.statChange} style={{ color: 'var(--danger)' }}>
                {staffStats.onLeaveRate}
              </span>
            )}
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statHeader}>New Hires</span>
          <div className={styles.statValueWrapper}>
            <span className={styles.statValue}>{staffStats?.newHires ?? '--'}</span>
            <span className={styles.statChange} style={{ color: 'var(--info)' }}>MTD</span>
          </div>
        </div>
      </div>

      {/* Employee List Section */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>All Employees</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing {employees.length} records
          </span>
        </div>
        
        <div className={styles.employeeGrid}>
          {employees.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '48px 24px', 
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              No employees found.
            </div>
          ) : (
            employees.map((emp) => (
              <EmployeeCard 
                key={emp.id}
                employee={emp}
                onView={handleViewEmployee}
                onEdit={handleEditEmployee}
                onDelete={handleToggleStatus}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Employee"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddEmployeeSubmit}>
              Save Employee
            </Button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleAddEmployeeSubmit}>
          <Input 
            label="Full Name" 
            placeholder="Sarah Jenkins" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="sarah.jenkins@company.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Job Title" 
            placeholder="Sr. Product Designer" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            required 
          />
          <div className={styles.formGroup}>
            <label className={styles.label}>Department</label>
            <select 
              value={dept} 
              onChange={(e) => setDept(e.target.value)}
              className={styles.select}
            >
              <option value="ENGINEERING">Engineering</option>
              <option value="PRODUCT">Product</option>
              <option value="HUMAN RESOURCES">HR</option>
              <option value="FINANCE">Finance</option>
            </select>
          </div>
          <Input 
            label="Avatar Photo URL (Optional)" 
            placeholder="https://..." 
            value={photo} 
            onChange={(e) => setPhoto(e.target.value)} 
          />
        </form>
      </Modal>
    </div>
  );
};

export default AdminEmployees;
