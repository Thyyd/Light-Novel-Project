import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Input from '../../components/general/Input';
import Button from '../../components/general/Button';


function Register() {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne sont pas identiques');
      return;
    }

    setLoading(true);

    let userCredential;

    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }
    catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'Cet email est déjà utilisé'
          : 'Impossible de créer le compte, veuillez réessayer'
      );
      setLoading(false);
      return;
    }

    try {
      const token = await userCredential.user.getIdToken();

      await axios.post('/api/users', { pseudo }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate(location.state?.from ?? '/');
    }
    catch (err) {
      setError(err.response?.data?.error?.message ?? 'Une erreur est survenue, veuillez réessayer');
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="register flex items-center justify-center p-12">
      <div className="register-card w-full max-w-lg bg-white text-black rounded-2xl shadow-sm p-8 md:p-10">
        <h2 className="auth-title font-title text-[2.5rem] font-bold text-center">Inscription</h2>
        <p className="register-description font-body text-[#777777] text-center mt-2 mb-8">Créez-vous un compte gratuitement</p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            id="email"
            className='input-auth'
            value={email}
            setValue={setEmail}
            inputAttributes={{ required: true, name: 'email', autoComplete: 'email', placeholder: 'e.g. : mail@gmail.com' }}
          />
          <Input
            label="Username"
            type="text"
            id="username"
            className='input-auth my-8'
            value={pseudo}
            setValue={setPseudo}
            inputAttributes={{ required: true, minLength: 3, maxLength: 20, name: 'username', autoComplete: 'username', placeholder: 'e.g. : The Fallen One' }}
          />
          <Input
            label="Mot de passe"
            type="password"
            id="password"
            className='input-auth my-8'
            value={password}
            setValue={setPassword}
            inputAttributes={{ required: true, minLength: 8, name: 'password', autoComplete: 'new-password', placeholder: '••••••••••' }}
          />
          <Input
            label="Confirmer Mot de passe"
            type="password"
            id="confirm-password"
            className='input-auth my-8'
            value={confirmPassword}
            setValue={setConfirmPassword}
            inputAttributes={{ required: true, minLength: 8, name: 'confirm-password', autoComplete: 'new-password', placeholder: '••••••••••' }}
          />
          {error && <p className="font-body text-error text-center">{error}</p>}
          <Button type="submit" disabled={loading} label={loading ? 'Inscription en cours...' : "S'inscrire"} className={"register-button mb-8"} />
        </form>

      </div>
    </div>
  );
}

export default Register;