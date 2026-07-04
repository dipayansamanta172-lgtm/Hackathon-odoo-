import React from 'react';
import { 
  UserPlus, 
  BadgeCheck, 
  Asterisk, 
  ChevronRight, 
  LogIn, 
  Receipt 
} from 'lucide-react';
import styles from './RecentActivityList.module.css';

export const RecentActivityList = ({ 
  title = "Recent Activity", 
  activities = [], 
  interactive = false,
  onItemClick 
}) => {
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_hire':
        return { icon: UserPlus, class: styles.badgeNewHire };
      case 'payroll_approval':
      case 'leave_approve':
        return { icon: BadgeCheck, class: styles.badgeApproval };
      case 'leave_request':
        return { icon: Asterisk, class: styles.badgeLeave };
      case 'check_in':
        return { icon: LogIn, class: styles.badgeCheckIn };
      case 'payroll':
        return { icon: Receipt, class: styles.badgePayroll };
      default:
        return { icon: Asterisk, class: styles.badgeApproval };
    }
  };

  return (
    <div className={styles.activityContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <button className={styles.viewAll}>View All</button>
      </div>
      
      <div className={styles.list}>
        {activities.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px 16px', 
            color: 'var(--text-muted)', 
            fontWeight: 600,
            fontSize: '0.85rem'
          }}>
            No recent activity.
          </div>
        ) : (
          activities.map((act) => {
            const config = getActivityIcon(act.type);
            const Icon = config.icon;
            
            return (
              <div 
                key={act.id} 
                className={`${styles.item} ${interactive ? styles.interactiveItem : ''}`}
                onClick={() => interactive && onItemClick && onItemClick(act)}
              >
                <div className={styles.leftSection}>
                  <div className={`${styles.avatarWrapper} ${config.class}`}>
                    {act.userPhoto ? (
                      <img src={act.userPhoto} alt="" className={styles.avatar} />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>
                  
                  <div className={styles.textSection}>
                    <span className={styles.itemTitle}>{act.title}</span>
                    <span className={styles.itemTime}>{act.time}</span>
                  </div>
                </div>
                
                {interactive && (
                  <ChevronRight className={styles.chevron} size={18} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivityList;
