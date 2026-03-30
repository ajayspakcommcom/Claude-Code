// CUSTOM HOOK: useForm
//
// Reusable form state management — handles values, errors, touched fields,
// validation, submit, and reset without any external library.
//
// Returns: { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, isValid }

import { useState, useCallback } from "react";

// ─── The Hook ─────────────────────────────────────────────────────────────────
type ValidationRules<T> = Partial<Record<keyof T, (value: string) => string | undefined>>;

const useForm = <T extends Record<string, string>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
) => {
  const [values, setValues]   = useState<T>(initialValues);
  const [errors, setErrors]   = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = useCallback(
    (name: keyof T, value: string) => {
      if (!validationRules?.[name]) return undefined;
      return validationRules[name]!(value);
    },
    [validationRules]
  );

  // Called on every keystroke
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));

      // Re-validate on change only if field was already touched
      if (touched[name as keyof T]) {
        const error = validate(name as keyof T, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validate]
  );

  // Called when a field loses focus
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validate(name as keyof T, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validate]
  );

  // Run all validations and call onSubmit if valid
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void) =>
      (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(initialValues).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<keyof T, boolean>
        );
        setTouched(allTouched);

        // Validate all fields
        const newErrors: Partial<Record<keyof T, string>> = {};
        let hasErrors = false;
        (Object.keys(values) as Array<keyof T>).forEach((key) => {
          const error = validate(key, values[key]);
          if (error) { newErrors[key] = error; hasErrors = true; }
        });
        setErrors(newErrors);

        if (!hasErrors) onSubmit(values);
      },
    [values, validate, initialValues]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).every((k) => !errors[k as keyof T]);

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, isValid };
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "6px 8px",
  marginTop: "4px", marginBottom: "2px", boxSizing: "border-box",
};
const errorStyle: React.CSSProperties = { color: "red", fontSize: "12px", marginBottom: "8px" };

const UseFormDemo = () => {
  const [submitted, setSubmitted] = useState<Record<string, string> | null>(null);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset } = useForm(
    { username: "", email: "", password: "", role: "developer" },
    {
      username: (v) => !v.trim() ? "Username is required" : v.length < 3 ? "Min 3 characters" : undefined,
      email:    (v) => !v.trim() ? "Email is required" : !/\S+@\S+\.\S+/.test(v) ? "Invalid email" : undefined,
      password: (v) => !v ? "Password is required" : v.length < 6 ? "Min 6 characters" : undefined,
    }
  );

  const onSubmit = handleSubmit((vals) => setSubmitted(vals));

  return (
    <div>
      <h2>useForm — Custom Hook</h2>

      {submitted ? (
        <div>
          <p style={{ color: "green" }}>Form submitted successfully!</p>
          <pre style={{ background: "#f5f5f5", padding: "10px" }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
          <button onClick={() => { reset(); setSubmitted(null); }}>Reset</button>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ maxWidth: "360px" }}>

          <label>Username
            <input
              name="username"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle}
              placeholder="At least 3 characters"
            />
          </label>
          {touched.username && errors.username && <p style={errorStyle}>{errors.username}</p>}

          <label>Email
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle}
              placeholder="you@example.com"
            />
          </label>
          {touched.email && errors.email && <p style={errorStyle}>{errors.email}</p>}

          <label>Password
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle}
              placeholder="At least 6 characters"
            />
          </label>
          {touched.password && errors.password && <p style={errorStyle}>{errors.password}</p>}

          <label>Role
            <select name="role" value={values.role} onChange={handleChange} style={inputStyle}>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="manager">Manager</option>
            </select>
          </label>

          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <button type="submit">Submit</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
        </form>
      )}
    </div>
  );
};

export { useForm };
export default UseFormDemo;
