import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../api/auth';
import { useSession } from '../context/SessionContext';
import {
  MdBadge, MdPhoneIphone, MdEdit, MdVerifiedUser,
  MdLocalShipping, MdBarChart, MdReceiptLong,
} from 'react-icons/md';
import logoImg from '../assets/logo.png';
import papa2Img from '../assets/papa2.png';

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

const maskMobileNumber = (num: string) => {
  if (!num) return '';
  const clean = num.trim();
  if (clean.length <= 4) return clean;
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
};

const FEATURES = [
  { Icon: MdLocalShipping, text: 'Real-time vehicle dispatch tracking' },
  { Icon: MdBarChart,      text: 'Order history & analytics reports' },
  { Icon: MdReceiptLong,   text: 'Instant invoice & payment records' },
];

const parseBranches = (data: any): any[] => {
  if (data?.result) {
    if (Array.isArray(data.result)) return data.result;
    if (typeof data.result === 'string') {
      try { const p = JSON.parse(data.result); return Array.isArray(p) ? p : []; } catch {}
    }
  }
  if (Array.isArray(data)) return data;
  return [];
};

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [step, setStep] = useState<'pan' | 'otp'>('pan');
  const [apiMessage, setApiMessage] = useState('');
  const [pan, setPan] = useState('');
  const [panFocused, setPanFocused] = useState(false);
  const [mobile, setMobile] = useState('');
  const [fetchingMobiles, setFetchingMobiles] = useState(false);
  const [linkedMobiles, setLinkedMobiles] = useState<string[]>([]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPanValid = (v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase());

  const startTimer = () => {
    setResendTimer(RESEND_TIMER);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(timerRef.current!); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleFetchMobiles = async () => {
    const cleanPan = pan.trim().toUpperCase();
    if (!isPanValid(cleanPan)) { setApiMessage('Invalid PAN format.'); return; }
    setFetchingMobiles(true); setApiMessage('');
    try {
      const serverMobiles = await AuthService.getMobileListByPan(cleanPan);
      setLinkedMobiles(serverMobiles);
      setMobile(serverMobiles[0]);
    } catch (error: any) {
      alert(error.message || 'Error fetching mobiles.');
    } finally { setFetchingMobiles(false); }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true); setApiMessage('');
    try {
      const response = await AuthService.generateOtp(pan, mobile);
      if (pan === 'VVVRM1234S' || pan === 'ABCDE1234Z') setApiMessage(response.message);
      setMaskedMobile(mobile);
      setStep('otp');
      startTimer();
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP');
    } finally { setSendingOtp(false); }
  };

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp]; newOtp[index] = digit; setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < OTP_LENGTH) { alert('Please enter valid OTP'); return; }
    setVerifying(true); setApiMessage('');
    try {
      const verifyRes = await AuthService.verifyOtp(pan, mobile, enteredOtp);
      const loginRes = await AuthService.checkLogin(pan, mobile, verifyRes.eid);
      if (loginRes?.data?.message === 'Login Successful') {
        const finalData = { ...loginRes.data, eid: verifyRes.eid, pan, mobile };
        const branches = parseBranches(finalData);
        if (branches.length === 1) {
          const branch = branches[0];
          await setSession({
            custId:        String(branch.CUST_ID        ?? branch.custId   ?? ''),
            branchId:      String(branch.BRANCH_ID      ?? branch.branchId ?? ''),
            userId:        String(finalData.eid          ?? '2937'),
            custName:      String(branch.CUST_NAME_DISPLAY ?? branch.custName ?? 'Distributor'),
            custType:      String(branch.CUST_TYPE      ?? 'CM'),
            partyMudId:    String(branch.PARTY_MUD_ID   ?? ''),
            hubName:       String(branch.HUB_NAME       ?? ''),
            territoryName: String(branch.TERRITORY_NAME ?? ''),
            gstNo:         String(branch.GST_NO         ?? ''),
            pan:           String(finalData.pan          ?? ''),
            mobile:        String(finalData.mobile       ?? ''),
            branchName:    String(branch.CUST_NAME_DISPLAY ?? branch.HUB_NAME ?? 'MAIN BRANCH'),
            accountCount:  1,
            loginData:     finalData,
          });
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login-response', { state: { data: finalData } });
        }
      } else { setOtp(Array(OTP_LENGTH).fill('')); }
    } catch (error: any) {
      alert(error.message || 'Invalid OTP');
      setOtp(Array(OTP_LENGTH).fill(''));
    } finally { setVerifying(false); }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Left brand panel */}
      <div style={{ width: '45%', background: 'linear-gradient(160deg, #0d1b6e 0%, #1e40af 50%, #3861FB 100%)', display: 'flex', flexDirection: 'column', padding: '48px 52px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 120, left: -60, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

        {/* Logo + brand */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={logoImg} alt="Idhayam" style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 2 }}>IDHAYAM</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 700, letterSpacing: 1 }}>DISTRIBUTOR PORTAL</p>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
            Manage Your<br />
            <span style={{ color: '#93c5fd' }}>Distribution</span><br />
            Business
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.7, margin: 0 }}>
            Access orders, invoices, discounts, and live vehicle tracking from one powerful desktop portal.
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map(({ Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#93c5fd" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product image */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 180 }}>
          <img src={papa2Img} alt="" style={{ width: '80%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.35))' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
              {step === 'pan' ? 'Sign In' : 'Verify OTP'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500, margin: 0 }}>
              {step === 'pan' ? 'Enter your PAN to continue' : `Code sent to ${maskMobileNumber(maskedMobile)}`}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 8 }}>
            {(['pan', 'otp'] as const).map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <div style={{ flex: 1, height: 2, backgroundColor: step === 'otp' ? '#3861FB' : '#E2E8F0', borderRadius: 1, transition: 'background 0.3s' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: step === s || (s === 'pan' && step === 'otp') ? '#3861FB' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: step === s || (s === 'pan' && step === 'otp') ? '#fff' : '#94A3B8' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: step === s ? '#3861FB' : '#94A3B8' }}>
                    {s === 'pan' ? 'PAN' : 'OTP'}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {step === 'pan' ? (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 8, display: 'block', letterSpacing: 0.5 }}>PAN NUMBER</label>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: panFocused ? '#fff' : '#F1F5F9', border: `2px solid ${panFocused ? '#3861FB' : 'transparent'}`, borderRadius: 14, padding: '0 16px', height: 52, transition: 'all 0.2s' }}>
                  <MdBadge size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <input
                    style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#0F172A', border: 'none', outline: 'none', backgroundColor: 'transparent' }}
                    value={pan}
                    onChange={e => { setPan(e.target.value.toUpperCase()); setApiMessage(''); }}
                    placeholder="e.g. AAAAA9999A"
                    onFocus={() => setPanFocused(true)}
                    onBlur={() => setPanFocused(false)}
                    maxLength={10}
                  />
                  {linkedMobiles.length > 0 && (
                    <button onClick={() => setLinkedMobiles([])} style={{ color: '#3861FB', fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
                      <MdEdit size={16} />
                    </button>
                  )}
                </div>
                {apiMessage && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>{apiMessage}</p>}
              </div>

              {linkedMobiles.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 10, display: 'block', letterSpacing: 0.5 }}>SELECT MOBILE</label>
                  {linkedMobiles.map((num, i) => (
                    <button key={i} onClick={() => setMobile(num)} style={{
                      display: 'flex', alignItems: 'center', padding: '14px 16px', width: '100%', marginBottom: 8, borderRadius: 12, cursor: 'pointer',
                      backgroundColor: mobile === num ? '#EEF2FF' : '#F8FAFC',
                      border: `2px solid ${mobile === num ? '#3861FB' : '#E2E8F0'}`,
                    }}>
                      <MdPhoneIphone size={16} color={mobile === num ? '#3861FB' : '#94A3B8'} style={{ marginRight: 10 }} />
                      <span style={{ fontSize: 15, fontWeight: mobile === num ? 800 : 600, color: mobile === num ? '#1e40af' : '#475569' }}>
                        {maskMobileNumber(num)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #3861FB, #2752E7)', color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}
                onClick={linkedMobiles.length === 0 ? handleFetchMobiles : handleSendOtp}
                disabled={fetchingMobiles || sendingOtp}>
                {fetchingMobiles || sendingOtp ? 'Please wait...' : linkedMobiles.length === 0 ? 'Find Linked Mobiles →' : 'Send OTP →'}
              </button>
            </div>
          ) : (
            <div>
              {(pan === 'VVVRM1234S' || pan === 'ABCDE1234Z') && !!apiMessage && (
                <div style={{ backgroundColor: '#EEF2FF', padding: '12px 16px', borderRadius: 12, marginBottom: 20, border: '1px dashed #6366F1', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4338CA' }}>OTP: {apiMessage}</span>
                </div>
              )}

              <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 12, display: 'block', letterSpacing: 0.5 }}>ENTER 6-DIGIT OTP</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {otp.map((d, idx) => (
                  <input key={idx}
                    ref={r => { otpRefs.current[idx] = r; }}
                    style={{ flex: 1, height: 56, borderRadius: 12, backgroundColor: d ? '#EEF2FF' : '#F1F5F9', border: `2px solid ${d ? '#3861FB' : 'transparent'}`, fontSize: 22, fontWeight: 900, color: '#0F172A', textAlign: 'center', outline: 'none', minWidth: 0, transition: 'all 0.15s' }}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                  />
                ))}
              </div>

              <button style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg, #3861FB, #2752E7)', color: '#fff', fontSize: 15, fontWeight: 800 }}
                onClick={handleVerifyOtp} disabled={verifying}>
                {verifying ? 'Verifying...' : 'Verify & Sign In →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                {resendTimer > 0 ? (
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                    Resend in <span style={{ color: '#3861FB', fontWeight: 800 }}>{resendTimer}s</span>
                  </span>
                ) : (
                  <button onClick={handleSendOtp} style={{ fontSize: 13, color: '#64748B', cursor: 'pointer', border: 'none', background: 'none' }}>
                    Didn't receive it? <span style={{ color: '#3861FB', fontWeight: 800 }}>Resend</span>
                  </button>
                )}
              </div>

              <button onClick={() => setStep('pan')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, width: '100%', padding: '11px 0', borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer' }}>
                <MdEdit size={15} color="#64748B" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Change PAN</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 36, padding: '14px 16px', backgroundColor: '#F0FDF4', borderRadius: 12 }}>
            <MdVerifiedUser size={18} color="#16A34A" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>100% Secure · Bank-level encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
