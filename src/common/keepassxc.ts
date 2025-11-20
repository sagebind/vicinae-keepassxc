import { spawn } from "node:child_process";
import { store, lookup } from "./secret-service";

type Entry = Record<string, string>;

const cliCommand = "flatpak";
const cliArgs = ["run", "--command=keepassxc-cli", "org.keepassxc.KeePassXC"];
const secretAttributes = {
    application: "vicinae-keepassxc",
    item: "database-password",
};

export async function getEntryNames(
    databasePath: string,
    includeTrash: boolean = false,
): Promise<string[]> {
    const password = await getPasswordInteractive(databasePath);

    const output = await new Promise((resolve, reject) => {
        const child = spawn(
            cliCommand,
            [...cliArgs, "ls", "--quiet", "--recursive", databasePath],
            {
                stdio: ["pipe", "pipe", "inherit"],
            },
        );

        // Send password to CLI to unlock database.
        child.stdin.write(password);
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

export async function getEntryByPath(
    databasePath: string,
    entryPath: string,
): Promise<Entry | null> {
    const password = await getPasswordInteractive(databasePath);

    const output = await new Promise((resolve, reject) => {
        const child = spawn(
            cliCommand,
            [
                ...cliArgs,
                "show",
                "--quiet",
                "--all",
                "--show-protected",
                databasePath,
                entryPath,
            ],
            {
                stdio: ["pipe", "pipe", "inherit"],
            },
        );

        // Send password to CLI to unlock database.
        child.stdin.write(password);
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

async function getPasswordInteractive(databasePath: string): Promise<string> {
    let password = await getDatabasePassword(databasePath);

    if (!password) {
        password = await promptDatabasePassword();
        if (!password) {
            throw new Error("No password provided for KeePassXC database.");
        }
        await storeDatabasePassword(databasePath, password);
    }

    return password;
}

async function getDatabasePassword(
    databasePath: string,
): Promise<string | null> {
    return await lookup({
        ...secretAttributes,
        database: databasePath,
    });
}

async function storeDatabasePassword(
    databasePath: string,
    password: string,
): Promise<void> {
    await store(
        "KeePassXC integration for Vicinae - Database Password",
        password,
        {
            ...secretAttributes,
            database: databasePath,
        },
    );
}

async function promptDatabasePassword(): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const child = spawn("zenity", ["--password"], {
            stdio: ["ignore", "pipe", "inherit"],
        });

        let output = "";

        child.stdout.on("data", (data) => {
            output += data.toString();
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`zenity exited with code ${code}`));
            }
        });
    });
}
