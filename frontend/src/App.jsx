import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const initialTaskForm = {
  title: "",
  description: "",
  status: "todo",
};

const statusOptions = ["all", "todo", "in-progress", "done"];

const humanizeStatus = (status) => {
  if (status === "in-progress") return "In Progress";
  if (status === "todo") return "To Do";
  if (status === "done") return "Done";
  return status;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const [taskFilter, setTaskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("board");

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((item) => item.status === "todo").length;
    const inProgress = tasks.filter((item) => item.status === "in-progress").length;
    const done = tasks.filter((item) => item.status === "done").length;
    return { total, todo, inProgress, done };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = taskFilter === "all" || task.status === taskFilter;
      const matchesSearch =
        !searchTerm ||
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, taskFilter, searchTerm]);

  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce(
      (acc, task) => {
        acc[task.status]?.push(task);
        return acc;
      },
      { todo: [], "in-progress": [], done: [] }
    );
  }, [filteredTasks]);

  const completionRate = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  }, [stats]);

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

  const resetFormState = () => {
    setEditingTaskId(null);
    setTaskForm(initialTaskForm);
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
      resetFormState();
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
      <header className="topbar">
        <div className="brand-block">
          <h1>Taskboard</h1>
          
        </div>
        <p className="api-pill">API: {API_BASE}</p>
      </header>

      {message.text && (
        <div className={`message ${message.type === "error" ? "error" : "success"}`}>
          {message.text}
        </div>
      )}

      {!isAuthenticated ? (
        <section className="auth-layout">


          <article className="auth-form panel">
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

            <form onSubmit={handleAuthSubmit} className="grid compact">
              {authMode === "register" && (
                <label>
                  Full Name
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={authForm.name}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>
              )}
              <label>
                Email
                <input
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                  value={authForm.password}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Please wait..." : authMode === "register" ? "Create Account" : "Sign In"}
              </button>
            </form>
          </article>
        </section>
      ) : (
        <section className="dashboard">
          <article className="panel user-summary">
            <div>
              <p className="eyebrow">Signed in as</p>
              <h2>{user?.name}</h2>
              <p className="muted">{user?.email}</p>
              <span className="role-pill">{user?.role}</span>
            </div>
            <div className="summary-actions">
              <button className="btn btn-ghost" onClick={fetchTasks}>
                Sync
              </button>
              <button className="btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </article>

          <article className="stats-grid">
            <div className="stat-card">
              <p>Total Tasks</p>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-card">
              <p>To Do</p>
              <strong>{stats.todo}</strong>
            </div>
            <div className="stat-card">
              <p>In Progress</p>
              <strong>{stats.inProgress}</strong>
            </div>
            <div className="stat-card">
              <p>Done</p>
              <strong>{stats.done}</strong>
            </div>
            <div className="stat-card progress-card">
              <p>Completion</p>
              <strong>{completionRate}%</strong>
              <div className="progress-bar">
                <span style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </article>

          <div className="workspace-grid">
            <article className="panel create-panel">
              <div className="section-head">
                <h3>{editingTaskId ? "Edit Task" : "Create Task"}</h3>
                {editingTaskId && (
                  <button className="btn btn-ghost" onClick={resetFormState} type="button">
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleTaskSubmit} className="grid compact">
                <label>
                  Title
                  <input
                    type="text"
                    placeholder="Ship assignment demo"
                    value={taskForm.title}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="5"
                    placeholder="Add details about the task"
                    value={taskForm.description}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={taskForm.status}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {editingTaskId ? "Update Task" : "Create Task"}
                </button>
              </form>
            </article>

            <article className="panel">
              <div className="section-head stacked-on-mobile">
                <h3>Task List</h3>
                <div className="list-controls">
                  <input
                    type="text"
                    placeholder="Search title or description"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)}>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "All Status" : humanizeStatus(option)}
                      </option>
                    ))}
                  </select>
                  <div className="view-toggle">
                    <button
                      type="button"
                      className={viewMode === "board" ? "active" : ""}
                      onClick={() => setViewMode("board")}
                    >
                      Board
                    </button>
                    <button
                      type="button"
                      className={viewMode === "list" ? "active" : ""}
                      onClick={() => setViewMode("list")}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <p className="muted">Loading tasks...</p>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <h4>No tasks found</h4>
                  <p className="muted">Create a task or adjust your search/filter criteria.</p>
                </div>
              ) : viewMode === "list" ? (
                <ul className="tasks">
                  {filteredTasks.map((task) => (
                    <li key={task._id} className="task-card">
                      <div className="task-content">
                        <div className="task-top-row">
                          <strong>{task.title}</strong>
                          <span className={`status-badge status-${task.status}`}>{humanizeStatus(task.status)}</span>
                        </div>
                        <p>{task.description || "No description provided."}</p>
                        <small className="muted">Updated {formatDate(task.updatedAt || task.createdAt)}</small>
                      </div>
                      <div className="action-row">
                        <button className="btn btn-ghost" onClick={() => startEditTask(task)}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteTask(task._id)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="board">
                  {Object.entries(groupedTasks).map(([status, items]) => (
                    <div key={status} className="board-column">
                      <div className="board-head">
                        <h4>{humanizeStatus(status)}</h4>
                        <span>{items.length}</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="muted">No tasks</p>
                      ) : (
                        items.map((task) => (
                          <div key={task._id} className="board-card">
                            <div className="task-top-row">
                              <strong>{task.title}</strong>
                              <span className={`status-badge status-${task.status}`}>
                                {humanizeStatus(task.status)}
                              </span>
                            </div>
                            <p>{task.description || "No description provided."}</p>
                            <small className="muted">Updated {formatDate(task.updatedAt || task.createdAt)}</small>
                            <div className="action-row">
                              <button className="btn btn-ghost" onClick={() => startEditTask(task)}>
                                Edit
                              </button>
                              <button className="btn btn-danger" onClick={() => handleDeleteTask(task._id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
