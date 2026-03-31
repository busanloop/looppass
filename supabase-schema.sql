-- LoopPass MVP Schema
-- Supabase SQL Editor에서 실행

-- 지점
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  floor TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 회원
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  membership_type TEXT NOT NULL DEFAULT 'non_member' CHECK (membership_type IN ('member', 'non_member')),
  membership_start DATE,
  membership_end DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QR 출입 토큰
CREATE TABLE access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 출입 로그
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('enter', 'exit')),
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 요금
CREATE TABLE pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES locations(id) NOT NULL,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('member', 'non_member')),
  price INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 초기 데이터: BIFC2 22층
INSERT INTO locations (name, address, floor) VALUES ('BIFC2', '부산 남구 문현금융로 40', '22층');

-- RLS 활성화
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자 읽기 허용
CREATE POLICY "Authenticated users can read locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can read own data" ON members FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Members can read own tokens" ON access_tokens FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));
CREATE POLICY "Members can insert own tokens" ON access_tokens FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));
CREATE POLICY "Members can read own logs" ON access_logs FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));
CREATE POLICY "Authenticated users can read pricing" ON pricing FOR SELECT TO authenticated USING (true);

-- 관리자용 서비스 역할은 Supabase 대시보드에서 별도 설정
