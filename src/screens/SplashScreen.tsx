import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAppVersion } from '../api';
import { useSession } from '../context/SessionContext';
import logoImg from '../assets/logo.png';
import papa1Img from '../assets/papa1.png';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session, isRestoring } = useSession();
  const [progress, setProgress] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    checkAppVersion().then((res) => {
      const text = typeof res === 'string' ? res : JSON.stringify(res);
      if (text && text.includes('EXPIRE')) alert('Update Required: Please update to the new version.');
    }).catch(() => {});

    const interval = setInterval(() => {
      setProgress(prev => { if (prev >= 100) { clearInterval(interval); return 100; } return prev + 2; });
    }, 60);
    const timer = setTimeout(() => setAnimDone(true), 3200);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (animDone && !isRestoring) {
      if (session?.custId) navigate('/dashboard', { replace: true });
      else navigate('/login', { replace: true });
    }
  }, [animDone, isRestoring, session, navigate]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', overflow: 'hidden', background: 'linear-gradient(135deg, #0d1b6e 0%, #1e3a8a 40%, #3861FB 100%)' }}>
      {/* Left content panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', position: 'relative' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          {/* Logo */}
          <div style={{ width: 120, height: 120, borderRadius: 30, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <img src={logoImg} alt="Idhayam" style={{ width: '85%', height: '85%', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>

          <h1 style={{ fontSize: 72, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 6, textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            IDHAYAM
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 8 }}>
            <div style={{ height: 1, width: 40, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 3 }}>SAY IDHAYAM · SPELL HEALTH</span>
            <div style={{ height: 1, width: 40, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </div>

          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 20, letterSpacing: 1 }}>
            Distributor Management Portal
          </p>

          {/* Progress bar */}
          <div style={{ marginTop: 60, width: 320 }}>
            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #93c5fd, #fff)', borderRadius: 2, transition: 'width 0.06s linear' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 3, margin: 0 }}>
              INITIALIZING... {progress}%
            </p>
          </div>
        </div>
      </div>

      {/* Right decorative panel */}
      <div style={{ width: 420, background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: '40px 20px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(13,27,110,0.5) 100%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 340, height: 340, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <img src={papa1Img} alt="" style={{ width: '88%', maxWidth: 360, objectFit: 'contain', filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.45))', animation: 'fadeIn 1s ease-out', position: 'relative', zIndex: 1 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <p style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 24, letterSpacing: 1 }}>v6.7.0 © 2026 Muthuraja Food Products</p>
      </div>
    </div>
  );
};

export default SplashScreen;
