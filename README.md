# ThunderSpam AI

ThunderSpam AI is a Thunderbird MailExtension that calls a local [Ollama](https://ollama.ai) instance to classify incoming mail as spam. Each new message is sent to an Ollama model using a customizable prompt. If the model labels the message as spam, the add-on can move it to Junk (default), mark it as spam in-place, or move it to a folder that you choose.

> **Privacy note**: All processing happens through the Ollama endpoint you configure. For the best privacy, run Ollama on the same machine as Thunderbird and keep the base URL at `http://127.0.0.1:11434`.

## Features
- Configurable Ollama connection and model picker (autofilled from `GET /api/tags`).
- Default structured prompt that can be tailored to your workflow.
- Per-message spam actions: move to Junk, mark as spam, custom folder, or no automatic action.
- Runs automatically on every incoming message through the `messages.onNewMailReceived` API.
- Optional verbose logging plus a rolling log of the last 100 classifications to help refine prompts.
- Built-in prompt tester to exercise your Ollama model with sample mail.
- Configurable delay so Thunderbird's native filters and junk rules can finish before the AI runs.
- Local settings backup stored as an email in the "ThunderSpam AI Config" folder under Local Folders, restorable from the settings page after confirmation.

## Requirements
1. Thunderbird 115 or later.
2. [Ollama](https://ollama.ai) running on the same machine (recommended).
3. At least one text-classification-capable model pulled into Ollama, e.g.:
   ```bash
   ollama pull llama3:8b
   ollama pull mistral
   ollama pull phi3:mini
   ```

### Model suggestions
- **Apple Silicon / NVIDIA GPU**: `llama3:8b`, `mistral`.
- **CPU-only laptops/desktops**: `phi3:mini`, `mistral` with `OLLAMA_NUM_PARALLEL=2`.
- **Servers with more VRAM**: `llama3:70b` (set expectations for longer latency).

For fine-grained tuning, adjust the default prompt to demande JSON output with fields that suit your workflow.

## Install in Thunderbird
1. Build the add-on zip:
   ```bash
   cd ThunderSpamAI
   zip -r ThunderSpamAI.xpi manifest.json background.js options icons debug
   ```
2. In Thunderbird, open **Tools → Add-ons and Themes → Extensions**.
3. Click the gear icon → **Install Add-on From File…**, and choose `ThunderSpamAI.xpi`.
4. After installation, click the ThunderSpam AI toolbar button or open the add-on options to configure the Ollama URL, model, prompt, and spam action.

## Configuration
Open the add-on options page (toolbar button or **Preferences**) to:
- Set the Ollama base URL (defaults to `http://127.0.0.1:11434`).
- Refresh and pick an available model.
- Customize the spam detection prompt. Supported placeholders:
  - `{{from}}`, `{{to}}`, `{{subject}}`, `{{date}}`, `{{email_text}}`
- Choose the spam handling action and, if desired, a custom destination folder.
- Toggle debug logging (enabled by default) and inspect or clear the recent classification log (last 100 messages) with scores, reasons, and actions.
- Run the **Prompt test** to confirm Thunderbird can reach Ollama and review how your prompt classifies a sample message.
- Adjust the "Delay before processing new mail" if you need to give Thunderbird's built-in filters extra time (default 1500&nbsp;ms).

Settings are stored locally via `browser.storage.local`.
ThunderSpam AI also keeps a local email backup of explicitly saved settings in Local Folders. If extension storage is reset and no saved local config remains, ThunderSpam AI automatically restores the latest local backup on restart. Use **Load previous config** at the top of the settings page when you want to replace an existing config, which requires confirmation. The backup may include API keys; keep the backup folder local and do not move it to an IMAP-synced folder.

## Development Notes
### Keeping credentials out of Git
API keys and personal prompts belong in the extension settings, never in source.
Thunderbird's profile and mail-based configuration backups are private runtime data;
do not copy them into this repository. Backups can contain API keys and are not encrypted.
The `.gitignore` excludes local environment files, settings exports, mail, logs,
databases, and generated XPI packages. Ignore rules do not protect an already tracked file.

Before pushing, install [Gitleaks](https://github.com/gitleaks/gitleaks) and run:
```bash
gitleaks dir . --redact
gitleaks git . --redact
```
Enable the included pre-push check in each clone with
`git config core.hooksPath .githooks` (requires Gitleaks).
Review the staged file list as well. Scanners reduce risk but cannot identify every
private value. If a real credential is committed, revoke it even if the repository
is private; deleting it in a later commit leaves it in history.

- The background script listens to `messages.onNewMailReceived`, pulls the full message body, and sends a single `POST /api/generate` request to Ollama.
- The default prompt asks for a compact JSON payload. If the model replies with free-form text, ThunderSpam AI heuristically inspects it for the word “spam”.
- Marking a message as spam uses `browser.messages.update(messageId, { junk: true })`; moving relies on `browser.messages.move`.
- Folder listing and special folders (Junk) are resolved with the `accounts` API and stored folder metadata.

## Testing
- Use Thunderbird’s “Test Pilot” mode or a dedicated account with sample mail. Seed the inbox with both legitimate and spam-like messages to see the actions trigger.
- For manual classification testing without moving mail, set the action to “Take no automatic action” and observe the Thunderbird error console for classification logs.

## Troubleshooting
- **No models appear**: Ensure Ollama is running (`ollama serve`), then click “Refresh models”.
- **Requests fail**: Check Thunderbird’s error console for messages beginning with “ThunderSpam AI”. Verify that the base URL matches your Ollama host and port.
- **Remote Ollama instances**: Set `OLLAMA_HOST=0.0.0.0` on the host machine and secure the network (VPN, SSH tunnel, firewall). Update the base URL accordingly in the add-on options.

## License
MIT (see `LICENSE` if included) or adapt to your project requirements.
