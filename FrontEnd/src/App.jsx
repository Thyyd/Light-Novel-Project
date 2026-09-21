import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/navigation/Navbar';
import Homepage from './routes/pages/Homepage';
import Series from './routes/pages/Series';
import Login from './routes/auth/Login';
// ... imports restants des pages

function App() {
  return (
    <div className="flex flex-col h-screen">
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/series" element={<Series />} />
            <Route path="/login" element={<Login />} />
            {/* Les <Route> ici */}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
