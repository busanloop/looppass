"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

interface VerifiedMember {
  name: string;
  email: string;
  membership_type: string;
}

interface TodayStats {
  totalEntries: number;
  memberEntries: number;
  nonMemberEntries: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifiedMember | null>(null);
  const [scanError, setScanError] = useState("");
  const [stats, setStats] = useState<TodayStats>({ totalEntries: 0, memberEntries: 0, nonMemberEntries: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    loadTodayStats();
  }, []);

  async function loadTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("access_logs")
      .select("id, action, members(membership_type)")
      .eq("action", "enter")
      .gte("created_at", today.toISOString());

    if (data) {
      const memberEntries = data.filter(
        (d) => (d.members as unknown as { membership_type: string })?.membership_type === "member"
      ).length;
      setStats({
        totalEntries: data.length,
        memberEntries,
        nonMemberEntries: data.length - memberEntries,
      });
    }
  }

  async function startScan() {
    setResult(null);
    setScanError("");
    setScanning(true);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
    } catch {
      setScanError("카메라를 사용할 수 없습니다.");
      setScanning(false);
    }
  }

  async function stopScan() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function onScanSuccess(decodedText: string) {
    await stopScan();

    try {
      const payload = JSON.parse(decodedText);
      const token = payload.token;

      if (!token) {
        setScanError("유효하지 않은 QR 코드입니다.");
        return;
      }

      // 토큰 검증
      const { data: accessToken } = await supabase
        .from("access_tokens")
        .select("*, members(id, name, email, membership_type)")
        .eq("token", token)
        .single();

      if (!accessToken) {
        setScanError("등록되지 않은 QR 코드입니다.");
        return;
      }

      if (new Date(accessToken.expires_at) < new Date()) {
        setScanError("만료된 QR 코드입니다. 새로 생성해주세요.");
        return;
      }

      if (accessToken.used_at) {
        setScanError("이미 사용된 QR 코드입니다.");
        return;
      }

      const member = accessToken.members as unknown as VerifiedMember & { id: string };

      // 토큰 사용 처리
      await supabase
        .from("access_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", accessToken.id);

      // 출입 로그 기록
      await supabase.from("access_logs").insert({
        member_id: member.id,
        location_id: accessToken.location_id,
        action: "enter",
        method: "qr",
      });

      setResult({
        name: member.name,
        email: member.email,
        membership_type: member.membership_type,
      });

      loadTodayStats();
    } catch {
      setScanError("QR 코드를 인식할 수 없습니다.");
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">LoopPass 관리자</h1>
          <Link href="/admin/members" className="text-sm opacity-80 hover:opacity-100">
            회원 관리
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* 오늘 현황 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
            <p className="text-xs text-gray-500">오늘 총 입장</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.memberEntries}</p>
            <p className="text-xs text-gray-500">회원</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.nonMemberEntries}</p>
            <p className="text-xs text-gray-500">비회원</p>
          </div>
        </div>

        {/* QR 스캐너 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h2 className="font-bold mb-4">QR 스캔</h2>

          <div id="qr-reader" className={`mb-4 ${scanning ? "" : "hidden"}`} />

          {!scanning ? (
            <button
              onClick={startScan}
              className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              스캔 시작
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              스캔 중지
            </button>
          )}
        </div>

        {/* 스캔 결과 */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
            <p className="text-green-700 font-bold mb-2">출입 승인</p>
            <p className="font-medium">{result.name}</p>
            <p className="text-sm text-gray-500">{result.email}</p>
            <span
              className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
                result.membership_type === "member"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {result.membership_type === "member" ? "회원 (50% 할인)" : "비회원 (정가)"}
            </span>
          </div>
        )}

        {scanError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
            <p className="text-red-600 font-medium">{scanError}</p>
          </div>
        )}
      </main>
    </div>
  );
}
