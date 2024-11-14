# AI 동요 생성기 (AI Children's Song Generator)

이 프로젝트는 OpenAI의 Realtime API와 Suno AI를 활용하여 어린이를 위한 맞춤형 동요를 생성하는 대화형 웹 애플리케이션입니다.

## 주요 기능

### 1. 대화형 음악 생성

- 실시간 음성 대화를 통한 자연스러운 상호작용
- 사용자의 아이디어와 이야기를 바탕으로 맞춤형 동요 생성
- 음성 활동 감지(VAD) 또는 수동 모드 지원

### 2. 가사 생성 (Lyrics Generation)

- 사용자와의 대화를 통해 발견한 소재로 동요 가사 생성
- 어린이의 눈높이에 맞는 한국어 가사 작성
- `generate_lyrics` 도구를 통한 맞춤형 가사 생성

### 3. 음악 생성 (Music Generation)

- Suno AI의 비공식 API를 활용한 고품질 음악 생성
- AI 기반의 동요 멜로디 및 반주 생성
- 다양한 장르와 스타일 지원
- 가사와 멜로디의 자연스러운 조화
- 선택적 반주 전용 버전 생성 가능

### 4. 시스템 도구

- 메모리 기능: 대화 내용과 생성된 음악 정보 저장
- 날씨 정보 통합: 날씨 관련 동요 생성 시 실제 날씨 데이터 활용

## 기술 스택

- **Frontend**: React, TypeScript, SCSS
- **API Integration**:
  - OpenAI Realtime API
  - Suno AI Unofficial API
- **Audio Processing**: Web Audio API
- **실시간 통신**: WebSocket
- **상태 관리**: React Context API
- **오디오 시각화**: Canvas API

## 프로젝트 구조

```
src/
├── components/         # React 컴포넌트
│   ├── console/       # 콘솔 관련 컴포넌트
│   ├── main/          # 메인 뷰 컴포넌트
│   ├── card/          # 음악 카드 컴포넌트
│   ├── music/         # 음악 라이브러리 컴포넌트
│   └── conversation/  # 대화 관련 컴포넌트
├── hooks/             # Custom React Hooks
│   └── realtime/      # 실시간 통신 관련 훅
├── tools/             # AI 도구 정의
│   ├── generateLyrics.ts
│   ├── generateMusic.ts
│   └── musicCallback.ts
├── types/             # TypeScript 타입 정의
└── utils/             # 유틸리티 함수
```

## 주요 도구 설명

### 1. generate_lyrics

- **기능**: 동요 가사 생성
- **입력**: 대화를 통해 발견한 소재와 주제
- **출력**: 한국어 동요 가사와 제목

### 2. generate_music (Suno AI Integration)

- **기능**: 음악 생성
- **입력**:
  - prompt: 상세한 음악 설명과 가사
  - tags: 음악 장르 및 스타일
  - title: 곡 제목
  - make_instrumental: 반주 전용 버전 생성 여부
- **출력**: 생성된 음악 파일과 메타데이터
- **특징**: Suno AI의 비공식 API를 활용하여 고품질 음악 생성

## 설치 및 실행

1. 프로젝트 클론

```bash
git clone [repository-url]
cd openai-realtime-console
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

```bash
# .env 파일 생성
OPENAI_API_KEY=your_api_key
REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
SUNO_COOKIE=your_suno_cookie  # Suno AI 쿠키 설정
```

4. 개발 서버 실행

```bash
npm start
```

5. 릴레이 서버 실행 (선택사항)

```bash
npm run relay
```

## 사용 방법

1. 웹 브라우저에서 애플리케이션 접속
2. OpenAI API 키 입력
3. 'Connect' 버튼을 클릭하여 시작
4. 음성 또는 텍스트로 대화 시작
5. AI와 대화하며 동요 생성 과정 진행
6. 생성된 가사와 음악 확인 및 재생

## 주의사항

- OpenAI API 키가 필요합니다
- Suno AI 계정의 쿠키가 필요합니다
- 마이크 접근 권한이 필요합니다
- 안정적인 인터넷 연결이 필요합니다
- 최신 버전의 웹 브라우저를 사용하세요
