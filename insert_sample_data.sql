-- ============================================
-- 샘플 데이터 INSERT SQL
-- 고객 3명, 주문 2개
-- ============================================
-- 이 파일의 내용을 Supabase SQL Editor에서 실행하세요.
--
-- 주의사항:
-- - 고객 데이터는 auth.users에 먼저 사용자가 생성되어 있어야 합니다.
-- - 아래 UUID는 예시이며, 실제 auth.users의 UUID로 변경해야 합니다.
-- - 이미 존재하는 고객은 ON CONFLICT로 자동 업데이트됩니다.
-- - 주문은 중복 방지 로직이 포함되어 있습니다 (최근 1분 이내 동일 주문 체크).
-- - 중복 실행해도 안전합니다.

-- ============================================
-- 0. 실제 사용자 확인 및 사용 (선택사항)
-- ============================================
-- 실제 auth.users에 존재하는 사용자가 있다면 그 ID를 사용하세요.
-- 아래 쿼리로 사용자 ID를 확인할 수 있습니다:
-- SELECT id, email FROM auth.users LIMIT 3;

-- 실제 사용자가 없는 경우, 아래 방법 중 하나를 선택하세요:
-- 방법 1: Supabase Dashboard > Authentication > Users에서 테스트 사용자 생성
-- 방법 2: 아래 주석을 해제하여 테스트 사용자 자동 생성 (권장하지 않음)

/*
-- 테스트 사용자 생성 (auth.users에 직접 삽입 - 주의: Supabase에서는 권장하지 않음)
-- 대신 Supabase Dashboard에서 사용자를 생성하는 것을 권장합니다.
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  user3_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- 주의: auth.users에 직접 삽입하는 것은 Supabase에서 권장하지 않습니다.
  -- 대신 Supabase Dashboard > Authentication > Users에서 사용자를 생성하세요.
  -- 또는 애플리케이션의 회원가입 기능을 사용하세요.
END $$;
*/

-- ============================================
-- 1. 고객(customers) 샘플 데이터 삽입
-- ============================================
-- 주의: 아래 UUID는 auth.users에 실제로 존재하는 사용자 ID로 변경해야 합니다.
--       실제 사용자 ID를 확인하려면: SELECT id, email FROM auth.users;
--       또는 Supabase Dashboard > Authentication > Users에서 확인하세요.

-- 실제 사용자 ID로 변경하거나, 아래 주석을 해제하여 기존 사용자 ID를 사용하세요:
/*
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- 첫 번째 사용자 ID 가져오기
  SELECT id INTO existing_user_id FROM auth.users LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- 고객 1: 첫 번째 사용자
    INSERT INTO customers (id, email, display_name, phone, address) VALUES
      (existing_user_id, 'kim.chulsoo@example.com', '김철수', '010-1234-5678', '서울특별시 강남구 테헤란로 123, 101동 101호')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      updated_at = NOW();
  END IF;
END $$;
*/

-- 고객 1: 김철수
-- ⚠️ 아래 UUID를 실제 auth.users에 존재하는 사용자 ID로 변경하세요!
-- 실제 사용자 ID 확인: SELECT id, email FROM auth.users;
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
BEGIN
  -- 실제 auth.users에서 사용자 ID 가져오기
  SELECT id INTO user1_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO user2_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 2;
  
  -- 고객 1: 김철수 (첫 번째 사용자 사용)
  IF user1_id IS NOT NULL THEN
    INSERT INTO customers (id, email, display_name, phone, address) VALUES
      (user1_id, 'kim.chulsoo@example.com', '김철수', '010-1234-5678', '서울특별시 강남구 테헤란로 123, 101동 101호')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      updated_at = NOW();
  ELSE
    RAISE NOTICE '경고: auth.users에 사용자가 없습니다. 먼저 사용자를 생성하세요.';
  END IF;
  
  -- 고객 2: 이영희 (두 번째 사용자 사용)
  IF user2_id IS NOT NULL THEN
    INSERT INTO customers (id, email, display_name, phone, address) VALUES
      (user2_id, 'lee.younghee@example.com', '이영희', '010-2345-6789', '서울특별시 서초구 서초대로 456, 202동 202호')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      updated_at = NOW();
  ELSE
    RAISE NOTICE '경고: 두 번째 사용자가 없습니다. 고객 2는 건너뜁니다.';
  END IF;
  
  -- 고객 3: 박민수 (세 번째 사용자 사용)
  IF user3_id IS NOT NULL THEN
    INSERT INTO customers (id, email, display_name, phone, address) VALUES
      (user3_id, 'park.minsu@example.com', '박민수', '010-3456-7890', '서울특별시 송파구 올림픽로 789, 303동 303호')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      updated_at = NOW();
  ELSE
    RAISE NOTICE '경고: 세 번째 사용자가 없습니다. 고객 3은 건너뜁니다.';
  END IF;
