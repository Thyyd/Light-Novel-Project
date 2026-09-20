import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import Button from '../general/Button';

function Navbar() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAccueilActive = location.pathname === '/';
  const isSeriesActive = location.pathname.startsWith('/serie') || location.pathname.startsWith('/volume');
  // const isFavoritesActive = location.pathname.startsWith('/favoris') [Pas encore implémenté, ajouté ici pour une future implémentation]

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    signOut(auth);
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  }

  return (
    <nav className="navbar w-full md:bg-navbar text-white flex flex-col md:flex-row md:items-center">
      <div className="navbar-topbar bg-navbar md:bg-none h-15 flex items-center justify-between px-8">
        <Link to="/" className="navbar-brand font-title text-2xl font-bold">LightNoverse</Link>

        <button
          className="navbar-burger w-11 h-11 flex items-center justify-center bg-transparent border-none md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMenuOpen}
        >
          <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} className="w-6 h-6"/>
        </button>
      </div>


      <div className={`navbar-links ${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col items-start gap-4 rounded-b-3xl
        divide-y divide-[#999999] px-8 pt-4 bg-white text-black font-body font-medium
        md:flex-1 md:flex-row md:items-center md:justify-end md:divide-y-0 md:gap-20 md:p-0 md:bg-transparent md:text-white md:pr-8 md:relative`}
      >
        <div className="flex flex-col items-start gap-4 divide-y divide-[#999999] w-full md:w-auto md:flex-row md:items-center
          md:divide-y-0 md:gap-6"
        >
          <Link
            to="/"
            className={`w-full pb-4 md:w-auto md:pb-0 md:border-b-0 ${isAccueilActive ? 'font-bold underline underline-offset-4' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Accueil
          </Link>
          <Link
            to="/series"
            className={`w-full pb-4 md:w-auto md:pb-0 md:border-b-0 ${isSeriesActive ? 'font-bold underline underline-offset-4' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Séries
          </Link>

          {isLoggedIn && (
            <a
              href="#"
              className="w-full pb-4 border-b border-[#999999] md:w-auto md:pb-0 md:border-b-0"
              onClick={(e) => e.preventDefault()}
            >
              Favoris
            </a>
          )}
        </div>

        {isLoggedIn ? (
          <>
            {/* Desktop uniquement : avatar cliquable + dropdown */}
            <div className="navbar-avatar-desktop hidden md:flex md:items-center md:gap-3" ref={dropdownRef}>
              {user.role === 'admin' && (
                <p>Admin</p>
              )}
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-label="Menu utilisateur"
              >
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-12.5 h-12.5 object-cover rounded-full shrink-0"
                />
              </button>

              {isDropdownOpen && (
                <div className="navbar-dropdown absolute top-full right-0 mt-2 bg-white text-black rounded-lg shadow-lg
                  p-2 flex flex-col gap-2 w-40 text-center"
                >
                  <a
                    className="w-full pb-4 border-b border-[#999999]"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    Profil
                  </a>
                  <Button
                    label={"Déconnexion"}
                    onClick={handleLogout}
                    className={"logout"}
                  />
                </div>
              )}
            </div>

            {/* Mobile uniquement : avatar + pseudo, liens à plat directement dans le menu */}
            <div className="navbar-connected-mobile flex md:hidden flex-col w-full">
              <a className="w-full pb-4 border-b border-[#999999]" href="#" onClick={(e) => e.preventDefault()}>Profil</a>
              <div className="navbar-user-mobile flex items-center gap-3 mt-4">
                <img
                  src={user.avatarUrl}
                  alt={`Avatar de ${user.pseudo}`}
                  className="w-12.5 h-12.5 object-cover rounded-full shrink-0"
                />
                <span>{user.pseudo}</span>
                {user.role === 'admin' && (
                  <p className="font-bold">Admin</p>
                )}
              </div>
              <Button
                label={"Déconnexion"}
                onClick={handleLogout}
                className={"logout my-4 text-left"}
              />
            </div>
          </>
        ) : (
          <Button
            label="Se connecter"
            onClick={() => { setIsMenuOpen(false); navigate('/login', { state: { from: location.pathname } }); }}
            className={"w-full md:w-fit mb-4 md:mb-0"}
          />
        )}
      </div>
    </nav>
  );
}

export default Navbar;