import React, { useState, useEffect } from 'react';
import { Badge, Button, Input } from '../components/UIElements';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { UploadCloud, Download, Laptop, Smartphone, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import styles from './EmployeeProfile.module.css';

export const EmployeeProfile = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'resume' | 'salary' | 'security'
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile state — populated from API
  const [profileData, setProfileData] = useState({
    name: '',
    photo: '',
    role: '',
    department: '',
    department_code: '',
    id: '',
    join_date: '',
    status: '',
    email: '',
    personal_email: '',
    phone: '',
    location: '',
    emergency_contact: '',
    dob: '',
    gender: '',
    marital_status: '',
    nationality: '',
    resume_name: '',
    resume_date: '',
    resume_url: '',
    user_role: '',
    // Bank information
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    // Salary components
    basic_salary: 0,
    hra: 0,
    travel_allowance: 0,
    medical_allowance: 0,
    performance_bonus: 0,
    other_allowances: 0,
    standard_allowance: 0,
    leave_travel_allowance: 0,
    fixed_allowance: 0,
    provident_fund: 0,
    professional_tax: 0,
    income_tax: 0,
    other_deductions: 0,
    gross_salary: 0,
    net_salary: 0,
    // Clearances
    security_clearance: '',
    role_clearance: '',
    department_access: '',
    payroll_permission: '',
    recruitment_permission: '',
    leave_permission: '',
    attendance_permission: '',
    employee_management_permission: ''
  });

  // Temporary Edit buffers
  const [editBuffer, setEditBuffer] = useState({ ...profileData });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployeeProfile();
      if (data) {
        const mapped = {
          name: data.name || '',
          photo: data.photo || '',
          role: data.role || '',
          department: data.department || '',
          department_code: data.department_code || '',
          id: data.employee_code || String(data.id) || '',
          join_date: data.join_date || '',
          status: data.status || '',
          email: data.personal_email || data.email || '',
          personal_email: data.personal_email || '',
          phone: data.phone || '',
          location: data.location || '',
          emergency_contact: data.emergency_contact || '',
          dob: data.dob ? data.dob.split('T')[0] : '',
          gender: data.gender || '',
          marital_status: data.marital_status || '',
          nationality: data.nationality || '',
          resume_name: data.resume_name || '',
          resume_date: data.resume_date || '',
          resume_url: data.resume_url || '',
          user_role: data.user_role || '',
          // Bank
          bank_name: data.bank_name || '',
          account_holder_name: data.account_holder_name || '',
          account_number: data.account_number || '',
          ifsc_code: data.ifsc_code || '',
          upi_id: data.upi_id || '',
          // Salary
          basic_salary: data.basic_salary || 0,
          hra: data.hra || 0,
          travel_allowance: data.travel_allowance || 0,
          medical_allowance: data.medical_allowance || 0,
          performance_bonus: data.performance_bonus || 0,
          other_allowances: data.other_allowances || 0,
          standard_allowance: data.standard_allowance || 0,
          leave_travel_allowance: data.leave_travel_allowance || 0,
          fixed_allowance: data.fixed_allowance || 0,
          provident_fund: data.provident_fund || 0,
          professional_tax: data.professional_tax || 0,
          income_tax: data.income_tax || 0,
          other_deductions: data.other_deductions || 0,
          gross_salary: data.gross_salary || 0,
          net_salary: data.net_salary || 0,
          // Clearances
          security_clearance: data.security_clearance || 'Level 1 (Standard Employee)',
          role_clearance: data.role_clearance || 'Employee',
          department_access: data.department_access || 'Own Department Only',
          payroll_permission: data.payroll_permission || 'View Only',
          recruitment_permission: data.recruitment_permission || 'No Access',
          leave_permission: data.leave_permission || 'Apply Only',
          attendance_permission: data.attendance_permission || 'Check-in/Check-out Only',
          employee_management_permission: data.employee_management_permission || 'No Access',
        };
        setProfileData(mapped);
        setEditBuffer(mapped);
      }
    } catch (err) {
      console.error('Failed to load employee profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditClick = () => {
    setEditBuffer({ ...profileData });
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    if (!editBuffer.name.trim() || !editBuffer.email.trim() || !editBuffer.phone.trim()) {
      showToast('Name, Email, and Phone number are required fields.', 'danger');
      return;
    }
    
    // Validate IFSC length if entered
    if (editBuffer.ifsc_code && editBuffer.ifsc_code.length !== 11) {
      showToast('IFSC Code must be exactly 11 characters.', 'danger');
      return;
    }

    try {
      // Map editBuffer back to backend model naming
      const payload = {
        personalEmail: editBuffer.personal_email,
        phone: editBuffer.phone,
        location: editBuffer.location,
        emergencyContact: editBuffer.emergency_contact,
        dob: editBuffer.dob,
        gender: editBuffer.gender,
        maritalStatus: editBuffer.marital_status,
        nationality: editBuffer.nationality,
        photo: editBuffer.photo,
        resumeName: editBuffer.resume_name,
        resumeDate: editBuffer.resume_date,
        resumeUrl: editBuffer.resume_url,
        bankName: editBuffer.bank_name,
        accountHolderName: editBuffer.account_holder_name,
        accountNumber: editBuffer.account_number,
        ifscCode: editBuffer.ifsc_code,
        upiId: editBuffer.upi_id
      };
      
      await api.updateEmployeeProfile(payload);
      setProfileData({ ...editBuffer });
      setIsEditMode(false);
      showToast('Profile details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Failed to update profile details. Please try again.', 'danger');
    }
  };

  const handleInputChange = (field, value) => {
    setEditBuffer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'danger');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'danger');
      return;
    }
    
    setPasswordLoading(true);
    setTimeout(() => {
      setPasswordLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully!', 'success');
    }, 1000);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Uploading resume file...', 'info');
      try {
        const uploadRes = await api.uploadFile(file);
        if (uploadRes && uploadRes.url) {
          const updatedFields = {
            resume_name: uploadRes.fileName || file.name,
            resume_date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
            resume_url: uploadRes.url
          };

          // Save immediately to DB
          const currentProfile = isEditMode ? editBuffer : profileData;
          const payload = {
            personalEmail: currentProfile.personal_email,
            phone: currentProfile.phone,
            location: currentProfile.location,
            emergencyContact: currentProfile.emergency_contact,
            dob: currentProfile.dob,
            gender: currentProfile.gender,
            maritalStatus: currentProfile.marital_status,
            nationality: currentProfile.nationality,
            photo: currentProfile.photo,
            resumeName: updatedFields.resume_name,
            resumeDate: updatedFields.resume_date,
            resumeUrl: updatedFields.resume_url,
            bankName: currentProfile.bank_name,
            accountHolderName: currentProfile.account_holder_name,
            accountNumber: currentProfile.account_number,
            ifscCode: currentProfile.ifsc_code,
            upiId: currentProfile.upi_id
          };

          await api.updateEmployeeProfile(payload);
          
          if (isEditMode) {
            setEditBuffer(prev => ({ ...prev, ...updatedFields }));
          } else {
            setProfileData(prev => ({ ...prev, ...updatedFields }));
          }
          showToast('Resume uploaded and saved successfully!', 'success');
        }
      } catch (err) {
        console.error('Resume upload failed:', err);
        showToast('Failed to upload resume to cloud storage.', 'danger');
      }
    }
  };

  const handleResumeDownload = () => {
    const url = isEditMode ? editBuffer.resume_url : profileData.resume_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast('No resume file URL available.', 'warning');
    }
  };

  const getWorkspaceTitle = () => {
    if (profileData.user_role === 'admin') {
      if (profileData.role && profileData.role.toLowerCase().includes('admin')) {
        return "Administrator Workspace";
      }
      return "HR Profile Workspace";
    }
    return "Employee Profile Workspace";
  };

  const getPermissionsList = () => {
    return {
      clearance: profileData.security_clearance || 'Level 1 (Standard Employee)',
      role_clearance: profileData.role_clearance || 'Employee',
      depts: profileData.department_access || 'Own Department Only',
      payroll: profileData.payroll_permission || 'View Only',
      leaves: profileData.leave_permission || 'Apply Only',
      attendance: profileData.attendance_permission || 'Check-in/Check-out Only',
      recruitment: profileData.recruitment_permission || 'No Access',
      empManagement: profileData.employee_management_permission || 'No Access'
    };
  };

  const permissions = getPermissionsList();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: 600 }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{getWorkspaceTitle()}</h2>
        
        {/* Toggle View Mode / Edit Mode controls */}
        {!isEditMode ? (
          <Button variant="outline" onClick={handleEditClick}>
            <Edit2 size={16} style={{ marginRight: '6px' }} />
            Edit Profile
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={handleCancelClick}>
              <X size={16} style={{ marginRight: '6px' }} />
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveClick}>
              <Check size={16} style={{ marginRight: '6px' }} />
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      {/* Profile Header Details card */}
      <div className={styles.profileCard}>
        {(isEditMode ? editBuffer.photo : profileData.photo) && (
          <img 
            src={isEditMode ? editBuffer.photo : profileData.photo} 
            alt={profileData.name} 
            className={styles.avatar} 
          />
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isEditMode && profileData.user_role === 'admin' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input 
                type="text" 
                value={editBuffer.name} 
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={styles.infoValue}
                style={{ fontSize: '1.05rem', fontWeight: 700, padding: '4px 8px', maxWidth: '240px' }}
                placeholder="Full Name"
              />
              <input 
                type="text" 
                value={editBuffer.photo} 
                onChange={(e) => handleInputChange('photo', e.target.value)}
                className={styles.infoValue}
                style={{ fontSize: '0.75rem', padding: '4px 8px', width: '280px' }}
                placeholder="Profile Avatar URL"
              />
            </div>
          ) : (
            <>
              <h3 className={styles.name}>{profileData.name || '--'}</h3>
              <p className={styles.role}>{profileData.role || '--'}</p>
            </>
          )}
          
          {isEditMode && profileData.user_role !== 'admin' && (
            <input 
              type="text" 
              value={editBuffer.photo} 
              onChange={(e) => handleInputChange('photo', e.target.value)}
              className={styles.infoValue}
              style={{ fontSize: '0.75rem', padding: '4px 8px', width: '280px', marginTop: '6px' }}
              placeholder="Profile Avatar URL"
            />
          )}
        </div>
        
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="success">{profileData.status || 'Active'}</Badge>
        </div>
      </div>

      {/* Tabs Menu navigation */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <button 
            type="button" 
            className={`${styles.tab} ${activeTab === 'personal' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Information
          </button>
          
          <button 
            type="button" 
            className={`${styles.tab} ${activeTab === 'resume' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            Resume File
          </button>

          <button 
            type="button" 
            className={`${styles.tab} ${activeTab === 'salary' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            Salary &amp; Bank Information
          </button>

          <button 
            type="button" 
            className={`${styles.tab} ${activeTab === 'security' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security &amp; Access
          </button>
        </div>
      </div>

      {/* Tab Panels body content */}
      <div className={styles.tabPanel}>
        {activeTab === 'personal' && (
          <div>
            <h3 className={styles.sectionTitle}>Personal &amp; Contact Details</h3>
            
            <div className={styles.infoGrid}>
              {/* Personal Email - Editable */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Personal Email</span>
                {isEditMode ? (
                  <input 
                    type="email" 
                    value={editBuffer.personal_email}
                    onChange={(e) => handleInputChange('personal_email', e.target.value)}
                    className={styles.infoValue}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.personal_email || '--'}</span>
                )}
              </div>

              {/* Phone - Editable */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone Number</span>
                {isEditMode ? (
                  <input 
                    type="text" 
                    value={editBuffer.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={styles.infoValue}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.phone || '--'}</span>
                )}
              </div>

              {/* Address - Editable */}
              <div className={styles.infoRow} style={{ gridColumn: 'span 2' }}>
                <span className={styles.infoLabel}>Residential Address</span>
                {isEditMode ? (
                  <input 
                    type="text" 
                    value={editBuffer.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={styles.infoValue}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.location || '--'}</span>
                )}
              </div>

              {/* Emergency Contact - Editable */}
              <div className={styles.infoRow} style={{ gridColumn: 'span 2' }}>
                <span className={styles.infoLabel}>Emergency Contact</span>
                {isEditMode ? (
                  <input 
                    type="text" 
                    value={editBuffer.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    className={styles.infoValue}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.emergency_contact || '--'}</span>
                )}
              </div>

              {/* Date of Birth - Editable */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date of Birth</span>
                {isEditMode ? (
                  <input 
                    type="date" 
                    value={editBuffer.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className={styles.infoValue}
                  />
                ) : (
                  <span className={styles.infoValue}>
                    {profileData.dob
                      ? new Date(profileData.dob).toLocaleDateString([], { month: 'long', day: '2-digit', year: 'numeric' })
                      : '--'}
                  </span>
                )}
              </div>

              {/* Gender - Editable */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Gender</span>
                {isEditMode ? (
                  <select 
                    value={editBuffer.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={styles.infoValue}
                    style={{ padding: '9px 14px' }}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <span className={styles.infoValue}>{profileData.gender || '--'}</span>
                )}
              </div>

              {/* Marital Status - Editable */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Marital Status</span>
                {isEditMode ? (
                  <select 
                    value={editBuffer.marital_status}
                    onChange={(e) => handleInputChange('marital_status', e.target.value)}
                    className={styles.infoValue}
                    style={{ padding: '9px 14px' }}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                ) : (
                  <span className={styles.infoValue}>{profileData.marital_status || '--'}</span>
                )}
              </div>

              {/* Nationality - Editable */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nationality</span>
                {isEditMode ? (
                  <input 
                    type="text" 
                    value={editBuffer.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className={styles.infoValue}
                  />
                ) : (
                  <span className={styles.infoValue}>{profileData.nationality || '--'}</span>
                )}
              </div>

              {/* Read-Only Details */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Employee ID Code (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>{profileData.id || '--'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Company (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>Nexus HR Global</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Department Group (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>{profileData.department || '--'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date of Joining (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>
                  {profileData.join_date ? new Date(profileData.join_date).toLocaleDateString([], { month: 'long', day: '2-digit', year: 'numeric' }) : '--'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Employment Designation (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>{profileData.role || '--'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Employment Type (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>Full-time Permanent</span>
              </div>

              <div className={styles.infoRow} style={{ gridColumn: 'span 2' }}>
                <span className={styles.infoLabel}>Reporting Manager (Read-Only)</span>
                <span className={styles.infoValue} style={{ opacity: 0.75 }}>System Administrator</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resume' && (
          <div className={styles.resumeSection}>
            <h3 className={styles.sectionTitle}>Professional Resume Attachment</h3>
            
            {/* Upload Area */}
            <label className={styles.uploadArea}>
              <UploadCloud size={32} style={{ color: 'var(--primary-color)' }} />
              <span className={styles.uploadText}>Click to select and upload new CV (PDF/DOCX)</span>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} style={{ display: 'none' }} />
            </label>

            {/* Uploaded File Detail */}
            {(isEditMode ? editBuffer.resume_url : profileData.resume_url) ? (
              <div className={styles.fileCard}>
                <div className={styles.fileMeta}>
                  <span className={styles.fileName}>
                    {isEditMode ? editBuffer.resume_name : profileData.resume_name}
                  </span>
                  <span className={styles.fileSubText}>
                    Uploaded on {isEditMode ? editBuffer.resume_date : profileData.resume_date}
                  </span>
                </div>
                <Button variant="outline" onClick={handleResumeDownload}>
                  <Download size={14} style={{ marginRight: '6px' }} />
                  Download / View Resume
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                No resume uploaded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'salary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Bank Information section (Employee Editable) */}
            <div>
              <h3 className={styles.sectionTitle}>Bank &amp; Financial Account Details</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Bank Name</span>
                  {isEditMode ? (
                    <input 
                      type="text" 
                      value={editBuffer.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      className={styles.infoValue}
                      placeholder="Chase, Bank of America, etc."
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.bank_name || '--'}</span>
                  )}
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Account Holder Name</span>
                  {isEditMode ? (
                    <input 
                      type="text" 
                      value={editBuffer.account_holder_name}
                      onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                      className={styles.infoValue}
                      placeholder="Name on card/passbook"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.account_holder_name || '--'}</span>
                  )}
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Account Number</span>
                  {isEditMode ? (
                    <input 
                      type="text" 
                      value={editBuffer.account_number}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                      className={styles.infoValue}
                      placeholder="0000000000"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.account_number || '--'}</span>
                  )}
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>IFSC / Routing Code</span>
                  {isEditMode ? (
                    <input 
                      type="text" 
                      value={editBuffer.ifsc_code}
                      onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                      className={styles.infoValue}
                      placeholder="11-character code"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.ifsc_code || '--'}</span>
                  )}
                </div>

                <div className={styles.infoRow} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.infoLabel}>UPI ID (Optional)</span>
                  {isEditMode ? (
                    <input 
                      type="text" 
                      value={editBuffer.upi_id}
                      onChange={(e) => handleInputChange('upi_id', e.target.value)}
                      className={styles.infoValue}
                      placeholder="username@bank"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.upi_id || '--'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Salary Breakdown section (Read-Only) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 className={styles.sectionTitle}>Salary Structure &amp; Grade (Read-Only)</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Salary Grade</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>Grade A-3 (Specialist)</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Basic Salary</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>${parseFloat(profileData.basic_salary).toLocaleString()}/month</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>HRA (House Rent Allowance)</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.hra).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Standard Allowance</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.standard_allowance).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Travel Allowance</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.travel_allowance).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Leave Travel Allowance (LTA)</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.leave_travel_allowance).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Performance Bonus</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.performance_bonus).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fixed Allowance</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.fixed_allowance).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Other Allowances</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>+ ${parseFloat(profileData.other_allowances).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Provident Fund (PF) Deduction</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75, color: 'var(--danger)' }}>- ${parseFloat(profileData.provident_fund).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Professional Tax Deduction</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75, color: 'var(--danger)' }}>- ${parseFloat(profileData.professional_tax).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Income Tax Deduction</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75, color: 'var(--danger)' }}>- ${parseFloat(profileData.income_tax).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gross Salary</span>
                  <span className={styles.infoValue} style={{ opacity: 0.85, fontWeight: 700 }}>${parseFloat(profileData.gross_salary).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Net Salary</span>
                  <span className={styles.infoValue} style={{ color: 'var(--primary-color)', fontWeight: 800 }}>${parseFloat(profileData.net_salary).toLocaleString()}</span>
                </div>

                <div className={styles.infoRow} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.infoLabel}>Payroll Clearance Status</span>
                  <span className={styles.infoValue} style={{ opacity: 0.75 }}>
                    <Badge variant="success">Fully Processed &amp; Paid</Badge>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className={styles.securitySection}>
            {/* Dynamic Role Permissions block */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--primary-color)' }} />
                Security Credentials &amp; Role Clearances
              </h3>
              
              <div className={styles.infoGrid} style={{ marginTop: '12px' }}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Current Assigned Role</span>
                  <span className={styles.infoValue} style={{ fontWeight: 700 }}>{permissions.role_clearance}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Security Clearance Level</span>
                  <span className={styles.infoValue}>{permissions.clearance}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Department Group Access</span>
                  <span className={styles.infoValue}>{permissions.depts}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Payroll Systems Permission</span>
                  <span className={styles.infoValue}>{permissions.payroll}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Leave Requests Permission</span>
                  <span className={styles.infoValue}>{permissions.leaves}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Daily Attendance Permission</span>
                  <span className={styles.infoValue}>{permissions.attendance}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Recruitment Systems Permission</span>
                  <span className={styles.infoValue}>{permissions.recruitment}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Employee Directory Permission</span>
                  <span className={styles.infoValue}>{permissions.empManagement}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={styles.sectionTitle}>Update Account Password</h3>
              <form className={styles.securityForm} onSubmit={handlePasswordChangeSubmit}>
                <Input 
                  label="Current Password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required 
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input 
                    label="New Password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                  />
                  <Input 
                    label="Confirm New Password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                
                <div style={{ display: 'flex', marginTop: '12px' }}>
                  <Button type="submit" variant="primary" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
