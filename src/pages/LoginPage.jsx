import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import GoogleIcon from '../components/auth/GoogleIcon';
import { signInWithGoogle } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  async function handleGoogleSignIn() {
    setError('');
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    }
  }

  return (
    <div className="dark bg-background text-on-background min-h-screen flex items-center justify-center p-gutter">
      <div className="w-full max-w-md">
        <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-container-margin shadow-2xl flex flex-col gap-section-gap">

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-element-gap">
            <div className="text-primary font-headline-md text-headline-md tracking-tighter font-bold mb-4">
              Flizen
            </div>
            <h1 className="text-primary font-headline-lg text-headline-lg">
              Welcome aboard
            </h1>
            <p className="text-on-surface-variant font-body-md text-body-md">
              Your next journey is just a few taps away
            </p>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-container-margin">

            {/* Google button */}
            <AuthButton onClick={handleGoogleSignIn}>
              <GoogleIcon size={18} />
              Continue with Google
            </AuthButton>

            {error && (
              <p className="text-error text-xs text-center">{error}</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] bg-[#2C2C2C] flex-1" />
              <span className="text-on-surface-variant font-label-sm text-label-sm uppercase">or</span>
              <div className="h-[1px] bg-[#2C2C2C] flex-1" />
            </div>

            {/* Email/password login — not yet implemented.
                 DO NOT wire this form to send credentials directly to the backend.
                 When added, use Firebase Auth signInWithEmailAndPassword() which
                 handles credentials securely and returns an ID token, just like Google sign-in. */}
            <form
              className="flex flex-col gap-element-gap"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex flex-col gap-2">
                <label className="text-on-surface font-label-sm text-label-sm sr-only" htmlFor="email">
                  Email address
                </label>
                <AuthInput id="email" type="email" placeholder="Email address" disabled />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-on-surface font-label-sm text-label-sm sr-only" htmlFor="password">
                  Password
                </label>
                <AuthInput id="password" type="password" placeholder="Password" disabled />
              </div>
              <AuthButton type="submit" className="mt-2 opacity-40 cursor-not-allowed" disabled>
                Coming soon
              </AuthButton>
            </form>

          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-element-gap mt-4">
            <p className="text-on-surface-variant font-body-md text-body-md">
              New to Flizen?{' '}
              <Link to="/signup" className="text-primary hover:underline transition-all">
                Sign up
              </Link>
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors">
                Terms
              </a>
              <span className="text-[#2C2C2C] font-label-sm text-label-sm">/</span>
              <a href="#" className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors">
                Privacy
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
