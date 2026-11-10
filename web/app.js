const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const status = document.querySelector("#status");
const filters = [...document.querySelectorAll(".filter")];
const themeToggle = document.querySelector("#theme-toggle");
const TASKS_KEY = "focusboard-tasks";
const THEME_KEY = "focusboard-theme";

let tasks = [];
let activeFilter = "all";

try {
  const storedTasks = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
  if (Array.isArray(storedTasks)) tasks = storedTasks;
} catch { /* Start with an empty list if stored data is unavailable or invalid. */ }

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    announce("Could not save tasks in this browser. Check its storage settings.");
  }
}

function setTheme(theme) {
  const isLight = theme === "light";
  document.documentElement.dataset.theme = isLight ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} theme`);
  themeToggle.title = `Switch to ${isLight ? "dark" : "light"} theme`;
  themeToggle.querySelector(".theme-label").textContent = isLight ? "Dark" : "Light";
  themeToggle.querySelector("[aria-hidden]").textContent = isLight ? "☾" : "☀";
  document.querySelector('meta[name="theme-color"]').content = isLight ? "#f4f6f1" : "#10131c";
  try { localStorage.setItem(THEME_KEY, isLight ? "light" : "dark"); } catch { /* Theme still works for this page view. */ }
}

let savedTheme = "dark";
try { savedTheme = localStorage.getItem(THEME_KEY) || "dark"; } catch { /* Use the default theme. */ }
setTheme(savedTheme);
themeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

function announce(message) {
  status.textContent = message;
}

function render() {
  const visible = tasks.filter((task) => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });
  const remaining = tasks.filter((task) => !task.completed).length;
  count.textContent = String(remaining);
  list.replaceChildren();
  emptyState.hidden = visible.length > 0;

  if (tasks.length === 0) {
    document.querySelector("#empty-title").textContent = "A fresh start.";
    document.querySelector("#empty-copy").textContent = "Add a task above and make today count.";
  } else if (visible.length === 0) {
    document.querySelector("#empty-title").textContent = "Nothing here yet.";
    document.querySelector("#empty-copy").textContent = "Try another filter or add a new task.";
  }

  for (const task of visible) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const toggle = document.createElement("button");
    toggle.className = "checkbox";
    toggle.type = "button";
    toggle.setAttribute("aria-label", task.completed ? `Mark ${task.title} as to do` : `Complete ${task.title}`);
    toggle.setAttribute("aria-pressed", String(task.completed));
    toggle.textContent = task.completed ? "✓" : "";
    toggle.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      render();
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
      announce("Task deleted.");
    });

    item.append(toggle, title, remove);
    list.append(item);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;

  tasks.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  saveTasks();
  input.value = "";
  activeFilter = "all";
  filters.forEach((filter) => {
    const selected = filter.dataset.filter === activeFilter;
    filter.classList.toggle("active", selected);
    filter.setAttribute("aria-pressed", String(selected));
  });
  render();
  announce("Task added.");
  input.focus();
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    activeFilter = filter.dataset.filter;
    filters.forEach((button) => {
      const selected = button === filter;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

render();
