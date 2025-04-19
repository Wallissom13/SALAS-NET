import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Class, Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReportFormProps {
  classes: Class[];
}

const reportSchema = z.object({
  classId: z.string().min(1, "Selecione uma turma"),
  studentId: z.string().min(1, "Selecione um aluno"),
  content: z.string().min(5, "Descreva o ocorrido com pelo menos 5 caracteres"),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
  reporterType: z.enum(["Líder", "Vice", "Professor"], {
    required_error: "Selecione quem você é",
  }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportForm({ classes }: ReportFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      classId: "",
      studentId: "",
      content: "",
      date: new Date().toISOString().split("T")[0], // Today's date
      time: new Date().toTimeString().slice(0, 5), // Current time
      reporterType: undefined,
    },
  });
  
  const classId = form.watch("classId");
  
  // Load students when class changes
  useEffect(() => {
    if (classId) {
      fetch(`/api/students?classId=${classId}`)
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          form.setValue("studentId", "");
        })
        .catch(error => {
          toast({
            title: "Erro ao carregar alunos",
            description: "Não foi possível carregar a lista de alunos.",
            variant: "destructive",
          });
        });
    } else {
      setStudents([]);
    }
  }, [classId, form, toast]);
  
  const reportMutation = useMutation({
    mutationFn: async (data: {
      studentId: number,
      content: string,
      date: Date,
      reporterType: string
    }) => {
      const res = await apiRequest("POST", "/api/reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Show success message
      setSuccessMessage("Relatório enviado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset form
      form.reset({
        classId: "",
        studentId: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        reporterType: undefined,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar relatório",
        description: error.message || "Não foi possível enviar o relatório.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: ReportFormValues) {
    const dateTime = `${values.date}T${values.time}:00`;
    
    reportMutation.mutate({
      studentId: parseInt(values.studentId),
      content: values.content,
      date: new Date(dateTime),
      reporterType: values.reporterType,
    });
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 mb-2">Registro de Ocorrências</h2>
          <p className="text-gray-600">Preencha este formulário para documentar uma ocorrência com o aluno.</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="inline-flex items-center justify-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg text-blue-700 shadow-sm border border-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Os relatórios são verificados diariamente</span>
          </div>
        </div>
      </div>
      
      <Card className="shadow-lg border-0 overflow-hidden rounded-xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-4 px-6">
          <h3 className="text-white text-lg font-semibold">Formulário de Ocorrência</h3>
          <p className="text-blue-100 text-sm">Todos os campos marcados são obrigatórios</p>
        </div>
        
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Campos principais */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs mr-2">1</span>
                  Identificação
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Turma</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                              <SelectValue placeholder="Selecione a turma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                Turma {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Aluno</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!classId}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                              <SelectValue placeholder={
                                classId ? "Selecione o aluno" : "Selecione primeiro a turma"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.length > 0 ? (
                              students.map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-4 text-center text-sm text-gray-500">
                                {classId ? "Nenhum aluno encontrado nesta turma" : "Selecione uma turma primeiro"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Detalhes da ocorrência */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs mr-2">2</span>
                  Detalhes da Ocorrência
                </h4>
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Descreva o Ocorrido</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva com detalhes o que aconteceu, incluindo local e contexto..." 
                          rows={5}
                          className="bg-white border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Descreva de forma clara e objetiva, com detalhes relevantes sobre o comportamento observado.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Data da Ocorrência</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="bg-white border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Horário</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            className="bg-white border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Informações do relator */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs mr-2">3</span>
                  Identificação do Relator
                </h4>
              
                <FormField
                  control={form.control}
                  name="reporterType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Selecione Sua Função</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2 bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                            <RadioGroupItem value="Líder" id="lider" />
                            <label htmlFor="lider" className="cursor-pointer font-medium">Líder de Turma</label>
                          </div>
                          <div className="flex items-center space-x-2 bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                            <RadioGroupItem value="Vice" id="vice" />
                            <label htmlFor="vice" className="cursor-pointer font-medium">Vice-Líder</label>
                          </div>
                          <div className="flex items-center space-x-2 bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                            <RadioGroupItem value="Professor" id="professor" />
                            <label htmlFor="professor" className="cursor-pointer font-medium">Professor</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Mensagem de sucesso */}
              {successMessage && (
                <Alert className="bg-green-50 border border-green-100 text-green-700 animate-pulse">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="font-medium">{successMessage}</AlertDescription>
                </Alert>
              )}
              
              {/* Botão de envio */}
              <div className="pt-2 flex justify-center sm:justify-end">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                  disabled={reportMutation.isPending}
                >
                  {reportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando envio...
                    </>
                  ) : (
                    "Enviar Relatório"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
