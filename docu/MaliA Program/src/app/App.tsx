import { useState } from "react";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { PlansPage } from "./pages/PlansPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { UserDashboard } from "./pages/UserDashboard";
import { NutritionPlanPage } from "./pages/NutritionPlanPage";
import { ChatPage } from "./pages/ChatPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ProgressTrackingPage } from "./pages/ProgressTrackingPage";
import { TrainingPage } from "./pages/TrainingPage";
import { RecipesPage } from "./pages/RecipesPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { BlogPage } from "./pages/BlogPage";
import { Button } from "./components/ui/button";
import { User, UserCog, LogOut } from "lucide-react";

type Page =
  | "home"
  | "plans"
  | "onboarding"
  | "dashboard"
  | "nutrition-plan"
  | "chat"
  | "admin"
  | "about"
  | "contact"
  | "checkout"
  | "progress-tracking"
  | "training"
  | "recipes"
  | "shopping-list"
  | "blog";

type UserType = "guest" | "user" | "admin";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [userType, setUserType] = useState<UserType>("guest");
  const [selectedPlanId, setSelectedPlanId] = useState<
    string | undefined
  >();
  const [showDemoControls, setShowDemoControls] =
    useState(true);

  const handleNavigate = (page: string, planId?: string) => {
    setCurrentPage(page as Page);
    if (planId) {
      setSelectedPlanId(planId);
    }

    // Simulate user authentication
    if (
      page === "dashboard" ||
      page === "nutrition-plan" ||
      page === "chat"
    ) {
      setUserType("user");
    } else if (page === "admin") {
      setUserType("admin");
    } else if (page === "home") {
      setUserType("guest");
    }

    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <LandingPage onNavigate={handleNavigate} />;
      case "plans":
        return <PlansPage onNavigate={handleNavigate} />;
      case "onboarding":
        return <OnboardingPage onNavigate={handleNavigate} />;
      case "dashboard":
        return <UserDashboard onNavigate={handleNavigate} />;
      case "nutrition-plan":
        return (
          <NutritionPlanPage onNavigate={handleNavigate} />
        );
      case "chat":
        return <ChatPage onNavigate={handleNavigate} />;
      case "admin":
        return <AdminDashboard onNavigate={handleNavigate} />;
      case "about":
        return <AboutPage onNavigate={handleNavigate} />;
      case "contact":
        return <ContactPage onNavigate={handleNavigate} />;
      case "checkout":
        return (
          <CheckoutPage
            planId={selectedPlanId}
            onNavigate={handleNavigate}
          />
        );
      case "progress-tracking":
        return (
          <ProgressTrackingPage onNavigate={handleNavigate} />
        );
      case "training":
        return <TrainingPage onNavigate={handleNavigate} />;
      case "recipes":
        return <RecipesPage onNavigate={handleNavigate} />;
      case "shopping-list":
        return <ShoppingListPage onNavigate={handleNavigate} />;
      case "blog":
        return <BlogPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userType={userType}
      />

      {/* Demo Mode Controls */}
      {showDemoControls && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary/20 p-4 space-y-2 max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-foreground">
                🎨 Demo Mode
              </p>
              <button
                onClick={() => setShowDemoControls(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Ocultar
              </button>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setUserType("guest");
                  handleNavigate("home");
                }}
                variant={
                  userType === "guest" ? "default" : "outline"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <LogOut className="h-4 w-4" />
                Vista Invitado
              </Button>
              <Button
                onClick={() => {
                  setUserType("user");
                  handleNavigate("dashboard");
                }}
                variant={
                  userType === "user" ? "default" : "outline"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <User className="h-4 w-4" />
                Vista Cliente
              </Button>
              <Button
                onClick={() => {
                  setUserType("admin");
                  handleNavigate("admin");
                }}
                variant={
                  userType === "admin" ? "default" : "outline"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <UserCog className="h-4 w-4" />
                Vista Admin
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showDemoControls && (
        <button
          onClick={() => setShowDemoControls(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        >
          🎨
        </button>
      )}

      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
}