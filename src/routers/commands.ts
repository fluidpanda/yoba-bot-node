import type { RouterConfig } from "@/routers/config";
import type { SshExecResult } from "@/routers/ssh";
import { sshExec } from "@/routers/ssh";

export interface RouterActionSpec {
    id: string;
    label: string;
    description: string;
    targets: string[];
    run: string[];
}

function formatResult(title: string, body: string): string {
    return `<b>${title}</b>\n<code>${body}</code>`;
}

export async function runRouterAction(router: RouterConfig, action: RouterActionSpec): Promise<string> {
    const chunks: string[] = [];
    for (const cmd of action.run) {
        const r: SshExecResult = await sshExec(router, cmd, { timeoutMs: 10_000, maxOutputChars: 12_000 });
        if (r.timedOut) {
            chunks.push(`${cmd}\nTimed out`);
        } else {
            chunks.push(`${cmd}\n${[r.stdout, r.stderr].filter(Boolean).join("\n") || "no output"}`);
        }
    }
    return formatResult(`${router.label} - ${action.label}`, chunks.join("\n"));
}
