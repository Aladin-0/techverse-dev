import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Immediate reset
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        
        // Fallback for late renders / Suspense transitions
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 100);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
