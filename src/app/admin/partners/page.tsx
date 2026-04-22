"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Benefit {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number;
  description: string | null;
  is_active: boolean;
}

interface Partner {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  partner_benefits: Benefit[];
}

const CATEGORIES = ["카페", "미용", "병원", "음식점", "헬스장", "기타"];
const DISCOUNT_TYPES = [
  { value: "percent", label: "% 할인" },
  { value: "fixed", label: "원 할인" },
  { value: "free", label: "무료 제공" },
];

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [benefitPartnerId, setBenefitPartnerId] = useState<string | null>(null);

  // 파트너 폼
  const [partnerName, setPartnerName] = useState("");
  const [partnerCategory, setPartnerCategory] = useState("카페");
  const [partnerAddress, setPartnerAddress] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerDesc, setPartnerDesc] = useState("");

  // 혜택 폼
  const [benefitTitle, setBenefitTitle] = useState("");
  const [benefitDiscountType, setBenefitDiscountType] = useState("percent");
  const [benefitDiscountValue, setBenefitDiscountValue] = useState("");
  const [benefitDesc, setBenefitDesc] = useState("");

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    const { data } = await supabase
      .from("partners")
      .select("*, partner_benefits(*)")
      .order("created_at", { ascending: false });

    if (data) setPartners(data);
    setLoading(false);
  }

  async function addPartner(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerName.trim()) return;

    await supabase.from("partners").insert({
      name: partnerName.trim(),
      category: partnerCategory,
      address: partnerAddress.trim() || null,
      phone: partnerPhone.trim() || null,
      description: partnerDesc.trim() || null,
    });

    setPartnerName("");
    setPartnerCategory("카페");
    setPartnerAddress("");
    setPartnerPhone("");
    setPartnerDesc("");
    setShowPartnerForm(false);
    loadPartners();
  }

  async function addBenefit(e: React.FormEvent) {
    e.preventDefault();
    if (!benefitPartnerId || !benefitTitle.trim()) return;

    await supabase.from("partner_benefits").insert({
      partner_id: benefitPartnerId,
      title: benefitTitle.trim(),
      discount_type: benefitDiscountType,
      discount_value: Number(benefitDiscountValue) || 0,
      description: benefitDesc.trim() || null,
    });

    setBenefitTitle("");
    setBenefitDiscountType("percent");
    setBenefitDiscountValue("");
    setBenefitDesc("");
    setBenefitPartnerId(null);
    loadPartners();
  }

  async function togglePartnerActive(partner: Partner) {
    await supabase
      .from("partners")
      .update({ is_active: !partner.is_active })
      .eq("id", partner.id);
    loadPartners();
  }

  async function toggleBenefitActive(benefit: Benefit) {
    await supabase
      .from("partner_benefits")
      .update({ is_active: !benefit.is_active })
      .eq("id", benefit.id);
    loadPartners();
  }

  async function deleteBenefit(benefitId: string) {
    if (!confirm("이 혜택을 삭제하시겠습니까?")) return;
    await supabase.from("partner_benefits").delete().eq("id", benefitId);
    loadPartners();
  }

  function formatDiscount(type: string, value: number) {
    if (type === "percent") return `${value}% 할인`;
    if (type === "fixed") return `${value.toLocaleString()}원 할인`;
    return "무료 제공";
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="flex items-center max-w-lg mx-auto">
          <Link href="/admin" className="mr-3 hover:opacity-80">
            &larr;
          </Link>
          <h1 className="text-lg font-bold">제휴 매장 관리</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {/* 파트너 추가 버튼 */}
        {!showPartnerForm && (
          <button
            onClick={() => setShowPartnerForm(true)}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors mb-4"
          >
            + 제휴 매장 추가
          </button>
        )}

        {/* 파트너 추가 폼 */}
        {showPartnerForm && (
          <form onSubmit={addPartner} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold mb-3">새 제휴 매장</h3>
            <input
              type="text"
              placeholder="매장명"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
              required
            />
            <select
              value={partnerCategory}
              onChange={(e) => setPartnerCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="주소"
              value={partnerAddress}
              onChange={(e) => setPartnerAddress(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
            />
            <input
              type="text"
              placeholder="전화번호"
              value={partnerPhone}
              onChange={(e) => setPartnerPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
            />
            <textarea
              placeholder="설명"
              value={partnerDesc}
              onChange={(e) => setPartnerDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setShowPartnerForm(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 혜택 추가 폼 */}
        {benefitPartnerId && (
          <form onSubmit={addBenefit} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold mb-3 text-sm">혜택 추가</h3>
            <input
              type="text"
              placeholder="혜택 제목"
              value={benefitTitle}
              onChange={(e) => setBenefitTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
              required
            />
            <div className="flex gap-2 mb-2">
              <select
                value={benefitDiscountType}
                onChange={(e) => setBenefitDiscountType(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {DISCOUNT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="할인값"
                value={benefitDiscountValue}
                onChange={(e) => setBenefitDiscountValue(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <textarea
              placeholder="설명"
              value={benefitDesc}
              onChange={(e) => setBenefitDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setBenefitPartnerId(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 파트너 목록 */}
        {loading ? (
          <p className="text-center text-gray-500 py-8">로딩 중...</p>
        ) : partners.length === 0 ? (
          <p className="text-center text-gray-500 py-8">등록된 제휴 매장이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {partners.map((partner) => (
              <li
                key={partner.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-xs text-gray-400">{partner.category}</p>
                    {partner.address && (
                      <p className="text-sm text-gray-500">{partner.address}</p>
                    )}
                    {partner.phone && (
                      <p className="text-sm text-gray-400">{partner.phone}</p>
                    )}
                    {partner.description && (
                      <p className="text-sm text-gray-400 mt-1">{partner.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      partner.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {partner.is_active ? "활성" : "비활성"}
                  </span>
                </div>

                {/* 혜택 목록 */}
                {partner.partner_benefits.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {partner.partner_benefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {benefit.title}
                            <span className="ml-2 text-xs text-blue-600">
                              {formatDiscount(benefit.discount_type, benefit.discount_value)}
                            </span>
                          </p>
                          {benefit.description && (
                            <p className="text-xs text-gray-400 truncate">{benefit.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => toggleBenefitActive(benefit)}
                            className={`text-xs px-2 py-1 rounded ${
                              benefit.is_active
                                ? "text-green-600 hover:bg-green-100"
                                : "text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {benefit.is_active ? "ON" : "OFF"}
                          </button>
                          <button
                            onClick={() => deleteBenefit(benefit.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-1"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => setBenefitPartnerId(partner.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + 혜택 추가
                  </button>
                  <button
                    onClick={() => togglePartnerActive(partner)}
                    className="text-xs text-primary hover:underline"
                  >
                    {partner.is_active ? "비활성으로 변경" : "활성으로 변경"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
