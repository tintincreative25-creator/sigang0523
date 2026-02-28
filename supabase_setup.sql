-- ============================================
-- Supabase Orders 테이블 생성 SQL
-- ============================================
-- 이 파일의 전체 내용을 Supabase SQL Editor에 복사하여 실행하세요.
-- 경로: Supabase 대시보드 > SQL Editor > New Query

-- 1. orders 테이블 생성
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 3. updated_at 자동 업데이트를 위한 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책: 사용자는 자신의 주문만 조회 가능
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- 7. RLS 정책: 사용자는 자신의 주문만 생성 가능
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS 정책: 사용자는 자신의 주문만 업데이트 가능
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 실행 완료 메시지 확인
-- ============================================
-- 위의 모든 쿼리가 성공적으로 실행되면 "Success. No rows returned" 메시지가 표시됩니다.
-- 테이블이 생성되었는지 확인하려면 Table Editor에서 "orders" 테이블을 확인하세요.

