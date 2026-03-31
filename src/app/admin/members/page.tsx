"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  membership_type: "member" | "non_member";
  membership_end: string | null;
  is_active: boolean;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setMembers(data);
    setLoading(false);
  }

  async function toggleMembership(member: Member) {
    const newType = member.membership_type === "member" ? "non_member" : "member";
    const updates: Record<string, unknown> = { membership_type: newType };

    if (newType === "member") {
      const start = new Date().toISOString().split("T")[0];
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      updates.membership_start = start;
      updates.membership_end = end;
    }

    await supabase.from("members").update(updates).eq("id", member.id);
    loadMembers();
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="flex items-center max-w-lg mx-auto">
          <Link href="/admin" className="mr-3 hover:opacity-80">
            &larr;
          </Link>
          <h1 className="text-lg font-bold">회원 관리</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {loading ? (
          <p className="text-center text-gray-500 py-8">로딩 중...</p>
        ) : members.length === 0 ? (
          <p className="text-center text-gray-500 py-8">등록된 회원이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.phone && (
                      <p className="text-sm text-gray-400">{member.phone}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      member.membership_type === "member"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.membership_type === "member" ? "회원" : "비회원"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {member.membership_type === "member" && member.membership_end && (
                    <p className="text-xs text-gray-400">
                      만료: {member.membership_end}
                    </p>
                  )}
                  <button
                    onClick={() => toggleMembership(member)}
                    className="text-xs text-primary hover:underline ml-auto"
                  >
                    {member.membership_type === "member" ? "비회원으로 변경" : "회원으로 변경"}
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
