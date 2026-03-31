"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  name: string;
  email: string;
  membership_type: "member" | "non_member";
  membership_start: string | null;
  membership_end: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMember() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (data) setMember(data);
      setLoading(false);
    }
    loadMember();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">회원 정보를 찾을 수 없습니다.</p>
          <button onClick={handleLogout} className="text-primary underline">
            다시 로그인
          </button>
        </div>
      </div>
    );
  }

  const isMember = member.membership_type === "member";
  const isExpired = member.membership_end
    ? new Date(member.membership_end) < new Date()
    : false;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">LoopPass</h1>
          <button onClick={handleLogout} className="text-sm opacity-80 hover:opacity-100">
            로그아웃
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* 회원 정보 카드 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">{member.name}</h2>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isMember
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isMember ? "회원" : "비회원"}
            </span>
          </div>
          <p className="text-sm text-gray-500">{member.email}</p>
          {isMember && member.membership_end && (
            <p className={`text-sm mt-2 ${isExpired ? "text-red-500" : "text-gray-500"}`}>
              {isExpired
                ? "멤버십 만료됨"
                : `유효기간: ${member.membership_end}`}
            </p>
          )}
        </div>

        {/* QR 출입 버튼 */}
        <Link
          href="/qr"
          className="block w-full py-4 bg-primary text-white text-center rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors shadow-sm mb-4"
        >
          QR 출입
        </Link>

        {/* 이용 내역 */}
        <Link
          href="/history"
          className="block w-full py-3 bg-white border border-gray-200 text-center rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          이용 내역
        </Link>
      </main>
    </div>
  );
}
