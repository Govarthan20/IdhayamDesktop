import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAppVersion } from '../api';
import { useSession } from '../context/SessionContext';
import splashIcon from '../assets/splash-icon.png';

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
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <img
        src={splashIcon}
        alt="Idhayam"
        style={{
          width: 'min(320px, 72vw)',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(280px, 80vw)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{ height: 4, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3861FB, #2752E7)',
            borderRadius: 2,
            transition: 'width 0.06s linear',
          }} />
        </div>
        <div style={{ width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </div>
  );
};

export default SplashScreen;
