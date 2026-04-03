import { createContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
    type AnalyticsProviderInterface,
    ConsoleAnalyticsProvider,
    GA4AnalyticsProvider,
    GTMAnalyticsProvider
} from "../services/analytics/types";

export const AnalyticsContext = createContext<AnalyticsProviderInterface | undefined>(undefined);

interface AnalyticsProviderProps {
    children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
    const provider = useMemo(() => {
        const type = import.meta.env.VITE_ANALYTICS_PROVIDER || "console";
        const ga4Id = import.meta.env.VITE_GA4_MEASUREMENT_ID;

        if (type === "gtm") {
            return new GTMAnalyticsProvider();
        }
        if (type === "ga4" && ga4Id) {
            return new GA4AnalyticsProvider(ga4Id);
        }
        return new ConsoleAnalyticsProvider();
    }, []);

    const location = useLocation();

    useEffect(() => {
        provider.page(location.pathname);
    }, [location, provider]);

    return (
        <AnalyticsContext.Provider value={provider}>
            {children}
        </AnalyticsContext.Provider>
    );
}
