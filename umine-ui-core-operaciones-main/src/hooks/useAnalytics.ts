import { useContext, useCallback } from "react";
import { AnalyticsContext } from "../providers/AnalyticsProvider";

export function useAnalytics() {
    const context = useContext(AnalyticsContext);

    if (!context) {
        throw new Error("useAnalytics must be used within an AnalyticsProvider");
    }

    const trackPageView = useCallback((pageName: string) => {
        context.page(pageName, {
            page_title: document.title,
            page_location: window.location.href,
        });
    }, [context]);

    return {
        track: context.track.bind(context),
        page: context.page.bind(context),
        identify: context.identify.bind(context),
        trackPageView
    };
}
