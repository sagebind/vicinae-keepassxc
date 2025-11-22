import { setTimeout } from "node:timers/promises";
import { closeMainWindow } from "@vicinae/api";
import { getVirtualKeyboard } from "./keyboard";
import { Entry } from "./keepassxc";

const defaultSequence = "{USERNAME}{TAB}{PASSWORD}{ENTER}";

export async function performAutoType(entry: Entry, keyDelay: number) {
    const autoTypeString = generateAutoTypeString(entry);

    closeMainWindow();

    await setTimeout(1000);
    const keyboard = await getVirtualKeyboard();
    await keyboard.type(autoTypeString, keyDelay);
}

function generateAutoTypeString(entry: Entry): string {
    const sequence = entry.autoType.sequence || defaultSequence;

    return sequence
        .replace(/{USERNAME}/g, entry.username || "")
        .replace(/{PASSWORD}/g, entry.password)
        .replace(/{TAB}/g, "\t")
        .replace(/{ENTER}/g, "\n")
        .replace(/{SPACE}/g, " ")
        .replace(/{LEFTBRACE}/g, "{")
        .replace(/{RIGHTBRACE}/g, "}");
}
