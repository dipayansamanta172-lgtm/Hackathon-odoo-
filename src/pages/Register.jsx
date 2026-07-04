import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Mail, Lock, User, Building2, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/UIElements';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import styles from './Login.module.css';

export const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('employee'); // 'employee' | 'admin'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.register({ companyName, name, email, phone, password, role });
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Get started with your HR workspace</p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleRegister}>
          <Input
            label="Company Name"
            type="text"
            placeholder="Enterprise Corp"
            icon={Building2}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <Input
            label="Full Name"
            type="text"
            placeholder="Alex Pierce"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            type="text"
            placeholder="+1 (555) 019-2834"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          {/* Account Perspective Role Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Register As</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: '12px',
                fontSize: '0.92rem',
                outline: 'none',
                backgroundColor: 'var(--bg-input)',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <option value="employee">Employee</option>
              <option value="admin">Employer / HR Admin</option>
            </select>
          </div>

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create password"
            icon={Lock}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </Button>
        </form>

        <div className={styles.divider}></div>

        <div className={styles.registerRow}>
          <span>Already have an account?</span>
          <Link to="/login" className={styles.registerLink}>Login</Link>
        </div>
      </div>

      <div className={styles.pageFooter}>
        <span className={styles.copyright}>© 2026 Nexus HR Global. All rights reserved.</span>
      </div>
    </div>
  );
};

export default Register;
