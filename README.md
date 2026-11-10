# FocusBoard

A small, local-first task planner you can run in your browser. Add tasks, mark them complete, and remove them; your list is saved on your computer between runs.

## Requirements

- Java 17 or newer
- Bash (for the run script)
- A modern browser

No frameworks, package managers, or external dependencies required.

## Run it

From the repository root:

```bash
./scripts/run.sh
```

Then open <http://localhost:8080>. Press `Ctrl+C` in the terminal to stop the server. Tasks are stored in `data/tasks.txt`.

To use another port:

```bash
PORT=9090 ./scripts/run.sh
```

## What’s inside

- `src/main/java/dev/focusboard/FocusBoardServer.java` — Java HTTP server, API, and local persistence
- `web/` — plain HTML, CSS, and JavaScript interface
- `scripts/run.sh` — compiles and starts the app using the JDK

The API supports listing tasks (`GET /api/tasks`), adding one (`POST /api/tasks` with form field `title`), toggling completion (`PATCH /api/tasks/{id}`), and deleting (`DELETE /api/tasks/{id}`).

## Notes

The server binds to `127.0.0.1` so the app is only available on your own computer by default. Keep the terminal open while using it. To reset your list, stop the server and remove `data/tasks.txt`.
