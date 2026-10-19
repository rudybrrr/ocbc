"use client";

import { ActivityList } from "@/components/home";
import { Icon } from "@/components/icons";
import { activity } from "@/lib/data";
import { dayKey, dayLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

export function Activity() {
  const store = useStore();
  const rows = activity(store.snapshot.transfers);
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = dayKey(row.at);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return (
    <div className="screen">
      <button type="button" className="back" onClick={() => store.go("home")}>
        <Icon name="back" />
        Today
      </button>
      <h1 id="screen-title" tabIndex={-1}>
        Activity
      </h1>
      <p className="lede">Practice payments you make in this demo appear at the top.</p>
      {[...groups.entries()].map(([key, group]) => (
        <section key={key} className="day-group" aria-labelledby={`day-${key}`}>
          <h2 id={`day-${key}`}>{dayLabel(group[0].at)}</h2>
          <ActivityList rows={group} />
        </section>
      ))}
    </div>
  );
}
