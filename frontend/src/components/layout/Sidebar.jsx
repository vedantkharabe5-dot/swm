'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/dashboard/bins', label: 'Smart Bins', icon: '🗑️' },
  { href: '/dashboard/routes', label: 'Route Optimizer', icon: '🗺️' },
  { href: '/dashboard/fleet', label: 'Fleet Management', icon: '🚛' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/alerts', label: 'Alert Center', icon: '🚨' },
  { href: '/dashboard/zones', label: 'Zones', icon: '📍' },
  { href: '/portal', label: 'Citizen Portal', icon: '🏘️' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(api.getUser());
  }, []);

  const handleLogout = () => {
    api.clearToken();
    router.push('/login');
  };

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>♻️</div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>SmartWaste</span>
            <span className={styles.logoSub}>Pro</span>
          </div>
        )}
        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item) ? styles.active : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            {isActive(item) && <div className={styles.activeIndicator} />}
          </Link>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className={styles.userMeta}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userRole}>{user.role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className={styles.logoutBtn} onClick={handleLogout}>
              ↗ Logout
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
