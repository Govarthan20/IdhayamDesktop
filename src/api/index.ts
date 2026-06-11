import {
  BASE_URL, VEHICLE_TRACKING_URL, VEHICLE_TRACKING_FALLBACK_URL,
  FALLBACK_CUSTOMER_ID, FALLBACK_BRANCH_ID, FALLBACK_CUST_TYPE, API_TOKEN,
} from './config';

export { AuthService } from './auth';

const deepParse = (val: any): any => {
  if (typeof val === 'string') {
    try { return deepParse(JSON.parse(val)); } catch { return val; }
  }
  return val;
};

const fetchWithTimeout = async (url: string, options: any, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export async function checkAppVersion(): Promise<any> {
  const appVersion = '6.7';
  const payload = { mobilenumber: appVersion, otp: '', frm_dt: '', to_dt: '' };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'CLOUDAPP_KEY', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const textData = await response.text();
    return textData ? JSON.parse(textData) : { success: true };
  } catch {
    return { success: false };
  }
}

export async function getCustomerBalance(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: custId, B: FALLBACK_CUST_TYPE };
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'CUST_BALANCE_CHK', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    }, 8000);
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const balance = parseFloat(inner.NAME ?? '0') || 0;
      const pendingOrder = parseFloat(inner.DMOBNO ?? '0') || 0;
      return { balance: balance.toFixed(2), pendingOrder: pendingOrder.toFixed(2), netBalance: (balance - pendingOrder).toFixed(2) };
    }
  } catch { }
  return { balance: '0.00', pendingOrder: '0.00', netBalance: '0.00' };
}

const resolveTripId = (v: any): string => {
  const fromCode = String(v.TRIP_CODE || v.tripCode || '').replace(/^R/i, '').trim();
  if (fromCode && fromCode !== '0') return fromCode;
  const fromId = String(v.TRIP_ID ?? v.Trip_Id ?? v.tripId ?? '').trim();
  if (fromId && fromId !== '0') return fromId;
  return String(v.API_TRIP_ID || v.TRIP_TRANS_ID || '').trim();
};

const extractVehicleRows = (inner: any): any[] => {
  if (!inner) return [];
  if (Array.isArray(inner)) return inner;
  if (Array.isArray(inner.Table)) return inner.Table;
  if (inner.Table) return [inner.Table];
  if (Array.isArray(inner.Items)) return inner.Items;
  if (inner.Items) return [inner.Items];
  if (Array.isArray(inner.List)) return inner.List;
  return [inner];
};

const mapVehicleRows = (rows: any[], branchId: string) =>
  rows
    .filter((v: any) => v && (v.VEHICLE_NO || v.BUS_NO || v.REF_NO || v.TRIP_CODE || resolveTripId(v)))
    .map((v: any) => ({
      vehicleNo: v.VEHICLE_NO || v.BUS_NO || v.Vehicle_No || v.vehicleNo || '—',
      tripRefNo: v.REF_NO || v.Ref_No || v.TRIP_REF_NO || v.tripRefNo || '',
      tripId: resolveTripId(v),
      tripTransId: String(v.TRIP_TRANS_ID || v.ID || ''),
      branchId: String(v.BRANCH_ID || v.branchId || branchId || '51'),
    }))
    .filter((v) => v.tripRefNo && v.tripId);

const fetchInvoicedVehicleList = async (custId: string, branchId: string, mode: string) => {
  const payload = { A: custId, B: branchId, C: 'GetInvoicedVehicleList' };
  const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
    method: 'POST',
    headers: { 'F': 'CheckVehicleDetails', 'MODE': mode, 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
  });
  const outer = deepParse(await response.text());
  const isSuccess = outer?.success === true || outer?.success === 'true';
  if (!isSuccess || !outer?.result) return [];
  const inner = deepParse(outer.result);
  return mapVehicleRows(extractVehicleRows(inner), branchId);
};

export async function getInvoicedVehicleList(custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
  try {
    const mobile = await fetchInvoicedVehicleList(custId, branchId, 'MOBILE');
    if (mobile.length > 0) return mobile;
    return await fetchInvoicedVehicleList(custId, branchId, 'SCHOOL');
  } catch { }
  return [];
}

