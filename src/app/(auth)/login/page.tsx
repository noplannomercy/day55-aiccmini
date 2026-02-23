"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Browser-safe Supabase client scoped to this component.
 * We instantiate directly from @supabase/ssr here instead of importing from
 * @/lib/auth to avoid pulling server-only modules (next/headers, postgres) into
 * the browser bundle.  The auth.ts module is intentionally server-side only.
 */
function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Instantiated once at module scope so the same client instance is reused
// across renders rather than being recreated on every handleGoogleLogin call.
const supabase = createSupabaseBrowserClient()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = {
  email: string
  password: string
}

type LoadingSource = "google" | "mock" | null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders the Google "G" SVG logo for the OAuth button.
 * Using an inline SVG keeps the component self-contained without
 * requiring an external image asset or icon library.
 */
function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" })
  const [loading, setLoading] = useState<LoadingSource>(null)
  // Separate error messages for each authentication path so they don't
  // overwrite each other when the user switches between the two methods.
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [mockError, setMockError] = useState<string | null>(null)

  // -- Google OAuth ----------------------------------------------------------

  async function handleGoogleLogin() {
    setGoogleError(null)
    setLoading("google")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        // signInWithOAuth redirects on success; an error means the redirect
        // never happened.
        setGoogleError(error.message)
        setLoading(null)
      }
      // On success Supabase initiates a browser redirect — no further action
      // is needed. Keep loading=true so the button stays disabled until the
      // navigation completes.
    } catch {
      setGoogleError("Google 로그인 중 오류가 발생했습니다.")
      setLoading(null)
    }
  }

  // -- Mock login form -------------------------------------------------------

  function handleFieldChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function handleMockLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMockError(null)

    if (!form.email.trim()) {
      setMockError("이메일을 입력해 주세요.")
      return
    }

    setLoading("mock")

    try {
      const response = await fetch("/api/mock-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          // password is optional — the API defaults to 'password123'
          password: form.password || undefined,
        }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setMockError(data.error ?? "로그인에 실패했습니다.")
        setLoading(null)
        return
      }

      // Successful login — redirect to the main dashboard.
      // window.location.href triggers a full page navigation which ensures
      // Next.js picks up the newly set Supabase auth cookies.
      window.location.href = "/dashboard"
    } catch {
      setMockError("서버와 통신하는 중 오류가 발생했습니다.")
      setLoading(null)
    }
  }

  // -- Render ----------------------------------------------------------------

  const isIdle = loading === null

  return (
    <Card className="w-full max-w-sm">
      {/* Header */}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">AICC Mini</CardTitle>
        <CardDescription>계정으로 로그인하세요</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Google OAuth */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!isIdle}
            onClick={handleGoogleLogin}
          >
            {loading === "google" ? (
              "로그인 중..."
            ) : (
              <>
                <GoogleIcon />
                Google로 로그인
              </>
            )}
          </Button>

          {googleError !== null && (
            <p role="alert" className="text-destructive text-sm">
              {googleError}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-border" />
          <span className="text-muted-foreground text-xs select-none">또는</span>
          <hr className="flex-1 border-border" />
        </div>

        {/* Mock login form (development) */}
        <form onSubmit={handleMockLogin} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="agent@example.com"
              value={form.email}
              onChange={handleFieldChange("email")}
              disabled={!isIdle}
              aria-invalid={mockError !== null}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={handleFieldChange("password")}
              disabled={!isIdle}
            />
          </div>

          {mockError !== null && (
            <p role="alert" className="text-destructive text-sm">
              {mockError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!isIdle}
          >
            {loading === "mock" ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
