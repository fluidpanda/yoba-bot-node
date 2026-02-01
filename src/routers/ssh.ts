import * as fs from "node:fs";
import { clearTimeout } from "node:timers";
import { Client } from "ssh2";
import type { RouterConfig } from "@/routers/config";
import type { ClientChannel } from "ssh2";
import { truncateText } from "@/logging/utils";

export interface SshExecResult {
    code: number;
    stdout: string | undefined;
    stderr: string | undefined;
    timedOut: boolean;
}

export interface SshExecOptions {
    timeoutMs?: number;
    maxOutputChars?: number;
}

export async function sshExec(router: RouterConfig, command: string, opts?: SshExecOptions): Promise<SshExecResult> {
    const timeoutMs: number = opts?.timeoutMs ?? 10_000;
    const maxOutputChars: number = opts?.maxOutputChars ?? 20_000;
    return await new Promise((resolve, reject): void => {
        const conn = new Client();
        let stdout: string = "";
        let stderr: string = "";
        let timedOut: boolean = false;
        let settled: boolean = false;
        const timeout = setTimeout((): void => {
            timedOut = true;
            conn.end();
        }, timeoutMs);
        function finish(code: number): void {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve({
                code,
                stdout: truncateText(stdout, maxOutputChars),
                stderr: truncateText(stderr, maxOutputChars),
                timedOut,
            });
        }
        conn.on("ready", (): void => {
            conn.exec(command, (err: Error | undefined, stream: ClientChannel): void => {
                if (err) {
                    clearTimeout(timeout);
                    conn.end();
                    reject(err);
                    return;
                }
                stream.on("data", (chunk: Buffer): void => {
                    stdout += chunk.toString("utf8");
                });
                stream.stderr.on("data", (chunk: Buffer): void => {
                    stderr += chunk.toString("utf8");
                });
                stream.on("close", (code: number | null): void => {
                    conn.end();
                    finish(code ?? 0);
                });
            });
        });
        conn.on("error", (err: Error): void => {
            if (settled) return;
            clearTimeout(timeout);
            settled = true;
            reject(err);
        });
        conn.connect({
            host: router.host,
            port: router.port,
            username: router.username,
            privateKey: fs.readFileSync(router.privateKeyPath, "utf8"),
        });
    });
}
