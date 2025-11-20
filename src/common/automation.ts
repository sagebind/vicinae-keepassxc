import { spawn } from "node:child_process";

/**
 * Type a string using ydotool.
 */
export async function type(text: string, keyDelay: number): Promise<void> {
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
