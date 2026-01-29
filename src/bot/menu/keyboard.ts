import { Markup } from "telegraf";
import type { MenuCommand } from "@/bot/menu/index";

export function buildMainMenuKeyboard(commands: readonly MenuCommand[]) {
    const rows: string[][] = [];
    for (let index = 0; index < commands.length; index += 2) {
        rows.push(commands.slice(index, index + 2).map((c: MenuCommand): string => c.label));
    }
    return Markup.keyboard(rows).resize(true).oneTime(false);
}

export function withMainMenu(commands: readonly MenuCommand[]) {
    return buildMainMenuKeyboard(commands);
}
