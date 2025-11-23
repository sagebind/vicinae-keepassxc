export type AutoTypeToken =
    | { type: "text"; value: string }

    // Special keys
    | { type: "insert" }
    | { type: "delete" }
    | { type: "home" }
    | { type: "end" }
    | { type: "pgup" }
    | { type: "pgdn" }
    | { type: "backspace" }
    | { type: "capslock" }
    | { type: "esc" }
    | { type: "up" }
    | { type: "down" }
    | { type: "left" }
    | { type: "right" }
    | { type: "function", number: number }

    // Placeholders
    | { type: "title" }
    | { type: "username" }
    | { type: "password" }
    | { type: "totp" }
    | { type: "attribute"; key: string }
    | { type: "delay"; millis: number }
    | { type: "set_delay"; millis: number }
    | { type: "modifier"; value: "press" | "release"; keys: string[] }
    | { type: "unknown"; token: string };

/**
 * Parse a KeePass autotype sequence into tokens. We use this to determine how
 * to perform an auto-type for an entry. Not everything is supported, but we try
 * to follow KeePassXC behavior as close as possible.
 *
 * See https://keepassxc.org/docs/KeePassXC_UserGuide#_auto_type_actions and
 * https://keepass.info/help/base/placeholders.html for more information about
 * this syntax.
 */
export function* parse(sequence: string): Generator<AutoTypeToken> {
    for (const token of sequence.split(/(\{[^}]+\})/)) {
        if (token.startsWith("{") && token.endsWith("}")) {
            switch (token) {
                case "{TAB}":
                    yield { type: "text", value: "\t" };
                    break;
                case "{ENTER}":
                    yield { type: "text", value: "\n" };
                    break;
                case "{SPACE}":
                    yield { type: "text", value: " " };
                    break;
                case "{INSERT}":
                    yield { type: "insert" };
                    break;
                case "{DELETE}":
                    yield { type: "delete" };
                    break;
                case "{HOME}":
                    yield { type: "home" };
                    break;
                case "{END}":
                    yield { type: "end" };
                    break;
                case "{PGUP}":
                    yield { type: "pgup" };
                    break;
                case "{PGDN}":
                    yield { type: "pgdn" };
                    break;
                case "{BACKSPACE}":
                    yield { type: "backspace" };
                    break;
                case "{CAPSLOCK}":
                    yield { type: "capslock" };
                    break;
                case "{ESC}":
                    yield { type: "esc" };
                    break;
                case "{UP}":
                    yield { type: "up" };
                    break;
                case "{DOWN}":
                    yield { type: "down" };
                    break;
                case "{LEFT}":
                    yield { type: "left" };
                    break;
                case "{RIGHT}":
                    yield { type: "right" };
                    break;
                case "{LEFTBRACE}":
                    yield { type: "text", value: "{" };
                    break;
                case "{RIGHTBRACE}":
                    yield { type: "text", value: "}" };
                    break;
                case "{TITLE}":
                    yield { type: "title" };
                    break;
                case "{USERNAME}":
                    yield { type: "username" };
                    break;
                case "{PASSWORD}":
                    yield { type: "password" };
                    break;
                case "{TOTP}":
                    yield { type: "totp" };
                    break;
                default:
                    if (token.startsWith("{S:")) {
                        yield {
                            type: "attribute",
                            key: token.slice(3, token.length - 1),
                        };
                    } else {
                        yield { type: "unknown", token };
                    }
                    break;
            }
        } else {
            yield { type: "text", value: token };
        }
    }
}
