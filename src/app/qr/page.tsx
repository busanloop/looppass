"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

export default function QRPage() {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");

  const generateToken = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    // 회원 정보 조회
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!member) {
      setError("회원 정보를 찾을 수 없습니다.");
      return;
    }

    // 활성 지점 조회 (MVP: 첫 번째 지점)
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!location) {
      setError("활성 지점이 없습니다.");
      return;
    }

    // 토큰 생성 (5분 유효)
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const { data: token, error: tokenError } = await supabase
      .from("access_tokens")
      .insert({
        member_id: member.id,
        location_id: location.id,
        expires_at: expires.toISOString(),
      })
      .select("token")
      .single();

    if (tokenError || !token) {
      setError("QR 코드 생성에 실패했습니다.");
      return;
    }

    // QR 코드 생성
    const qrPayload = JSON.stringify({
      token: token.token,
      t: Date.now(),
    });

    const dataUrl = await QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    setQrDataUrl(dataUrl);
    setExpiresAt(expires);
    setError("");
  }, [router]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  // 남은 시간 카운트다운
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isExpired = expiresAt && remaining === 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 bg-white">
      <button
        onClick={() => router.push("/dashboard")}
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
      ) : qrDataUrl ? (
        <div className="text-center">
          <h2 className="text-lg font-bold mb-1">QR 출입</h2>
          <p className="text-sm text-gray-500 mb-6">아래 QR을 데스크에서 스캔해주세요</p>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 inline-block mb-4">
            <img src={qrDataUrl} alt="QR Code" width={280} height={280} />
          </div>

          <div className={`text-2xl font-mono font-bold ${isExpired ? "text-red-500" : "text-gray-700"}`}>
            {isExpired ? "만료됨" : `${minutes}:${seconds.toString().padStart(2, "0")}`}
          </div>

          {isExpired && (
            <button
              onClick={generateToken}
              className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              새 QR 생성
            </button>
          )}
        </div>
      ) : (
        <p className="text-gray-500">QR 코드 생성 중...</p>
      )}
    </div>
  );
}
