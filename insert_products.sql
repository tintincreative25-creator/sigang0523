-- ============================================
-- 상품 데이터 INSERT SQL
-- products.json 기반
-- ============================================
-- 이 파일의 내용을 Supabase SQL Editor에서 실행하세요.
--
-- 주의사항:
-- - 이미 존재하는 상품은 ON CONFLICT로 자동 업데이트됩니다.
-- - 중복 실행해도 안전합니다.
-- - 기존 데이터는 유지되며, 변경된 정보만 업데이트됩니다.

-- 기존 데이터 삭제 (선택사항 - 필요시 주석 해제)
-- DELETE FROM products;

-- 상품 데이터 삽입
INSERT INTO products (id, name, description, price, image, sold_out, not_for_sale, details) VALUES
  (
    '1',
    '행성의 파편',
    '45억년 전 배설물과 같은 행성에서 자란 나무 쪼가리',
    12000,
    '/src/assets/product-1.jpg',
    false,
    false,
    '[]'::jsonb
  ),
  (
    '2',
    '감독의 호흡',
    '스티븐 스필버그의 방귀가 섞인 공기와 혼합된 봉투 속 공기',
    12000,
    '/src/assets/product-2.jpg',
    false,
    false,
    '[]'::jsonb
  ),
  (
    '3',
    '당신을 위한 욕설',
    '오직 당신만을 위해 준비된 고품격 욕설 한 마디',
    12000,
    '/src/assets/product-3.jpg',
    false,
    false,
    '[]'::jsonb
  ),
  (
    '4',
    '거장의 디저트',
    '브루노 마스가 먹다가 뱉은 20만원 상당의 브라우니',
    12000,
    '/src/assets/product-4.jpg',
    true,
    false,
    '[]'::jsonb
  ),
  (
    '5',
    '창조주의 유해',
    '프레드릭 바우어의 유골이 담긴 프링글스 통',
    12000,
    '/src/assets/product-5.jpg',
    true,
    false,
    '[]'::jsonb
  ),
  (
    '6',
    '추상적 화폐',
    '실제 가치와 동일한 12,000원권 지폐',
    12000,
    '',
    false,
    false,
    '[]'::jsonb
  ),
  (
    '7',
    '친구',
    '없어서 못 팜',
    12000,
    '',
    true,
    false,
    '[]'::jsonb
  ),
  (
    '8',
    '코딩산 오레오',
    '오레오 오즈 틴틴 코딩산 에디션',
    12000,
    '',
    false,
    false,
    '[]'::jsonb
  ),
  (
    '9',
    '잭슨의 유산',
    '마이클 잭슨의 쓰레기가 버려졌던 쓰레기장',
    12000,
    '',
    false,
    true,
    '[]'::jsonb
  ),
  (
    '10',
    '아이디어',
    '순수 개념적 아이디어',
    12000,
    '',
    true,
    false,
    '[]'::jsonb
  ),
  (
    '11',
    '태초의 공기',
    '최초의 인류가 밟고 지나간 자리, 그 지구 반대편에 있던 공기',
    12000,
    '',
    true,
    false,
    '[]'::jsonb
  ),
  (
    '12',
    'TMI 컬렉션',
    '알아두면 쓸모없는 고귀한 지식들',
    12000,
    '',
    false,
    false,
    '[
      "나는 자습시간 5시간 중에 한번도 공부를 안하고 미술책 2권 76페이지에 있는 테이프 붙여진 바나나만 본 적 있다.",
      "오레오 오즈 틴틴 코딩산은 재고가 떨어지면 내가 직접 보충하지 않는다.",
      "북극곰은 코카콜라를 마실 줄 모른다.",
      "내용 3은 정확한 사실이 아니라 나의 추측이다.",
      "51구역 근무자들은 본인이 51구역에 있다는 사실을 인지하고 있는지 궁금하다.",
      "TMI 내용이 다 떨어져가고 있다.",
      "TMI는 알아도 쓸모없는 지식이란 뜻이다. 아니면 내 알 바 아니다.",
      "아마도 TMI가 여기에서 가장 좋은 상품일 것이다.",
      "내용 6과 내용 7을 합치면 67이다. 식스세븐.",
      "지금 이 TMI는 10번째 TMI다."
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  sold_out = EXCLUDED.sold_out,
  not_for_sale = EXCLUDED.not_for_sale,
  details = EXCLUDED.details,
  updated_at = NOW();

-- 완료!
-- 총 12개의 상품이 삽입되었습니다.

