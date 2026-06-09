import {
  BASE_URL, FALLBACK_CUSTOMER_ID, FALLBACK_BRANCH_ID,
  FALLBACK_CUST_TYPE, API_TOKEN
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

export async function getInvoicedVehicleList(custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
  const payload = { A: custId, B: branchId, C: 'GetInvoicedVehicleList' };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'CheckVehicleDetails', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const rows = Array.isArray(inner) ? inner : [inner];
      const mapped = rows.map((v: any) => ({
        vehicleNo: v.VEHICLE_NO || v.BUS_NO || '—',
        tripRefNo: v.REF_NO || '',
        tripId: v.TRIP_ID || '',
        tripTransId: v.TRIP_TRANS_ID || v.ID || '',
        branchId: v.BRANCH_ID || branchId,
      }));
      return mapped.length > 0 ? mapped[0] : null;
    }
  } catch { }
  return null;
}

export async function getVehicleTracking(branchId: string, tripId: string, tripRefNo: string): Promise<any> {
  const payload = { A: branchId || '51', B: tripId, C: 'GetVehicleTrackingStatus', D: '', E: 'No', F: tripRefNo, G: 'PARTY' };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'GetVehicleTrackingStatus', 'MODE': 'MOBILE', 'P': '', 'J': JSON.stringify(payload), 'M': 'POST', 'Authorization': API_TOKEN },
    });
    const outer = deepParse(await response.text());
    if (outer?.success && outer?.result) {
      const inner = deepParse(outer.result);
      const data = Array.isArray(inner) ? inner[0] : inner;
      let stops: any[] = [];
      if (data.BUS_STATUS_TRACKINGS) {
        const trackings = Array.isArray(data.BUS_STATUS_TRACKINGS) ? data.BUS_STATUS_TRACKINGS : [data.BUS_STATUS_TRACKINGS];
        stops = trackings.map((t: any) => ({
          lat: parseFloat(t.LATITUDE), lng: parseFloat(t.LONGITUDE),
          address: t.ADDRS || t.STOP_NAME || 'Stop', status: t.STATUS
        })).filter((t: any) => !isNaN(t.lat) && !isNaN(t.lng));
      }
      if (data.LATITUDE && data.LONGITUDE) {
        stops.unshift({ lat: parseFloat(data.LATITUDE), lng: parseFloat(data.LONGITUDE), address: 'Current Location', status: data.STATUS || 'In Progress' });
      }
      return { latitude: parseFloat(data.LATITUDE || '9.3622'), longitude: parseFloat(data.LONGITUDE || '77.9404'), status: data.STATUS || 'Moving', stops, lastUpdated: new Date().toISOString() };
    }
  } catch { }
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
        id: String(item.ID || item.ITEM_ID || item.Id || ''),
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

export async function submitOrder(custId: string, orderDetails: any[], branchId = FALLBACK_BRANCH_ID, userId = '2937'): Promise<any> {
  const items = orderDetails.map((o: any) => {
    const raw = o.raw || {};
    const price = parseFloat(o.price || '0');
    const box = parseFloat(o.box || '0');
    const pcs = parseFloat(o.pcs || '0');
    const convFactor = parseFloat(raw.CONV_FACTOR || '1');
    const totalPcs = (box * convFactor) + pcs;
    const lineAmt = totalPcs * price;
    const taxRate = parseFloat(raw.TAX_PER || '0');
    const taxAmt = (lineAmt * taxRate) / 100;
    return {
      ITEM_ID: String(raw.ITEM_ID || raw.ID || '0'),
      ITEM_DESC: String(raw.ITEM_DESC || ''),
      SALES_UOM: String(raw.SALES_UOM || 'Pcs'),
      CONV_FACTOR: Number(convFactor) || 1,
      ORD_QTY: Number(totalPcs) || 0,
      TOTAL_BOX: Number(box) || 0,
      TOTAL_AMOUNT: Number(lineAmt + taxAmt) || 0,
      APP_PRICE: Number(price) || 0,
      TAX_PER: Number(taxAmt) || 0,
      APP_LINE_AMT: Number(lineAmt) || 0,
      USR_ID: Number(userId) || 2937,
      BOX_QTY: Number(box) || 0,
      PCS_QTY: Number(pcs) || 0,
    };
  });
  const payload = { A: custId, B: JSON.stringify(items), C: branchId, D: '', E: '', F: '', G: '', H: '', I: '', J: '' };
  try {
    const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
      method: 'POST',
      headers: { 'F': 'OrderCreation', 'MODE': 'MOBILE', 'P': '', 'J': '', 'M': 'POST', 'Authorization': API_TOKEN },
      body: JSON.stringify(payload),
    });
    const outer = deepParse(await response.text());
    if (outer?.success) return { success: true, orderId: outer.result || 'SUCCESS', message: outer.message || 'Order placed successfully' };
    return { success: false, message: outer.message || 'Server error' };
  } catch {
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
