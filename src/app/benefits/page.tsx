"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

const categories = ["전체", "카페", "미용", "병원", "음식점", "기타"];

const categoryIcons: Record<string, string> = {
  카페: "☕",
  미용: "✂️",
  병원: "🏥",
  음식점: "🍽️",
  기타: "📦",
};

export default function BenefitsPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("전체");

  useEffect(() => {
    async function loadBenefits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("partners")
        .select("id, name, category, address, benefits(id, title, description, discount_type, discount_value)")
        .eq("is_active", true)
        .eq("benefits.is_active", true);

      if (data) {
        setPartners(data.filter((p: Partner) => p.benefits.length > 0));
      }

      setLoading(false);
    }

    loadBenefits();
  }, [router]);

  const filtered =
    activeCategory === "전체"
      ? partners
      : partners.filter((p) => p.category === activeCategory);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm opacity-80 hover:opacity-100"
            >
              &larr;
            </button>
            <h1 className="text-lg font-bold">제휴 혜택</h1>
          </div>
          <Link
            href="/benefits/qr"
            className="text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
          >
            혜택 QR
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-1 px-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 파트너 카드 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">해당 카테고리에 혜택이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((partner) => (
              <div
                key={partner.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {categoryIcons[partner.category] || categoryIcons["기타"]}
                  </span>
                  <h3 className="font-bold">{partner.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {partner.category}
                  </span>
                </div>
                {partner.address && (
                  <p className="text-xs text-gray-400 mb-3 ml-7">
                    {partner.address}
                  </p>
                )}

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
        )}
      </main>
    </div>
  );
}
