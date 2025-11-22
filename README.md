# KeePassXC Vicinae Extension

**Status: The basic idea works, but still very experimental.**

An extension for [Vicinae](https://github.com/vicinaehq/vicinae) that allows you to access your [KeePassXC](https://keepassxc.org) vault from anywhere, any time.

This extension also re-implements [Auto-Type](https://keepassxc.org/docs/KeePassXC_UserGuide#_auto_type) on top of [ydotool](https://github.com/ReimuNotMoe/ydotool), allowing you to execute auto-type of any entry into the currently-focused window. Yes, even on Wayland!

There is already a KeePassXC extension for Raycast, but it will not run in Vicinae on Linux without modifications, and it does not provide auto-type functionality anyway, which is the most valuable feature that an extension on Linux could provide in my opinion.

## Prerequisites

- Linux-only
- KeePassXC must be installed.
- You must have `ydotool` installed, `ydotoold` must be running, and the current user must have permission to the `ydotool` socket. The easiest way to accomplish this is to run `ydotool` as a user service instead of as `root`, and adding yourself to the `input` group.
- You must have `secret-tool` installed. Until Vicinae moves to an encrypted preferences storage (see https://github.com/vicinaehq/vicinae/issues/758), this extension will store your password in your Secret Service keyring instead to ensure it is remembered securely.
- Your KDBX database file must be readable from a file system path.

## FAQ

- Why is this not a fork/patch for the Raycast KeePassXC extension?
    - It seems unlikely to me that the features I want to implement would be accepted upstream, and I prefer to implement this in a way that meets my own needs exactly anyway.
- Why not use the `Clipboard` API for pasting passwords into the current window?
    - Not all applications support this, and some applications & websites block clipboard interaction into their login forms. A virtual keyboard is the only reliable way to support auto-fill of credentials into *any* application.
- Will you add feature XYZ?
    - Maybe. Open a GitHub issue and we'll talk!

## License

This project's source code and documentation is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.
