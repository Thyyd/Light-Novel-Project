import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/navigation/Navbar';
// ... imports restants des pages

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Les <Route> ici */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
