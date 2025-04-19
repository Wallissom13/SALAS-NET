import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Class, User, Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  CheckCircle, 
  Pencil, 
  Trash2, 
  X, 
  Save,
  UserPlus,
  Users
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import schemas
const importStudentsSchema = z.object({
  classId: z.string().min(1, "Selecione uma turma"),
  studentsList: z.string().min(1, "Digite pelo menos um nome de aluno"),
});

type ImportStudentsFormValues = z.infer<typeof importStudentsSchema>;

const userSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  isAdmin: z.boolean().default(false),
});

type UserFormValues = z.infer<typeof userSchema>;

export function AdminPanel() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch data
  const { data: classes, isLoading: isClassesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });
  
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Dashboard stats
  const { data: dashboardData } = useQuery<any>({
    queryKey: ["/api/dashboard"],
  });
  
  // Calculate stats
  const totalStudents = dashboardData?.reduce((acc: number, cls: any) => 
    acc + cls.students.length, 0) || 0;
  
  const totalReports = dashboardData?.reduce((acc: number, cls: any) => 
    acc + cls.students.reduce((sum: number, student: any) => 
      sum + student.reports.length, 0), 0) || 0;
  
  const studentsWithManyReports = dashboardData?.reduce((acc: number, cls: any) => 
    acc + cls.students.filter((s: any) => s.reports.length >= 3).length, 0) || 0;
  
  // Student management state
  const [isDeleteStudentDialogOpen, setIsDeleteStudentDialogOpen] = useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentClass, setEditStudentClass] = useState<number | null>(null);
  
  // Setup forms
  const importForm = useForm<ImportStudentsFormValues>({
    resolver: zodResolver(importStudentsSchema),
    defaultValues: {
      classId: "",
      studentsList: "",
    },
  });
  
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      isAdmin: false,
    },
  });
  
  // Mutations
  const importStudentsMutation = useMutation({
    mutationFn: async (data: { classId: number, names: string[] }) => {
      const res = await apiRequest("POST", "/api/students/bulk", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Show success message
      setSuccessMessage("Alunos importados com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset form
      importForm.reset({
        classId: "",
        studentsList: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao importar alunos",
        description: error.message || "Não foi possível importar os alunos.",
        variant: "destructive",
      });
    },
  });
  
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Show success message
      setSuccessMessage("Usuário criado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset form
      userForm.reset({
        username: "",
        isAdmin: false,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    },
  });
  
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest("DELETE", `/api/students/${studentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsDeleteStudentDialogOpen(false);
      setSelectedStudent(null);
      
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
    mutationFn: async ({ id, data }: { id: number; data: { name: string; classId: number } }) => {
      const res = await apiRequest("PATCH", `/api/students/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsEditStudentDialogOpen(false);
      setSelectedStudent(null);
      
      toast({
        title: "Aluno atualizado",
        description: "Os dados do aluno foram atualizados com sucesso",
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
  
  // Form submit handlers
  function onImportSubmit(values: ImportStudentsFormValues) {
    const names = values.studentsList
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (names.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Adicione pelo menos um nome para importar.",
        variant: "destructive",
      });
      return;
    }
    
    importStudentsMutation.mutate({
      classId: parseInt(values.classId),
      names,
    });
  }
  
  function onUserSubmit(values: UserFormValues) {
    createUserMutation.mutate(values);
  }
  
  // Chart data
  const classChartData = dashboardData?.map((cls: any) => ({
    name: cls.name,
    alunos: cls.students.length,
    relatorios: cls.students.reduce((sum: number, student: any) => sum + student.reports.length, 0),
  })) || [];
  
  const reportTypeData = [
    {
      name: "Alunos com 0 relatórios",
      value: totalStudents - dashboardData?.reduce((acc: number, cls: any) => 
        acc + cls.students.filter((s: any) => s.reports.length > 0).length, 0) || 0,
      color: "#10b981"
    },
    {
      name: "Alunos com 1-2 relatórios",
      value: dashboardData?.reduce((acc: number, cls: any) => 
        acc + cls.students.filter((s: any) => s.reports.length > 0 && s.reports.length < 3).length, 0) || 0,
      color: "#f59e0b"
    },
    {
      name: "Alunos com 3+ relatórios",
      value: studentsWithManyReports,
      color: "#ef4444"
    }
  ];
  
  // Lista de todos os alunos (extraída do dashboardData)
  const allStudents: Student[] = dashboardData?.reduce((acc: Student[], cls: any) => {
    return [...acc, ...cls.students.map((student: any) => ({
      id: student.id,
      name: student.name,
      classId: cls.id
    }))];
  }, []) || [];
  
  // Manipuladores de eventos
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditStudentName(student.name);
    setEditStudentClass(student.classId);
    setIsEditStudentDialogOpen(true);
  };
  
  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteStudentDialogOpen(true);
  };
  
  const handleUpdateStudent = () => {
    if (!selectedStudent || !editStudentName.trim() || !editStudentClass) return;
    
    updateStudentMutation.mutate({
      id: selectedStudent.id,
      data: {
        name: editStudentName.trim(),
        classId: editStudentClass
      }
    });
  };
    
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Painel de Administração</h2>
      <p className="text-gray-600 mb-8">Gerencie alunos, logins e permissões do sistema.</p>
      
      {/* Dialog de exclusão de aluno */}
      <Dialog open={isDeleteStudentDialogOpen} onOpenChange={setIsDeleteStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Aluno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o aluno {selectedStudent?.name}? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteStudentDialogOpen(false)}
              disabled={deleteStudentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedStudent && deleteStudentMutation.mutate(selectedStudent.id)}
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
      
      {/* Dialog de edição de aluno */}
      <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Edite as informações do aluno abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Nome do Aluno
              </label>
              <Input
                id="edit-name"
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                placeholder="Nome do aluno"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-class" className="text-sm font-medium">
                Turma
              </label>
              <Select 
                value={editStudentClass?.toString() || ""} 
                onValueChange={(value) => setEditStudentClass(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditStudentDialogOpen(false)}
              disabled={updateStudentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateStudent}
              disabled={updateStudentMutation.isPending || !editStudentName.trim() || !editStudentClass}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Statistics Card */}
        <Card>
          <CardHeader className="p-5 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">Resumo do Sistema</h3>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Total de alunos</span>
              <span className="font-semibold text-gray-800">{totalStudents}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Total de relatórios</span>
              <span className="font-semibold text-gray-800">{totalReports}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Alunos com 3+ relatórios</span>
              <span className="font-semibold text-red-600">{studentsWithManyReports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Usuários ativos</span>
              <span className="font-semibold text-gray-800">{users?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Bulk Import Form */}
        <Card>
          <CardHeader className="p-5 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">Importar Alunos</h3>
          </CardHeader>
          <CardContent className="p-5">
            <Form {...importForm}>
              <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-5">
                <FormField
                  control={importForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turma</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={importForm.control}
                  name="studentsList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lista de Alunos</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite um nome por linha" 
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Insira um nome por linha
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={importStudentsMutation.isPending}
                >
                  {importStudentsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    "Importar Alunos"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* User Management */}
        <Card>
          <CardHeader className="p-5 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">Gerenciar Usuários</h3>
          </CardHeader>
          <CardContent className="p-5">
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-5">
                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome de usuário" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userForm.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Usuário Administrador
                        </FormLabel>
                        <FormDescription>
                          Concede acesso completo ao sistema
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {successMessage && (
        <Alert className="bg-green-100 text-green-700 mb-8">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader className="p-5 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">Alunos e Relatórios por Turma</h3>
          </CardHeader>
          <CardContent className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={classChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alunos" fill="#3b82f6" name="Alunos" />
                <Bar dataKey="relatorios" fill="#10b981" name="Relatórios" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-5 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">Distribuição de Relatórios</h3>
          </CardHeader>
          <CardContent className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart width={400} height={400}>
                <Pie
                  data={reportTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* User List */}
      <Card>
        <CardHeader className="p-5 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Usuários do Sistema</h3>
        </CardHeader>
        <CardContent className="p-0">
          {isUsersLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isAdmin 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {user.isAdmin ? "Administrador" : "Usuário"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Ativo
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="link" 
                          className="text-primary-dark hover:text-primary"
                          onClick={() => {
                            toast({
                              title: "Funcionalidade em desenvolvimento",
                              description: "Edição de usuários será implementada em breve.",
                            });
                          }}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
