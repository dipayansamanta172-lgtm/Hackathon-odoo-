import React from 'react';
import { Briefcase, Eye, Pencil, UserMinus } from 'lucide-react';
import { Badge } from './UIElements';
import styles from './EmployeeCard.module.css';

export const EmployeeCard = ({ employee, onView, onEdit, onDelete }) => {
  const { name, role, department, status, photo } = employee;
  const isActive = status === 'Active';

  return (
    <div className={styles.card}>
      <div className={styles.statusBadge}>
        <Badge variant={isActive ? 'success' : 'danger'}>
          {status}
        </Badge>
      </div>
      
      <div className={styles.infoSection}>
        {photo ? (
          <img 
            src={photo} 
            alt={name} 
            className={styles.avatar} 
          />
        ) : (
          <div 
            className={styles.avatar} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              fontWeight: 700,
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        
        <div className={styles.details}>
          <h4 className={styles.name}>{name}</h4>
          <span className={styles.role}>{role}</span>
          <div className={styles.department}>
            <Briefcase size={12} />
            <span>{department}</span>
          </div>
        </div>
      </div>

      
      <div className={styles.actions}>
        <button 
          className={styles.actionBtn} 
          onClick={() => onView && onView(employee)}
          title="View Profile"
        >
          <Eye size={16} />
        </button>
        
        <button 
          className={styles.actionBtn} 
          onClick={() => onEdit && onEdit(employee)}
          title="Edit Details"
        >
          <Pencil size={16} />
        </button>
        
        <button 
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`} 
          onClick={() => onDelete && onDelete(employee)}
          title="Toggle Status"
        >
          <UserMinus size={16} />
        </button>
      </div>
    </div>
  );
};

export default EmployeeCard;
