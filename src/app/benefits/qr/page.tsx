"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

export default function BenefitQRPage() {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const generateQR = useCallback(async (token: string) => {
    const url = `https://looppass.vercel.app/verify?token=${token}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
  }, []);

  const loadToken = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data: member } = await supabase
      .from("members")
      .select("benefit_token")
      .eq("auth_id", user.id)
      .single();

    if (!member) {
      setError("회원 정보를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    if (member.benefit_token) {
      await generateQR(member.benefit_token);
    } else {
      // 토큰이 없으면 새로 생성
      const { data: updated } = await supabase
        .from("members")
        .update({ benefit_token: crypto.randomUUID() })
        .eq("auth_id", user.id)
        .select("benefit_token")
        .single();

      if (updated?.benefit_token) {
        await generateQR(updated.benefit_token);
      } else {
        setError("QR 코드 생성에 실패했습니다.");
      }
    }

    setLoading(false);
  }, [router, generateQR]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  async function handleRegenerate() {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data: updated } = await supabase
      .from("members")
      .update({ benefit_token: crypto.randomUUID() })
      .eq("auth_id", user.id)
      .select("benefit_token")
      .single();

    if (updated?.benefit_token) {
      await generateQR(updated.benefit_token);
    } else {
      setError("QR 재발급에 실패했습니다.");
    }

    setLoading(false);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 bg-white">
      <button
        onClick={() => router.push("/benefits")}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 text-sm"
      >
        &larr; 돌아가기
      </button>

      {error ? (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-primary underline"
          >
            돌아가기
          </button>
        </div>
      ) : loading ? (
        <p className="text-gray-500">QR 코드 생성 중...</p>
      ) : (
        <div className="text-center">
          <h2 className="text-lg font-bold mb-1">혜택 QR</h2>
          <p className="text-sm text-gray-500 mb-6">
            제휴 매장에서 이 QR을 보여주세요
          </p>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 inline-block mb-6">
            <img src={qrDataUrl} alt="Benefit QR Code" width={280} height={280} />
          </div>

          <div>
            <button
              onClick={handleRegenerate}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              QR 재발급
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
