import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './UIElements.module.css';

// Badge Component
export const Badge = ({ children, variant = 'success' }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'danger': return styles.badgeDanger;
      case 'warning': return styles.badgeWarning;
      case 'info': return styles.badgeInfo;
      default: return styles.badgeSuccess;
    }
  };

  return (
    <span className={`${styles.badge} ${getVariantClass()}`}>
      {children}
    </span>
  );
};

// Button Component
export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  fullWidth = false,
  disabled = false,
  className = ''
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary': return styles.btnSecondary;
      case 'outline': return styles.btnOutline;
      case 'danger': return styles.btnDanger;
      default: return styles.btnPrimary;
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${styles.btn} 
        ${getVariantClass()} 
        ${fullWidth ? styles.btnFull : ''} 
        ${className}
      `}
      style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = ({ 
  label, 
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name,
  required = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div className={`
        ${styles.inputFieldWrapper} 
        ${isFocused ? styles.inputFieldWrapperFocus : ''}
      `}>
        {Icon && <Icon className={styles.inputIcon} size={18} />}
        
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            ${styles.input} 
            ${Icon ? styles.inputWithIcon : ''} 
            ${RightIcon ? styles.inputWithRightIcon : ''}
          `}
        />
        
        {RightIcon && (
          <button 
            type="button" 
            className={styles.rightIconBtn}
            onClick={onRightIconClick}
          >
            <RightIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {children}
        </div>
        
        {footer && (
          <div className={styles.modalFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
