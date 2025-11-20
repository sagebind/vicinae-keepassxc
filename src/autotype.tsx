import { useState, useEffect } from "react";
import {
    ActionPanel,
    Action,
    List,
    Icon,
    closeMainWindow,
    getPreferenceValues,
    openExtensionPreferences,
    showToast,
} from "@vicinae/api";
import { type } from "./common/automation";
import { getEntryByPath, getEntryNames } from "./common/keepassxc";

export default function () {
    const { databasePath, keyDelay } = getPreferenceValues();

    if (!databasePath) {
        showToast({
            title: "Database path not set",
            message:
                "Please set the database path in the extension preferences.",
        });
        return openExtensionPreferences();
    }

    const [isLoading, setIsLoading] = useState(true);
    const [entryNames, setEntryNames] = useState<string[]>([]);

    useEffect(() => {
        getEntryNames(databasePath).then((names) => {
            setEntryNames(names);
            setIsLoading(false);
        });
    }, [databasePath]);

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search KeePassXC entries..."
        >
            {entryNames.map((name, idx) => (
                <List.Item
                    id={`entry-${idx}`}
                    key={`entry-${idx}`}
                    title={name}
                    icon={Icon.Key}
                    actions={
                        <ActionPanel>
                            <Action
                                title="Auto-Type"
                                icon={Icon.Window}
                                onAction={() =>
                                    performAutoType(
                                        databasePath,
                                        name,
                                        parseInt(keyDelay, 10),
                                    )
                                }
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}

async function performAutoType(
    databasePath: string,
    entryName: string,
    keyDelay: number,
) {
    const entry = await getEntryByPath(databasePath, entryName);

    if (!entry) {
        return showToast({
            title: "Entry not found",
            message: `Could not find entry "${entryName}" in the database.`,
        });
    }

    const autoTypeString = generateAutoTypeString(entry);

    closeMainWindow();

    setTimeout(async () => {
        await type(autoTypeString, keyDelay);
    }, 1000);
}

function generateAutoTypeString(entry: Record<string, string>): string {
    // If a custom attribute is set to override our auto-type sequence, use it.
    if (entry.VicinaeAutoTypeSequence) {
        return entry.VicinaeAutoTypeSequence.replace(/{TAB}/g, "\t")
            .replace(/{ENTER}/g, "\n")
            .replace(/{SPACE}/g, " ")
            .replace(/{LEFTBRACE}/g, "{")
            .replace(/{RIGHTBRACE}/g, "}");
    }

    return `${entry.UserName}\t${entry.Password}\n`;
}
