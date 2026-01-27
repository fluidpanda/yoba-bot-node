import type { BotApi, Plugin } from "@/bot/types";
import { formatBytes } from "@/format";
import { log } from "@/logging";
import { Logger } from "@/logging/logger";

const logger: Logger = log.with({ module: "cmd_status" });

export interface StatusOptions {
    ownerId: number | null;
    startedAtMs: number;
}

export function statusPlugin(opts: StatusOptions): Plugin {
    return (bot: BotApi): void => {
        bot.command("status", async (ctx): Promise<void> => {
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
            logger.info("Status requested", { fromId: ctx.from?.id });
            await ctx.reply(lines.join("\n"));
        });
    };
}