const sanitizeCoord = (val: any): number => {
  const n = parseFloat(String(val ?? '').replace(/[\s\t\r\n]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const parseVehicleTracking = (outer: any, tripRefNo = '') => {
  if (!outer) return null;
  const isSuccess = outer?.success === true || outer?.success === 'true' || outer?.success === 1;
  if (!isSuccess && !outer?.result) return null;

  const raw = outer?.result ?? outer?.data ?? outer;
  const inner = deepParse(raw);
  const rows = Array.isArray(inner) ? inner : inner ? [inner] : [];
  if (rows.length === 0) return null;

  const data = (tripRefNo
    ? rows.find((r: any) => r?.REF_NO === tripRefNo || r?.refNo === tripRefNo)
    : null) || rows[0];
  if (!data || typeof data !== 'object') return null;

  const lat = sanitizeCoord(data.LATITUDE ?? data.latitude);
  const lng = sanitizeCoord(data.LONGITUDE ?? data.longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  const trackings = data.BUS_STATUS_TRACKINGS ?? data.busStatusTrackings;
  const routeStops = trackings
    ? (Array.isArray(trackings) ? trackings : [trackings]).map((t: any) => ({
        lat: sanitizeCoord(t.LATITUDE ?? t.latitude),
        lng: sanitizeCoord(t.LONGITUDE ?? t.longitude),
        address: (t.ADDRS || t.STOP_NAME || t.address || 'Stop').replace(/\\r\\n/g, ', '),
        status: t.STATUS || t.status || 'NotStarted',
        refNo: t.REF_NO || '',
      })).filter((t: any) => !isNaN(t.lat) && !isNaN(t.lng))
    : [];

  const currentAddress = (data.ADDRS || 'Current Location').replace(/\\r\\n/g, ', ');
  const stops = hasCoords
    ? [{ lat, lng, address: currentAddress, status: data.STATUS || 'In Progress', isCurrent: true }, ...routeStops]
    : routeStops;

  return {
    latitude: hasCoords ? lat : (routeStops[0]?.lat ?? 8.411395),
    longitude: hasCoords ? lng : (routeStops[0]?.lng ?? 78.015017),
    status: data.STATUS || data.status || 'In Progress',
    vehicleNo: data.VEHICLE_NO || data.BUS_NO || data.vehicleNo || '',
    tripRefNo: data.REF_NO || tripRefNo,
    tripName: data.TRIP_NAME || data.TRIP_CODE || '',
    stops,
    lastUpdated: new Date().toISOString(),
  };
};

const requestVehicleTracking = async (baseUrl: string, payload: Record<string, string>) => {
  const response = await fetchWithTimeout(`${baseUrl}/APPEAL_UAT`, {
    method: 'POST',
    headers: {
      'F': 'GetVehicleTrackingStatus',
      'MODE': 'SCHOOL',
      'P': '',
      'J': JSON.stringify(payload),
      'M': 'POST',
      'Authorization': API_TOKEN,
    },
  }, 12000);
  const text = await response.text();
  if (!text) return null;
  return parseVehicleTracking(deepParse(text), payload.F);
};

export async function getVehicleTracking(branchId: string, tripId: string, tripRefNo: string): Promise<any> {
  if (!tripId || !tripRefNo) return null;
  const payload = {
    A: String(branchId || '51'),
    B: String(tripId),
    C: 'GetVehicleTrackingStatus',
    D: '',
    E: 'No',
    F: tripRefNo,
    G: 'PARTY',
  };
  const urls = [VEHICLE_TRACKING_URL, VEHICLE_TRACKING_FALLBACK_URL];
  for (const baseUrl of urls) {
    try {
      const data = await requestVehicleTracking(baseUrl, payload);
      if (data) return data;
    } catch { }
  }
  return null;
}

export async function getDiscountSummary(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: custId, B: FALLBACK_CUST_TYPE, C: 'DISCOUNT_NAME', D: '' };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'CUST_DISCOUNT_SUM', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      return Array.isArray(inner) ? inner : [inner];
    }
  } catch { }
  return [];
}

export async function getDiscountDetail(discountIds: string, type: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: custId, B: FALLBACK_CUST_TYPE, C: 'DISCOUNT_DETAIL', D: type, E: discountIds };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'CUST_DISCOUNT', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      return Array.isArray(inner) ? inner : [inner];
    }
  } catch { }
  return [];
}

