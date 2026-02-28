# Edge Function 빠른 배포 가이드

## 현재 문제
**FunctionsFetchError: Failed to send a request to the Edge Function**

이 오류는 Edge Function이 아직 배포되지 않았기 때문에 발생합니다.

## 해결 방법 (가장 쉬운 방법)

### Supabase 대시보드에서 직접 배포

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택 (zfnkbhexaozfmxoojsfi)

2. **Edge Functions 메뉴로 이동**
   - 왼쪽 사이드바에서 **Edge Functions** 클릭

3. **함수 확인**
   - `chat-completion` 함수가 목록에 있는지 확인
   - 없다면 다음 단계로 진행

4. **새 함수 생성**
   - **Create a new function** 버튼 클릭
   - 함수 이름: `chat-completion` 입력
   - **Create function** 클릭

5. **코드 복사 및 붙여넣기**
   - 프로젝트의 `supabase/functions/chat-completion/index.ts` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)
   - Supabase 대시보드의 코드 에디터에 붙여넣기 (Ctrl+V)

6. **배포**
   - **Deploy** 버튼 클릭
   - 배포 완료 대기 (몇 초 소요)

7. **환경변수 설정**
   - **Project Settings** (왼쪽 하단 톱니바퀴 아이콘) 클릭
   - **Edge Functions** > **Secrets** 이동
   - **Add new secret** 클릭
   - **Key**: `OPENAI_API_KEY`
   - **Value**: OpenAI API 키 입력 (sk-로 시작)
   - **Save** 클릭

8. **테스트**
   - 브라우저 새로고침 (F5)
   - 챗봇에서 메시지 전송 테스트

## 배포 확인

### 방법 1: 대시보드에서 확인
- **Edge Functions** 메뉴에서 `chat-completion` 함수 확인
- 상태가 **Active** (초록색)인지 확인

### 방법 2: 브라우저 콘솔에서 테스트
```javascript
// 개발자 도구 콘솔에서 실행
const { data, error } = await supabase.functions.invoke('chat-completion', {
  body: { messages: [{ role: 'user', content: '테스트' }] }
});
console.log({ data, error });
```

## 문제가 계속되면

1. **Edge Function 로그 확인**
   - 대시보드 > Edge Functions > chat-completion > **Logs** 탭
   - 에러 메시지 확인

2. **환경변수 재확인**
   - `OPENAI_API_KEY` Secret이 올바르게 설정되었는지 확인

3. **코드 재배포**
   - Edge Function 코드를 다시 복사하여 배포

