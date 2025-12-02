import { setTimeout } from "node:timers/promises";
import { closeMainWindow } from "@vicinae/api";
import { getVirtualKeyboard } from "./keyboard";
import { type AutoTypeToken, parse } from "./parser";
import type { Entry } from "../keepassxc";

const defaultSequence = "{USERNAME}{TAB}{PASSWORD}{ENTER}";

export async function performAutoType(entry: Entry, keyDelay: number) {
    const sequence = entry.autoTypeSequence || defaultSequence;
    const tokens = await toArray(
        expandEntryPlaceholders(entry, parse(sequence)),
    );

    closeMainWindow();

    await setTimeout(1000);
    const keyboard = await getVirtualKeyboard();
    await keyboard.type(tokens, keyDelay);
}

export async function* expandEntryPlaceholders(
    entry: Entry,
    tokens: Generator<AutoTypeToken>,
): AsyncGenerator<AutoTypeToken> {
    for (const token of tokens) {
        switch (token.type) {
            case "username":
                yield { type: "text", value: entry.username || "" };
                break;

            case "password":
                yield { type: "text", value: entry.password || "" };
                break;

            case "totp":
                yield {
                    type: "text",
                    value: await entry.getTotpCode(),
                };
                break;

            case "attribute":
                yield { type: "text", value: entry.getString(token.key) || "" };
                break;

            default:
                yield token;
                break;
        }
    }
}

async function toArray<T>(asyncIterator: AsyncGenerator<T>): Promise<T[]> {
    const array = [];
    for await (const i of asyncIterator) {
        array.push(i);
    }
    return array;
}
