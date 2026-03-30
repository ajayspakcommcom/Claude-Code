// PRACTICE: Simple CRUD with Local State
//
// Concepts used:
//   • useState — list of records, form state, edit mode
//   • useReducer — all CRUD actions in one reducer
//   • Controlled forms — Create and Update forms
//   • Lists & keys — rendering the records table
//   • Conditional rendering — empty state, edit mode vs view mode
//   • Basic validation — required fields, duplicate check

import { useReducer, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  id: number;
  name: string;
  email: string;
  grade: string;
}

interface State {
  students: Student[];
  nextId: number;
}

type Action =
  | { type: "CREATE"; payload: Omit<Student, "id"> }
  | { type: "UPDATE"; payload: Student }
  | { type: "DELETE"; id: number };

// ─── Reducer ──────────────────────────────────────────────────────────────────
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "CREATE":
      return {
        students: [...state.students, { id: state.nextId, ...action.payload }],
        nextId: state.nextId + 1,
      };
    case "UPDATE":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case "DELETE":
      return { ...state, students: state.students.filter((s) => s.id !== action.id) };
    default:
      return state;
  }
};

const INITIAL_STATE: State = {
  students: [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", grade: "A" },
    { id: 2, name: "Bob Smith",     email: "bob@example.com",   grade: "B" },
    { id: 3, name: "Carol White",   email: "carol@example.com", grade: "A+" },
  ],
  nextId: 4,
};

const GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];

// ─── Form Component (shared for Create & Update) ──────────────────────────────
interface StudentFormProps {
  initialValues?: Omit<Student, "id">;
  onSubmit: (values: Omit<Student, "id">) => void;
  onCancel?: () => void;
  submitLabel: string;
}

const StudentForm = ({ initialValues, onSubmit, onCancel, submitLabel }: StudentFormProps) => {
  const [values, setValues] = useState(
    initialValues ?? { name: "", email: "", grade: "A" }
  );
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.email.trim()) {
      setError("Name and Email are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(values.email)) {
      setError("Enter a valid email address.");
      return;
    }
    onSubmit(values);
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 8px", borderRadius: "4px",
    border: "1px solid #ccc", fontSize: "14px", width: "100%",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 160px" }}>
        <label style={{ fontSize: "12px", color: "#555" }}>Name *</label>
        <input name="name" value={values.name} onChange={handleChange} placeholder="Full name" style={inputStyle} />
      </div>
      <div style={{ flex: "1 1 160px" }}>
        <label style={{ fontSize: "12px", color: "#555" }}>Email *</label>
        <input name="email" value={values.email} onChange={handleChange} placeholder="email@example.com" style={inputStyle} />
      </div>
      <div style={{ flex: "0 1 100px" }}>
        <label style={{ fontSize: "12px", color: "#555" }}>Grade</label>
        <select name="grade" value={values.grade} onChange={handleChange} style={inputStyle}>
          {GRADES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          type="submit"
          style={{ padding: "7px 14px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: "7px 14px", background: "#aaa", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p style={{ color: "red", fontSize: "12px", width: "100%", margin: 0 }}>{error}</p>}
    </form>
  );
};

// ─── Main CRUD App ────────────────────────────────────────────────────────────
const CRUDApp = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const handleCreate = (values: Omit<Student, "id">) => {
    dispatch({ type: "CREATE", payload: values });
  };

  const handleUpdate = (id: number, values: Omit<Student, "id">) => {
    dispatch({ type: "UPDATE", payload: { id, ...values } });
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this student?")) {
      dispatch({ type: "DELETE", id });
      if (editingId === id) setEditingId(null);
    }
  };

  const filtered = state.students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: "14px" };
  const thStyle: React.CSSProperties = { ...tdStyle, background: "#f5f5f5", fontWeight: "bold", textAlign: "left" };

  return (
    <div>
      <h2>Simple CRUD App — Students</h2>

      {/* CREATE */}
      <div style={{ background: "#f0f7ff", padding: "14px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 10px" }}>Add New Student</h3>
        <StudentForm submitLabel="Add Student" onSubmit={handleCreate} />
      </div>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #ccc", width: "100%", marginBottom: "12px", fontSize: "14px" }}
      />

      {/* Stats */}
      <p style={{ fontSize: "13px", color: "#888", margin: "0 0 8px" }}>
        Showing <strong>{filtered.length}</strong> of <strong>{state.students.length}</strong> students
      </p>

      {/* READ */}
      {filtered.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#aaa", border: "1px solid #eee", borderRadius: "8px" }}>
          {state.students.length === 0 ? "No students yet. Add one above!" : "No students match your search."}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Grade</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <>
                {/* VIEW row */}
                <tr key={student.id} style={{ background: editingId === student.id ? "#fffbe6" : "#fff" }}>
                  <td style={tdStyle}>{student.name}</td>
                  <td style={tdStyle}>{student.email}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                      background: student.grade.startsWith("A") ? "#d4edda" : student.grade.startsWith("B") ? "#fff3cd" : "#f8d7da",
                      color: student.grade.startsWith("A") ? "#155724" : student.grade.startsWith("B") ? "#856404" : "#721c24",
                    }}>
                      {student.grade}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => setEditingId(editingId === student.id ? null : student.id)}
                      style={{ marginRight: "8px", padding: "4px 10px", background: "#f0ad4e", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      {editingId === student.id ? "Cancel" : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      style={{ padding: "4px 10px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* EDIT inline row */}
                {editingId === student.id && (
                  <tr key={`edit-${student.id}`}>
                    <td colSpan={4} style={{ padding: "12px", background: "#fffbe6", borderBottom: "1px solid #eee" }}>
                      <StudentForm
                        initialValues={{ name: student.name, email: student.email, grade: student.grade }}
                        submitLabel="Save Changes"
                        onSubmit={(values) => handleUpdate(student.id, values)}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CRUDApp;