export async function getOrderItems(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchOrderItems', 'MODE': 'MOBILE', 'P': `Cust_Id=${custId}`, 'J': '', 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const rows = Array.isArray(inner) ? inner : [inner];
      return rows.map((item: any) => ({
        id: String(item.ITEM_ID || item.ID || item.Id || ''),
        name: item.ITEM_DESC || item.Item_Desc || 'Unknown Item',
        price: parseFloat(item.PLUS_TAX || item.Plus_Tax || item.APP_PRICE || '0').toFixed(2),
        appPrice: parseFloat(item.APP_PRICE || item.App_Price || '0').toFixed(2),
        unit: item.SALES_UOM || item.Sales_Uom || 'Pcs',
        category: item.ITEM_GRP_NAME || item.Item_Grp_Name || '',
        igSort: parseInt(item.IG_SORT ?? item.IG_Sort ?? '9999', 10),
        imSort: parseInt(item.SORT ?? item.IM_SORT ?? item.IM_Sort ?? '9999', 10),
        mrp: parseFloat(item.APP_MRP || item.App_Mrp || '0').toFixed(2),
        tax: item.TAX_PER ? `${item.TAX_PER}%` : '0%',
        raw: item,
      }));
    }
  } catch { }
  return [];
}

export async function getPriceList(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  return getOrderItems(custId);
}

const orderErrorMessage = (outer: any): string => {
  if (outer?.message) return String(outer.message);
  if (typeof outer?.result === 'string' && outer.result.trim()) return outer.result;
  if (outer?.result?.message) return String(outer.result.message);
  return 'Server error';
};

export async function submitOrder(
  custId: string,
  orderDetails: any[],
  branchId = FALLBACK_BRANCH_ID,
  userId = '2937',
): Promise<any> {
  const effectiveCustId = custId || FALLBACK_CUSTOMER_ID;
  const effectiveBranchId = branchId || FALLBACK_BRANCH_ID;
  const items = orderDetails.map((o: any) => {
    const raw = o.raw || {};
    const box = parseInt(String(o.box || '0'), 10) || 0;
    const pcs = parseInt(String(o.pcs || '0'), 10) || 0;
    const convFactor = parseFloat(raw.CONV_FACTOR || '1') || 1;
    const totalPcs = o.totalPcs != null ? Number(o.totalPcs) : (box * convFactor) + pcs;
    const unitPrice = parseFloat(raw.PLUS_TAX ?? raw.Plus_Tax ?? o.price ?? raw.APP_PRICE ?? o.appPrice ?? '0');
    const lineAmt = +(totalPcs * unitPrice).toFixed(2);
    const taxRate = parseFloat(raw.TAX_PER || '0') || 0;
    const taxAmt = +((lineAmt * taxRate) / 100).toFixed(2);
    const totalAmt = +(lineAmt + taxAmt).toFixed(2);
    return {
      ...raw,
      ITEM_ID: raw.ITEM_ID || o.id,
      ORD_QTY: totalPcs,
      ORD_PCS: pcs,
      TOTAL_BOX: box,
      BOX_QTY: box,
      PCS_QTY: pcs,
      APP_PRICE: unitPrice,
      APP_LINE_AMT: lineAmt,
      APP_ORDER_AMT: totalAmt,
      TOTAL_AMOUNT: totalAmt,
      TAX_PER: taxAmt,
      BRANCH_ID: parseInt(String(effectiveBranchId), 10) || 0,
      USR_ID: parseInt(String(userId), 10) || 2937,
    };
  });
  const payload = {
    A: effectiveCustId,
    B: JSON.stringify(items),
    C: effectiveBranchId,
    D: '', E: '', F: '', G: '', H: '', I: '', J: '',
  };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: {
        'F': 'OrderCreation',
        'MODE': 'MOBILE',
        'P': '',
        'J': '',
        'M': 'POST',
        'Authorization': API_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const outer = deepParse(await response.text());
    if (import.meta.env.DEV) console.warn('[OrderCreation] response:', outer);
    const isSuccess = outer?.success === true || outer?.success === 'true';
    if (isSuccess) {
      return { success: true, orderId: outer.result || 'SUCCESS', message: outer.message || 'Order placed successfully' };
    }
    return { success: false, message: orderErrorMessage(outer) };
  } catch (e) {
    if (import.meta.env.DEV) console.error('[OrderCreation] failed:', e);
    return { success: false, message: 'Network request failed' };
  }
}

