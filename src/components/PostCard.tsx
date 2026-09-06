import type { Post } from "@/types";
import { KIND_LABEL, LEVEL_LABEL } from "@/types";

const WD = "日月火水木金土";
const fmt = (d: string) => {
  const t = new Date(d + "T00:00:00");
  return `${t.getMonth() + 1}/${t.getDate()}(${WD[t.getDay()]})`;
};

export default function PostCard({ post, active }: { post: Post; active: boolean }) {
  const helper = post.kind === "helper";
  return (
    <article
      className={`flex h-full w-[19rem] shrink-0 snap-start flex-col gap-2 rounded-xl border-2 bg-white p-4 text-left transition ${
        active ? "border-emerald-500 shadow-lg" : "border-transparent shadow"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
            helper ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
          }`}
        >
          {KIND_LABEL[post.kind]}
        </span>
        <span className="text-[11px] text-slate-500">{LEVEL_LABEL[post.level]}</span>
      </div>

      <p className="text-lg font-bold leading-tight text-slate-900">
        {fmt(post.date)} <span className="text-sm font-medium text-slate-600">{post.startTime}〜{post.endTime}</span>
      </p>

      <p className="text-sm font-bold text-slate-800">{post.team.name}</p>

      <p className="text-xs text-slate-600">
        {post.venue.name}
        <span className="ml-1 text-slate-400">/ {post.venue.city}</span>
      </p>

      {helper && (
        <p className="text-xs font-bold text-amber-700">
          {post.positions?.join("・")} を {post.needed} 名
        </p>
      )}

      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{post.body}</p>

      <p className="mt-auto text-xs text-slate-500">
        参加費 {post.fee ? `${post.fee.toLocaleString()}円` : "なし"}
      </p>
    </article>
  );
}
