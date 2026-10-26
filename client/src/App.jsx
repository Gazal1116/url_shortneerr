import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
// import Analytics from './pages/Analytics'; // uncomment when needed
import Unlock from './pages/Unlock';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Analytics — uncomment when needed
          <Route path="/analytics/:id" element={<Analytics />} />
          */}
          <Route path="/unlock/:code" element={<Unlock />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Main application component
