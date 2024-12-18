import { ToolDefinition } from '../types/tools';
import axios from 'axios';
import academyStudents from '../data/academy_students.json';

const KAKAO_MOBILITY_API_KEY = '28bab536bede4af8cfbc8a0cf14e7653';

interface Coordinate {
  x: string;
  y: string;
}

interface Student {
  name: string;
  poi_name: string;
  address: string;
  status: 'waiting' | 'boarded' | 'absent';
  x?: string;
  y?: string;
}

interface Academy {
  name: string;
  address: string;
  x: string;
  y: string;
  students: Student[];
}

interface Academies {
  [key: string]: Academy;
}

interface StudentUpdateParams {
  academy_name: string;
  student_name: string;
  address?: string;
  status?: 'waiting' | 'boarded' | 'absent';
}

// 학생 목록 조회 도구 (이름을 get_students_list로 변경)
export const getStudentsListTool = (): ToolDefinition => {
  return {
    name: 'get_students_list',
    description: '지정된 학원의 학생 명단과 각 학생의 상태를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        academy_name: {
          type: 'string',
          description: '학원 이름 (예: 카모아카데미, 판교영재학원)'
        }
      },
      required: ['academy_name']
    } as any,
    handler: async (params: { [key: string]: any }) => {
      try {
        const { academy_name } = params;
        const academiesData = academyStudents.academies as Academies;

        const academy = academiesData[academy_name];
        if (!academy) {
          return {
            success: false,
            error: `${academy_name} 학원을 찾을 수 없습니다.`
          };
        }

        return {
          success: true,
          academy: {
            name: academy.name,
            address: academy.address,
            students: academy.students
          }
        };
      } catch (error) {
        console.error('학생 정보 조회 중 오류:', error);
        return {
          success: false,
          error: '학생 정보 조회 중 오류가 발생했습니다.'
        };
      }
    }
  };
};

export const updateStudentListTool = (
  setMemoryKv: (fn: (kv: { [key: string]: any }) => { [key: string]: any }) => void
): ToolDefinition => {
  return {
    name: 'update_student_list',
    description: '학생 정보를 업데이트합니다. 주소, 상태 등을 변경할 수 있습니다.',
    parameters: {
      type: 'object',
      properties: {
        academy_name: {
          type: 'string',
          description: '학원 이름 (예: 카모아카데미, 판교영재학원)'
        },
        student_name: {
          type: 'string',
          description: '학생 이름'
        },
        address: {
          type: 'string',
          description: '(선택) 새로운 주소'
        },
        status: {
          type: 'string',
          description: '(선택) 학생 상태',
          enum: ['waiting', 'boarded', 'absent']
        }
      },
      required: ['academy_name', 'student_name']
    } as any,
    handler: async (params: { [key: string]: any }) => {
      try {
        const { academy_name, student_name, address, status } = params;
        
        // 학원 및 학생 존재 확인
        const academiesData = academyStudents.academies as Academies;
        if (!academiesData[academy_name]) {
          return {
            success: false,
            error: `${academy_name} 학원을 찾을 수 없습니다.`
          };
        }

        const studentIndex = academiesData[academy_name].students.findIndex(
          (student) => student.name === student_name
        );

        if (studentIndex === -1) {
          return {
            success: false,
            error: `${student_name} 학생을 찾을 수 없습니다.`
          };
        }

        let updatedStudent = { ...academiesData[academy_name].students[studentIndex] };

        // 주소 업데이트 및 좌표 변환
        if (address) {
          try {
            const coordinates = await getCoordinatesForAddress(address);
            if (coordinates) {
              updatedStudent.address = address;
              updatedStudent.x = coordinates.x;
              updatedStudent.y = coordinates.y;
            }
          } catch (coordError) {
            console.error('좌표 변환 중 오류:', coordError);
          }
        }

        // 상태 업데이트
        if (status) {
          updatedStudent.status = status;
        }

        // memoryKv 업데이트
        setMemoryKv((prev) => ({
          ...prev,
          studentUpdate: {
            academy: academy_name,
            student: student_name,
            updatedFields: { address, status },
            updatedStudent
          }
        }));

        return {
          success: true,
          message: '학생 정보가 성공적으로 업데이트되었습니다.',
          updatedStudent
        };
      } catch (error) {
        console.error('학생 정보 업데이트 중 오류:', error);
        return {
          success: false,
          error: '학생 정보 업데이트 중 오류가 발생했습니다.'
        };
      }
    }
  };
};

// 주소를 좌표로 변환하는 헬퍼 함수
async function getCoordinatesForAddress(address: string): Promise<Coordinate | null> {
  try {
    const response = await axios.get<{
      documents: Array<{
        x: string;
        y: string;
      }>;
    }>(
      'https://dapi.kakao.com/v2/local/search/address.json',
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MOBILITY_API_KEY}`,
        },
        params: {
          query: address,
        },
      }
    );

    if (response.status === 200 && response.data.documents.length > 0) {
      const { x: longitude, y: latitude } = response.data.documents[0];
      return { x: longitude, y: latitude };
    }
    
    return null;
  } catch (error) {
    console.error('좌표 변환 중 오류:', error);
    return null;
  }
};
