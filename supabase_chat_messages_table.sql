-- ============================================
-- Chat messages 테이블 생성 SQL
-- ============================================
-- 이 파일의 전체 내용을 Supabase SQL Editor에 복사하여 실행하세요.
-- 경로: Supabase 대시보드 > SQL Editor > New Query

-- 1. chat_messages 테이블 생성
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
  ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON chat_messages(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (익명 사용자도 조회/삽입 가능)
DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON chat_messages;
CREATE POLICY "Chat messages are viewable by everyone"
  ON chat_messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Chat messages can be inserted by everyone" ON chat_messages;
CREATE POLICY "Chat messages can be inserted by everyone"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- 완료!

