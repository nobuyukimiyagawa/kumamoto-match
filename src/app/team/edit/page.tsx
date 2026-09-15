"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TeamForm from "@/components/TeamForm";
import { getTeam, teamsRunBy, useDB, useSessionId } from "@/lib/store";
import type { Team } from "@/types";

export default function EditTeamPage() {
  return <Suspense fallback={null}><Edit /></Suspense>;
}

function Edit() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const db = useDB();
  const sid = useSessionId();
  const router = useRouter();
  const team = getTeam(db, id);
  const canEdit = !!sid && teamsRunBy(db, sid).some((t) => t.id === id);

  if (!db.ready) return <main className="min-h-dvh"><Header /></main>;
  if (!team || !canEdit) {
    return (
      <main className="min-h-dvh"><Header />
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="font-bold">このチームは編集できません</p>
          <Link href="/team/" className="btn btn-ghost mt-4">チーム管理に戻る</Link>
        </div>
      </main>
    );
  }
  return <Form key={team.id} initial={team} onDone={() => router.push("/team/")} />;
}

function Form({ initial, onDone }: { initial: Team; onDone: () => void }) {
  return (
    <main className="min-h-dvh pb-24 sm:pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <Link href="/team/" className="text-[14px] font-bold" style={{ color: "var(--primary)" }}>← チーム管理に戻る</Link>
        <p className="hud mt-4" style={{ color: "var(--match)" }}>team // edit</p>
        <h1 className="mt-1 text-[22px] font-bold">チームを編集</h1>
        <div className="mt-5">
          <TeamForm ownerId={initial.ownerId} initial={initial} onDone={onDone} onCancel={onDone} />
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
