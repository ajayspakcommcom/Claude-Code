// TOPIC: Profile Page — Edit Profile + Change Password (two separate forms)
//
// Production patterns:
//   - Two independent RHF forms on the same page (each with its own useForm)
//   - defaultValues pre-populated from Redux user state (useEffect sync)
//   - Optimistic local update (patchUser) so the navbar updates instantly
//   - Actual server call in parallel → on failure, re-sync UI from server
//   - Confirm before discarding unsaved changes (formState.isDirty)
//   - Separate success/error toasts per form (not a global error banner)

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import * as authApi from "../api/authApi";
import type { Page } from "../types";

// ─── Toast helper (inline — no library) ──────────────────────────────────────

interface Toast { id: number; message: string; type: "success" | "error" }

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  return { toasts, success: (m: string) => add(m, "success"), error: (m: string) => add(m, "error") };
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName:  z.string().min(1, "Last name is required").max(50),
  avatarUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword:     z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path:    ["confirmNewPassword"],
  });

type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  navigate: (page: Page) => void;
}

export const ProfilePage = ({ navigate }: Props) => {
  const { user, patchUser } = useAuth();
  const toast               = useToast();
  const [showPws, setShowPws] = useState({ current: false, new: false, confirm: false });

  // ── Profile form ───────────────────────────────────────────────────────────

  const profileForm = useForm<ProfileForm>({
    resolver:      zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", avatarUrl: "" },
  });

  // Sync form when user loads from Redux
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName:  user.lastName,
        avatarUrl: user.avatarUrl ?? "",
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user) return;

    // 1. Optimistic update — navbar / header updates instantly
    patchUser({ firstName: data.firstName, lastName: data.lastName, avatarUrl: data.avatarUrl || null });

    try {
      // 2. Persist to server
      const updated = await authApi.updateProfile(user.id, {
        firstName: data.firstName,
        lastName:  data.lastName,
        avatarUrl: data.avatarUrl || null,
      });
      // 3. Sync with server response (handles any server-side transform)
      patchUser(updated);
      profileForm.reset(data); // mark form as pristine
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      // 4. Rollback optimistic update
      patchUser({ firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl });
      toast.error(err.message ?? "Failed to update profile");
    }
  };

  // ── Password form ──────────────────────────────────────────────────────────

  const passwordForm = useForm<PasswordForm>({
    resolver:      zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!user) return;
    try {
      await authApi.changePassword(user.id, data.currentPassword, data.newPassword);
      passwordForm.reset();
      toast.success("Password changed! Please use your new password next time you log in.");
    } catch (err: any) {
      passwordForm.setError("currentPassword", { message: err.message ?? "Failed to change password" });
    }
  };

  const { isDirty: profileDirty, isSubmitting: profileSubmitting } = profileForm.formState;
  const { isSubmitting: pwSubmitting } = passwordForm.formState;

  return (
    <div style={s.page}>

      {/* Toast container */}
      <div style={s.toastContainer}>
        {toast.toasts.map((t) => (
          <div key={t.id} style={{ ...s.toast, ...(t.type === "success" ? s.toastSuccess : s.toastError) }}>
            {t.type === "success" ? "✓" : "✗"} {t.message}
          </div>
        ))}
      </div>

      {/* Page header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate("dashboard")}>← Dashboard</button>
        <h1 style={s.title}>Account Settings</h1>
      </div>

      {/* Avatar preview */}
      <div style={s.avatarSection}>
        <div style={s.avatar}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.firstName} style={s.avatarImg} />
          ) : (
            <span style={s.avatarInitials}>
              {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?"}
            </span>
          )}
        </div>
        <div>
          <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
          <div style={s.userEmail}>{user?.email}</div>
          <div style={s.rolePill}>{user?.role}</div>
        </div>
      </div>

      {/* ── Profile form ──────────────────────────────────────────────────── */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Personal Information</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} noValidate style={s.form}>

          <div style={s.row}>
            <div style={s.field}>
              <label htmlFor="firstName" style={s.label}>First name</label>
              <input
                id="firstName"
                type="text"
                style={{ ...s.input, ...(profileForm.formState.errors.firstName ? s.inputError : {}) }}
                {...profileForm.register("firstName")}
              />
              {profileForm.formState.errors.firstName && (
                <span style={s.err}>{profileForm.formState.errors.firstName.message}</span>
              )}
            </div>
            <div style={s.field}>
              <label htmlFor="lastName" style={s.label}>Last name</label>
              <input
                id="lastName"
                type="text"
                style={{ ...s.input, ...(profileForm.formState.errors.lastName ? s.inputError : {}) }}
                {...profileForm.register("lastName")}
              />
              {profileForm.formState.errors.lastName && (
                <span style={s.err}>{profileForm.formState.errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div style={s.field}>
            <label htmlFor="email" style={s.label}>Email address</label>
            <input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              style={{ ...s.input, ...s.inputDisabled }}
            />
            <span style={s.hint}>Email cannot be changed. Contact support if needed.</span>
          </div>

          <div style={s.field}>
            <label htmlFor="avatarUrl" style={s.label}>Avatar URL <span style={s.optional}>(optional)</span></label>
            <input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              style={{ ...s.input, ...(profileForm.formState.errors.avatarUrl ? s.inputError : {}) }}
              {...profileForm.register("avatarUrl")}
            />
            {profileForm.formState.errors.avatarUrl && (
              <span style={s.err}>{profileForm.formState.errors.avatarUrl.message}</span>
            )}
          </div>

          <div style={s.formFooter}>
            {profileDirty && (
              <button
                type="button"
                style={s.cancelBtn}
                onClick={() => profileForm.reset()}
              >
                Discard changes
              </button>
            )}
            <button
              type="submit"
              disabled={!profileDirty || profileSubmitting}
              style={{ ...s.saveBtn, ...(!profileDirty ? s.saveBtnDisabled : {}) }}
            >
              {profileSubmitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password form ─────────────────────────────────────────────────── */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} noValidate style={s.form}>

          {/* Current password */}
          <div style={s.field}>
            <label htmlFor="currentPassword" style={s.label}>Current password</label>
            <div style={s.passwordWrap}>
              <input
                id="currentPassword"
                type={showPws.current ? "text" : "password"}
                autoComplete="current-password"
                style={{ ...s.input, ...s.passwordInput, ...(passwordForm.formState.errors.currentPassword ? s.inputError : {}) }}
                {...passwordForm.register("currentPassword")}
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPws((v) => ({ ...v, current: !v.current }))} aria-label="Toggle">
                {showPws.current ? "🙈" : "👁️"}
              </button>
            </div>
            {passwordForm.formState.errors.currentPassword && (
              <span style={s.err}>{passwordForm.formState.errors.currentPassword.message}</span>
            )}
          </div>

          {/* New password */}
          <div style={s.field}>
            <label htmlFor="newPassword" style={s.label}>New password</label>
            <div style={s.passwordWrap}>
              <input
                id="newPassword"
                type={showPws.new ? "text" : "password"}
                autoComplete="new-password"
                style={{ ...s.input, ...s.passwordInput, ...(passwordForm.formState.errors.newPassword ? s.inputError : {}) }}
                {...passwordForm.register("newPassword")}
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPws((v) => ({ ...v, new: !v.new }))} aria-label="Toggle">
                {showPws.new ? "🙈" : "👁️"}
              </button>
            </div>
            {passwordForm.formState.errors.newPassword && (
              <span style={s.err}>{passwordForm.formState.errors.newPassword.message}</span>
            )}
          </div>

          {/* Confirm new password */}
          <div style={s.field}>
            <label htmlFor="confirmNewPassword" style={s.label}>Confirm new password</label>
            <div style={s.passwordWrap}>
              <input
                id="confirmNewPassword"
                type={showPws.confirm ? "text" : "password"}
                autoComplete="new-password"
                style={{ ...s.input, ...s.passwordInput, ...(passwordForm.formState.errors.confirmNewPassword ? s.inputError : {}) }}
                {...passwordForm.register("confirmNewPassword")}
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPws((v) => ({ ...v, confirm: !v.confirm }))} aria-label="Toggle">
                {showPws.confirm ? "🙈" : "👁️"}
              </button>
            </div>
            {passwordForm.formState.errors.confirmNewPassword && (
              <span style={s.err}>{passwordForm.formState.errors.confirmNewPassword.message}</span>
            )}
          </div>

          <div style={s.formFooter}>
            <button type="submit" disabled={pwSubmitting} style={s.saveBtn}>
              {pwSubmitting ? "Changing…" : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:           { maxWidth: 720, margin: "0 auto", padding: "32px 24px" },
  toastContainer: { position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 10, zIndex: 1000 },
  toast:          { padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
  toastSuccess:   { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
  toastError:     { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
  header:         { marginBottom: 24 },
  back:           { background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0, fontSize: 14, marginBottom: 12 },
  title:          { fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 },
  avatarSection:  { display: "flex", alignItems: "center", gap: 20, marginBottom: 32, padding: "20px 24px", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" },
  avatar:         { width: 72, height: 72, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  avatarImg:      { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontSize: 26, fontWeight: 700, color: "#fff" },
  userName:       { fontSize: 18, fontWeight: 700, color: "#111827" },
  userEmail:      { fontSize: 14, color: "#6b7280", marginTop: 2 },
  rolePill:       { display: "inline-block", marginTop: 6, padding: "2px 10px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize" },
  card:           { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 28, marginBottom: 20 },
  cardTitle:      { fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 20px" },
  form:           { display: "flex", flexDirection: "column", gap: 18 },
  row:            { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field:          { display: "flex", flexDirection: "column", gap: 6 },
  label:          { fontSize: 14, fontWeight: 600, color: "#374151" },
  optional:       { fontWeight: 400, color: "#9ca3af" },
  input:          { padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" },
  inputError:     { borderColor: "#ef4444" },
  inputDisabled:  { background: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" },
  hint:           { fontSize: 12, color: "#9ca3af" },
  err:            { fontSize: 12, color: "#ef4444" },
  passwordWrap:   { position: "relative" },
  passwordInput:  { paddingRight: 44 },
  eyeBtn:         { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  formFooter:     { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 4 },
  cancelBtn:      { padding: "10px 20px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontWeight: 500 },
  saveBtn:        { padding: "10px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  saveBtnDisabled:{ background: "#93c5fd", cursor: "not-allowed" },
};
