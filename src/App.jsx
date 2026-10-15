import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Squadre from './pages/Squadre.jsx';
import Squadra from './pages/Squadra.jsx';
import Calendario from './pages/Calendario.jsx';
import Impostazioni from './pages/Impostazioni.jsx';
import { migraDati } from './services/squadre.js';

// Primo avvio: l'identità delle vecchie impostazioni diventa la squadra iniziale
// e rosa/calendario preesistenti vengono adottati da essa.
migraDati();

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/squadre" element={<Squadre />} />
        <Route path="/squadra" element={<Squadra />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/impostazioni" element={<Impostazioni />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
