import { useState } from "react";
import { ClassWithStudents, StudentWithReports } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BadgeCounter } from "@/components/ui/badge-counter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <Input 
            type="text" 
            className="border-0 py-2 px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Students List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} getReporterBadgeColor={getReporterBadgeColor} formatDateTime={formatDateTime} />
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
  const [showAllReports, setShowAllReports] = useState(false);
  const hasMultipleReports = student.reports.length > 2;
  const displayReports = showAllReports ? student.reports : student.reports.slice(0, 2);
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className={`font-semibold ${student.reportCount >= 3 ? 'text-red-600' : 'text-gray-800'}`}>
          {student.name}
        </h3>
        <BadgeCounter 
          count={student.reportCount} 
          variant={student.reportCount >= 3 ? 'danger' : student.reportCount === 2 ? 'warning' : 'success'} 
        />
      </CardHeader>
      <CardContent className="p-5">
        {student.reportCount === 0 ? (
          <p className="text-gray-500 text-center py-2">Nenhum relatório registrado.</p>
        ) : (
          <>
            {displayReports.map((report, index) => (
              <div 
                key={report.id} 
                className={`mb-4 pb-4 ${index < displayReports.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">{formatDateTime(report.date)}</p>
                    <p className="mt-1.5 text-gray-800">{report.content}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getReporterBadgeColor(report.reporterType)}`}>
                    {report.reporterType}
                  </span>
                </div>
              </div>
            ))}
            
            {hasMultipleReports && (
              <div className="mt-2 text-center">
                <Button 
                  variant="link" 
                  onClick={() => setShowAllReports(!showAllReports)}
                  className="text-primary text-sm font-medium hover:text-primary-dark"
                >
                  {showAllReports ? "Mostrar menos" : "Ver todos os relatórios"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
