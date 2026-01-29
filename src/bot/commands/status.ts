import type { MenuCommand } from "@/bot/menu";
import type { BotCtx } from "@/bot/types";
import { formatBytes } from "@/format";

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
            const uptimeSec: number = Math.floor((Date.now() - opts.startedAtMs) / 1000);
            const mem = process.memoryUsage();
            const lines: string[] = [
                `ok=true`,
                `pid=${process.pid}`,
                `node=${process.version}`,
                `platform=${process.platform}`,
                `uptime=${uptimeSec}`,
                `rss=${formatBytes(mem.rss)}`,
                `heapUsed=${formatBytes(mem.heapUsed)}`,
            ];
            ctx.state.logger?.info("Status requested", {
                fromId: ctx.from?.id,
            });
            await ctx.reply(lines.join("\n"));
        },
    };
}
