import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, RefreshCw } from "lucide-react";
import { Logo } from "@/components/logo";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "O nome de usuário é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const [setupStatus, setSetupStatus] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Inicialização do banco de dados
  const initializeDatabase = async () => {
    try {
      setIsSettingUp(true);
      const response = await apiRequest("GET", "/api/setup");
      const data = await response.json();
      setSetupStatus(`Sistema inicializado com sucesso. Usuários disponíveis: ${data.stats.usernames.join(", ")}`);
    } catch (error) {
      setSetupStatus("Erro ao inicializar banco de dados. Tente novamente.");
      console.error("Erro ao inicializar:", error);
    } finally {
      setIsSettingUp(false);
    }
  };

  // Use useEffect for redirection to avoid calling hooks conditionally
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Fundo abstrato para mobile */}
      <div className="md:hidden absolute inset-0 bg-gradient-to-b from-blue-900 to-indigo-900 opacity-90"></div>
      
      {/* Hero section (reformulado e adaptado) */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-800 via-indigo-800 to-blue-700">
        <div className="h-full w-full flex items-center justify-center p-10 relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full animate-pulse" style={{animationDuration: '8s'}}></div>
            <div className="absolute bottom-20 right-10 w-60 h-60 bg-blue-300 rounded-full animate-pulse" style={{animationDuration: '12s'}}></div>
            <div className="absolute top-40 right-20 w-20 h-20 bg-indigo-400 rounded-full animate-pulse" style={{animationDuration: '6s'}}></div>
          </div>
          
          <div className="text-white max-w-lg z-10">
            <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">SALAS CONECTADAS</h1>
            <h2 className="text-2xl font-semibold mb-6 text-blue-100">Centro de Ensino em Período Integral</h2>
            <p className="text-lg mb-8 text-blue-50">
              Plataforma integrada para acompanhamento de ocorrências e desempenho dos alunos.
            </p>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg border border-white border-opacity-20">
              <p className="text-sm italic">
                "A educação é a arma mais poderosa que você pode usar para mudar o mundo."
              </p>
              <p className="text-sm mt-2 text-blue-200">- Nelson Mandela</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login form - aplicando glassmorphism para mobile */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white md:bg-white relative z-10">
        <div className="w-full max-w-md backdrop-blur-sm md:backdrop-blur-none bg-white bg-opacity-90 md:bg-opacity-100 p-8 md:p-0 rounded-xl md:rounded-none shadow-2xl md:shadow-none">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="large" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 md:text-gray-800 bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-900">
              Bem-vindo(a)
            </h2>
            <p className="text-gray-600 md:text-gray-600 mt-2 font-medium">SISTEMA DE GESTÃO EDUCACIONAL</p>
          </div>

          <Card className="border-0 shadow-lg md:shadow bg-white bg-opacity-90 md:bg-opacity-100">
            <CardContent className="pt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Usuário</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite seu nome de usuário" 
                            className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Digite sua senha" 
                            className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full text-base font-medium py-6 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 transition-all shadow-md hover:shadow-xl" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      "Acessar Sistema"
                    )}
                  </Button>
                </form>
              </Form>
              
              {setupStatus && (
                <Alert className="mt-4 border-blue-500 bg-blue-50">
                  <AlertDescription className="text-blue-800 text-sm">
                    {setupStatus}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6 text-center text-sm text-gray-600">
                <p className="flex items-center justify-center">
                  <span className="inline-block w-1 h-1 rounded-full bg-gray-400 mr-1"></span>
                  Em caso de problemas com o acesso, contate a administração.
                  <span className="inline-block w-1 h-1 rounded-full bg-gray-400 ml-1"></span>
                </p>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={initializeDatabase} 
                  disabled={isSettingUp}
                  className="mt-4 text-xs flex items-center mx-auto"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Inicializando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Inicializar usuários padrão
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
