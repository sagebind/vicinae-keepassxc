import * as secretService from "./secret-service";

const secretLabel = "KeePassXC integration for Vicinae - Database Password";
const secretAttributes = {
    application: "vicinae-keepassxc",
    item: "database-password",
};

export async function getDatabasePassword(
    databasePath: string,
): Promise<string | null> {
    return await secretService.lookup({
        ...secretAttributes,
        database: databasePath,
    });
}

export async function storeDatabasePassword(
    databasePath: string,
    password: string,
): Promise<void> {
    await secretService.store(secretLabel, password, {
        ...secretAttributes,
        database: databasePath,
    });
}
