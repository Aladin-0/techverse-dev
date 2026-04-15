// src/pages/GoogleAuthHandler.tsx
// This component is no longer the primary auth handler.
// Google OAuth is handled by the backend allauth flow:
//   1. User clicks "Sign in with Google" → redirected to /auth/google/login/
//   2. Google authenticates → backend redirects to /?login=success&access=TOKEN&refresh=TOKEN
//   3. LoginSuccessHandler.tsx reads the tokens and logs the user in
//
// This file is kept for reference but is not used in any route.
// If a user somehow lands here (e.g. stale bookmark), redirect them cleanly.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleAuthHandler = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/login', { replace: true });
    }, [navigate]);
    return null;
};

export { GoogleAuthHandler };
export default GoogleAuthHandler;