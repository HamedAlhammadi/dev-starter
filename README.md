# FocusBoard

A small task planner that runs directly in your browser. Add tasks, mark them complete, filter the list, delete tasks, and switch themes. Tasks and theme preference are saved in your browser on this device.

## Run on Windows

No Java, Node.js, Python, or other runtime is required. You only need Windows PowerShell and a modern browser.

From the repository root in Windows Terminal (PowerShell), run:

```powershell
.\scripts\run.ps1
```

This opens the app in your default browser. You can also open `web/index.html` directly. Your tasks are saved in that browser's local storage; clearing browser data or switching browsers may remove or hide them.

## Run on macOS or Linux

From the repository root:

```bash
./scripts/run.sh
```

This opens the app in your default browser. If your desktop environment has no browser opener configured, open `web/index.html` manually.

## Features

- Create, complete, filter, and delete tasks
- Dark/light theme toggle with saved preference
- Responsive layout and accessible controls
- Browser-local persistence; no account or external service needed

## Project files

- `web/` — app interface and functionality (HTML, CSS, JavaScript)
- `scripts/run.ps1` — opens the app from Windows PowerShell
- `scripts/run.sh` — opens the app on macOS/Linux
- `src/main/java/` — optional Java server implementation, not needed to use the browser app

The optional Java server requires JDK 17 or newer. The browser app does not depend on it.
