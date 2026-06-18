import LoginClient from "./LoginClient";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const AUTH_ERROR_MESSAGE =
  "ログインリンクの有効期限が切れたか、認証に失敗しました。もう一度お試しください。";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = first(params.mode) === "signup" ? "signup" : "signin";
  const nextPath = safeNextPath(first(params.next));
  const initialError = first(params.error) === "auth" ? AUTH_ERROR_MESSAGE : "";

  return (
    <LoginClient
      initialError={initialError}
      initialMode={mode}
      nextPath={nextPath}
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}
