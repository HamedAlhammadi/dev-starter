const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const status = document.querySelector("#status");
const filters = [...document.querySelectorAll(".filter")];

let tasks = [];
let activeFilter = "all";

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

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
    toggle.addEventListener("click", () => changeTask(task.id));

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => deleteTask(task.id));

    item.append(toggle, title, remove);
    list.append(item);
  }
}

async function loadTasks() {
  try {
    tasks = await request("/api/tasks");
    render();
  } catch (error) {
    announce(`${error.message} Is the FocusBoard server still running?`);
  }
}

async function changeTask(id) {
  try {
    tasks = await request(`/api/tasks/${id}`, { method: "PATCH" });
    render();
  } catch (error) {
    announce(error.message);
  }
}

async function deleteTask(id) {
  try {
    tasks = await request(`/api/tasks/${id}`, { method: "DELETE" });
    render();
    announce("Task deleted.");
  } catch (error) {
    announce(error.message);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    tasks = await request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ title }),
    });
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
  } catch (error) {
    announce(error.message);
  } finally {
    button.disabled = false;
  }
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

loadTasks();
