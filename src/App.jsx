import { CheckCircle2, ClipboardList, FolderKanban, Loader2, LogOut, Moon, Plus, Sun, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api.js';

const emptyAuth = { name: '', email: '', password: '' };
const emptyProject = { name: '', description: '' };
const emptyTask = { title: '', description: '', status: 'todo', priority: 'medium', project: '' };

const statusLabels = {
  todo: 'To do',
  'in-progress': 'In progress',
  review: 'Review',
  done: 'Done'
};

export function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const token = localStorage.getItem('projectm_token');

  useEffect(() => {
    if (!token) return;
    apiRequest('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('projectm_token'));
  }, [token]);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  useEffect(() => {
    if (!taskForm.project && projects.length > 0) {
      setTaskForm((current) => ({ ...current, project: projects[0]._id }));
    }
  }, [projects, taskForm.project]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'done').length;
    const active = tasks.filter((task) => task.status !== 'done').length;
    return { total, done, active };
  }, [tasks]);

  const visibleTasks = selectedProject ? tasks.filter((task) => task.project?._id === selectedProject || task.project === selectedProject) : tasks;

  const loadDashboard = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [projectData, taskData] = await Promise.all([apiRequest('/projects'), apiRequest('/tasks')]);
      setProjects(projectData);
      setTasks(taskData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      const data = await apiRequest(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      localStorage.setItem('projectm_token', data.token);
      setUser(data.user);
      setAuthForm(emptyAuth);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProject = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/projects', { method: 'POST', body: JSON.stringify(projectForm) });
      setProjectForm(emptyProject);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const handleTask = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/tasks', { method: 'POST', body: JSON.stringify(taskForm) });
      setTaskForm((current) => ({ ...emptyTask, project: current.project }));
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(`/tasks/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('projectm_token');
    setUser(null);
    setProjects([]);
    setTasks([]);
  };

  if (!user) {
    return (
      <main className={darkMode ? 'app dark auth-shell' : 'app auth-shell'}>
        <section className="auth-panel">
          <div>
            <p className="eyebrow">Team Project Management</p>
            <h1>Project Management</h1>
            <p className="lede">Plan projects, track task status, and keep team work visible from one focused dashboard.</p>
          </div>

          <form className="form" onSubmit={handleAuth}>
            <div className="segmented">
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
                Login
              </button>
              <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
                Register
              </button>
            </div>
            {authMode === 'register' && (
              <label>
                Name
                <input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" minLength="6" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required />
            </label>
            {message && <p className="alert">{message}</p>}
            <button className="primary" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
              {authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={darkMode ? 'app dark' : 'app'}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Project Management</h1>
        </div>
        <div className="top-actions">
          <button className="icon-button" title="Toggle dark mode" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="secondary" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <section className="summary">
        <div>
          <span>Total tasks</span>
          <strong>{metrics.total}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{metrics.active}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{metrics.done}</strong>
        </div>
      </section>

      {message && <p className="alert wide">{message}</p>}

      <section className="workspace">
        <aside className="sidebar">
          <div className="panel-heading">
            <FolderKanban size={20} />
            <h2>Projects</h2>
          </div>
          <form className="form compact" onSubmit={handleProject}>
            <label>
              Name
              <input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} required />
            </label>
            <label>
              Description
              <textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} />
            </label>
            <button className="primary" disabled={loading}>
              <Plus size={18} />
              Add project
            </button>
          </form>

          <div className="project-list">
            <button className={selectedProject === '' ? 'project-row active' : 'project-row'} onClick={() => setSelectedProject('')}>
              All projects
            </button>
            {projects.map((project) => (
              <button key={project._id} className={selectedProject === project._id ? 'project-row active' : 'project-row'} onClick={() => setSelectedProject(project._id)}>
                {project.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="board-area">
          <div className="panel-heading">
            <ClipboardList size={20} />
            <h2>Tasks</h2>
          </div>

          <form className="task-form" onSubmit={handleTask}>
            <input placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required />
            <select value={taskForm.project} onChange={(event) => setTaskForm({ ...taskForm, project: event.target.value })} required>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="primary" disabled={loading || projects.length === 0}>
              <Plus size={18} />
              Add task
            </button>
          </form>

          <div className="kanban">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div className="column" key={status}>
                <h3>{label}</h3>
                {visibleTasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <article className="task-card" key={task._id}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.project?.name || 'Project'}</span>
                      </div>
                      <p>{task.description || 'No description'}</p>
                      <div className="task-footer">
                        <span className={`priority ${task.priority}`}>{task.priority}</span>
                        <select value={task.status} onChange={(event) => updateTaskStatus(task, event.target.value)}>
                          {Object.entries(statusLabels).map(([value, text]) => (
                            <option key={value} value={value}>
                              {text}
                            </option>
                          ))}
                        </select>
                        <button className="icon-button danger" title="Delete task" onClick={() => deleteTask(task._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
