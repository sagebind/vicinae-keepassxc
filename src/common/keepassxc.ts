import { spawn } from "node:child_process";

type Entry = Record<string, string>;

export type DatabaseConfig = {
    path: string;
    password: string;
};

const cliCommand = "flatpak";
const cliArgs = ["run", "--command=keepassxc-cli", "org.keepassxc.KeePassXC"];

export class Database {
    #path: string;
    #password: string;

    constructor(path: string, password: string) {
        this.#path = path;
        this.#password = password;
    }

    async getEntryNames(includeTrash: boolean = false): Promise<string[]> {
        const output = await new Promise((resolve, reject) => {
            const child = spawn(
                cliCommand,
                [...cliArgs, "ls", "--quiet", "--recursive", this.#path],
                {
                    stdio: ["pipe", "pipe", "inherit"],
                },
            );

            // Send password to CLI to unlock database.
            child.stdin.write(this.#password);
            child.stdin.end();

            let output = "";

            child.stdout.on("data", (data) => {
                output += data.toString();
            });

            child.on("close", (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`keepassxc-cli exited with code ${code}`));
                }
            });
        });

        const fullNames = [];
        const groupStack: string[] = [];

        for (const line of (output as string).split("\n")) {
            const [, indentation, name, slash] =
                /^(\s*)(.*?)(\/?)$/.exec(line) || [];
            // Infer tree depth from indentation.
            const depth = indentation.length / 2;

            while (groupStack.length > depth) {
                groupStack.pop();
            }

            if (name === "[empty]") {
                // Skip empty entries.
                continue;
            } else if (slash) {
                groupStack.push(name);
            } else {
                if (groupStack.length > 0) {
                    if (includeTrash || groupStack[0] !== "Trash") {
                        fullNames.push(groupStack.join("/") + "/" + name);
                    }
                } else {
                    fullNames.push(name);
                }
            }
        }

        return fullNames;
    }

    async getEntryByPath(entryPath: string): Promise<Entry | null> {
        const output = await new Promise((resolve, reject) => {
            const child = spawn(
                cliCommand,
                [
                    ...cliArgs,
                    "show",
                    "--quiet",
                    "--all",
                    "--show-protected",
                    this.#path,
                    entryPath,
                ],
                {
                    stdio: ["pipe", "pipe", "inherit"],
                },
            );

            // Send password to CLI to unlock database.
            child.stdin.write(this.#password);
            child.stdin.end();

            let output = "";

            child.stdout.on("data", (data) => {
                output += data.toString();
            });

            child.on("close", (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`keepassxc-cli exited with code ${code}`));
                }
            });
        });

        if (!output) {
            return null;
        }

        const entry: Entry = {};

        for (const line of (output as string).split("\n")) {
            const [, key, value] = /^([^:]+):\s*(.*)$/.exec(line) || [];
            if (key) {
                entry[key] = value;
            }
        }

        return entry;
    }
}
