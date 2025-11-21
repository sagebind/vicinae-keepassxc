import { setTimeout } from "node:timers/promises";
import { closeMainWindow, showToast } from "@vicinae/api";
import { type } from "./automation";
import type { Database } from "./keepassxc";

export async function performAutoType(
    database: Database,
    entryName: string,
    keyDelay: number,
) {
    const entry = await database.getEntryByPath(entryName);

    if (!entry) {
        return showToast({
            title: "Entry not found",
            message: `Could not find entry "${entryName}" in the database.`,
        });
    }

    const autoTypeString = generateAutoTypeString(entry);

    closeMainWindow();

    await setTimeout(1000);
    await type(autoTypeString, keyDelay);
}

function generateAutoTypeString(entry: Record<string, string>): string {
    // If a custom attribute is set to override our auto-type sequence, use it.
    if (entry.VicinaeAutoTypeSequence) {
        return entry.VicinaeAutoTypeSequence.replace(/{TAB}/g, "\t")
            .replace(/{ENTER}/g, "\n")
            .replace(/{SPACE}/g, " ")
            .replace(/{LEFTBRACE}/g, "{")
            .replace(/{RIGHTBRACE}/g, "}");
    }

    return `${entry.UserName}\t${entry.Password}\n`;
}
