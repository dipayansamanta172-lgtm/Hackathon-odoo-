import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/UIElements';
import { api } from '../services/api';
import styles from './Login.module.css';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res && res.token) {
        localStorage.setItem('hrms_token', res.token);
        
        // Redirect automatically based on the database role returned by backend
        if (res.user && res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.brandHeader}>
        <div className={styles.logoIcon}>
          <LayoutGrid size={28} strokeWidth={2.5} />
        </div>
        <h1 className={styles.brandName}>Nexus HR</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Access your enterprise dashboard</p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleLogin}>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <div className={styles.passwordLabelRow}>
              <label className={styles.checkboxLabel} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
              <button type="button" className={styles.forgotBtn}>Forgot Password?</button>
            </div>
            
            <div style={{ marginTop: '6px' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                icon={Lock}
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.rememberRow}>
            <input type="checkbox" id="remember" className={styles.checkbox} defaultChecked />
            <label htmlFor="remember" className={styles.checkboxLabel}>Remember for 30 days</label>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
            {!loading && <ArrowRight size={18} />}
          </Button>
        </form>

        <div className={styles.divider}></div>

        <div className={styles.registerRow}>
          <span>Don't have an account?</span>
          <Link to="/register" className={styles.registerLink}>Register</Link>
        </div>
      </div>

      <div className={styles.pageFooter}>
        <span className={styles.identityText}>Enterprise Identity Provider</span>
        <span className={styles.copyright}>© 2026 Nexus HR Global. All rights reserved.</span>
        
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <a href="#" className={styles.footerLink}>Terms of Service</a>
          <a href="#" className={styles.footerLink}>Support</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
