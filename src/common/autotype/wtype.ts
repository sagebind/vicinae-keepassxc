import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { VirtualKeyboard } from "./keyboard";
import { AutoTypeToken } from "./parser";

const execFileAsync = promisify(execFile);

/**
 * Uses the `wtype` tool to send virtual keyboard input on Wayland using the
 * `zwp_virtual_keyboard_v1` protocol.
 *
 * This implementation is preferred on Wayland because it is fast, and does not
 * require any daemons or permissions. However, it only works on some Wayland
 * compositors. See the ones that support it here:
 * https://wayland.app/protocols/virtual-keyboard-unstable-v1#compositor-support
 */
export class Wtype implements VirtualKeyboard {
    async type(
        tokens: AutoTypeToken[],
        keyDelay: number,
    ): Promise<void> {
        const args = ["-d", "50", "-s", "5000"];

        for (const token of tokens) {
            if (token.type === "text") {
                if (token.value === "\n") {
                    args.push("-k");
                    args.push("KP_Enter");
                } else if (token.value === "\t") {
                    // args.push("-k");
                    // args.push("Tab");
                } else if (token.value.length > 0) {
                    args.push(token.value.toLowerCase());
                }

                args.push("-s");
                args.push("500");
            }
        }

        console.log("wtype args:", args);

        await execFileAsync("wtype", args);
    }
}
