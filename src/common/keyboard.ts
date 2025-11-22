import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { commandExists } from "./util";

const execFileAsync = promisify(execFile);

export interface VirtualKeyboard {
    /**
     * Type a string using the virtual keyboard.
     */
    type(text: string, keyDelay: number): Promise<void>;
}

export async function getVirtualKeyboard(): Promise<VirtualKeyboard> {
    if (await commandExists("ydotool")) {
        return new Ydotool();
    }

    if (await commandExists("wtype")) {
        return new Wtype();
    }

    throw new Error(
        "No virtual keyboard implementation found. Please install ydotool or wtype.",
    );
}

/**
 * Uses the `wtype` tool to send virtual keyboard input on Wayland using the
 * `zwp_virtual_keyboard_v1` protocol.
 *
 * This implementation is preferred on Wayland because it is fast, and does not
 * require any daemons or permissions. However, it only works on some Wayland
 * compositors. See the ones that support it here:
 * https://wayland.app/protocols/virtual-keyboard-unstable-v1#compositor-support
 */
class Wtype implements VirtualKeyboard {
    async type(text: string, keyDelay: number): Promise<void> {
        const args = ["-d", "50", "-s", "5000"];

        const tokens = text.split(/([\n\t])/);

        for (const token of tokens) {
            if (token === "\n") {
                args.push("-k");
                args.push("KP_Enter");
            } else if (token === "\t") {
                // args.push("-k");
                // args.push("Tab");
            } else if (token.length > 0) {
                args.push(token.toLowerCase());
            }

            args.push("-s");
            args.push("500");
        }

        console.log("wtype args:", args);

        await execFileAsync("wtype", args);
    }
}

/**
 * Uses the `ydotool` tool to send virtual keyboard input on X11 and Wayland.
 * This implementation works on basically all Linux desktop environments, but it
 * requires the `ydotoold` daemon to be configured and running, and usually
 * requires the current user to be in the `input` group.
 */
class Ydotool implements VirtualKeyboard {
    async type(text: string, keyDelay: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn(
                "ydotool",
                ["type", "--file=-", `--key-delay=${keyDelay}`],
                {
                    stdio: ["pipe", "pipe", "inherit"],
                },
            );

            child.stdin.write(text);
            child.stdin.end();

            child.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`ydotool exited with code ${code}`));
                }
            });
        });
    }
}
