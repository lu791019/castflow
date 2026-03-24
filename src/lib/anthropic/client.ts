import { execFile } from "child_process";

const CLAUDE_CLI = process.env.CLAUDE_CLI || "claude";

/**
 * 呼叫 claude --print，走 Pro/Max 額度不花 API
 * 參考 social-scraper 的 run_claude_print 模式
 */
export async function runClaudePrint(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      CLAUDE_CLI,
      ["--print"],
      { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`claude --print 失敗: ${stderr || error.message}`));
          return;
        }
        resolve(stdout.trim());
      },
    );

    // 透過 stdin 傳入 prompt
    if (child.stdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }
  });
}
