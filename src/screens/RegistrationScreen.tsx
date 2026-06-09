import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdBadge, MdPhone, MdVerifiedUser, MdPerson } from 'react-icons/md';
import logoImg from '../assets/logo.png';
import papa1Img from '../assets/papa1.png';

const MOCK_PHONES = ['+91 98765 43210', '+91 94435 34646', '+91 76543 21098'];

const RegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pan, setPan] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerifyPan = () => {
    if (pan.trim().length < 10) { alert('Please enter a valid 10-character PAN number.'); return; }
    setStep(2);
  };

  const handleSendOtp = () => {
    if (!selectedPhone) { alert('Please select a mobile number.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setOtpSent(true); alert(`OTP sent to ${selectedPhone}`); }, 1200);
  };

  const handleRegister = () => {
    if (otp.trim().length !== 6) { alert('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 1200);
  };

  const STEPS = ['PAN Verify', 'Phone OTP', 'Complete'];

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ width: '42%', background: 'linear-gradient(160deg, #0d1b6e 0%, #1e40af 50%, #3861FB 100%)', display: 'flex', flexDirection: 'column', padding: '48px 44px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={logoImg} alt="Idhayam" style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 2 }}>IDHAYAM</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 700, letterSpacing: 1 }}>DISTRIBUTOR PORTAL</p>
            </div>
          </div>

          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <MdPerson size={26} color="#93c5fd" />
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', margin: '0 0 14px', lineHeight: 1.25 }}>New Account<br />Registration</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.7 }}>
            Register your distributor account using your PAN and linked mobile number.
          </p>

          {/* Step indicators */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: step > i + 1 ? '#86efac' : step === i + 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: step > i + 1 ? '#15803d' : step === i + 1 ? '#1e40af' : 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? '#fff' : 'rgba(255,255,255,0.5)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 180 }}>
          <img src={papa1Img} alt="" style={{ width: '80%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.35))' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <button onClick={() => step === 2 ? setStep(1) : navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, color: '#64748B', fontSize: 13, fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            <MdArrowBack size={18} />
            Back
          </button>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
            {step === 1 ? 'Verify PAN' : step === 2 ? 'Phone Verification' : 'All Done!'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 32px', fontWeight: 500 }}>
            {step === 1 ? 'Enter your Permanent Account Number'
              : step === 2 ? 'Select the mobile linked to your account'
              : 'Your account is now active'}
          </p>

          {step === 1 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>PAN NUMBER</label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, padding: '0 16px', height: 52, marginBottom: 24 }}>
                <MdBadge size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                <input style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#0F172A', border: 'none', outline: 'none', backgroundColor: 'transparent' }}
                  value={pan} onChange={e => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F" maxLength={10} />
              </div>
              <button style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #3861FB, #2752E7)', color: '#fff', fontSize: 15, fontWeight: 800 }} onClick={handleVerifyPan}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              {MOCK_PHONES.map(phone => (
                <button key={phone} onClick={() => setSelectedPhone(phone)} style={{
                  display: 'flex', alignItems: 'center', padding: '14px 16px', width: '100%', marginBottom: 10,
                  borderRadius: 12, cursor: 'pointer', border: `2px solid ${selectedPhone === phone ? '#3861FB' : '#E2E8F0'}`,
                  backgroundColor: selectedPhone === phone ? '#EEF2FF' : '#fff',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedPhone === phone ? '#3861FB' : '#CBD5E0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                    {selectedPhone === phone && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3861FB' }} />}
                  </div>
                  <MdPhone size={16} color={selectedPhone === phone ? '#3861FB' : '#94A3B8'} style={{ marginRight: 10 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: selectedPhone === phone ? '#1e40af' : '#475569' }}>{phone}</span>
                </button>
              ))}

              {!otpSent ? (
                <button style={{ width: '100%', marginTop: 16, padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #3861FB, #2752E7)', color: '#fff', fontSize: 15, fontWeight: 800 }} onClick={handleSendOtp} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP →'}
                </button>
              ) : (
                <div style={{ marginTop: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>6-DIGIT OTP</label>
                  <input style={{ width: '100%', fontSize: 24, fontWeight: 900, color: '#0F172A', padding: '12px 16px', borderRadius: 14, border: '2px solid #E2E8F0', backgroundColor: '#F8FAFC', boxSizing: 'border-box', outline: 'none', marginBottom: 16, letterSpacing: 8, textAlign: 'center' }}
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" maxLength={6} />
                  <button style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #10B981, #059669)', color: '#fff', fontSize: 15, fontWeight: 800 }} onClick={handleRegister} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify & Register →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <MdVerifiedUser size={40} color="#10B981" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Registration Successful!</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>Your account is now active. Welcome to Idhayam Distributor Portal.</p>
              <button style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #3861FB, #2752E7)', color: '#fff', fontSize: 15, fontWeight: 800 }} onClick={() => navigate('/dashboard')}>
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationScreen;
