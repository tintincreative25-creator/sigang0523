# Edge Function 배포 가이드

## 현재 상태
- ✅ Edge Function 파일 존재: `supabase/functions/chat-completion/index.ts`
- ❌ Supabase CLI 미설치
- ❓ Edge Function 배포 상태 불명

## 배포 방법

### 방법 1: Supabase CLI 사용 (권장)

#### 1단계: Supabase CLI 설치

**Windows (PowerShell 관리자 권한):**
```powershell
# npm이 설치되어 있는지 확인
npm --version

# Supabase CLI 설치
npm install -g supabase

# 설치 확인
supabase --version
```

**또는 직접 다운로드:**
- https://github.com/supabase/cli/releases 에서 Windows용 다운로드

#### 2단계: Supabase 로그인
```powershell
supabase login
```
브라우저가 열리면 Supabase 계정으로 로그인하세요.

#### 3단계: 프로젝트 연결 (선택사항)
```powershell
# 프로젝트 디렉토리로 이동
cd "C:\Users\tinti\Downloads\sigang0523-main\sigang0523-main"

# 프로젝트 연결 (프로젝트 참조 ID 필요)
supabase link --project-ref zfnkbhexaozfmxoojsfi
```

#### 4단계: Edge Function 배포
```powershell
supabase functions deploy chat-completion
```

### 방법 2: Supabase 대시보드에서 직접 배포 (더 쉬움)

#### 1단계: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (zfnkbhexaozfmxoojsfi)

#### 2단계: Edge Function 생성
1. 왼쪽 메뉴에서 **Edge Functions** 클릭
2. **Create a new function** 버튼 클릭
3. 함수 이름: `chat-completion` 입력

#### 3단계: 코드 복사
1. `supabase/functions/chat-completion/index.ts` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)

#### 4단계: 코드 붙여넣기 및 배포
1. Supabase 대시보드의 코드 에디터에 붙여넣기 (Ctrl+V)
2. **Deploy** 버튼 클릭
3. 배포 완료 대기

#### 5단계: 환경변수 설정
1. **Project Settings** > **Edge Functions** > **Secrets** 이동
2. **Add new secret** 클릭
3. **Key**: `OPENAI_API_KEY`
4. **Value**: OpenAI API 키 입력
5. **Save** 클릭

## 배포 확인

### 방법 1: Supabase 대시보드에서 확인
1. **Edge Functions** 메뉴 이동
2. `chat-completion` 함수가 목록에 있는지 확인
3. 상태가 "Active"인지 확인

### 방법 2: 브라우저 콘솔에서 테스트
```javascript
// 브라우저 개발자 도구 콘솔에서 실행
const testFunction = async () => {
  const { data, error } = await supabase.functions.invoke('chat-completion', {
    body: {
      messages: [{ role: 'user', content: '테스트' }],
      model: 'gpt-4o-mini'
    }
  });
  console.log('결과:', { data, error });
};
testFunction();
```

### 방법 3: curl로 테스트
```bash
curl -X POST https://zfnkbhexaozfmxoojsfi.supabase.co/functions/v1/chat-completion \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"테스트"}],"model":"gpt-4o-mini"}'
```

## 문제 해결

### "FunctionsFetchError: Failed to send a request to the Edge Function"
- Edge Function이 배포되지 않았습니다
- 위의 배포 방법 중 하나를 따라 Edge Function을 배포하세요

### "404 Not Found"
- Edge Function 이름이 올바른지 확인 (`chat-completion`)
- Supabase 대시보드에서 함수가 배포되었는지 확인

### "500 Internal Server Error"
- OpenAI API 키가 올바르게 설정되었는지 확인
- Edge Function 로그 확인 (대시보드 > Edge Functions > chat-completion > Logs)

### CORS 오류
- Edge Function 코드가 최신 버전인지 확인
- OPTIONS 요청이 올바르게 처리되는지 확인

## 빠른 체크리스트

- [ ] Edge Function 파일 존재 확인 (`supabase/functions/chat-completion/index.ts`)
- [ ] Supabase 대시보드에서 `chat-completion` 함수 배포
- [ ] `OPENAI_API_KEY` Secret 설정
- [ ] 브라우저 새로고침 후 테스트

