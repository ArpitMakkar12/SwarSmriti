import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PersonProvider } from './context/PersonContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Family from './pages/Family';
import Persona from './pages/Persona';
import Train from './pages/Train';
import Talk from './pages/Talk';
import Memories from './pages/Memories';

function App() {
  return (
    // PersonProvider wraps everything, so every page knows who is being remembered.
    <PersonProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="family" element={<Family />} />
            <Route path="persona" element={<Persona />} />
            <Route path="train" element={<Train />} />
            <Route path="talk" element={<Talk />} />
            <Route path="memories" element={<Memories />} />
          </Route>
        </Routes>
      </Router>
    </PersonProvider>
  );
}

export default App;