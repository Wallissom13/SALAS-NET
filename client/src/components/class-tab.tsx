import { useState } from "react";
import { ClassWithStudents, StudentWithReports } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BadgeCounter } from "@/components/ui/badge-counter";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, MoreVertical, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassTabProps {
  classData: ClassWithStudents;
}

export function ClassTab({ classData }: ClassTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredStudents = classData.students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getReporterBadgeColor = (reporterType: string) => {
    switch (reporterType) {
      case "Líder":
        return "bg-purple-50 text-purple-700";
      case "Vice":
        return "bg-indigo-50 text-indigo-700";
      case "Professor":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };
  
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Turma {classData.name}</h2>
          <p className="text-gray-600">Visualização de relatórios por aluno</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{classData.students.length}</span>
            <span>alunos nesta turma</span>
          </div>
        </div>
      </div>

      {/* Search Bar - versão aprimorada */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center flex-1 w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-blue-500" />
              </div>
              <Input 
                type="text" 
                className="pl-10 pr-4 py-2 border-blue-200 bg-white text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-300 w-full rounded-lg"
                placeholder="Digite o nome do aluno para filtrar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setSearchTerm('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-2 text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="font-bold">{classData.students.length}</span>
            <span>alunos</span>
            {filteredStudents.length < classData.students.length && (
              <span className="ml-1 text-blue-500">({filteredStudents.length} filtrados)</span>
            )}
          </div>
        </div>
        
        {filteredStudents.length === 0 && searchTerm && (
          <div className="mt-4 text-center p-2 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-amber-700 text-sm">
              Nenhum aluno encontrado com "{searchTerm}". Tente outro termo de busca.
            </p>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              getReporterBadgeColor={getReporterBadgeColor} 
              formatDateTime={formatDateTime}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-10">
            <p className="text-gray-500">Nenhum aluno encontrado com o termo de busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StudentCardProps {
  student: StudentWithReports;
  getReporterBadgeColor: (reporterType: string) => string;
  formatDateTime: (date: Date | string) => string;
}

function StudentCard({ student, getReporterBadgeColor, formatDateTime }: StudentCardProps) {
  const { toast } = useToast();
  const [showAllReports, setShowAllReports] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(student.name);
  
  const hasMultipleReports = student.reports.length > 2;
  const displayReports = showAllReports ? student.reports : student.reports.slice(0, 2);
  
  // Mutations
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest("DELETE", `/api/students/${studentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Aluno excluído",
        description: "O aluno foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir aluno",
        description: error.message || "Não foi possível excluir o aluno.",
        variant: "destructive",
      });
    },
  });
  
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/students/${id}`, { 
        name,
        classId: student.classId || 0
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsEditDialogOpen(false);
      
      toast({
        title: "Aluno atualizado",
        description: "O nome do aluno foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar aluno",
        description: error.message || "Não foi possível atualizar o aluno.",
        variant: "destructive",
      });
    },
  });
  
  const handleUpdateStudent = () => {
    if (!editName.trim()) return;
    
    updateStudentMutation.mutate({
      id: student.id,
      name: editName.trim()
    });
  };
  
  return (
    <div>
      {/* Delete Student Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Aluno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o aluno {student.name}? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteStudentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteStudentMutation.mutate(student.id)}
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Aluno"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Edite o nome do aluno abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Nome do Aluno
              </label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do aluno"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateStudentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateStudent}
              disabled={updateStudentMutation.isPending || !editName.trim()}
            >
              {updateStudentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-100 rounded-xl">
        <CardHeader className={`px-5 py-4 border-b ${student.reportCount >= 3 ? 'bg-red-50 border-red-100' : student.reportCount === 2 ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-3">
              {/* Avatar circular com iniciais do aluno */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${student.reportCount >= 3 ? 'bg-red-500' : student.reportCount === 2 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              
              <div>
                <h3 className={`font-semibold ${student.reportCount >= 3 ? 'text-red-700' : student.reportCount === 2 ? 'text-amber-700' : 'text-gray-800'}`}>
                  {student.name}
                </h3>
                <p className="text-xs text-gray-500">ID: {student.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <BadgeCounter 
                count={student.reportCount} 
                variant={student.reportCount >= 3 ? 'danger' : student.reportCount === 2 ? 'warning' : 'success'} 
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Opções de admin apenas para usuários administradores */}
                  {window.userIsAdmin === true && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditName(student.name);
                          setIsEditDialogOpen(true);
                        }}
                        className="flex items-center cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Editar Aluno</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 flex items-center cursor-pointer"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir Aluno</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* Para usuários não-admin, exibir apenas visualização de relatórios */}
                  {window.userIsAdmin !== true && (
                    <DropdownMenuItem 
                      onClick={() => setShowAllReports(!showAllReports)}
                      className="cursor-pointer"
                    >
                      {showAllReports ? "Ocultar relatórios" : "Ver todos relatórios"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 bg-gradient-to-b from-white via-white to-gray-50">
          {student.reportCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Nenhum relatório registrado</p>
              <p className="text-xs text-gray-400 mt-1">Este aluno não possui ocorrências</p>
            </div>
          ) : (
            <>
              {displayReports.map((report, index) => (
                <div 
                  key={report.id} 
                  className={`mb-4 pb-4 ${index < displayReports.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 -mx-5 px-5 py-2 transition-colors`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full mr-2 ${getReporterBadgeColor(report.reporterType)}`}>
                          {report.reporterType}
                        </span>
                        <p className="text-xs text-gray-500">{formatDateTime(report.date || new Date())}</p>
                      </div>
                      <p className="mt-1 text-gray-800 text-sm leading-relaxed">{report.description || report.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMultipleReports && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAllReports(!showAllReports)}
                    className="text-primary text-xs font-medium border-primary/30 hover:bg-primary/5"
                  >
                    {showAllReports ? "Mostrar menos" : `Ver todos os ${student.reportCount} relatórios`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}