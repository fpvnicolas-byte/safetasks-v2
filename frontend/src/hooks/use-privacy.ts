import { createContext, useContext } from 'react';

interface PrivacyContextType {
    privacyMode: boolean;
    setPrivacyMode: (mode: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
};

export { PrivacyContext };
