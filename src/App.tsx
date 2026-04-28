import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Leaderboard } from './components/Leaderboard';
import { VaultProfile } from './components/VaultProfile';
import { VaultSelector } from './components/VaultSelector';
import { RevenueReconciliation } from './components/RevenueReconciliation';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/vault" element={<VaultSelector />} />
            <Route path="/vault/:id" element={<VaultProfile />} />
            <Route path="/revenue" element={<RevenueReconciliation />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
