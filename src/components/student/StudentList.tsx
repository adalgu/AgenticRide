import React, { useEffect, useState } from 'react';
import { useConsole } from '../../contexts/ConsoleContext';
import './StudentList.scss';

interface Student {
  name: string;
  poi_name: string;
  address: string;
  status: 'waiting' | 'boarded' | 'absent';
}

interface Academy {
  name: string;
  address: string;
  students: Student[];
}

interface StudentListProps {
  memoryKv: { [key: string]: any };
}

export function StudentList({ memoryKv }: StudentListProps) {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const { client } = useConsole();

  useEffect(() => {
    // Function to fetch students using get_students tool
    const fetchStudents = async () => {
      try {
        client.sendUserMessageContent([
          {
            type: 'input_text',
            text: '카모아카데미 학생 명단을 가져와줘',
          },
        ]);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [client]);

  // Watch memoryKv for student list updates
  useEffect(() => {
    if (memoryKv.academy) {
      setAcademy(memoryKv.academy);
    }
  }, [memoryKv]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'boarded':
        return 'status-boarded';
      case 'absent':
        return 'status-absent';
      default:
        return 'status-waiting';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'boarded':
        return '탑승완료';
      case 'absent':
        return '결석';
      default:
        return '대기중';
    }
  };

  if (!academy) {
    return <div className="student-list">학생 명단을 불러오는 중...</div>;
  }

  return (
    <div className="student-list">
      <h2>{academy.name} 학생 명단</h2>
      <div className="student-list-content">
        {academy.students.map((student) => (
          <div key={student.name} className="student-item">
            <div className="student-info">
              <span className="student-name">{student.name}</span>
              <span className="student-location">{student.poi_name}</span>
            </div>
            <div className={`student-status ${getStatusClass(student.status)}`}>
              {getStatusText(student.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
