import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ContractReview from './pages/ContractReview';
import TaxCalculator from './pages/TaxCalculator';
import KnowledgeCards from './pages/KnowledgeCards';
import Arbitration from './pages/Arbitration';
import BenefitsGuide from './pages/BenefitsGuide';
import Interview from './pages/Interview';
import Layout from './components/Layout';
import { AIChatProvider } from './contexts/AIChatContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AIChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contract" element={<ContractReview />} />
              <Route path="/tax" element={<TaxCalculator />} />
              <Route path="/knowledge" element={<KnowledgeCards />} />
              <Route path="/arbitration" element={<Arbitration />} />
              <Route path="/benefits" element={<BenefitsGuide />} />
              <Route path="/interview" element={<Interview />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AIChatProvider>
    </AuthProvider>
  );
}
