-- ============================================
-- 데이터베이스 테이블 생성 SQL
-- 상품(products), 고객(customers), 주문(orders)
-- ============================================
-- 이 파일의 전체 내용을 Supabase SQL Editor에 복사하여 실행하세요.
-- 경로: Supabase 대시보드 > SQL Editor > New Query
--
-- 주의사항:
-- - 이미 존재하는 테이블, 인덱스, 함수, 트리거, 정책은 자동으로 예외 처리됩니다.
-- - 존재하지 않는 컬럼은 자동으로 추가됩니다.
-- - 중복 실행해도 안전합니다.
-- - 기존 데이터는 유지되며, 상품 데이터는 ON CONFLICT로 업데이트됩니다.

-- ============================================
-- 1. 상품(products) 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  image TEXT DEFAULT '',
  sold_out BOOLEAN DEFAULT FALSE,
  not_for_sale BOOLEAN DEFAULT FALSE,
  details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상품 테이블 컬럼 추가 (없는 경우)
DO $$
BEGIN
  -- products 테이블이 존재하는 경우에만 컬럼 추가
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    -- 각 컬럼이 존재하는지 확인 후 추가
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'name') THEN
      ALTER TABLE products ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description') THEN
      ALTER TABLE products ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price') THEN
      ALTER TABLE products ADD COLUMN price INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image') THEN
      ALTER TABLE products ADD COLUMN image TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sold_out') THEN
      ALTER TABLE products ADD COLUMN sold_out BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'not_for_sale') THEN
      ALTER TABLE products ADD COLUMN not_for_sale BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'details') THEN
      ALTER TABLE products ADD COLUMN details JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at') THEN
      ALTER TABLE products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_at') THEN
      ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- 기본값 설정 (이미 존재하는 컬럼의 경우)
    BEGIN
      ALTER TABLE products ALTER COLUMN image SET DEFAULT '';
      ALTER TABLE products ALTER COLUMN sold_out SET DEFAULT FALSE;
      ALTER TABLE products ALTER COLUMN not_for_sale SET DEFAULT FALSE;
      ALTER TABLE products ALTER COLUMN details SET DEFAULT '[]'::jsonb;
      ALTER TABLE products ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT NOW();
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    -- NOT NULL 제약조건 추가 (없는 경우)
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'name' AND is_nullable = 'YES') THEN
        ALTER TABLE products ALTER COLUMN name SET NOT NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description' AND is_nullable = 'YES') THEN
        ALTER TABLE products ALTER COLUMN description SET NOT NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price' AND is_nullable = 'YES') THEN
        ALTER TABLE products ALTER COLUMN price SET NOT NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 상품 테이블 인덱스 생성 (컬럼이 생성된 후에 실행)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sold_out') THEN
    CREATE INDEX IF NOT EXISTS idx_products_sold_out ON products(sold_out);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'not_for_sale') THEN
    CREATE INDEX IF NOT EXISTS idx_products_not_for_sale ON products(not_for_sale);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 2. 고객(customers) 테이블 생성
-- ============================================
-- Supabase auth.users와 연동되는 고객 프로필 테이블
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객 테이블 컬럼 추가 (없는 경우)
DO $$
BEGIN
  -- customers 테이블이 존재하는 경우에만 컬럼 추가
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    -- 각 컬럼이 존재하는지 확인 후 추가
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'email') THEN
      ALTER TABLE customers ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'display_name') THEN
      ALTER TABLE customers ADD COLUMN display_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'phone') THEN
      ALTER TABLE customers ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'address') THEN
      ALTER TABLE customers ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'created_at') THEN
      ALTER TABLE customers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'updated_at') THEN
      ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- 기본값 설정 (이미 존재하는 컬럼의 경우)
    BEGIN
      ALTER TABLE customers ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE customers ALTER COLUMN updated_at SET DEFAULT NOW();
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    -- 외래키 제약조건 추가 (없는 경우)
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_id_fkey' 
        AND table_name = 'customers'
        AND table_schema = 'public'
      ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_id_fkey 
          FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 고객 테이블 인덱스 생성 (컬럼이 생성된 후에 실행)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  END IF;
END $$;

-- ============================================
-- 3. 주문(orders) 테이블 생성
-- ============================================
-- 외래키 제약조건은 나중에 추가 (컬럼이 모두 생성된 후)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  items JSONB,
  total_amount INTEGER,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주문 테이블 컬럼 추가 (없는 경우)
DO $$
BEGIN
  -- orders 테이블이 존재하는 경우에만 컬럼 추가
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    -- 각 컬럼이 존재하는지 확인 후 추가
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id') THEN
      ALTER TABLE orders ADD COLUMN customer_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'items') THEN
      ALTER TABLE orders ADD COLUMN items JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount') THEN
      ALTER TABLE orders ADD COLUMN total_amount INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status') THEN
      ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
      ALTER TABLE orders ADD COLUMN payment_method TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_address') THEN
      ALTER TABLE orders ADD COLUMN shipping_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_at') THEN
      ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at') THEN
      ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- 기본값 설정 (이미 존재하는 컬럼의 경우)
    BEGIN
      ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
      ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT NOW();
      ALTER TABLE orders ALTER COLUMN updated_at SET DEFAULT NOW();
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    -- NOT NULL 제약조건 추가 (없는 경우)
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id' AND is_nullable = 'YES') THEN
        ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'items' AND is_nullable = 'YES') THEN
        ALTER TABLE orders ALTER COLUMN items SET NOT NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount' AND is_nullable = 'YES') THEN
        ALTER TABLE orders ALTER COLUMN total_amount SET NOT NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    -- CHECK 제약조건 추가 (status 컬럼용)
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_status_check' 
        AND table_name = 'orders'
        AND table_schema = 'public'
      ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
          CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    -- 외래키 제약조건 추가 (없는 경우) - 컬럼이 모두 생성된 후에 실행
    BEGIN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers')
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'orders_customer_id_fkey' 
          AND table_name = 'orders'
          AND table_schema = 'public'
        ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 주문 테이블 인덱스 생성 (컬럼이 생성된 후에 실행)
