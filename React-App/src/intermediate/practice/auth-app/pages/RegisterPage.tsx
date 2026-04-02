// TOPIC: Register Page — Multi-field Zod schema + password strength
//
// Production patterns:
//   - .refine() on the schema level for cross-field validation (confirmPassword)
//   - Password strength meter — visual feedback without extra library
//   - criteriaMode: "all" — show ALL validation errors at once (not just first)
//   - Server errors (duplicate email) surfaced via setError("root")

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import type { Page } from "../types";

// ─── Password strength helper ─────────────────────────────────────────────────

const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
};

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

// ─── Validation schema ────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    firstName:       z.string().min(1, "First name is required").max(50),
    lastName:        z.string().min(1, "Last name is required").max(50),
    email:           z.string().min(1, "Email is required").email("Enter a valid email"),
    password:        z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],   // attach error to this field
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  navigate: (page: Page) => void;
}

export const RegisterPage = ({ navigate }: Props) => {
  const { register: registerUser, isAuth, error: authError, dismissError } = useAuth();
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [pwValue, setPwValue] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver:     zodResolver(registerSchema),
    criteriaMode: "all",    // collect ALL password errors simultaneously
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  // Live password strength — watch field value to update meter
  const watchedPw = watch("password");
  useEffect(() => setPwValue(watchedPw ?? ""), [watchedPw]);

  // Navigate on success
  useEffect(() => {
    if (isAuth) navigate("dashboard");
  }, [isAuth, navigate]);

  // Surface server errors
  useEffect(() => {
    if (authError) {
      setError("root", { message: authError });
      dismissError();
    }
  }, [authError, setError, dismissError]);

  const onSubmit = async (data: RegisterForm) => {
    await registerUser(data);
  };

  const strength      = getPasswordStrength(pwValue);
  const strengthLabel = strengthLabels[strength];
  const strengthColor = strengthColors[strength];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>Create account</h1>
          <p style={s.subtitle}>Join us today — it's free</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>

          {errors.root && (
            <div style={s.errorBanner} role="alert">{errors.root.message}</div>
          )}

          {/* Name row */}
          <div style={s.nameRow}>
            <div style={s.field}>
              <label htmlFor="firstName" style={s.label}>First name</label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                style={{ ...s.input, ...(errors.firstName ? s.inputError : {}) }}
                {...register("firstName")}
              />
              {errors.firstName && <span style={s.fieldError}>{errors.firstName.message}</span>}
            </div>
            <div style={s.field}>
              <label htmlFor="lastName" style={s.label}>Last name</label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                style={{ ...s.input, ...(errors.lastName ? s.inputError : {}) }}
                {...register("lastName")}
              />
              {errors.lastName && <span style={s.fieldError}>{errors.lastName.message}</span>}
            </div>
          </div>

          {/* Email */}
          <div style={s.field}>
            <label htmlFor="reg-email" style={s.label}>Email address</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              {...register("email")}
            />
            {errors.email && <span style={s.fieldError}>{errors.email.message}</span>}
          </div>

          {/* Password + strength meter */}
          <div style={s.field}>
            <label htmlFor="reg-password" style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                style={{ ...s.input, ...s.passwordInput, ...(errors.password ? s.inputError : {}) }}
                {...register("password")}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} style={s.eyeBtn} aria-label="Toggle password">
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {/* Strength meter */}
            {pwValue && (
              <div style={s.strengthWrap}>
                <div style={s.strengthBar}>
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      style={{
                        ...s.strengthSegment,
                        background: n <= strength ? strengthColor : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>
                  {strengthLabel}
                </span>
              </div>
            )}
            {/* Show all password errors at once */}
            {errors.password && (
              <ul style={s.errorList}>
                {Array.isArray(errors.password) ? (
                  errors.password.map((e, i) => <li key={i}>{e.message}</li>)
                ) : (
                  <li>{errors.password.message}</li>
                )}
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div style={s.field}>
            <label htmlFor="reg-confirm" style={s.label}>Confirm password</label>
            <div style={s.passwordWrap}>
              <input
                id="reg-confirm"
                type={showCpw ? "text" : "password"}
                autoComplete="new-password"
                style={{ ...s.input, ...s.passwordInput, ...(errors.confirmPassword ? s.inputError : {}) }}
                {...register("confirmPassword")}
              />
              <button type="button" onClick={() => setShowCpw((v) => !v)} style={s.eyeBtn} aria-label="Toggle confirm password">
                {showCpw ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span style={s.fieldError}>{errors.confirmPassword.message}</span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} style={s.submitBtn}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{" "}
          <button style={s.link} onClick={() => navigate("login")}>Sign in</button>
        </p>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:         { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px" },
  card:         { background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 480, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  header:       { marginBottom: 24, textAlign: "center" },
  title:        { fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 },
  subtitle:     { color: "#6b7280", marginTop: 8 },
  form:         { display: "flex", flexDirection: "column", gap: 20 },
  errorBanner:  { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14 },
  nameRow:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field:        { display: "flex", flexDirection: "column", gap: 6 },
  label:        { fontSize: 14, fontWeight: 600, color: "#374151" },
  input:        { padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" },
  inputError:   { borderColor: "#ef4444" },
  fieldError:   { fontSize: 12, color: "#ef4444" },
  passwordWrap: { position: "relative" },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  strengthWrap: { display: "flex", alignItems: "center", gap: 10, marginTop: 6 },
  strengthBar:  { display: "flex", gap: 4, flex: 1 },
  strengthSegment: { height: 4, flex: 1, borderRadius: 2, transition: "background 0.3s" },
  errorList:    { margin: 0, paddingLeft: 18, fontSize: 12, color: "#ef4444", listStyle: "disc" },
  submitBtn:    { padding: "12px 0", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" },
  footer:       { textAlign: "center", marginTop: 24, fontSize: 14, color: "#6b7280" },
  link:         { background: "none", border: "none", color: "#3b82f6", fontSize: 14, cursor: "pointer", padding: 0, fontWeight: 500 },
};
