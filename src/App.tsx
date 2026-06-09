import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { SessionProvider } from './context/SessionContext';
import AppLayout from './components/AppLayout';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import LoginResponseScreen from './screens/LoginResponseScreen';
import DashboardScreen from './screens/DashboardScreen';
import OrderEntryScreen from './screens/OrderEntryScreen';
import DiscountScreen from './screens/DiscountScreen';
import DiscountDetailScreen from './screens/DiscountDetailScreen';
import PriceDetailsScreen from './screens/PriceDetailsScreen';
import ReportScreen from './screens/ReportScreen';
import InvoiceDetailScreen from './screens/InvoiceDetailScreen';
import MiniStatementScreen from './screens/MiniStatementScreen';
import BankDetailsScreen from './screens/BankDetailsScreen';
import ContactUsScreen from './screens/ContactUsScreen';
import VehicleTrackingScreen from './screens/VehicleTrackingScreen';
import OrderEntryReportScreen from './screens/OrderEntryReportScreen';
import CreditDebitNoteScreen from './screens/CreditDebitNoteScreen';
import PdfViewerScreen from './screens/PdfViewerScreen';

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <SessionProvider>
        <HashRouter>
          <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/registration" element={<RegistrationScreen />} />
              <Route path="/login-response" element={<LoginResponseScreen />} />

              {/* Authenticated routes with sidebar layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/order-entry" element={<OrderEntryScreen />} />
                <Route path="/discount" element={<DiscountScreen />} />
                <Route path="/discount-detail" element={<DiscountDetailScreen />} />
                <Route path="/price-details" element={<PriceDetailsScreen />} />
                <Route path="/report" element={<ReportScreen />} />
                <Route path="/invoice-detail" element={<InvoiceDetailScreen />} />
                <Route path="/mini-statement" element={<MiniStatementScreen />} />
                <Route path="/bank-details" element={<BankDetailsScreen />} />
                <Route path="/contact-us" element={<ContactUsScreen />} />
                <Route path="/vehicle-tracking" element={<VehicleTrackingScreen />} />
                <Route path="/order-entry-report" element={<OrderEntryReportScreen />} />
                <Route path="/credit-debit-note" element={<CreditDebitNoteScreen />} />
                <Route path="/pdf-viewer" element={<PdfViewerScreen />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </HashRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
