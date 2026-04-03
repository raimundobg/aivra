import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../providers/ThemeProvider";
import { AnalyticsProvider } from "../providers/AnalyticsProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { DashboardLayout } from "../templates/DashboardLayout";
import { CustomerProvider } from "../contexts/CustomerContext";

import { DashboardPage } from "../pages/DashboardPage";
import { PODashboardPage } from "../pages/PODashboardPage";
import { PurchaseOrdersPage } from "../pages/PurchaseOrdersPage";
import { PODetailPage } from "../pages/PODetailPage";
import { CustomersPage } from "../pages/CustomersPage";
import { CustomerDetailPage } from "../pages/CustomerDetailPage";
import { TableroSencePage } from "../pages/TableroSencePage";
import { useAuth } from "../providers/AuthProvider";
import { LandingPage } from "../pages/LandingPage";
import { Toaster } from "../components/ui/toaster";
import { ScopedThemeProvider } from "../providers/ScopedThemeProvider";
import { useTheme } from "../contexts/ThemeContext";

export const AppContent = () => {
    const { user } = useAuth();
    const { overlayTheme } = useTheme();

    if (!user) {
        return <LandingPage />;
    }

    return (
        <ScopedThemeProvider overlay={overlayTheme}>
            <DashboardLayout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/po/dashboard" element={<PODashboardPage />} />
                    <Route path="/po" element={<PurchaseOrdersPage />} />
                    <Route path="/po/:id" element={<PODetailPage />} />
                    <Route path="/clients" element={<CustomersPage />} />
                    <Route path="/clients/:id" element={<CustomerDetailPage />} />
                    <Route path="/tablero-sence" element={<TableroSencePage />} />
                </Routes>
            </DashboardLayout>
        </ScopedThemeProvider>
    );
};

export const AppShell = () => {
    return (
        <BrowserRouter>
            <AnalyticsProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <CustomerProvider>
                            <AppContent />
                            <Toaster />
                        </CustomerProvider>
                    </ThemeProvider>
                </AuthProvider>
            </AnalyticsProvider>
        </BrowserRouter>
    );
};
