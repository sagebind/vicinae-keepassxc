import which from "which";

export async function commandExists(command: string): Promise<boolean> {
    return !!(await which(command, { nothrow: true }));
}
