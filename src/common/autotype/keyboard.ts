import { commandExists } from "../util";
import type { AutoTypeToken } from "./parser";
import { Wtype } from "./wtype";
import { YdotoolClient } from "./ydotool";

export interface VirtualKeyboard {
    /**
     * Type a string using the virtual keyboard.
     */
    type(tokens: AutoTypeToken[], keyDelay: number): Promise<void>;
}

export async function getVirtualKeyboard(): Promise<VirtualKeyboard> {
    if (await commandExists("nc")) {
        return new YdotoolClient(
            "/run/user/1000/.ydotool_socket",
        );
    }

    if (await commandExists("wtype")) {
        return new Wtype();
    }

    throw new Error(
        "No virtual keyboard implementation found. Please install ydotool or wtype.",
    );
}
