import React, { useState, useEffect } from 'react';
import { Badge, Button } from '../components/UIElements';
import { useToast } from '../context/ToastContext';
import { Edit2, Check, X } from 'lucide-react';
import { api } from '../services/api';
import styles from './EmployeeProfile.module.css'; // Reuse existing profile stylesheet

export const AdminProfile = () => {
  const { showToast } = useToast();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBuffer, setEditBuffer] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // Check localStorage for locally saved edits first
        const saved = localStorage.getItem('hrms_admin_profile');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setAdminData(parsed);
            setEditBuffer(parsed);
            setLoading(false);
            return;
          } catch {
            // Corrupted cache — fall through to API
          }
        }
        const data = await api.getEmployeeProfile();
        if (data) {
          setAdminData(data);
          setEditBuffer(data);
        }
      } catch (err) {
        console.error('Failed to load admin profile:', err);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleEditClick = () => {
    setEditBuffer({ ...adminData });
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!editBuffer.name?.trim() || !editBuffer.email?.trim() || !editBuffer.phone?.trim()) {
      showToast('Name, Email, and Phone number are required fields.', 'danger');
      return;
    }
    setAdminData({ ...editBuffer });
    localStorage.setItem('hrms_admin_profile', JSON.stringify(editBuffer));
    setIsEditMode(false);
    showToast('Admin Profile updated successfully!', 'success');
  };

  const handleInputChange = (field, value) => {
    setEditBuffer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: 600 }}>
        Loading profile...
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className={styles.container}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Profile</h2>
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
          No profile data available. Please complete setup.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Profile</h2>
        
        {/* View mode / Edit mode buttons */}
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
      
      {/* Profile Card header */}
      <div className={styles.profileCard}>
        {(isEditMode ? editBuffer.photo : adminData.photo) && (
          <img 
            src={isEditMode ? editBuffer.photo : adminData.photo} 
            alt={adminData.name} 
            className={styles.avatar} 
          />
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isEditMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input 
                type="text" 
                value={editBuffer.name || ''} 
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={styles.infoValue}
                style={{ fontSize: '1.05rem', fontWeight: 700, padding: '4px 8px', maxWidth: '240px' }}
                placeholder="Name"
              />
              <input 
                type="text" 
                value={editBuffer.photo || ''} 
                onChange={(e) => handleInputChange('photo', e.target.value)}
                className={styles.infoValue}
                style={{ fontSize: '0.75rem', padding: '4px 8px', width: '280px' }}
                placeholder="Profile Photo URL"
              />
            </div>
          ) : (
            <>
              <h3 className={styles.name}>{adminData.name}</h3>
              <p className={styles.role}>{adminData.role}</p>
            </>
          )}
        </div>
        
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="success">{adminData.status || 'Active'}</Badge>
        </div>
      </div>

      {/* Info grid */}
      <div className={styles.infoGrid}>
        {/* Admin ID - Read Only */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Admin ID (Read-Only)</span>
          <span className={styles.infoValue} style={{ opacity: 0.75 }}>{adminData.id || '--'}</span>
        </div>

        {/* Email - Editable */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Email</span>
          {isEditMode ? (
            <input 
              type="email" 
              value={editBuffer.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={styles.infoValue}
            />
          ) : (
            <span className={styles.infoValue}>{adminData.email || '--'}</span>
          )}
        </div>

        {/* Department - Editable */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Department</span>
          {isEditMode ? (
            <input 
              type="text" 
              value={editBuffer.department || ''}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className={styles.infoValue}
            />
          ) : (
            <span className={styles.infoValue}>{adminData.department || '--'}</span>
          )}
        </div>

        {/* Join Date - Editable */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Join Date</span>
          {isEditMode ? (
            <input 
              type="text" 
              value={editBuffer.joinDate || ''}
              onChange={(e) => handleInputChange('joinDate', e.target.value)}
              className={styles.infoValue}
            />
          ) : (
            <span className={styles.infoValue}>{adminData.joinDate || '--'}</span>
          )}
        </div>

        {/* Phone Number - Editable */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Phone Number</span>
          {isEditMode ? (
            <input 
              type="text" 
              value={editBuffer.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={styles.infoValue}
            />
          ) : (
            <span className={styles.infoValue}>{adminData.phone || '--'}</span>
          )}
        </div>

        {/* Location - Editable */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Location</span>
          {isEditMode ? (
            <input 
              type="text" 
              value={editBuffer.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={styles.infoValue}
            />
          ) : (
            <span className={styles.infoValue}>{adminData.location || '--'}</span>
          )}
        </div>

        {/* Other details - Editable */}
        <div className={styles.infoRow} style={{ gridColumn: 'span 2' }}>
          <span className={styles.infoLabel}>Other Details</span>
          {isEditMode ? (
            <input 
              type="text" 
              value={editBuffer.otherDetails || ''}
              onChange={(e) => handleInputChange('otherDetails', e.target.value)}
              className={styles.infoValue}
            />
          ) : (
            <span className={styles.infoValue}>{adminData.otherDetails || '--'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
