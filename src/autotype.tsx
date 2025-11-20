import { useState, useEffect } from "react";
import { ActionPanel, Action, List, Icon, closeMainWindow, getPreferenceValues, openExtensionPreferences, showToast } from "@vicinae/api";
import { type } from "./common/automation";
import { getEntryNames } from "./common/keepassxc";

export default function () {
    const { databasePath } = getPreferenceValues();

    if (!databasePath) {
        showToast({
            title: "Database path not set",
            message: "Please set the database path in the extension preferences.",
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
        <List isLoading={isLoading} searchBarPlaceholder="Search KeePassXC entries...">
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
                                onAction={() => performAutoType(name)}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}

function performAutoType(entryName: string) {
    closeMainWindow();
    setTimeout(async () => {
        await type(entryName);
    }, 1000);
}
