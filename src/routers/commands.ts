import type { RouterConfig } from "@/routers/config";
import type { SshExecResult } from "@/routers/ssh";
import { sshExec } from "@/routers/ssh";

export type RouterActionId = "health" | "ips";

export interface RouterAction {
    id: RouterActionId;
    label: string;
    description: string;
    run: (router: RouterConfig) => Promise<string>;
}

function formatResult(title: string, body: string): string {
    return `<b>${title}</b>\n<pre>${body}</pre>`;
}

export const ROUTER_ACTIONS: readonly RouterAction[] = [
    {
        id: "health",
        label: "Health",
        description: "Resources query",
        run: async (router: RouterConfig): Promise<string> => {
            const cmd = "/system/resource/print";
            const r: SshExecResult = await sshExec(router, cmd, { timeoutMs: 10_000, maxOutputChars: 12_000 });
            const body: string = r.timedOut ? "Timed out" : [r.stdout, r.stderr].filter(Boolean).join("\n");
            return formatResult(`${router.label} - health`, body || "no output");
        },
    },
    {
        id: "ips",
        label: "IPs",
        description: "Interfaces addresses",
        run: async (router: RouterConfig): Promise<string> => {
            const cmd = "/ip/address/print";
            const r: SshExecResult = await sshExec(router, cmd, { timeoutMs: 10_000, maxOutputChars: 12_000 });
            const body: string = r.timedOut ? "Timed out" : [r.stdout, r.stderr].filter(Boolean).join("\n");
            return formatResult(`${router.label} - ips`, body || "no output");
        },
    },
];
