import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  CheckCircle2, 
  CalendarDays, 
  Wallet, 
  ShieldCheck, 
  BarChart3 
} from 'lucide-react';
import { Button } from '../components/UIElements';
import styles from './Landing.module.css';

export const Landing = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleGetStartedClick = () => {
    navigate('/register');
  };

  const features = [
    {
      icon: Users,
      iconBg: '#eef2ff',
      iconColor: 'var(--primary-color)',
      title: "Employee Management",
      desc: "Centralized employee files with automated onboarding, dynamic organization charting, and profile settings."
    },
    {
      icon: CheckCircle2,
      iconBg: '#ecfdf5',
      iconColor: 'var(--success)',
      title: "Attendance Tracking",
      desc: "Real-time check-in logs, geofencing, shift logs, and dynamic timeline visualization for global teams."
    },
    {
      icon: CalendarDays,
      iconBg: '#eff6ff',
      iconColor: '#3b82f6',
      title: "Leave Approvals",
      desc: "Tabbed request queues, multi-level workflows, and interactive team availability grids."
    },
    {
      icon: Wallet,
      iconBg: '#faf5ff',
      iconColor: '#a855f7',
      title: "Smart Payroll",
      desc: "Automated payment runs, payslip generation, and direct budget allocations with compliance records."
    },
    {
      icon: ShieldCheck,
      iconBg: '#f0fdf4',
      iconColor: '#22c55e',
      title: "Secure Access",
      desc: "Granular administrative roles, role-specific sidebars, and enterprise security protocols."
    },
    {
      icon: BarChart3,
      iconBg: '#fff1f2',
      iconColor: '#f43f5e',
      title: "Workforce Analytics",
      desc: "Real-time attendance graphs, approval velocity, and comprehensive reporting views."
    }
  ];

  return (
    <div className={styles.landing}>
      {/* Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.brand}>
            <LayoutGrid size={26} strokeWidth={2.5} />
            <span>Nexus HR</span>
          </Link>
          
          <nav className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#about" className={styles.navLink}>About</a>
            <a href="#contact" className={styles.navLink}>Contact</a>
          </nav>

          <div className={styles.headerActions}>
            <button type="button" className={styles.loginBtn} onClick={handleLoginClick}>
              Login
            </button>
            <Button variant="primary" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroRow}>
          <div className={styles.heroLeft}>
            <div className={styles.pillWrapper}>
              <span className={styles.pill}>Enterprise AI Workforce Management</span>
            </div>
            <h1 className={styles.title}>
              Scale Your Workforce with <span className={styles.titleHighlight}>Intelligence</span>
            </h1>
            <p className={styles.subtitle}>
              The next-generation HRMS suite built for high-growth modern enterprises. Automate attendance, leaves, payroll, and staff directories with data-driven insights.
            </p>
            <div className={styles.heroButtons}>
              <Button variant="primary" onClick={handleGetStartedClick}>
                Get Started Free
              </Button>
              <Button variant="outline" onClick={handleLoginClick}>
                Employee Login
              </Button>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.mockupWrapper}>
              <div className={styles.browserHeader}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
              <div className={styles.mockupGraphic}>
                <div className={styles.mockupSidebar}></div>
                <div className={styles.mockupMain}>
                  <div className={styles.mockupLine} style={{ width: '40%', height: '14px', backgroundColor: '#cbd5e1' }}></div>
                  <div className={styles.mockupLine} style={{ width: '85%' }}></div>
                  <div className={styles.mockupLine} style={{ width: '60%' }}></div>
                  <div className={styles.mockupLine} style={{ width: '75%' }}></div>
                  <div className={styles.mockupLine} style={{ width: '50%' }}></div>
                </div>
                
                <div className={styles.badgeWidget}>
                  <span className={styles.badgeWidgetLabel}>Workforce Efficiency</span>
                  <span className={styles.badgeWidgetValue}>+ 24.8%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid Section */}
        <section id="features" className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>A Complete Human Capital Suite</h2>
          <p className={styles.sectionSubtitle}>Precision tools for modern people operations.</p>
          
          <div className={styles.featureList}>
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className={styles.featureCard}>
                  <div 
                    className={styles.featureIcon} 
                    style={{ backgroundColor: feat.iconBg, color: feat.iconColor }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className={styles.featureTitle}>{feat.title}</h3>
                  <p className={styles.featureDesc}>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Call To Action */}
        <section className={styles.ctaWrapper}>
          <div className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>Ready to transform your HR?</h2>
            <p className={styles.ctaDesc}>
              Join over 2,000+ global enterprises that trust Nexus HR for managing their directories, payroll compliance, and attendance tracking.
            </p>
            <div className={styles.ctaButtons}>
              <button type="button" className={styles.btnCtaWhite} onClick={handleGetStartedClick}>
                Get Started Now
              </button>
              <button type="button" className={styles.btnCtaOutline} onClick={handleGetStartedClick}>
                Book a Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Expanded Multi-Column Footer */}
      <footer className={styles.footerOuter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogo}>
              <LayoutGrid size={22} strokeWidth={2.5} />
              <span>Nexus HR</span>
            </div>
            <p className={styles.footerDesc}>
              Enterprise workforce operations automated with intelligence. Scale your hiring, check-ins, payroll runs, and approvals on one single database.
            </p>
          </div>

          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Product</span>
            <ul className={styles.footerLinks}>
              <li className={styles.footerLinkItem}><a href="#features">Features</a></li>
              <li className={styles.footerLinkItem}><a href="#">Integrations</a></li>
              <li className={styles.footerLinkItem}><a href="#">Security Guard</a></li>
              <li className={styles.footerLinkItem}><a href="#">Enterprise Support</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Company</span>
            <ul className={styles.footerLinks}>
              <li className={styles.footerLinkItem}><a href="#">About Us</a></li>
              <li className={styles.footerLinkItem}><a href="#">Careers</a></li>
              <li className={styles.footerLinkItem}><a href="#">Customers</a></li>
              <li className={styles.footerLinkItem}><a href="#">Press Kit</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <span className={styles.footerColTitle}>Resources</span>
            <ul className={styles.footerLinks}>
              <li className={styles.footerLinkItem}><a href="#">Help Center</a></li>
              <li className={styles.footerLinkItem}><a href="#">API Reference</a></li>
              <li className={styles.footerLinkItem}><a href="#">Legal & GDPR</a></li>
              <li className={styles.footerLinkItem}><a href="#">System Status</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 Nexus HR Global. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>SLA Agreement</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