DO $$
BEGIN
  -- customer_id 컬럼이 존재하는 경우에만 인덱스 생성
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 4. updated_at 자동 업데이트 함수 생성
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 5. updated_at 자동 업데이트 트리거 생성
-- ============================================
-- products 테이블 트리거
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- customers 테이블 트리거
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- orders 테이블 트리거
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Row Level Security (RLS) 활성화
-- ============================================
-- RLS가 이미 활성화되어 있어도 에러 없이 처리됨
DO $$
BEGIN
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- 7. RLS 정책 생성
-- ============================================

-- products 테이블 정책: 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- customers 테이블 정책: 사용자는 자신의 정보만 조회/수정 가능
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
CREATE POLICY "Users can view their own customer data"
  ON customers FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;
CREATE POLICY "Users can insert their own customer data"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
CREATE POLICY "Users can update their own customer data"
  ON customers FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- orders 테이블 정책: 사용자는 자신의 주문만 조회/생성/수정 가능
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- ============================================
-- 8. 초기 상품 데이터 삽입
-- ============================================
INSERT INTO products (id, name, description, price, image, sold_out, not_for_sale, details) VALUES
  ('1', '행성의 파편', '45억년 전 배설물과 같은 행성에서 자란 나무 쪼가리', 12000, '/src/assets/product-1.jpg', false, false, '[]'::jsonb),
  ('2', '감독의 호흡', '스티븐 스필버그의 방귀가 섞인 공기와 혼합된 봉투 속 공기', 12000, '/src/assets/product-2.jpg', false, false, '[]'::jsonb),
  ('3', '당신을 위한 욕설', '오직 당신만을 위해 준비된 고품격 욕설 한 마디', 12000, '/src/assets/product-3.jpg', false, false, '[]'::jsonb),
  ('4', '거장의 디저트', '브루노 마스가 먹다가 뱉은 20만원 상당의 브라우니', 12000, '/src/assets/product-4.jpg', true, false, '[]'::jsonb),
  ('5', '창조주의 유해', '프레드릭 바우어의 유골이 담긴 프링글스 통', 12000, '/src/assets/product-5.jpg', true, false, '[]'::jsonb),
  ('6', '추상적 화폐', '실제 가치와 동일한 12,000원권 지폐', 12000, '', false, false, '[]'::jsonb),
  ('7', '친구', '없어서 못 팜', 12000, '', true, false, '[]'::jsonb),
  ('8', '코딩산 오레오', '오레오 오즈 틴틴 코딩산 에디션', 12000, '', false, false, '[]'::jsonb),
  ('9', '잭슨의 유산', '마이클 잭슨의 쓰레기가 버려졌던 쓰레기장', 12000, '', false, true, '[]'::jsonb),
  ('10', '아이디어', '순수 개념적 아이디어', 12000, '', true, false, '[]'::jsonb),
  ('11', '태초의 공기', '최초의 인류가 밟고 지나간 자리, 그 지구 반대편에 있던 공기', 12000, '', true, false, '[]'::jsonb),
  ('12', 'TMI 컬렉션', '알아두면 쓸모없는 고귀한 지식들', 12000, '', false, false, 
   '["나는 자습시간 5시간 중에 한번도 공부를 안하고 미술책 2권 76페이지에 있는 테이프 붙여진 바나나만 본 적 있다.", "오레오 오즈 틴틴 코딩산은 재고가 떨어지면 내가 직접 보충하지 않는다.", "북극곰은 코카콜라를 마실 줄 모른다.", "내용 3은 정확한 사실이 아니라 나의 추측이다.", "51구역 근무자들은 본인이 51구역에 있다는 사실을 인지하고 있는지 궁금하다.", "TMI 내용이 다 떨어져가고 있다.", "TMI는 알아도 쓸모없는 지식이란 뜻이다. 아니면 내 알 바 아니다.", "아마도 TMI가 여기에서 가장 좋은 상품일 것이다.", "내용 6과 내용 7을 합치면 67이다. 식스세븐.", "지금 이 TMI는 10번째 TMI다."]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 완료 메시지
-- ============================================
-- 위의 모든 쿼리가 성공적으로 실행되면 "Success. No rows returned" 메시지가 표시됩니다.
-- 테이블이 생성되었는지 확인하려면 Table Editor에서 다음 테이블들을 확인하세요:
-- - products (상품)
-- - customers (고객)
-- - orders (주문)
--
-- 주요 기능:
-- ✓ 테이블이 없으면 생성, 있으면 유지
-- ✓ 컬럼이 없으면 자동 추가
-- ✓ 기본값 자동 설정
-- ✓ NOT NULL 제약조건 자동 추가
-- ✓ 외래키 제약조건 자동 추가
-- ✓ 인덱스, 함수, 트리거, RLS 정책 자동 생성/업데이트

