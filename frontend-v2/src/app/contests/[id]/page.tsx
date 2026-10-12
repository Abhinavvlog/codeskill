"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
import { Calendar, Clock, Code2, Trophy } from "lucide-react";
import api from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/spinner";

interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: string[];
  isPrivate: boolean;
  participants?: string[];
}

type ContestResult = {
  key: string;
  contest?: Contest;
  error?: string;
};

export default function ContestDetailsPage() {
  // The existing [id] segment carries the public slug on this detail route.
  const { id: slug } = useParams<{ id: string }>();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<ContestResult>();
  const [now, setNow] = useState(Date.now);
  const requestKey = `${slug}:${retry}`;

  useEffect(() => {
    const controller = new AbortController();
    api.get<Contest>(`/contests/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, contest: data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          error: isAxiosError(error) && error.response?.status === 404
            ? "Contest not found. It may not have been published or may no longer be available."
            : "Unable to load this contest. Please try again.",
        });
      });
    return () => {
      controller.abort();
    };
  }, [slug, requestKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (result?.key !== requestKey) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center gap-3" role="status">
        <Spinner className="text-primary" /> Loading contest...
      </div>
    );
  }

  const contest = result.contest;
  if (!contest) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Contest unavailable</h1>
        <p className="text-muted-foreground" role="alert">{result.error}</p>
        <button type="button" onClick={() => setRetry((value) => value + 1)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground">
          Try again
        </button>
      </div>
    );
  }

  const ended = now >= new Date(contest.endTime).getTime();
  const upcoming = now < new Date(contest.startTime).getTime();
  const status = ended ? "Ended" : upcoming ? "Upcoming" : "Active";


  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6 font-sans">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold"><Trophy className="w-5 h-5" /> CodeSkill Contest</div>
        <h1 className="text-3xl font-bold text-foreground break-words">{contest.title}</h1>
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">{status}</span>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Starts", value: new Date(contest.startTime).toLocaleString(), icon: Calendar },
          { label: "Ends", value: new Date(contest.endTime).toLocaleString(), icon: Clock },
          { label: "Problems", value: contest.problems.length.toString(), icon: Code2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-4 rounded-2xl border border-border bg-card space-y-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="w-4 h-4" />{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <section className="p-6 rounded-2xl border border-border bg-card space-y-3">
        <h2 className="text-lg font-bold text-foreground">About this contest</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{contest.description}</p>
      </section>
      <ContestRegistration key={contest.id} contest={contest} ended={ended} />
    </div>
  );
}


function ContestRegistration({ contest, ended }: { contest: Contest; ended: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registeredId, setRegisteredId] = useState<string>();
  const [registrationError, setRegistrationError] = useState("");
  const registrationRequest = useRef<AbortController | null>(null);
  useEffect(() => () => registrationRequest.current?.abort(), []);
  const registered = registeredId === contest.id || !!(user && contest.participants?.includes(user.id || user._id));

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || registering || registered || Date.now() >= new Date(contest.endTime).getTime()) return;
    const controller = new AbortController();
    registrationRequest.current = controller;
    setRegistering(true);
    setRegistrationError("");
    try {
      // Registration takes the database ID, while public detail links use the slug.
      await api.post(`/contests/${encodeURIComponent(contest.id)}/register`,
        contest.isPrivate ? { password } : {}, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setRegisteredId(contest.id);
        setPassword("");
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        const message = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
        setRegistrationError(typeof message === "string" ? message : "Registration failed. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) setRegistering(false);
    }
  };


  return (
      <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h2 className="text-lg font-bold text-foreground">Registration</h2>
        {ended ? <p className="text-sm text-muted-foreground">This contest has ended.</p>
          : registered ? <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">You are registered for this contest.</p>
          : authLoading ? <p className="text-sm text-muted-foreground" role="status">Checking your account...</p>
          : !user ? <p className="text-sm text-muted-foreground"><Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link> to register for this contest.</p>
          : <form onSubmit={register} className="space-y-4">
            {contest.isPrivate && <div className="space-y-2">
              <label htmlFor="contest-password" className="block text-sm font-medium text-foreground">Contest password</label>
              <input id="contest-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full sm:max-w-sm px-3 py-2 rounded-xl border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>}
            {registrationError && <p className="text-sm text-red-500" role="alert">{registrationError}</p>}
            <button type="submit" disabled={registering} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {registering ? "Registering..." : "Register for Contest"}
            </button>
          </form>}
      </section>
  );
}
