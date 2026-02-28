# Edge Function 테스트 가이드

## 문제 해결 체크리스트

### 1. Edge Function 배포 확인

Edge Function이 제대로 배포되었는지 확인하세요:

1. Supabase 대시보드 접속
2. **Edge Functions** 메뉴 이동
3. `chat-completion` 함수가 목록에 있는지 확인
4. 상태가 "Active"인지 확인

### 2. 환경변수 확인

1. Supabase 대시보드 > **Project Settings** > **Edge Functions** > **Secrets**
2. `OPENAI_API_KEY` Secret이 설정되어 있는지 확인
3. API 키가 올바른지 확인 (sk-로 시작해야 함)

### 3. CORS 오류 해결

CORS 오류가 발생하면:

1. Edge Function 코드가 최신 버전인지 확인
2. OPTIONS 요청이 올바르게 처리되는지 확인
3. 브라우저 캐시를 지우고 다시 시도

### 4. 수동 테스트

터미널에서 직접 테스트:

```bash
curl -X POST https://zfnkbhexaozfmxoojsfi.supabase.co/functions/v1/chat-completion \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "안녕하세요"}],
    "model": "gpt-4o-mini"
  }'
```

### 5. 로그 확인

1. Supabase 대시보드 > **Edge Functions** > **chat-completion** > **Logs**
2. 에러 메시지 확인
3. OpenAI API 호출이 성공했는지 확인

### 6. 대안: 임시로 클라이언트에서 직접 호출 (개발용만)

개발 중에만 사용하고, 프로덕션에서는 반드시 Edge Function을 사용하세요:

```typescript
// 임시 해결책 (개발용만)
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: conversationRef.current,
    tools: TOOLS,
    tool_choice: "auto",
  }),
});
```

**주의**: 이 방법은 CORS 오류가 발생할 수 있으며, API 키가 클라이언트에 노출됩니다.