export async function getOrderList(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
  const payload = { A: fromDate, B: toDate, C: 'ORD', D: branchId, E: custId };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchOrderList', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const rows = Array.isArray(inner) ? inner : [inner];
      rows.sort((a: any, b: any) => (Number(b.SO_ID) || 0) - (Number(a.SO_ID) || 0));
      const stripTime = (val: any): string => val ? String(val).split('T')[0] : '—';
      return rows.map((o: any) => ({
        id: String(o.SO_ID || o.ID || '—'),
        orderNo: String(o.ORDER_NO_STR || o.ORDER_NO || '—'),
        date: stripTime(o.ORDER_DATE || o.ORD_DATE_STR),
        amount: o.TOTAL_AMOUNT ?? o.NET_AMT ?? 0,
        status: o.STATUS || '—',
        group: o.IG_DISP || o.ITEM_GRP_NAME || '',
        itemName: o.DISPLAY_NAME || o.ITEM_DESC || '',
        perBox: o.PACKING_FACTOR || o.CONV_FACTOR || '',
        price: o.SELLING_PRICE || o.APP_PRICE || 0,
        ordBox: o.TOTAL_BOX || 0, ordPcs: o.PCS || 0,
        cnfBox: o.INV_BOX || 0, cnfPcs: o.INV_QTY || 0,
        raw: o,
      }));
    }
  } catch { }
  return [];
}

export async function getInvoiceList(fromDate: string, toDate: string, type: 'SI' | 'CNDN' = 'SI', branchId = FALLBACK_BRANCH_ID, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: fromDate, B: toDate, C: type, D: branchId, E: custId };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchBills', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      return Array.isArray(inner) ? inner : [inner];
    }
  } catch { }
  return [];
}

export async function getCreditDebitNotes(fromDate: string, toDate: string, branchId = FALLBACK_BRANCH_ID, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: fromDate, B: toDate, C: 'CNDN', D: branchId, E: custId };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchBills', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const rows = Array.isArray(inner) ? inner : [inner];
      const stripTime = (val: any): string => val ? String(val).split('T')[0].split(' ')[0] : '—';
      return rows.map((r: any) => ({
        id: r.BILL_NO || r.ID || '—',
        billId: r.ID != null ? String(r.ID) : '—',
        date: stripTime(r.BILL_DATE || r.DATE),
        amount: r.NET_AMT || r.AMOUNT || '0',
        type: r.BILL_TYPE || r.TYPE || 'CNDN',
        custName: r.CUST_NAME || r.PARTY || '',
        branchId: r.BRANCH_ID || branchId,
        raw: r,
      }));
    }
  } catch { }
  return [];
}

export async function downloadBillPdf(type: 'SI' | 'CNDN', billIds: string, branchId = FALLBACK_BRANCH_ID): Promise<any> {
  const payload = { A: type, B: billIds, C: branchId };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchBillsPdf', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      let url: string | null = null;
      if (typeof inner === 'string' && inner.startsWith('http')) url = inner;
      else if (typeof inner === 'object' && inner !== null) {
        url = inner.URL || inner.url || inner.REPORT_URL || null;
        if (!url) url = (Object.values(inner) as string[]).find((v: string) => typeof v === 'string' && v.startsWith('http')) || null;
      }
      if (url) return { success: true, url };
    }
  } catch { }
  return { success: false, message: 'Failed to generate PDF' };
}

export async function getTransactionList(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: fromDate, B: toDate, C: custId };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchTransDetails', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) return { success: true, url: outer.result };
  } catch { }
  return { success: false, message: 'Failed to fetch statement URL' };
}

export async function getNewTransactionDetailsPdf(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'FetchTransDetailsPdf', 'MODE': 'MOBILE', 'P': `Cust_Id=${custId}`, 'J': '', 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const url = typeof inner === 'string' ? inner : inner.URL || inner.url || inner.DMOBNO;
      return { success: true, url };
    }
  } catch { }
  return { success: false, message: 'Failed to generate PDF' };
}

const RAW_TOKEN = '5HNdr62cpgiZ/Op3AU/uuUXRpkUVurMbVZPrUE+nOF1iHgazGrL8iWUU2jRuPPbU';

export async function getContactInfo(custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID, custType = FALLBACK_CUST_TYPE): Promise<any> {
  const payload = { otp: branchId, mobilenumber: RAW_TOKEN, frm_dt: custId, to_dt: custType };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'APP_Contact', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      return Array.isArray(inner) ? inner : [inner];
    }
  } catch { }
  return [];
}

export async function getBankDetails(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
  const payload = { A: custId, B: FALLBACK_CUST_TYPE };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'CUST_VitrualAcc_CHK', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      return Array.isArray(inner) ? inner : [inner];
    }
  } catch { }
  return [];
}
