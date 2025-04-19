import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Class } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Users, BookOpen } from "lucide-react";

// Define as cores para cada turma com base no ano
const getClassColor = (className: string): string => {
  const grade = className.charAt(0);
  
  switch (grade) {
    case '6':
      return 'bg-emerald-500 hover:bg-emerald-600'; // Verde para 6º ano
    case '7':
      return 'bg-blue-500 hover:bg-blue-600';      // Azul para 7º ano
    case '8':
      return 'bg-amber-500 hover:bg-amber-600';    // Âmbar para 8º ano
    case '9':
      return 'bg-purple-500 hover:bg-purple-600';  // Roxo para 9º ano
    default:
      return 'bg-gray-500 hover:bg-gray-600';      // Cinza para outros
  }
};

// Define ícones para cada tipo de turma
const getClassIcon = (className: string) => {
  const grade = className.charAt(0);
  
  switch (grade) {
    case '6':
      return <BookOpen className="h-10 w-10 mb-3" />;
    case '7':
      return <GraduationCap className="h-10 w-10 mb-3" />;
    case '8':
      return <Users className="h-10 w-10 mb-3" />;
    case '9':
      return <BookOpen className="h-10 w-10 mb-3" />;
    default:
      return <GraduationCap className="h-10 w-10 mb-3" />;
  }
};

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
  
  // Ordenar as turmas por nome
  const sortedClasses = [...(classes || [])].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">TURMAS</h1>
        <p className="text-gray-600">Selecione uma turma para visualizar os alunos e seus relatórios</p>
      </div>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
        {sortedClasses?.map((classItem) => (
          <Link key={classItem.id} href={`/class/${classItem.id}`}>
            <Card className={`cursor-pointer transition-all transform hover:scale-105 overflow-hidden rounded-xl shadow-lg h-full border-0`}>
              <div className={`${getClassColor(classItem.name)} text-white flex flex-col items-center justify-center text-center h-full p-8`}>
                {getClassIcon(classItem.name)}
                <div className="text-4xl font-bold mb-2">{classItem.name}</div>
                <div className="text-white text-sm opacity-80">
                  {classItem.name.startsWith('6') ? '6º Ano' : 
                   classItem.name.startsWith('7') ? '7º Ano' : 
                   classItem.name.startsWith('8') ? '8º Ano' : '9º Ano'}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}