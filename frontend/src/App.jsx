import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const initialTaskForm = {
  title: "",
  description: "",
  status: "todo",
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  };

  const fetchTasks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await apiFetch("/tasks");
      setTasks(response.data || []);
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const payload =
        authMode === "register"
          ? {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            }
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const response = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setToken(response.data.token);
      setUser(response.data.user);
      setAuthForm({ name: "", email: "", password: "" });
      showMessage("success", response.message || "Authentication successful");
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setTasks([]);
    setTaskForm(initialTaskForm);
    setEditingTaskId(null);
    showMessage("success", "Logged out");
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const path = editingTaskId ? `/tasks/${editingTaskId}` : "/tasks";
      const method = editingTaskId ? "PUT" : "POST";

      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(taskForm),
      });

      showMessage("success", response.message || "Task saved");
      setTaskForm(initialTaskForm);
      setEditingTaskId(null);
      await fetchTasks();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditTask = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
    });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      showMessage("success", response.message || "Task deleted");
      await fetchTasks();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <h1>Backend Assignment UI</h1>
        <p className="muted">API base: {API_BASE}</p>

        {message.text && (
          <div className={`message ${message.type === "error" ? "error" : "success"}`}>
            {message.text}
          </div>
        )}

        {!isAuthenticated ? (
          <>
            <div className="tabs">
              <button onClick={() => setAuthMode("login")} className={authMode === "login" ? "active" : ""}>
                Login
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={authMode === "register" ? "active" : ""}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="grid">
              {authMode === "register" && (
                <input
                  type="text"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : authMode === "register" ? "Register" : "Login"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="row">
              <div>
                <strong>{user?.name}</strong> <span className="muted">({user?.role})</span>
              </div>
              <button onClick={handleLogout}>Logout</button>
            </div>

            <h2>{editingTaskId ? "Edit Task" : "Create Task"}</h2>
            <form onSubmit={handleTaskSubmit} className="grid">
              <input
                type="text"
                placeholder="Task title"
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <textarea
                placeholder="Description"
                value={taskForm.description}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <select
                value={taskForm.status}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="todo">todo</option>
                <option value="in-progress">in-progress</option>
                <option value="done">done</option>
              </select>
              <div className="row">
                <button type="submit" disabled={loading}>
                  {editingTaskId ? "Update Task" : "Create Task"}
                </button>
                {editingTaskId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(null);
                      setTaskForm(initialTaskForm);
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <h2>Tasks</h2>
            {loading ? (
              <p>Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="muted">No tasks yet.</p>
            ) : (
              <ul className="tasks">
                {tasks.map((task) => (
                  <li key={task._id}>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                      <small>Status: {task.status}</small>
                    </div>
                    <div className="row">
                      <button onClick={() => startEditTask(task)}>Edit</button>
                      <button onClick={() => handleDeleteTask(task._id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
