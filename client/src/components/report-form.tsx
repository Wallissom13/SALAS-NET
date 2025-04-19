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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Enviar Relatório</h2>
      <p className="text-gray-600 mb-8">Preencha o formulário abaixo para registrar uma ocorrência.</p>
      
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
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
                          {classes.map((cls) => (
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
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aluno</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!classId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              classId ? "Selecione o aluno" : "Selecione primeiro a turma"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ocorrido</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o que aconteceu..." 
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="reporterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eu Sou</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Líder" id="lider" />
                          <label htmlFor="lider">Líder</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Vice" id="vice" />
                          <label htmlFor="vice">Vice</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Professor" id="professor" />
                          <label htmlFor="professor">Professor</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {successMessage && (
                <Alert className="bg-green-100 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={reportMutation.isPending}
                >
                  {reportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
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
