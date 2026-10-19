import ErrorFallbackRoute from "./page-client";

type SearchParams = Promise<{ failure?: string; returnTo?: string }>;

export default async function ErrorFallbackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//") && !params.returnTo.startsWith("/error-fallback")
    ? params.returnTo
    : "/";
  const failure = ["server", "network", "timeout", "unexpected"].includes(params.failure || "") ? params.failure! : "unexpected";

  return <ErrorFallbackRoute failure={failure as "server" | "network" | "timeout" | "unexpected"} returnTo={returnTo} />;
}
