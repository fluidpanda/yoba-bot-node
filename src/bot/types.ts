import type { MenuId } from "@/bot/menu/register";
import type { Logger } from "@/logging/logger";
import type { Composer, Context } from "telegraf";
import type { Update } from "telegraf/types";

export interface BotSession {
    menu?: MenuId;
}

export type BotCtx = Context<Update> & {
    session: BotSession;
    state: {
        logger?: Logger;
        updateId?: string;
        replyWithMenu?: (text: string) => Promise<void>;
    };
};
export type BotApi = Composer<BotCtx>;
