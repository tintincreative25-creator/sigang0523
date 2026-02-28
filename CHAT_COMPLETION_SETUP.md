# OpenAI Chat Completion Edge Function 설정 가이드

## 1. Edge Function 파일 배포

### 파일 위치
`supabase/functions/chat-completion/index.ts` 파일이 생성되어 있습니다.

### 디렉토리 구조
```
supabase/
  functions/
    chat-completion/
      index.ts
```

## 2. 환경변수 설정

Supabase 대시보드에서 환경변수를 설정하세요:

1. Supabase 대시보드 접속
2. **Project Settings** > **Edge Functions** > **Secrets** 이동
3. 다음 Secret 추가:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: OpenAI API 키 (예: `sk-...`)

**중요**: `.env` 파일의 `VITE_OPENAI_API_KEY`는 더 이상 사용되지 않습니다. Edge Function의 Secret에만 설정하면 됩니다.

## 3. Edge Function 배포

### Supabase CLI 사용 (권장)

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
npm install -g supabase

# Supabase 프로젝트 로그인
supabase login

# Edge Function 배포
supabase functions deploy chat-completion
```

### 또는 Supabase 대시보드에서 직접 배포

1. Supabase 대시보드 접속
2. **Edge Functions** 메뉴 이동
3. **Create a new function** 클릭
4. 함수 이름: `chat-completion`
5. `supabase/functions/chat-completion/index.ts` 파일의 내용을 복사하여 붙여넣기
6. **Deploy** 클릭

## 4. 클라이언트에서 호출 방법

ChatWidget 컴포넌트에서 자동으로 호출됩니다:

```typescript
const { data, error } = await supabase.functions.invoke('chat-completion', {
  body: {
    messages: conversationRef.current,
    tools: TOOLS,
    tool_choice: 'auto',
    model: 'gpt-4o-mini',
  },
});
```

## 5. 주의사항

- **API 키 보안**: API 키는 절대 클라이언트 코드에 노출하지 마세요. Edge Function의 Secret에만 저장하세요.
- **환경변수**: 프로덕션과 테스트 환경의 API 키를 분리하여 관리하세요.
- **CORS**: Edge Function은 자동으로 CORS를 처리합니다.
- **에러 처리**: API 호출 실패 시 적절한 에러 처리가 구현되어 있습니다.

## 6. 모델 변경

기본 모델은 `gpt-4o-mini`입니다. 다른 모델을 사용하려면:

1. `src/components/ChatWidget.tsx`의 `fetchOpenAIResponse` 함수에서 `model` 값을 변경
2. 또는 Edge Function에서 기본 모델을 변경

사용 가능한 모델:
- `gpt-4o-mini` (기본, 저렴하고 빠름)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

## 7. 문제 해결

### CORS 오류
- Edge Function이 제대로 배포되었는지 확인
- Supabase 프로젝트 URL이 올바른지 확인

### 401 Unauthorized 오류
- Supabase 대시보드에서 `OPENAI_API_KEY` Secret이 올바르게 설정되었는지 확인
- API 키가 유효한지 확인

### 500 Internal Server Error
- Edge Function 로그 확인 (Supabase 대시보드 > Edge Functions > chat-completion > Logs)
- API 키가 올바르게 설정되었는지 확인

