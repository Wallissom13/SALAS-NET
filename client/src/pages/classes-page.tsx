import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Class } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ClassesPage() {
  const { toast } = useToast();
  
  const { data: classes, isLoading, error } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const response = await fetch("/api/classes");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar turmas");
      }
      
      return response.json();
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    toast({
      title: "Erro ao carregar turmas",
      description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
      variant: "destructive",
    });
    
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro ao carregar turmas</h1>
        <p className="text-gray-600 mb-6">Não foi possível carregar as turmas. Tente novamente mais tarde.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Todas as Turmas</h1>
        <p className="text-gray-600">Selecione uma turma para visualizar os alunos e seus relatórios</p>
      </div>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {classes?.map((classItem) => (
          <Link key={classItem.id} href={`/class/${classItem.id}`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-0">
                <div className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[120px]">
                  <div className="text-primary text-4xl font-bold mb-2">{classItem.name}</div>
                  <div className="text-gray-500 text-sm">Turma</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}