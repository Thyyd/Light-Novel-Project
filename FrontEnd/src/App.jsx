import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/navigation/Navbar';
import Login from './routes/auth/Login';
// ... imports restants des pages

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Les <Route> ici */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
