# Supabase Edge Function 설정 가이드

## 1. Edge Function 파일 배포

### 파일 위치
`supabase/functions/approve-payment/index.ts` 파일을 생성합니다.

### 디렉토리 구조
```
supabase/
  functions/
    approve-payment/
      index.ts
```

## 2. 환경변수 설정

Supabase 대시보드에서 환경변수를 설정하세요:

1. Supabase 대시보드 접속
2. **Project Settings** > **Edge Functions** > **Secrets** 이동
3. 다음 Secret 추가:
   - **Key**: `TOSS_SECRET_KEY`
   - **Value**: `test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG`

## 3. Edge Function 배포

### Supabase CLI 사용 (권장)

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
npm install -g supabase

# Supabase 프로젝트 로그인
supabase login

# Edge Function 배포
supabase functions deploy approve-payment
```

### 또는 Supabase 대시보드에서 직접 배포

1. Supabase 대시보드 접속
2. **Edge Functions** 메뉴 이동
3. **Create a new function** 클릭
4. 함수 이름: `approve-payment`
5. `index.ts` 파일의 내용을 복사하여 붙여넣기
6. **Deploy** 클릭

## 4. 클라이언트에서 호출 방법

```typescript
// 결제 성공 후 approve-payment 함수 호출
const confirmPayment = async (paymentKey: string, orderId: string, amount: number, items: any[]) => {
  const { data, error } = await supabase.functions.invoke('approve-payment', {
    body: {
      paymentKey,
      orderId,
      amount,
      items,
    },
  });

  if (error) {
    console.error('결제 승인 실패:', error);
    return { error };
  }

  return { data };
};
```

## 5. 주의사항

- **시크릿 키 보안**: 시크릿 키는 절대 클라이언트 코드에 노출하지 마세요.
- **환경변수**: 프로덕션과 테스트 환경의 시크릿 키를 분리하여 관리하세요.
- **CORS**: 프로덕션에서는 CORS 설정을 적절히 제한하세요.
- **에러 처리**: 결제 승인 실패 시 적절한 에러 처리를 구현하세요.

## 6. 테스트

배포 후 다음 명령어로 테스트할 수 있습니다:

```bash
# Edge Function 테스트
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/approve-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentKey": "test_payment_key",
    "orderId": "test_order_123",
    "amount": 12000,
    "items": [{"product_id": "1", "product_name": "테스트 상품", "quantity": 1, "price": 12000}]
  }'
```

