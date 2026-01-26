import type { Composer, Context } from "telegraf";
import type { Update } from "telegraf/types";

export type BotCtx = Context<Update>;
export type BotApi = Composer<BotCtx>;
export type Plugin = (bot: BotApi) => void;
