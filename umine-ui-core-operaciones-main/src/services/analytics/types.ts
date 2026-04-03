export interface AnalyticsTrackProps {
    [key: string]: any;
}

export interface AnalyticsProviderInterface {
    track(event: string, props?: AnalyticsTrackProps): void;
    page(name: string, props?: AnalyticsTrackProps): void;
    identify(userId: string, traits?: AnalyticsTrackProps): void;
}

export class ConsoleAnalyticsProvider implements AnalyticsProviderInterface {
    track(event: string, props?: AnalyticsTrackProps): void {
        console.log(`[Analytics:Track] ${event}`, props);
    }
    page(name: string, props?: AnalyticsTrackProps): void {
        console.log(`[Analytics:Page] ${name}`, {
            page_title: document.title,
            page_location: window.location.href,
            ...props
        });
    }
    identify(userId: string, traits?: AnalyticsTrackProps): void {
        console.log(`[Analytics:Identify] ${userId}`, traits);
    }
}

// GA4 stub
export class GA4AnalyticsProvider implements AnalyticsProviderInterface {
    constructor(_measurementId: string) {
        // Implementation for GA4 via gtag would go here
    }

    track(_event: string, _props?: AnalyticsTrackProps): void {
        // Implementation for GA4 via gtag would go here
    }
    page(_name: string, _props?: AnalyticsTrackProps): void {
        // Implementation for GA4 page view
    }
    identify(_userId: string, _traits?: AnalyticsTrackProps): void {
        // Implementation for GA4 identify
    }
}

export class GTMAnalyticsProvider implements AnalyticsProviderInterface {
    constructor() { }

    track(event: string, props?: AnalyticsTrackProps): void {
        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event,
                ...props
            });
        }
    }

    page(name: string, props?: AnalyticsTrackProps): void {
        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: "page_view",
                page_path: name,
                page_title: document.title,
                page_location: window.location.href,
                ...props
            });
        }
    }

    identify(userId: string, traits?: AnalyticsTrackProps): void {
        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: "identify",
                userId,
                ...traits
            });
        }
    }
}
