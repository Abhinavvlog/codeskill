"use client";

import { useId, useState } from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search, Trophy, X } from "lucide-react";
import { contestStatus, type PublicContest } from "@/lib/contests";

interface ContestPickerProps {
  contests: PublicContest[];
  value: string;
  onChange: (slug: string) => void;
}

function matchesContest(contest: PublicContest, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/);
  const content = (contest.title + " " + (contest.description || "") + " " + contest.slug).toLocaleLowerCase();
  return terms.every(term => content.includes(term));
}

function ContestDetails({ contest }: { contest: PublicContest }) {
  const status = contestStatus(contest);
  const statusStyle = status === "Live"
    ? "text-primary bg-primary/10"
    : status === "Upcoming"
      ? "text-amber-700 bg-amber-500/10 dark:text-amber-400"
      : "text-muted-foreground bg-muted";
  return <>
    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
      <Trophy className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold">{contest.title}</span>
      <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{contest.problems.length} {contest.problems.length === 1 ? "problem" : "problems"}</span>
        <span className={"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold " + statusStyle}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{status}
        </span>
      </span>
    </span>
  </>;
}

const optionClass = "flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-3 text-foreground outline-none transition-colors hover:bg-primary/5 data-highlighted:bg-primary/10 data-selected:bg-primary/[0.06]";
const popupClass = "w-[var(--anchor-width)] overflow-hidden rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-xl shadow-black/10 outline-none";

export function ContestPicker({ contests, value, onChange }: ContestPickerProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [selectOpen, setSelectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hasQuery = query.trim().length > 0;
  const selectedContest = contests.find(contest => contest.slug === value) ?? null;
  const matches = contests.filter(contest => matchesContest(contest, query));

  return <section aria-labelledby={id + "-heading"} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 id={id + "-heading"} className="text-base font-semibold tracking-tight">Find your contest</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a contest to explore its leaderboard.</p>
      </div>
      <span className="shrink-0 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
        {contests.length} {contests.length === 1 ? "contest" : "contests"}
      </span>
    </div>

    <div className="grid items-start gap-4 md:grid-cols-2 md:gap-5">
      <div className="min-w-0">
        <label htmlFor={id + "-select"} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose a contest</label>
        <Select.Root
          items={contests.map(contest => ({ value: contest.slug, label: contest.title }))}
          value={value || null}
          onValueChange={next => { if (next) onChange(next); }}
          open={selectOpen}
          modal={false}
          onOpenChange={open => { setSelectOpen(open); if (open) setSearchOpen(false); }}
        >
          <Select.Trigger id={id + "-select"} className="group flex h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-3.5 text-left outline-none transition hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/10 data-popup-open:border-primary/50 data-popup-open:ring-4 data-popup-open:ring-primary/10">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Trophy className="h-4 w-4" /></span>
            <Select.Value className="min-w-0 flex-1 truncate text-sm font-medium" placeholder="Select a contest" />
            <Select.Icon><ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-data-popup-open:rotate-180 motion-reduce:transition-none" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner align="start" sideOffset={8} alignItemWithTrigger={false} className="z-50">
              <Select.Popup className={popupClass}>
                <div className="border-b border-border/70 px-4 py-3 text-xs font-medium text-muted-foreground">Available contests</div>
                <Select.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto p-1.5">
                  {contests.map(contest => <Select.Item key={contest.id} value={contest.slug} label={contest.title} className={optionClass}>
                    <ContestDetails contest={contest} />
                    <span className="grid w-5 shrink-0 place-items-center"><Select.ItemIndicator><Check aria-hidden="true" className="h-4 w-4 text-primary" /></Select.ItemIndicator></span>
                  </Select.Item>)}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>

      <div className="min-w-0">
        <label htmlFor={id + "-search"} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search contests</label>
        <Combobox.Root
          items={contests}
          value={selectedContest}
          inputValue={query}
          itemToStringLabel={contest => contest.title}
          itemToStringValue={contest => contest.slug}
          isItemEqualToValue={(contest, selected) => contest.slug === selected.slug}
          filter={matchesContest}
          autoHighlight
          openOnInputClick={hasQuery}
          open={searchOpen && hasQuery}
          onOpenChange={open => { setSearchOpen(open && hasQuery); if (open && hasQuery) setSelectOpen(false); }}
          onInputValueChange={(text, details) => {
            if (["input-change", "input-clear", "clear-press"].includes(details.reason)) {
              const hasSearch = text.trim().length > 0;
              setQuery(text);
              setSearchOpen(hasSearch);
              if (hasSearch) setSelectOpen(false);
            }
          }}
          onValueChange={contest => {
            if (contest) { onChange(contest.slug); setQuery(""); setSearchOpen(false); }
          }}
        >
          <Combobox.InputGroup className="flex h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-3.5 transition hover:border-primary/40 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Combobox.Input id={id + "-search"} placeholder="Search by name or keyword…" className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/75" />
            {query && <Combobox.Clear aria-label="Clear contest search" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"><X aria-hidden="true" className="h-3.5 w-3.5" /></Combobox.Clear>}
          </Combobox.InputGroup>
          <Combobox.Portal>
            <Combobox.Positioner align="start" sideOffset={8} className="z-50">
              <Combobox.Popup className={popupClass}>
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Search results</span><span>{matches.length} {matches.length === 1 ? "match" : "matches"}</span>
                </div>
                <Combobox.Empty>
                  <div className="px-5 py-7 text-center">
                    <Search aria-hidden="true" className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No contests found</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Try another name or keyword.</p>
                  </div>
                </Combobox.Empty>
                <Combobox.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto p-1.5 empty:p-0">
                  {(contest: PublicContest) => <Combobox.Item key={contest.id} value={contest} className={optionClass}>
                    <ContestDetails contest={contest} />
                    <span className="grid w-5 shrink-0 place-items-center"><Combobox.ItemIndicator><Check aria-hidden="true" className="h-4 w-4 text-primary" /></Combobox.ItemIndicator></span>
                  </Combobox.Item>}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>
    </div>
  </section>;
}
