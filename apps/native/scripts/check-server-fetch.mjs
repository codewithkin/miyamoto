#!/usr/bin/env node
/**
 * Fails when a request to the server could leave without the session (D-047).
 *
 * On native the session is a cookie the app attaches by hand, and it's
 * attached in exactly one place: lib/server-fetch.ts. A request built any
 * other way reaches the server signed out. That's how the chat's first
 * message came back 401 while every other screen worked. Two shapes get
 * caught:
 *
 *   - a bare `fetch(` anywhere but lib/server-fetch.ts;
 *   - a `DefaultChatTransport` not handed our fetch. Given none, the AI SDK
 *     falls back to the global fetch, which is the bug itself.
 *
 * Runs as part of `pnpm check-types`. Usage: node scripts/check-server-fetch.mjs [root]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ?? join(fileURLToPath(import.meta.url), "..", "..");
const DIRS = ["app", "components", "contexts", "content", "lib", "utils", "theme"];
const ALLOWED = "lib/server-fetch.ts";

function* sources(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sources(path);
    else if (/\.(tsx?|jsx?|mjs)$/.test(name)) yield path;
  }
}

/** A call's argument list, from its opening paren to the one that closes it. */
function argumentsOf(body, open) {
  let depth = 0;
  for (let i = open; i < body.length; i++) {
    if (body[i] === "(") depth++;
    else if (body[i] === ")" && --depth === 0) return body.slice(open, i + 1);
  }
  return body.slice(open);
}

/**
 * Just the code: comments and string contents are blanked to spaces, so
 * prose or a URL that mentions fetch( doesn't count. Newlines are kept, so
 * line numbers still match the file.
 */
function code(text) {
  let out = "";
  let mode = null; // null | "line" | "block" | '"' | "'" | "`"
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    const blank = c === "\n" ? "\n" : " ";
    if (mode === null) {
      if (c === "/" && next === "/") mode = "line";
      else if (c === "/" && next === "*") mode = "block";
      else if (c === '"' || c === "'" || c === "`") {
        mode = c;
        out += c;
        continue;
      }
      out += mode === null ? c : " ";
    } else if (mode === "line") {
      if (c === "\n") mode = null;
      out += blank;
    } else if (mode === "block") {
      if (c === "*" && next === "/") {
        out += "  ";
        i++;
        mode = null;
      } else out += blank;
    } else {
      if (c === "\\") {
        out += " " + (next === "\n" ? "\n" : " ");
        i++;
      } else if (c === mode) {
        mode = null;
        out += c;
      } else out += blank;
    }
  }
  return out;
}

const problems = [];

for (const dir of DIRS) {
  for (const file of sources(join(root, dir))) {
    const rel = relative(root, file).split(sep).join("/");
    const body = code(readFileSync(file, "utf8"));
    const lineOf = (index) => body.slice(0, index).split("\n").length;

    if (rel !== ALLOWED) {
      for (const m of body.matchAll(/(?<![\w.$])fetch\s*\(/g)) {
        problems.push(`${rel}:${lineOf(m.index)}  bare fetch(). Use serverFetch from @/lib/server-fetch.`);
      }
    }

    for (const m of body.matchAll(/new\s+DefaultChatTransport\s*\(/g)) {
      const call = argumentsOf(body, m.index + m[0].length - 1);
      if (!/\bfetch\s*:\s*(streamingServerFetch|serverFetch)\b/.test(call)) {
        problems.push(
          `${rel}:${lineOf(m.index)}  DefaultChatTransport without fetch: streamingServerFetch.`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error("Requests that would reach the server without the session (D-047):\n");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("check-server-fetch: every request carries the session.");
