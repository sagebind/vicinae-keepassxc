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
        let socketPath = process.env.YDOTOOL_SOCKET;

        // Mimic ydotool's logic for default socket location.
        if (!socketPath) {
            const socketDir = process.env.XDG_RUNTIME_DIR || "/tmp";
            socketPath = `${socketDir}/.ydotool_socket`;
        }

        return new YdotoolClient(socketPath);
    }

    if (await commandExists("wtype")) {
        return new Wtype();
    }

    throw new Error(
        "No virtual keyboard implementation found. Please install ydotool or wtype.",
    );
}
