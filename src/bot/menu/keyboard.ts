import { Markup } from "telegraf";
import type { MenuCommand } from "@/bot/menu";

export function buildMainMenuKeyboard(commands: readonly MenuCommand[], columns: number) {
    const rows: string[][] = [];
    for (let index = 0; index < commands.length; index += columns) {
        rows.push(commands.slice(index, index + columns).map((c: MenuCommand): string => c.label));
    }
    return Markup.keyboard(rows).resize(true).oneTime(false);
}

export function withMainMenu(commands: readonly MenuCommand[], columns: number) {
    return buildMainMenuKeyboard(commands, columns);
}
