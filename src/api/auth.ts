import { API_TOKEN } from './config';

const API_URL = 'http://117.232.71.91:2101/MOB/APPEAL_UAT';

const btoa64 = (str: string): string => {
  try { return btoa(unescape(encodeURIComponent(str))); } catch { return btoa(str); }
};

export const AuthService = {
  async getMobileListByPan(pan: string): Promise<string[]> {
    const base64Pan = btoa64(pan);
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'F': 'GetmobileListByPan',
        'MODE': 'MOBILE',
        'P': `pan=${base64Pan}`,
        'J': '',
        'M': 'GET',
        'Authorization': API_TOKEN,
      },
    });
    const textData = await response.text();
    try {
      let outer = JSON.parse(textData);
      if (typeof outer === 'string') outer = JSON.parse(outer);
      if (outer?.success && typeof outer.result === 'string') {
        const innerArray = JSON.parse(outer.result);
        if (Array.isArray(innerArray)) {
          const mobiles = innerArray.map((item: any) => item.MOBNO || item.DMOBNO || '').filter(Boolean);
          if (mobiles.length > 0) return mobiles;
        }
      }
    } catch { }
    throw new Error('No linked mobiles found for this PAN. Please contact support.');
  },

  async generateOtp(pan: string, mobile: string): Promise<any> {
    const base64Pan = btoa64(pan);
    const deviceName = `Windows Desktop ## ${navigator.userAgent.slice(0, 50)}`;
    const payload = { mobilenumber: mobile, pan: base64Pan, pwd: deviceName };
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'F': 'Cust_OTP_GEN',
        'MODE': 'MOBILE',
        'P': '',
        'J': JSON.stringify(payload),
        'M': 'POST',
        'Authorization': API_TOKEN,
      },
    });
    const textData = await response.text();
    try {
      let parsed = JSON.parse(textData);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      const finalMsg = parsed.message || (parsed.result ? String(parsed.result) : 'OTP Sent');
      return { success: true, message: finalMsg };
    } catch {
      return { success: true, message: textData || 'OTP Sent' };
    }
  },

  async verifyOtp(pan: string, mobile: string, otp: string): Promise<any> {
    const base64Pan = btoa64(pan);
    const deviceName = `Windows Desktop ## ${navigator.userAgent.slice(0, 50)}`;
    const payload = { mobilenumber: mobile, pan: base64Pan, otp, pwd: deviceName };
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'F': 'Cust_OTP_VER',
        'MODE': 'MOBILE',
        'P': '',
        'J': JSON.stringify(payload),
        'M': 'POST',
        'Authorization': API_TOKEN,
      },
    });
    const textData = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(textData);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    } catch {
      throw new Error('Please enter a valid OTP');
    }
    let eid = '3004';
    if (parsed?.result) {
      const match = String(parsed.result).match(/\bid\s*:\s*['"]?([0-9a-zA-Z]+)['"]?/);
      if (match) eid = match[1];
    }
    if (parsed?.message === 'Register Successfull..') {
      return { success: true, message: 'Register Successfull..', eid };
    }
    throw new Error('Please enter a valid OTP');
  },

  async checkLogin(pan: string, mobile: string, eid: string = '3004'): Promise<any> {
    const base64Pan = btoa64(pan);
    const did = `WIN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const deviceName = `Windows ## Desktop ## win10`;
    const manualJson = `{"pan":"${base64Pan}","mobilenumber":"${mobile}","eid":"${eid}","did":"${did}","pname":"IDHAYAM","dmobno":"","deviceinfo":"${deviceName}"}`;
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'F': 'Cust_LOGIN_CHK',
        'MODE': 'MOBILE',
        'P': '',
        'J': manualJson,
        'M': 'POST',
        'Authorization': API_TOKEN,
      },
    });
    const textData = await response.text();
    try {
      let parsed = JSON.parse(textData);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return { success: true, data: parsed };
    } catch {
      return { success: true, data: textData };
    }
  },
};
