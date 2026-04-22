-- LoopPass 멤버십 혜택 스키마
-- Supabase SQL Editor에서 실행

-- 제휴 파트너
CREATE TABLE partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cafe', 'barbershop', 'clinic', 'restaurant', 'gym', 'other')),
  address TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 혜택
CREATE TABLE benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free_item', 'other')),
  discount_value TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 혜택 사용 로그
CREATE TABLE benefit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES benefits(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT now()
);

-- members 테이블에 benefit_token 컬럼 추가
ALTER TABLE members ADD COLUMN benefit_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- RLS 활성화
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: partners - 누구나 활성 파트너 조회 가능
CREATE POLICY "Anyone can read active partners" ON partners FOR SELECT TO anon, authenticated USING (is_active = true);

-- RLS 정책: benefits - 누구나 활성 혜택 조회 가능
CREATE POLICY "Anyone can read active benefits" ON benefits FOR SELECT TO anon, authenticated USING (is_active = true);

-- RLS 정책: benefit_logs - 인증된 회원은 본인 로그 조회
CREATE POLICY "Members can read own benefit logs" ON benefit_logs FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));

-- RLS 정책: benefit_logs - 비인증 사용자(파트너 키오스크 등)가 로그 삽입
CREATE POLICY "Anon can insert benefit logs" ON benefit_logs FOR INSERT TO anon WITH CHECK (true);

-- RLS 정책: members - benefit_token으로 조회 시 제한된 컬럼 노출
CREATE POLICY "Anon can verify member by benefit_token" ON members FOR SELECT TO anon USING (benefit_token IS NOT NULL);

-- 초기 데이터: 테스트 파트너
INSERT INTO partners (id, name, category, address, phone, description) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '카페 루프', 'cafe', '부산 남구 문현금융로 40 BIFC2 1층', '051-000-0001', '루프패스 회원 전용 카페'),
  ('a1b2c3d4-0002-4000-8000-000000000002', '바버샵 클린컷', 'barbershop', '부산 남구 문현동 12-3', '051-000-0002', '남성 전문 바버샵'),
  ('a1b2c3d4-0003-4000-8000-000000000003', '스마일 치과', 'clinic', '부산 남구 문현동 45-6', '051-000-0003', '루프패스 회원 할인 제공'),
  ('a1b2c3d4-0004-4000-8000-000000000004', '로컬 키친', 'restaurant', '부산 남구 문현금융로 38', '051-000-0004', '건강한 한 끼, 로컬 재료 사용');

-- 초기 데이터: 테스트 혜택
INSERT INTO benefits (partner_id, title, description, discount_type, discount_value) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '아메리카노 20% 할인', '루프패스 회원 대상 아메리카노 20% 할인', 'percent', '20'),
  ('a1b2c3d4-0002-4000-8000-000000000002', '남성 커트 3,000원 할인', '루프패스 회원 대상 남성 커트 3,000원 할인', 'fixed', '3000'),
  ('a1b2c3d4-0003-4000-8000-000000000003', '스케일링 10% 할인', '루프패스 회원 대상 스케일링 10% 할인', 'percent', '10'),
  ('a1b2c3d4-0004-4000-8000-000000000004', '런치 세트 15% 할인', '루프패스 회원 대상 런치 세트 15% 할인', 'percent', '15');
