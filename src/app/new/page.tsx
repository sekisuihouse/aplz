import { redirect } from "next/navigation";

export default async function NewAppPage({
  searchParams,
}: {
  searchParams?: { request?: string | string[] };
}) {
  const requestValue = searchParams?.request;
  const requestSlug = Array.isArray(requestValue)
    ? requestValue[0]?.trim()
    : requestValue?.trim();

  if (requestSlug) {
    redirect(`/requests/${encodeURIComponent(requestSlug)}`);
  }

  redirect("/requests");
}
