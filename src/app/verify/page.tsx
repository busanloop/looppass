"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface MemberInfo {
  name: string;
  membership_type: "member" | "non_member";
  membership_end: string | null;
}

interface Benefit {
  id: string;
  title: string;
  description: string | null;
  discount_type: string | null;
  discount_value: string | null;
}

interface Partner {
  id: string;
  name: string;
  category: string;
  address: string | null;
  benefits: Benefit[];
}

const categoryIcons: Record<string, string> = {
  카페: "☕",
  미용: "✂️",
  병원: "🏥",
  음식점: "🍽️",
  기타: "📦",
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [member, setMember] = useState<MemberInfo | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError("유효하지 않은 QR 코드입니다");
        setLoading(false);
        return;
      }

      // 회원 조회
      const { data: memberData } = await supabase
        .from("members")
        .select("name, membership_type, membership_end")
        .eq("benefit_token", token)
        .single();

      if (!memberData) {
        setError("유효하지 않은 QR 코드입니다");
        setLoading(false);
        return;
      }

      setMember(memberData);

      // 활성 파트너 + 혜택 조회
      const { data: partnerData } = await supabase
        .from("partners")
        .select("id, name, category, address, benefits(id, title, description, discount_type, discount_value)")
        .eq("is_active", true)
        .eq("benefits.is_active", true);

      if (partnerData) {
        setPartners(partnerData.filter((p: Partner) => p.benefits.length > 0));
      }

      setLoading(false);
    }

    verify();
  }, [token]);

  const isActive =
    member?.membership_type === "member" &&
    member?.membership_end &&
    new Date(member.membership_end) >= new Date();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">확인 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✕</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header / Branding */}
      <header className="bg-primary text-white px-4 py-5 text-center">
        <h1 className="text-xl font-bold">LoopPass</h1>
        <p className="text-sm opacity-80 mt-1">멤버십 혜택 확인</p>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* 회원 상태 배지 */}
        {isActive ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-green-600">✓</span>
            </div>
            <p className="font-bold text-lg">{member!.name}</p>
            <span className="inline-block mt-2 text-sm px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
              활성 회원
            </span>
            <p className="text-sm text-gray-500 mt-2">
              유효기간: {member!.membership_end}
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-red-600">✕</span>
            </div>
            <p className="font-bold text-lg">{member!.name}</p>
            <span className="inline-block mt-2 text-sm px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">
              {member!.membership_type === "non_member"
                ? "비회원"
                : "멤버십 만료"}
            </span>
          </div>
        )}

        {/* 혜택 목록 */}
        {partners.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-4">제휴 혜택</h2>
            <div className="space-y-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">
                      {categoryIcons[partner.category] || categoryIcons["기타"]}
                    </span>
                    <h3 className="font-bold">{partner.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {partner.category}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {partner.benefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <p className="font-medium text-sm">{benefit.title}</p>
                        {benefit.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {benefit.description}
                          </p>
                        )}
                        {benefit.discount_value && (
                          <p className="text-xs text-primary font-medium mt-1">
                            {benefit.discount_type === "percent"
                              ? `${benefit.discount_value}% 할인`
                              : benefit.discount_type === "amount"
                                ? `${Number(benefit.discount_value).toLocaleString()}원 할인`
                                : benefit.discount_value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
