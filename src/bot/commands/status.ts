import type { MenuCommand } from "@/bot/menu";
import type { BotCtx } from "@/bot/types";
import { formatBytes, formatMs } from "@/format";

export interface StatusOptions {
    ownerId: number | null;
    startedAtMs: number;
}

export function statusCommand(opts: StatusOptions): MenuCommand {
    return {
        id: "status",
        label: "Status",
        description: "Show bot status",
        triggers: ["Status", "/status"],
        command: "status",
        async handler(ctx: BotCtx): Promise<void> {
            if (opts.ownerId !== null && ctx.from?.id !== opts.ownerId) {
                await ctx.reply("Forbidden");
                return;
            }
            const uptime: string = formatMs(Date.now() - opts.startedAtMs);
            const mem = process.memoryUsage();
            const lines: string[] = [
                `ok=<code>true</code>`,
                `pid=<code>${process.pid}</code>`,
                `node=<code>${process.version}</code>`,
                `platform=<code>${process.platform}-${process.arch}</code>`,
                `uptime=<code>${uptime}</code>`,
                `rss=<code>${formatBytes(mem.rss)}</code>`,
                `heapUsed=<code>${formatBytes(mem.heapUsed)}</code>`,
            ];
            await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
        },
    };
}
