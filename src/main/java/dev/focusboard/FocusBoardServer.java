package dev.focusboard;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;

public final class FocusBoardServer {
    private static final List<Task> TASKS = new ArrayList<>();
    private static final AtomicLong NEXT_ID = new AtomicLong(1);
    private static Path dataFile;
    private static Path webDir;

    private record Task(long id, String title, boolean completed, String createdAt) {}

    public static void main(String[] args) throws Exception {
        int port = args.length == 0 ? 8080 : Integer.parseInt(args[0]);
        Path root = Path.of(System.getProperty("focusboard.root", ".")).toAbsolutePath();
        dataFile = root.resolve("data/tasks.txt");
        webDir = root.resolve("web");
        loadTasks();

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/api/tasks", FocusBoardServer::handleTasks);
        server.createContext("/", FocusBoardServer::handleWeb);
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        System.out.println("FocusBoard is running at http://127.0.0.1:" + port);
    }

    private static void handleTasks(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        try {
            if (path.equals("/api/tasks") && method.equals("GET")) {
                sendJson(exchange, 200, tasksJson());
            } else if (path.equals("/api/tasks") && method.equals("POST")) {
                Map<String, String> form = parseForm(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                String title = form.getOrDefault("title", "").strip();
                if (title.isEmpty()) {
                    sendJson(exchange, 400, "{\"error\":\"Task title cannot be empty.\"}");
                    return;
                }
                if (title.length() > 200) {
                    sendJson(exchange, 400, "{\"error\":\"Task title must be 200 characters or fewer.\"}");
                    return;
                }
                synchronized (TASKS) {
                    TASKS.add(new Task(NEXT_ID.getAndIncrement(), title, false, Instant.now().toString()));
                    saveTasks();
                    sendJson(exchange, 201, tasksJson());
                }
            } else if (path.matches("/api/tasks/[0-9]+") && method.equals("PATCH")) {
                long id = Long.parseLong(path.substring(path.lastIndexOf('/') + 1));
                synchronized (TASKS) {
                    boolean found = false;
                    for (int i = 0; i < TASKS.size(); i++) {
                        Task task = TASKS.get(i);
                        if (task.id() == id) {
                            TASKS.set(i, new Task(task.id(), task.title(), !task.completed(), task.createdAt()));
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        sendJson(exchange, 404, "{\"error\":\"Task not found.\"}");
                        return;
                    }
                    saveTasks();
                    sendJson(exchange, 200, tasksJson());
                }
            } else if (path.matches("/api/tasks/[0-9]+") && method.equals("DELETE")) {
                long id = Long.parseLong(path.substring(path.lastIndexOf('/') + 1));
                synchronized (TASKS) {
                    boolean removed = TASKS.removeIf(task -> task.id() == id);
                    if (!removed) {
                        sendJson(exchange, 404, "{\"error\":\"Task not found.\"}");
                        return;
                    }
                    saveTasks();
                    sendJson(exchange, 200, tasksJson());
                }
            } else {
                sendJson(exchange, 405, "{\"error\":\"Unsupported API request.\"}");
            }
        } catch (Exception exception) {
            exception.printStackTrace();
            sendJson(exchange, 500, "{\"error\":\"Something went wrong while handling the request.\"}");
        } finally {
            exchange.close();
        }
    }

    private static void handleWeb(HttpExchange exchange) throws IOException {
        try {
            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            String requestPath = exchange.getRequestURI().getPath();
            String filename = requestPath.equals("/") ? "index.html" : requestPath.substring(1);
            if (!List.of("index.html", "app.js", "style.css").contains(filename)) {
                exchange.sendResponseHeaders(404, -1);
                return;
            }
            Path file = webDir.resolve(filename);
            if (!Files.isRegularFile(file)) {
                exchange.sendResponseHeaders(404, -1);
                return;
            }
            String type = filename.endsWith(".css") ? "text/css; charset=utf-8" :
                    filename.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8";
            byte[] body = Files.readAllBytes(file);
            exchange.getResponseHeaders().set("Content-Type", type);
            exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
        } finally {
            exchange.close();
        }
    }

    private static Map<String, String> parseForm(String body) {
        java.util.HashMap<String, String> values = new java.util.HashMap<>();
        for (String pair : body.split("&")) {
            int separator = pair.indexOf('=');
            if (separator >= 0) {
                values.put(URLDecoder.decode(pair.substring(0, separator), StandardCharsets.UTF_8),
                        URLDecoder.decode(pair.substring(separator + 1), StandardCharsets.UTF_8));
            }
        }
        return values;
    }

    private static String tasksJson() {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < TASKS.size(); i++) {
            Task task = TASKS.get(i);
            if (i > 0) json.append(',');
            json.append("{\"id\":").append(task.id())
                    .append(",\"title\":\"").append(escapeJson(task.title()))
                    .append("\",\"completed\":").append(task.completed())
                    .append(",\"createdAt\":\"").append(escapeJson(task.createdAt())).append("\"}");
        }
        return json.append(']').toString();
    }

    private static String escapeJson(String value) {
        StringBuilder escaped = new StringBuilder();
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> escaped.append("\\\"");
                case '\\' -> escaped.append("\\\\");
                case '\b' -> escaped.append("\\b");
                case '\f' -> escaped.append("\\f");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (c < 0x20) escaped.append(String.format("\\u%04x", (int) c));
                    else escaped.append(c);
                }
            }
        }
        return escaped.toString();
    }

    private static void loadTasks() throws IOException {
        if (!Files.exists(dataFile)) return;
        long maxId = 0;
        for (String line : Files.readAllLines(dataFile, StandardCharsets.UTF_8)) {
            String[] fields = line.split("\\t", 4);
            if (fields.length != 4) continue;
            try {
                String title = new String(Base64.getUrlDecoder().decode(fields[3]), StandardCharsets.UTF_8);
                Task task = new Task(Long.parseLong(fields[0]), title, Boolean.parseBoolean(fields[1]), fields[2]);
                TASKS.add(task);
                maxId = Math.max(maxId, task.id());
            } catch (IllegalArgumentException ignored) {
                // Ignore malformed rows and keep loading the rest of the task list.
            }
        }
        NEXT_ID.set(maxId + 1);
    }

    private static void saveTasks() throws IOException {
        Files.createDirectories(dataFile.getParent());
        List<String> rows = new ArrayList<>();
        for (Task task : TASKS) {
            String encodedTitle = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(task.title().getBytes(StandardCharsets.UTF_8));
            rows.add(task.id() + "\t" + task.completed() + "\t" + task.createdAt() + "\t" + encodedTitle);
        }
        Files.write(dataFile, rows, StandardCharsets.UTF_8);
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
    }
}
