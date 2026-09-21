import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Input from '../../components/general/Input';
import Button from '../../components/general/Button';


function Login() {
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    let email;
    try {
      const response = await axios.get('/api/users/email', { params: { pseudo } });
      email = response.data.data.email;
    }
    catch (lookupError) {
      console.error('Lookup email a échoué :', lookupError);
      setError('Identifiants invalides');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    }
    catch (firebaseError) {
      console.error('Firebase signIn a échoué :', firebaseError);
      setError('Identifiants invalides');
      setLoading(false);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      // stub pour le moment — rien à exploiter tant que la vraie route n'existe pas
    }
    catch (meError) {
      console.error('GET user/me a échoué (stub) :', meError);
    }

    setLoading(false);
    navigate(location.state?.from ?? '/');
  }

  return (
    <div className="login flex items-center justify-center p-12">
      <div className="login-card w-full max-w-lg bg-white text-black rounded-2xl shadow-sm p-8 md:p-10">
        <h2 className="auth-title font-title text-[2.5rem] font-bold text-center">Connexion</h2>
        <p className="login-description font-body text-[#777777] text-center mt-2 mb-8">Connectez-vous à votre compte</p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            id="username"
            className='input-auth'
            value={pseudo}
            setValue={setPseudo}
            inputAttributes={{ required: true, minLength: 3, maxLength: 20 }}
          />
          <Input
            label="Mot de passe"
            type="password"
            id="password"
            className='input-auth my-8'
            value={password}
            setValue={setPassword}
            inputAttributes={{ required: true, minLength: 8 }}
          />
          {error && <p>{error}</p>}
          <Button type="submit" disabled={loading} label={loading ? 'Connexion...' : 'Se connecter'} className={"login-button mb-8"} />
        </form>

        <div className="login-redirection flex flex-col md:flex-row md:justify-center items-center border-t border-[#777777] gap-1">
          <p className="font-body mt-8 md:my-8">Pas encore de compte ?</p>
          <a
            className="font-body text-[1.125rem] text-interactive font-bold mb-8 md:my-8"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Cliquez ici pour vous inscrire
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;