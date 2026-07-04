import React from 'react';
import styles from './StatCard.module.css';

export const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  change, 
  changeType = 'positive', 
  theme = 'white',
  iconVariant = 'primary'
}) => {
  const isIndigo = theme === 'indigo';
  
  const getIconClass = () => {
    switch (iconVariant) {
      case 'success': return styles.iconSuccess;
      case 'danger': return styles.iconDanger;
      case 'warning': return styles.iconWarning;
      default: return styles.iconPrimary;
    }
  };

  const getChangeClass = () => {
    return changeType === 'negative' ? styles.changeNegative : styles.changePositive;
  };

  return (
    <div className={`${styles.card} ${isIndigo ? styles.themeIndigo : ''}`}>
      <div className={styles.topRow}>
        <div className={`${styles.iconWrapper} ${getIconClass()}`}>
          {Icon && <Icon size={22} />}
        </div>
        {change && !isIndigo && (
          <span className={`${styles.changeRate} ${getChangeClass()}`}>
            {change}
          </span>
        )}
        {change && isIndigo && (
          <span className={styles.changeRate} style={{ color: 'rgba(255,255,255,0.9)' }}>
            {change}
          </span>
        )}
      </div>
      <div>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
