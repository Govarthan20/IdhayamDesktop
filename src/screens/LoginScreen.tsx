import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../api/auth';
import { useSession } from '../context/SessionContext';
import { MdBadge, MdPhoneIphone, MdEdit, MdVerifiedUser, MdLock } from 'react-icons/md';
import pappaCutout from '../assets/pappa-cutout.png';
import './LoginScreen.css';

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

const maskMobileNumber = (num: string) => {
  if (!num) return '';
  const clean = num.trim();
  if (clean.length <= 4) return clean;
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
};

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
  const [mobile, setMobile] = useState('');
  const [fetchingMobiles, setFetchingMobiles] = useState(false);
  const [linkedMobiles, setLinkedMobiles] = useState<string[]>([]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
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
      setOtpValue('');
      startTimer();
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP');
    } finally { setSendingOtp(false); }
  };

  const handleLogin = async () => {
    if (step === 'pan') {
      if (linkedMobiles.length === 0) {
        await handleFetchMobiles();
      } else {
        await handleSendOtp();
      }
      return;
    }

    const enteredOtp = otpValue.replace(/\D/g, '');
    if (enteredOtp.length < OTP_LENGTH) { alert('Please enter a valid 6-digit OTP'); return; }
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
      } else {
        setOtpValue('');
      }
    } catch (error: any) {
      alert(error.message || 'Invalid OTP');
      setOtpValue('');
    } finally { setVerifying(false); }
  };

  const handleBackToPan = () => {
    setStep('pan');
    setOtpValue('');
    setApiMessage('');
  };

  const isLoading = fetchingMobiles || sendingOtp || verifying;

  return (
    <div className="login-page">
      <div className="login-page__ambient" aria-hidden="true" />
      <img src={pappaCutout} alt="" className="login-page__pappa" aria-hidden="true" />

      <header className="login-page__header">
        <h1 className="login-page__title">IDHAYAM</h1>
        <p className="login-page__slogan">Say Idhayam · Say Healthy</p>
      </header>

      <div className="login-page__content">
        <section className="login-page__panel">
          <div className="login-card">
            <h2 className="login-card__heading">Distributor Login</h2>
            <p className="login-card__subheading">
              {step === 'pan'
                ? 'Sign in securely to access your Idhayam distributor portal'
                : `OTP sent to ${maskMobileNumber(maskedMobile)}. Enter it below to continue.`}
            </p>

            <div className="login-field">
              <label className="login-field__label" htmlFor="username">Username</label>
              <div className="login-field__input-wrap">
                <MdBadge size={20} />
                <input
                  id="username"
                  className={`login-field__input ${step === 'otp' ? 'login-field__input--readonly' : ''}`}
                  value={pan}
                  onChange={e => { if (step === 'pan') { setPan(e.target.value.toUpperCase()); setApiMessage(''); } }}
                  placeholder="Enter PAN number"
                  maxLength={10}
                  autoComplete="username"
                  readOnly={step === 'otp'}
                />
                {step === 'pan' && linkedMobiles.length > 0 && (
                  <button type="button" onClick={() => setLinkedMobiles([])} aria-label="Edit username" style={{ color: '#2563b0', padding: 4 }}>
                    <MdEdit size={18} />
                  </button>
                )}
              </div>
              {apiMessage && step === 'pan' && <p className="login-field__error">{apiMessage}</p>}
            </div>

            {step === 'pan' && linkedMobiles.length > 0 && (
              <div className="login-field">
                <span className="login-field__label">Registered Mobile</span>
                {linkedMobiles.map((num, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`login-mobile-option ${mobile === num ? 'login-mobile-option--selected' : ''}`}
                    onClick={() => setMobile(num)}
                  >
                    <MdPhoneIphone size={18} color={mobile === num ? '#2563b0' : '#94a3b8'} />
                    <span>{maskMobileNumber(num)}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 'otp' && (
              <>
                {(pan === 'VVVRM1234S' || pan === 'ABCDE1234Z') && !!apiMessage && (
                  <div className="login-otp-hint">OTP: {apiMessage}</div>
                )}

                <div className="login-field">
                  <label className="login-field__label" htmlFor="password">Password</label>
                  <div className="login-field__input-wrap">
                    <MdLock size={20} />
                    <input
                      id="password"
                      className="login-field__input"
                      type="password"
                      inputMode="numeric"
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={OTP_LENGTH}
                      autoComplete="one-time-code"
                    />
                  </div>
                </div>

                <div className="login-resend">
                  {resendTimer > 0 ? (
                    <span>Resend OTP in <strong style={{ color: '#2563b0' }}>{resendTimer}s</strong></span>
                  ) : (
                    <button type="button" onClick={handleSendOtp}>
                      Didn't receive it? <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              className="login-btn login-btn--primary"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : step === 'pan'
                  ? linkedMobiles.length === 0 ? 'Login' : 'Send OTP'
                  : 'Login'}
            </button>

            <button
              type="button"
              className="login-forgot"
              onClick={() => step === 'otp'
                ? handleBackToPan()
                : alert('For login assistance, please contact your Idhayam distributor support team.')}
            >
              {step === 'otp' ? (
                <>Back to <span>Username</span></>
              ) : (
                <>Forgot Password? <span>Get Support</span></>
              )}
            </button>

            <div className="login-secure">
              <MdVerifiedUser size={18} color="#16a34a" />
              <span>100% Secure · Bank-level encryption</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginScreen;
