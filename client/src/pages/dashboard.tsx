import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ClassWithStudents } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ClassTab } from "@/components/class-tab";
import { ReportForm } from "@/components/report-form";
import { AdminPanel } from "@/components/admin-panel";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("6A");
  
  const { data: classesData, isLoading } = useQuery<ClassWithStudents[]>({
    queryKey: ["/api/dashboard"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getClassIdByName = (className: string): number | undefined => {
    const foundClass = classesData?.find(c => c.name === className);
    return foundClass?.id;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Logo />
            <h1 className="text-xl font-semibold text-gray-800">CEPI - Sistema de Relatórios</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-700 flex items-center">
              <span className="mr-2">Olá, </span>
              <span className="font-medium">{user?.username}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-gray-600 hover:text-gray-900"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-1" />
              )}
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="flex space-x-1 overflow-x-auto hide-scrollbar h-auto border-b border-gray-200 bg-transparent p-0 mb-8">
              {classesData?.map((classItem) => (
                <TabsTrigger 
                  key={classItem.id} 
                  value={classItem.name}
                  className="px-5 py-2.5 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Turma {classItem.name}
                </TabsTrigger>
              ))}
              <TabsTrigger 
                value="enviar-relatorio"
                className="px-5 py-2.5 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Enviar Relatório
              </TabsTrigger>
              {user?.isAdmin && (
                <TabsTrigger 
                  value="admin"
                  className="px-5 py-2.5 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Administração
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Class Tabs */}
            {classesData?.map((classItem) => (
              <TabsContent key={classItem.id} value={classItem.name}>
                <ClassTab classData={classItem} />
              </TabsContent>
            ))}
            
            {/* Report Form Tab */}
            <TabsContent value="enviar-relatorio">
              <ReportForm classes={classesData || []} />
            </TabsContent>
            
            {/* Admin Tab */}
            {user?.isAdmin && (
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
}
