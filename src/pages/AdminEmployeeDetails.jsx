import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, ShieldAlert } from 'lucide-react';
import { Badge, Button, Input, Modal } from '../components/UIElements';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import styles from './AdminEmployeeDetails.module.css';

export const AdminEmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit modal states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [dept, setDept] = useState('ENGINEERING');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('Active');
  
  // Clearance states
  const [securityClearance, setSecurityClearance] = useState('Level 1 (Standard Employee)');
  const [roleClearance, setRoleClearance] = useState('Employee');
  const [departmentAccess, setDepartmentAccess] = useState('Own Department Only');
  const [payrollPermission, setPayrollPermission] = useState('View Only');
  const [recruitmentPermission, setRecruitmentPermission] = useState('No Access');
  const [leavePermission, setLeavePermission] = useState('Apply Only');
  const [attendancePermission, setAttendancePermission] = useState('Check-in/Check-out Only');
  const [employeeManagementPermission, setEmployeeManagementPermission] = useState('No Access');

  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const found = await api.getEmployeeById(id);
        if (found) {
          setEmployee(found);
          setName(found.name || '');
          setRole(found.role || '');
          setDept(found.department || 'ENGINEERING');
          setEmail(found.email || '');
          setSalary(found.salary_breakdown ? found.salary_breakdown.basic_salary : '0');
          setStatus(found.status || 'Active');
          
          setSecurityClearance(found.security_clearance || 'Level 1 (Standard Employee)');
          setRoleClearance(found.role_clearance || 'Employee');
          setDepartmentAccess(found.department_access || 'Own Department Only');
          setPayrollPermission(found.payroll_permission || 'View Only');
          setRecruitmentPermission(found.recruitment_permission || 'No Access');
          setLeavePermission(found.leave_permission || 'Apply Only');
          setAttendancePermission(found.attendance_permission || 'Check-in/Check-out Only');
          setEmployeeManagementPermission(found.employee_management_permission || 'No Access');
        }
      } catch (e) {
        console.error('Failed to fetch employee details:', e);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    
    try {
      const updated = {
        name,
        role,
        department: dept,
        email,
        salary,
        status,
        securityClearance,
        roleClearance,
        departmentAccess,
        payrollPermission,
        recruitmentPermission,
        leavePermission,
        attendancePermission,
        employeeManagementPermission
      };
      
      await api.updateEmployee(id, updated);
      
      // Update local state
      setEmployee(prev => ({
        ...prev,
        ...updated,
        department: dept,
        salary_breakdown: {
          ...prev.salary_breakdown,
          basic_salary: salary
        },
        security_clearance: securityClearance,
        role_clearance: roleClearance,
        department_access: departmentAccess,
        payroll_permission: payrollPermission,
        recruitment_permission: recruitmentPermission,
        leave_permission: leavePermission,
        attendance_permission: attendancePermission,
        employee_management_permission: employeeManagementPermission
      }));

      setEditModalOpen(false);
      showToast('Employee profile and clearances updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update employee clearances:', err);
      showToast('Failed to update employee details. Please try again.', 'danger');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
        Loading employee record...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h3>Employee Not Found</h3>
          <Button variant="outline" onClick={() => navigate('/admin/employees')} style={{ marginTop: '16px' }}>
            <ArrowLeft size={16} /> Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumb Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleWrapper}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/admin/employees')}>Employees</span>
            <span>/</span>
            <span>{employee.name}</span>
          </div>
          <h2 className={styles.title}>{employee.name}</h2>
        </div>
        
        <Button variant="outline" onClick={() => setEditModalOpen(true)}>
          <Edit2 size={16} />
          Edit Profile &amp; Permissions
        </Button>
      </div>

      <div className={styles.profileLayout}>
        {/* Left Side: Avatar Card */}
        <div className={styles.leftCard}>
          {employee.photo && (
            <img src={employee.photo} alt={employee.name} className={styles.avatar} />
          )}
          <div>
            <h3 className={styles.empName}>{employee.name}</h3>
            <p className={styles.empRole}>{employee.role || '--'}</p>
            <div style={{ marginTop: '8px' }}>
              <Badge variant={employee.status === 'Active' ? 'success' : 'warning'}>
                {employee.status || 'Unknown'}
              </Badge>
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.contactInfoList}>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>Email Address</span>
              <span className={styles.contactValue}>{employee.email || '--'}</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>Contact Number</span>
              <span className={styles.contactValue}>{employee.phone || '--'}</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>Office Location</span>
              <span className={styles.contactValue}>{employee.location || '--'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Details Grid */}
        <div className={styles.rightCard}>
          <div>
            <h3 className={styles.sectionTitle}>Employment Profile</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Employee ID</span>
                <span className={styles.detailsValue}>{employee.employee_code || '--'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Department</span>
                <span className={styles.detailsValue}>{employee.department || '--'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Line Manager</span>
                <span className={styles.detailsValue}>{employee.lineManager || 'System Administrator'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Date of Hire</span>
                <span className={styles.detailsValue}>
                  {employee.join_date ? new Date(employee.join_date).toLocaleDateString([], { month: 'long', day: '2-digit', year: 'numeric' }) : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Clearances & Security Section */}
          <div style={{ marginTop: '16px' }}>
            <h3 className={styles.sectionTitle}>Security Credentials &amp; Clearances</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Assigned Clearance Level</span>
                <span className={styles.detailsValue}>{employee.security_clearance || 'Level 1 (Standard Employee)'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Role clearance Group</span>
                <span className={styles.detailsValue}>{employee.role_clearance || 'Employee'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Access Permission Scope</span>
                <span className={styles.detailsValue}>{employee.department_access || 'Own Department Only'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Payroll Access Permission</span>
                <span className={styles.detailsValue}>{employee.payroll_permission || 'View Only'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Leave Approvals Permission</span>
                <span className={styles.detailsValue}>{employee.leave_permission || 'Apply Only'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Attendance Logs Permission</span>
                <span className={styles.detailsValue}>{employee.attendance_permission || 'Check-in/Check-out Only'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Recruitment Systems Permission</span>
                <span className={styles.detailsValue}>{employee.recruitment_permission || 'No Access'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Employee Directory Permission</span>
                <span className={styles.detailsValue}>{employee.employee_management_permission || 'No Access'}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h3 className={styles.sectionTitle}>Compensation &amp; Structure</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Base Salary</span>
                <span className={styles.detailsValue} style={{ color: 'var(--primary-color)' }}>
                  {employee.salary_breakdown?.basic_salary ? `$${parseFloat(employee.salary_breakdown.basic_salary).toLocaleString()}/month` : '--'}
                </span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Payroll Cycle</span>
                <span className={styles.detailsValue}>{employee.payrollCycle || 'Monthly (End of month)'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Employment Type</span>
                <span className={styles.detailsValue}>{employee.employmentType || 'Full-time Permanent'}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Standard Working Hours</span>
                <span className={styles.detailsValue}>{employee.workingHours || '40 hours / week'}</span>
              </div>
            </div>
          </div>

          {employee.resume_url && (
            <div style={{ marginTop: '16px' }}>
              <h3 className={styles.sectionTitle}>Resume Attachment</h3>
              <div style={{ 
                padding: '14px', 
                backgroundColor: 'var(--bg-main)', 
                borderRadius: 'var(--border-radius-md)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {employee.resume_name || 'Resume Document'}
                  </div>
                  {employee.resume_date && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Uploaded on {employee.resume_date}
                    </div>
                  )}
                </div>
                <a 
                  href={employee.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--primary-color)',
                    border: '1px solid var(--primary-color)',
                    borderRadius: 'var(--border-radius-sm)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--primary-color)';
                  }}
                >
                  View / Open
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Details Dialog Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Employee & Clearances"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateSubmit}>
              Save Updates
            </Button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
          <Input 
            label="Full Name" 
            placeholder="Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          
          <Input 
            label="Email Address" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              label="Job Role" 
              placeholder="Sr. Solutions Architect" 
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              label="Monthly Base Salary" 
              placeholder="$9,200" 
              value={salary} 
              onChange={(e) => setSalary(e.target.value)} 
              required 
            />
            <div className={styles.formGroup}>
              <label className={styles.label}>Status State</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className={styles.select}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Clearances Assignment Inputs */}
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '14px', marginTop: '10px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '10px' }}>Role Permissions & Clearances</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Clearance Level</label>
                <select 
                  value={securityClearance} 
                  onChange={(e) => setSecurityClearance(e.target.value)}
                  className={styles.select}
                >
                  <option value="Level 1 (Standard Employee)">Level 1 (Employee)</option>
                  <option value="Level 2 (HR Officer)">Level 2 (HR Officer)</option>
                  <option value="Level 3 (Full Administration)">Level 3 (Administrator)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Role Group Designation</label>
                <select 
                  value={roleClearance} 
                  onChange={(e) => setRoleClearance(e.target.value)}
                  className={styles.select}
                >
                  <option value="Employee">Employee</option>
                  <option value="HR Administrator">HR Administrator</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Department Access</label>
                <select 
                  value={departmentAccess} 
                  onChange={(e) => setDepartmentAccess(e.target.value)}
                  className={styles.select}
                >
                  <option value="Own Department Only">Own Department Only</option>
                  <option value="All Departments">All Departments</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Payroll Access</label>
                <select 
                  value={payrollPermission} 
                  onChange={(e) => setPayrollPermission(e.target.value)}
                  className={styles.select}
                >
                  <option value="View Only">View Only</option>
                  <option value="Read & Write">Read & Write</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Leave Management</label>
                <select 
                  value={leavePermission} 
                  onChange={(e) => setLeavePermission(e.target.value)}
                  className={styles.select}
                >
                  <option value="Apply Only">Apply Only</option>
                  <option value="Read & Write">Read & Write</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Attendance Management</label>
                <select 
                  value={attendancePermission} 
                  onChange={(e) => setAttendancePermission(e.target.value)}
                  className={styles.select}
                >
                  <option value="Check-in/Check-out Only">Check-in/Check-out Only</option>
                  <option value="Read & Write">Read & Write</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Recruitment System</label>
                <select 
                  value={recruitmentPermission} 
                  onChange={(e) => setRecruitmentPermission(e.target.value)}
                  className={styles.select}
                >
                  <option value="No Access">No Access</option>
                  <option value="Full Access">Full Access</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Employee Management</label>
                <select 
                  value={employeeManagementPermission} 
                  onChange={(e) => setEmployeeManagementPermission(e.target.value)}
                  className={styles.select}
                >
                  <option value="No Access">No Access</option>
                  <option value="Full Access">Full Access</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminEmployeeDetails;
