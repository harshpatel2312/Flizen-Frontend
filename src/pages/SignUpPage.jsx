import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import AuthButton from '../components/auth/AuthButton';
import GoogleIcon from '../components/auth/GoogleIcon';
import { signInWithGoogle } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');

  // Already signed in — go straight to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleGoogleSignIn() {
    setError('');
    try {
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-up failed. Please try again.');
    }
  }

  return (
    <div className="dark bg-surface text-on-surface antialiased min-h-screen flex flex-col justify-center items-center px-container-margin py-section-gap font-body-md">
      <main className="w-full max-w-md">
        <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-container-margin md:p-section-gap flex flex-col items-center text-center shadow-[0_0_32px_rgba(0,0,0,0.4)]">

          {/* Logo */}
          <div className="mb-section-gap">
            <span className="text-white text-xl font-bold tracking-tighter font-headline-md">
              Flizen
            </span>
          </div>

          {/* Headings */}
          <div className="mb-section-gap space-y-element-gap">
            <h1 className="font-headline-lg text-headline-lg text-primary">Start your journey</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Smarter flights begin with Flizen
            </p>
          </div>

          {/* Google button */}
          <div className="w-full space-y-element-gap mb-container-margin">
            <AuthButton onClick={handleGoogleSignIn}>
              <GoogleIcon size={18} />
              Continue with Google
            </AuthButton>

            {error && (
              <p className="text-error text-xs text-center mt-1">{error}</p>
            )}
          </div>

          {/* Helper text */}
          <div className="mb-section-gap">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              More sign-up options coming soon
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-element-gap w-full pt-gutter border-t border-[#2C2C2C]">
            <p className="text-on-surface-variant font-body-md text-body-md">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline transition-all">
                Log in
              </Link>
            </p>
            <div className="flex gap-gutter mt-unit">
              <a href="#" className="font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors">
                Terms
              </a>
              <a href="#" className="font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors">
                Privacy
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
