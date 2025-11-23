import { Buffer } from "node:buffer";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import type { VirtualKeyboard } from "./keyboard";
import { AutoTypeToken } from "./parser";

// Map of characters to Linux key codes. See
// /usr/include/linux/input-event-codes.h
const charMap: Record<string, number> = {
    "1": 2,
    "2": 3,
    "3": 4,
    "4": 5,
    "5": 6,
    "6": 7,
    "7": 8,
    "8": 9,
    "9": 10,
    "0": 11,
    "-": 12,
    "=": 13,
    "\t": 15,
    q: 16,
    w: 17,
    e: 18,
    r: 19,
    t: 20,
    y: 21,
    u: 22,
    i: 23,
    o: 24,
    p: 25,
    "[": 26,
    "]": 27,
    "\n": 28,
    a: 30,
    s: 31,
    d: 32,
    f: 33,
    g: 34,
    h: 35,
    j: 36,
    k: 37,
    l: 38,
    ";": 39,
    "'": 40,
    "`": 41,
    "\\": 43,
    z: 44,
    x: 45,
    c: 46,
    v: 47,
    b: 48,
    n: 49,
    m: 50,
    ",": 51,
    ".": 52,
    "/": 53,
    " ": 57,
};

const shiftTable: Record<string, string> = {
    "~": "`",
    "!": "1",
    "@": "2",
    "#": "3",
    $: "4",
    "%": "5",
    "^": "6",
    "&": "7",
    "*": "8",
    "(": "9",
    ")": "0",
    _: "-",
    "+": "=",
    Q: "q",
    W: "w",
    E: "e",
    R: "r",
    T: "t",
    Y: "y",
    U: "u",
    I: "i",
    O: "o",
    P: "p",
    "{": "[",
    "}": "]",
    A: "a",
    S: "s",
    D: "d",
    F: "f",
    G: "g",
    H: "h",
    J: "j",
    K: "k",
    L: "l",
    ":": ";",
    '"': "'",
    "|": "\\",
    Z: "z",
    X: "x",
    C: "c",
    V: "v",
    B: "b",
    N: "n",
    M: "m",
    "<": ",",
    ">": ".",
    "?": "/",
};

/**
 * Talks to a persistent `ydotoold` daemon directly using its socket to send
 * virtual keyboard input on X11 and Wayland. This implementation works on
 * basically all Linux desktop environments, but it requires the `ydotoold`
 * daemon to be configured and running, and usually requires the current user to
 * be in the `input` group.
 */
export class YdotoolClient implements VirtualKeyboard {
    #netcatProcess: ChildProcessWithoutNullStreams;
    #eventBuffer = Buffer.alloc(24); // sizeof(input_event)

    constructor(path: string) {
        // Unfortunately, node does not support UNIX datagram sockets, but we can
        // use a netcat pipe to achieve the same result.
        this.#netcatProcess = spawn("nc", ["-u", "--send-only", "-U", path]);
    }

    async type(
        tokens: AutoTypeToken[],
        keyDelay: number,
    ): Promise<void> {
        for (const token of tokens) {
            if (token.type === "text") {
                for (const char of token.value) {
                    const code = charMap[char];

                    if (code) {
                        await setTimeout(keyDelay);
                        await this.sendKeyEvent(code, true);
                        await setTimeout(keyDelay);
                        await this.sendKeyEvent(code, false);
                    } else {
                        const baseChar = shiftTable[char];

                        if (baseChar) {
                            const code = charMap[baseChar];

                            if (code) {
                                await setTimeout(keyDelay);
                                await this.sendKeyEvent(42, true);
                                await setTimeout(keyDelay);
                                await this.sendKeyEvent(code, true);
                                await setTimeout(keyDelay);
                                await this.sendKeyEvent(code, false);
                                await setTimeout(keyDelay);
                                await this.sendKeyEvent(42, false);
                            }
                        }
                    }
                }
            }
        }
    }

    close() {
        this.#netcatProcess.stdin.end(() => {
            this.#netcatProcess.kill();
            this.#netcatProcess.unref();
        });
    }

    private async sendKeyEvent(code: number, pressed: boolean): Promise<void> {
        await this.sendEvent(1, code, pressed ? 1 : 0);
        await setTimeout(12);
        await this.sendEvent(0, 0, 0); // SYN_REPORT
    }

    private async sendEvent(
        type: number,
        code: number,
        value: number,
    ): Promise<void> {
        // Prepare input_event struct
        this.#eventBuffer.fill(0);
        this.#eventBuffer.writeInt16LE(type, 16);
        this.#eventBuffer.writeInt16LE(code, 18);
        this.#eventBuffer.writeInt32LE(value, 20);

        // Write to netcat stdin to forward to ydotoold.
        return new Promise((resolve, reject) => {
            this.#netcatProcess.stdin.write(this.#eventBuffer, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
