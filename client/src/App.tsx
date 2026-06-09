import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import InstitutionDetail from "./pages/InstitutionDetail";
import Profile from "./pages/Profile";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Contacts from "./pages/Contacts";
import Admin from "./pages/Admin";
import Editor from "./pages/Editor";
import Representative from "./pages/Representative";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/institution/:slug" component={InstitutionDetail} />
      <Route path="/institution/id/:numId" component={InstitutionDetail} />
      <Route path="/profile/:tab?" component={Profile} />
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsDetail} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/:tab" component={Admin} />
      <Route path="/editor" component={Editor} />
      <Route path="/editor/:section" component={Editor} />
      <Route path="/editor/:section/:id" component={Editor} />
      <Route path="/representative" component={Representative} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
