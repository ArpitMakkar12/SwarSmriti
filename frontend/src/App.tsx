import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Train from './pages/Train';
import Talk from './pages/Talk';
import Memories from './pages/Memories';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="train" element={<Train />} />
          <Route path="talk" element={<Talk />} />
          <Route path="memories" element={<Memories />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;