END $$;

-- ============================================
-- 2. 주문(orders) 샘플 데이터 삽입
-- ============================================
-- 주문 1: 김철수의 주문 (행성의 파편 2개, 감독의 호흡 1개)
-- 주의: 주문은 매번 새로 생성되므로, 중복 실행 시 여러 개의 주문이 생성됩니다.
--       특정 주문만 삽입하려면 WHERE 조건을 추가하거나 수동으로 삽입하세요.
DO $$
DECLARE
  customer1_id UUID;
  has_customer_id BOOLEAN;
  has_user_id BOOLEAN;
BEGIN
  -- 고객 ID 가져오기
  SELECT id INTO customer1_id FROM customers WHERE display_name = '김철수' LIMIT 1;
  
  -- 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
  ) INTO has_customer_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  IF customer1_id IS NOT NULL THEN
    -- customer_id + user_id 둘 다 있는 경우
    IF has_customer_id AND has_user_id THEN
      INSERT INTO orders (customer_id, user_id, items, total_amount, status, payment_method, shipping_address)
      SELECT 
        customer1_id,
        customer1_id,
        '[
          {
            "product_id": "1",
            "product_name": "행성의 파편",
            "quantity": 2,
            "price": 12000
          },
          {
            "product_id": "2",
            "product_name": "감독의 호흡",
            "quantity": 1,
            "price": 12000
          }
        ]'::jsonb,
        36000,
        'completed',
        'card',
        '서울특별시 강남구 테헤란로 123, 101동 101호'
      WHERE NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE (customer_id = customer1_id OR user_id = customer1_id)
          AND total_amount = 36000
          AND status = 'completed'
          AND created_at > NOW() - INTERVAL '1 minute'
        LIMIT 1
      );
    -- customer_id 컬럼만 있는 경우
    ELSIF has_customer_id THEN
      INSERT INTO orders (customer_id, items, total_amount, status, payment_method, shipping_address)
      SELECT 
        customer1_id,
        '[
          {
            "product_id": "1",
            "product_name": "행성의 파편",
            "quantity": 2,
            "price": 12000
          },
          {
            "product_id": "2",
            "product_name": "감독의 호흡",
            "quantity": 1,
            "price": 12000
          }
        ]'::jsonb,
        36000,
        'completed',
        'card',
        '서울특별시 강남구 테헤란로 123, 101동 101호'
      WHERE NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE customer_id = customer1_id
          AND total_amount = 36000
          AND status = 'completed'
          AND created_at > NOW() - INTERVAL '1 minute'
        LIMIT 1
      );
    -- user_id 컬럼만 있는 경우 (기존 스키마)
    ELSIF has_user_id THEN
      INSERT INTO orders (user_id, items, total_amount, status, payment_method, shipping_address)
      SELECT 
        customer1_id,
        '[
          {
            "product_id": "1",
            "product_name": "행성의 파편",
            "quantity": 2,
            "price": 12000
          },
          {
            "product_id": "2",
            "product_name": "감독의 호흡",
            "quantity": 1,
            "price": 12000
          }
        ]'::jsonb,
        36000,
        'completed',
        'card',
        '서울특별시 강남구 테헤란로 123, 101동 101호'
      WHERE NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE user_id = customer1_id
          AND total_amount = 36000
          AND status = 'completed'
          AND created_at > NOW() - INTERVAL '1 minute'
        LIMIT 1
      );
    END IF;
  END IF;
END $$;

