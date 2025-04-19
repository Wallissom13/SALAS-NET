import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ClassWithStudents } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Loader2, PieChart, BarChart, Users, FileText } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ClassTab } from "@/components/class-tab";
import { ReportForm } from "@/components/report-form";
import { AdminPanel } from "@/components/admin-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsBarChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart as RechartsBarChart2, Bar, XAxis, YAxis } from "recharts";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
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
  
  // Compute stats for dashboard
  const totalStudents = classesData?.reduce((acc, cls) => acc + cls.students.length, 0) || 0;
  const totalReports = classesData?.reduce((acc, cls) => {
    return acc + cls.students.reduce((sum, student) => sum + student.reports.length, 0);
  }, 0) || 0;
  
  // Data for class distribution pie chart
  const classDistributionData = classesData?.map(cls => ({
    name: `Turma ${cls.name}`,
    value: cls.students.length,
  })) || [];
  
  // Data for reports by class bar chart
  const reportsByClassData = classesData?.map(cls => {
    const totalReportsInClass = cls.students.reduce((sum, student) => sum + student.reports.length, 0);
    return {
      name: `Turma ${cls.name}`,
      reports: totalReportsInClass,
    };
  }) || [];
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Logo size="medium" showAnimation={true} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200 animate-pulse">
                  SALAS CONECTADAS
                </span>
              </h1>
              <p className="text-sm text-blue-100">Centro de Ensino em Período Integral</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-sm text-white flex items-center">
              <span className="mr-2">Olá, </span>
              <span className="font-medium">{user?.username}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-white hover:text-white hover:bg-blue-800"
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
              <TabsTrigger 
                value="dashboard"
                className="px-5 py-2.5 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Dashboard
              </TabsTrigger>
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
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Total de Alunos
                    </CardTitle>
                    <CardDescription>Todos os alunos cadastrados no sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{totalStudents}</div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      Total de Relatórios
                    </CardTitle>
                    <CardDescription>Relatórios registrados para todos os alunos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-indigo-600">{totalReports}</div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-amber-600" />
                      Turmas
                    </CardTitle>
                    <CardDescription>Número de turmas ativas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-amber-600">{classesData?.length || 0}</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Distribuição de Alunos por Turma</CardTitle>
                    <CardDescription>Número de alunos matriculados em cada turma</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart>
                        <Pie
                          data={classDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {classDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Relatórios por Turma</CardTitle>
                    <CardDescription>Quantidade de relatórios registrados por turma</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart2
                        data={reportsByClassData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="reports" fill="#8884d8" />
                      </RechartsBarChart2>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
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
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>© 2025 SALAS CONECTADAS - CEPI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
