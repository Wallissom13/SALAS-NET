import { Switch, Route, useLocation, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ClassesPage from "@/pages/classes-page";
import { ProtectedRoute } from "./lib/protected-route";

// Adicionar variável global para armazenar status de admin
declare global {
  interface Window {
    userIsAdmin?: boolean;
  }
}

function ClassDetail() {
  // Obter o ID da turma da URL
  const [, params] = useLocation().match(/\/class\/(\d+)/) || ["", "0"];
  const classId = Number(params); 
  return <Dashboard classId={classId} />;
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <Dashboard />} />
      <ProtectedRoute path="/classes" component={() => <ClassesPage />} />
      <ProtectedRoute path="/class/:id" component={ClassDetail} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;