-- 주문 2: 이영희의 주문 (당신을 위한 욕설 3개, 코딩산 오레오 1개)
DO $$
DECLARE
  customer2_id UUID;
  has_customer_id BOOLEAN;
  has_user_id BOOLEAN;
BEGIN
  -- 고객 ID 가져오기
  SELECT id INTO customer2_id FROM customers WHERE display_name = '이영희' LIMIT 1;
  
  -- 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
  ) INTO has_customer_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  IF customer2_id IS NOT NULL THEN
    -- customer_id + user_id 둘 다 있는 경우
    IF has_customer_id AND has_user_id THEN
      INSERT INTO orders (customer_id, user_id, items, total_amount, status, payment_method, shipping_address)
      SELECT 
        customer2_id,
        customer2_id,
        '[
          {
            "product_id": "3",
            "product_name": "당신을 위한 욕설",
            "quantity": 3,
            "price": 12000
          },
          {
            "product_id": "8",
            "product_name": "코딩산 오레오",
            "quantity": 1,
            "price": 12000
          }
        ]'::jsonb,
        48000,
        'completed',
        'card',
        '서울특별시 서초구 서초대로 456, 202동 202호'
      WHERE NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE (customer_id = customer2_id OR user_id = customer2_id)
          AND total_amount = 48000
          AND status = 'completed'
          AND created_at > NOW() - INTERVAL '1 minute'
        LIMIT 1
      );
    -- customer_id 컬럼만 있는 경우
    ELSIF has_customer_id THEN
      INSERT INTO orders (customer_id, items, total_amount, status, payment_method, shipping_address)
      SELECT 
        customer2_id,
        '[
          {
            "product_id": "3",
            "product_name": "당신을 위한 욕설",
            "quantity": 3,
            "price": 12000
          },
          {
            "product_id": "8",
            "product_name": "코딩산 오레오",
            "quantity": 1,
            "price": 12000
          }
        ]'::jsonb,
        48000,
        'completed',
        'card',
        '서울특별시 서초구 서초대로 456, 202동 202호'
      WHERE NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE customer_id = customer2_id
          AND total_amount = 48000
          AND status = 'completed'
          AND created_at > NOW() - INTERVAL '1 minute'
        LIMIT 1
      );
    -- user_id 컬럼만 있는 경우 (기존 스키마)
    ELSIF has_user_id THEN
      INSERT INTO orders (user_id, items, total_amount, status, payment_method, shipping_address)
      SELECT 
        customer2_id,
        '[
          {
            "product_id": "3",
            "product_name": "당신을 위한 욕설",
            "quantity": 3,
            "price": 12000
          },
          {
            "product_id": "8",
            "product_name": "코딩산 오레오",
            "quantity": 1,
            "price": 12000
          }
        ]'::jsonb,
        48000,
        'completed',
        'card',
        '서울특별시 서초구 서초대로 456, 202동 202호'
      WHERE NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE user_id = customer2_id
          AND total_amount = 48000
          AND status = 'completed'
          AND created_at > NOW() - INTERVAL '1 minute'
        LIMIT 1
      );
    END IF;
  END IF;
END $$;

-- ============================================
-- 완료 메시지
-- ============================================
-- 총 3명의 고객과 2개의 주문이 삽입되었습니다.
-- 
-- 주의사항:
-- 1. 이 스크립트는 auth.users에 존재하는 사용자를 자동으로 사용합니다.
-- 2. auth.users에 사용자가 없으면 고객 데이터가 삽입되지 않습니다.
-- 3. auth.users에 사용자를 먼저 생성하려면:
--    - Supabase Dashboard > Authentication > Users에서 수동으로 생성하거나
--    - 애플리케이션에서 회원가입을 통해 생성할 수 있습니다.
-- 4. 최소 1명의 사용자가 있으면 고객 1명과 주문 1개가 생성됩니다.
-- 5. 최소 2명의 사용자가 있으면 고객 2명과 주문 2개가 생성됩니다.
-- 6. 실제 사용자 확인: SELECT id, email FROM auth.users;
-- 7. 이 스크립트는 orders 테이블의 컬럼명을 자동으로 감지합니다:
--    - customer_id 컬럼이 있으면 customer_id 사용
--    - user_id 컬럼이 있으면 user_id 사용 (기존 스키마)

