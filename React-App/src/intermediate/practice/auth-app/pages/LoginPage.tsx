// TOPIC: Login Page — React Hook Form + Zod + Auth Integration
//
// Production patterns:
//   - zodResolver bridges Zod schema → RHF validation
//   - formState.isSubmitting disables button during async submit (prevents double-submit)
//   - setError("root") captures server-level errors (wrong password) in the form
//   - "remember me" is passed to the API layer (could extend session length server-side)
//   - Password visibility toggle (UX best practice — never hide it behind **** permanently)
//   - useEffect to navigate away once auth succeeds (not in the submit handler)

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import type { Page } from "../types";

// ─── Validation schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:      z.string().min(1, "Email is required").email("Enter a valid email"),
  password:   z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  navigate: (page: Page) => void;
}

export const LoginPage = ({ navigate }: Props) => {
  const { login, isAuth, error: authError, dismissError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // Navigate to dashboard once auth succeeds — keep submit handler free of navigation
  useEffect(() => {
    if (isAuth) navigate("dashboard");
  }, [isAuth, navigate]);

  // Surface Redux error into the form (e.g. "Invalid email or password")
  useEffect(() => {
    if (authError) {
      setError("root", { message: authError });
      dismissError();
    }
  }, [authError, setError, dismissError]);

  const onSubmit = async (data: LoginForm) => {
    await login(data);
    // navigation happens via the isAuth useEffect above
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.subtitle}>Sign in to your account</p>
        </div>

        {/* Demo credentials hint */}
        <div style={s.hint}>
          <strong>Demo accounts:</strong>
          <br />admin@example.com / Admin123!
          <br />user@example.com &nbsp;/ User123!
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>

          {/* Server / root error */}
          {errors.root && (
            <div style={s.errorBanner} role="alert">
              {errors.root.message}
            </div>
          )}

          {/* Email */}
          <div style={s.field}>
            <label htmlFor="email" style={s.label}>Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              {...register("email")}
            />
            {errors.email && <span style={s.fieldError}>{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div style={s.field}>
            <label htmlFor="password" style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                style={{ ...s.input, ...s.passwordInput, ...(errors.password ? s.inputError : {}) }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={s.eyeBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span style={s.fieldError}>{errors.password.message}</span>}
          </div>

          {/* Remember me + Forgot password */}
          <div style={s.row}>
            <label style={s.checkLabel}>
              <input type="checkbox" style={s.check} {...register("rememberMe")} />
              Remember me
            </label>
            <button
              type="button"
              style={s.link}
              onClick={() => navigate("forgot-password")}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting} style={s.submitBtn}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Register link */}
        <p style={s.footer}>
          Don't have an account?{" "}
          <button style={s.link} onClick={() => navigate("register")}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:      { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f3f4f6" },
  card:      { background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  header:    { marginBottom: 24, textAlign: "center" },
  title:     { fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 },
  subtitle:  { color: "#6b7280", marginTop: 8 },
  hint:      { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#1e40af", marginBottom: 24, lineHeight: 1.6 },
  form:      { display: "flex", flexDirection: "column", gap: 20 },
  errorBanner: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14 },
  field:     { display: "flex", flexDirection: "column", gap: 6 },
  label:     { fontSize: 14, fontWeight: 600, color: "#374151" },
  input:     { padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 15, outline: "none", transition: "border-color 0.15s", width: "100%", boxSizing: "border-box" },
  inputError: { borderColor: "#ef4444" },
  fieldError: { fontSize: 12, color: "#ef4444" },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 44 },
  eyeBtn:    { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  row:       { display: "flex", justifyContent: "space-between", alignItems: "center" },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151", cursor: "pointer" },
  check:     { width: 16, height: 16, cursor: "pointer" },
  link:      { background: "none", border: "none", color: "#3b82f6", fontSize: 14, cursor: "pointer", padding: 0, fontWeight: 500 },
  submitBtn: { padding: "12px 0", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" },
  footer:    { textAlign: "center", marginTop: 24, fontSize: 14, color: "#6b7280" },
};
