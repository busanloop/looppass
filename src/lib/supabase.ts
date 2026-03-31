import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// 클라이언트 컴포넌트에서 사용할 편의 getter
export const supabase = typeof window !== "undefined"
  ? (() => {
      try { return getSupabase(); } catch { return null as unknown as SupabaseClient; }
    })()
  : (null as unknown as SupabaseClient);
