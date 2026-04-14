// components/TokenGuard.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/tokenUtils';
import { useUserStore } from '../store/UsersStore';

export const TokenGuard = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const { access_token } = useUserStore();

    useEffect(() => {
        if (!access_token || isTokenExpired(access_token)) {
            // Токен отсутствует или истек
            localStorage.clear();
            navigate('/login');
        }
    }, [access_token, navigate]);

    return <>{children}</>;
};

// Использование в App или в защищенных маршрутах:
// <TokenGuard>
//   <ProtectedComponent />
// </TokenGuard>