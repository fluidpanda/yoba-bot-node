import type { MenuId } from "@/bot/menu/register";
import type { AppConfig } from "@/config";
import type { Logger } from "@/logging/logger";
import type { Context } from "telegraf";
import type { Update } from "telegraf/types";

export interface BotSession {
    menu?: MenuId;
}

export type BotCtx = Context<Update> & {
    session: BotSession;
    state: {
        config: AppConfig;
        logger?: Logger;
        replyWithMenu?: (text: string) => Promise<void>;
        updateId?: string;
    };
};
