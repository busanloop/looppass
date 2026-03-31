"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AccessLog {
  id: string;
  action: "enter" | "exit";
  method: "qr" | "manual";
  created_at: string;
  locations: { name: string; floor: string | null };
}

export default function HistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!member) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("access_logs")
        .select("id, action, method, created_at, locations(name, floor)")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setLogs(data as unknown as AccessLog[]);
      setLoading(false);
    }
    loadLogs();
  }, [router]);

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-primary text-white px-4 py-4">
        <div className="flex items-center max-w-lg mx-auto">
          <button onClick={() => router.push("/dashboard")} className="mr-3 hover:opacity-80">
            &larr;
          </button>
          <h1 className="text-lg font-bold">이용 내역</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {loading ? (
          <p className="text-center text-gray-500 py-8">로딩 중...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">이용 내역이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => {
              const date = new Date(log.created_at);
              return (
                <li
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div>
                    <span className={`text-sm font-medium ${log.action === "enter" ? "text-blue-600" : "text-gray-600"}`}>
                      {log.action === "enter" ? "입장" : "퇴장"}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {log.locations?.name} {log.locations?.floor}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {date.toLocaleDateString("ko-KR")} {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
