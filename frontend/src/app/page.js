'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = api.token || (typeof window !== 'undefined' && localStorage.getItem('swm_token'));
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div style={pageStyles.container}>
      {/* Animated Background */}
      <div style={pageStyles.bgOrbs}>
        <div style={{ ...pageStyles.orb, ...pageStyles.orb1 }} />
        <div style={{ ...pageStyles.orb, ...pageStyles.orb2 }} />
        <div style={{ ...pageStyles.orb, ...pageStyles.orb3 }} />
      </div>

      {/* Hero */}
      <main style={pageStyles.hero}>
        <div style={pageStyles.badge}>🌍 Powered by AI & IoT</div>
        <h1 style={pageStyles.title}>
          <span style={pageStyles.titleGradient}>SmartWaste</span>
          <span style={pageStyles.titleSub}> Pro</span>
        </h1>
        <p style={pageStyles.description}>
          Next-generation waste management platform that transforms cities into
          sustainable ecosystems. Real-time IoT monitoring, AI-powered route
          optimization, and predictive analytics — all in one dashboard.
        </p>

        <div style={pageStyles.stats}>
          {[
            { value: '40%', label: 'Cost Reduction' },
            { value: '60%', label: 'Recycling Boost' },
            { value: '99.9%', label: 'Uptime' },
            { value: '50+', label: 'Smart Sensors' },
          ].map((s, i) => (
            <div key={i} style={pageStyles.statBox}>
              <div style={pageStyles.statValue}>{s.value}</div>
              <div style={pageStyles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={pageStyles.features}>
          {[
            { icon: '📡', title: 'IoT Bin Monitoring', desc: 'Real-time fill levels, temperature, methane detection' },
            { icon: '🗺️', title: 'AI Route Optimization', desc: 'Reduce collection costs by 40% with smart routing' },
            { icon: '📊', title: 'Predictive Analytics', desc: 'Forecast fill rates and prevent overflows' },
            { icon: '🏆', title: 'Citizen Rewards', desc: 'Gamified recycling with points and leaderboards' },
            { icon: '🚛', title: 'Fleet Tracking', desc: 'Live GPS tracking of collection vehicles' },
            { icon: '🌱', title: 'Carbon Tracking', desc: 'Measure and reduce environmental impact' },
          ].map((f, i) => (
            <div key={i} style={pageStyles.featureCard}>
              <div style={pageStyles.featureIcon}>{f.icon}</div>
              <h3 style={pageStyles.featureTitle}>{f.title}</h3>
              <p style={pageStyles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={pageStyles.cta}>
          <button style={pageStyles.ctaBtn} onClick={() => router.push('/login')}>
            🚀 Launch Dashboard
          </button>
          <button style={pageStyles.ctaBtnSecondary} onClick={() => router.push('/register')}>
            Create Account
          </button>
        </div>
      </main>

      <footer style={pageStyles.footer}>
        <p>© 2026 SmartWaste Pro — Engineered for Sustainable Cities</p>
      </footer>

      <style jsx global>{`
        @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-40px) scale(1.1); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px,30px) scale(0.9); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,50px) scale(1.05); } }
      `}</style>
    </div>
  );
}

const pageStyles = {
  container: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrbs: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none', zIndex: 0,
  },
  orb: {
    position: 'absolute', borderRadius: '50%', filter: 'blur(80px)',
  },
  orb1: {
    width: 500, height: 500, top: '-10%', right: '-10%',
    background: 'rgba(16,185,129,0.08)', animation: 'float1 12s ease-in-out infinite',
  },
  orb2: {
    width: 400, height: 400, bottom: '10%', left: '-5%',
    background: 'rgba(59,130,246,0.08)', animation: 'float2 15s ease-in-out infinite',
  },
  orb3: {
    width: 300, height: 300, top: '40%', left: '50%',
    background: 'rgba(139,92,246,0.06)', animation: 'float3 10s ease-in-out infinite',
  },
  hero: {
    position: 'relative', zIndex: 1,
    maxWidth: 1200, margin: '0 auto', padding: '80px 24px 40px',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block', padding: '8px 20px', marginBottom: 24,
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 9999, fontSize: 14, fontWeight: 600, color: '#34d399',
  },
  title: { fontSize: 72, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24 },
  titleGradient: {
    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  titleSub: { color: '#64748b' },
  description: {
    fontSize: 18, lineHeight: 1.7, color: '#94a3b8', maxWidth: 700, margin: '0 auto 48px',
  },
  stats: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, maxWidth: 800,
    margin: '0 auto 64px',
  },
  statBox: {
    padding: '24px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, backdropFilter: 'blur(10px)',
  },
  statValue: { fontSize: 32, fontWeight: 800, color: '#10b981', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1000,
    margin: '0 auto 64px', textAlign: 'left',
  },
  featureCard: {
    padding: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, transition: 'all 0.3s',
  },
  featureIcon: { fontSize: 32, marginBottom: 16 },
  featureTitle: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 },
  featureDesc: { fontSize: 14, color: '#64748b', lineHeight: 1.6 },
  cta: { display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 80 },
  ctaBtn: {
    padding: '16px 40px', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(16,185,129,0.3)', transition: 'all 0.3s',
    fontFamily: 'var(--font-sans)',
  },
  ctaBtnSecondary: {
    padding: '16px 40px', fontSize: 16, fontWeight: 700, borderRadius: 12,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8',
    cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'var(--font-sans)',
  },
  footer: {
    position: 'relative', zIndex: 1, textAlign: 'center', padding: '24px',
    color: '#475569', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)',
  },
};
