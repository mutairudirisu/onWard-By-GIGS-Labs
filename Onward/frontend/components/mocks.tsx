import { Sparkles, Users } from "lucide-react";

/* ————— Mock: share portfolio card (feature 1 visual) ————— */

export function ShareCardMock() {
  return (
    <div className="space-y-4">
      <div className="rounded-[22px] bg-paper p-5 shadow-lift">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-[13px] font-bold text-ink">
            AZ
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-bold tracking-tight text-ink">
              <span className="text-lime-deep">o</span>nWard portfolio
            </p>
            <p className="text-[11px] font-medium text-muted">Ayesha · Product Designer</p>
          </div>
          <span className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-paper">
            Share
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["24", "onWards"],
            ["12", "streaks"],
            ["8", "skills"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-2xl bg-mist px-2 py-3">
              <p className="text-[17px] font-bold leading-none text-ink">{n}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {l}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-1.5">
          {[35, 55, 42, 70, 62, 88, 76].map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t-md ${i === 5 ? "bg-lime" : "bg-lime-soft"}`}
              style={{ height: `${h * 0.6}px` }}
            />
          ))}
        </div>
        <p className="tiny mt-3">Momentum · last 7 weeks</p>
      </div>
      <div className="flex items-center gap-3 rounded-[18px] bg-ink px-4 py-3 text-paper">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
          <Users className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <p className="flex-1 text-[12px] font-semibold">
          3 employers viewed this link this week
        </p>
        <span className="text-[11px] font-bold text-lime">+2</span>
      </div>
    </div>
  );
}

/* ————— Mock: goals + live streak card (feature 2 visual) ————— */

export function GoalsMock() {
  return (
    <div className="space-y-4">
      <div className="rounded-[22px] bg-paper p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold tracking-tight text-ink">This week&apos;s goals</p>
          <span className="flex items-center gap-1 rounded-full bg-lime-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" /> Live
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {[
            ["Ship the onboarding redesign", true, "4 / 5 tasks"],
            ["Read 20 pages daily", true, "7 / 7 days"],
            ["Log 3 onWards", false, "2 / 3 logged"],
          ].map(([label, done, meta]) => (
            <li key={label as string} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? "bg-lime text-ink" : "border border-line bg-paper text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="flex-1">
                <span
                  className={`block text-[12.5px] font-semibold ${
                    done ? "text-muted line-through" : "text-ink"
                  }`}
                >
                  {label}
                </span>
                <span className="block text-[10.5px] font-medium text-faint">{meta}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-4 rounded-[18px] bg-ink px-5 py-4 text-paper">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime text-ink">
          <Sparkles className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-bold">16-day streak</p>
          <p className="text-[11px] font-medium text-paper/55">
            Best this year — keep the momentum
          </p>
        </div>
        <p className="text-[15px] font-bold text-lime">+120</p>
      </div>
    </div>
  );
}
