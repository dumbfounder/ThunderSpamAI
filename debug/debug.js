const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const elements = {
  status: document.getElementById("status"),
  openSettings: document.getElementById("open-settings"),
  messageId: document.getElementById("message-id"),
  folder: document.getElementById("folder"),
  loadMessage: document.getElementById("load-message"),
  runReplay: document.getElementById("run-replay"),
  applyMessage: document.getElementById("apply-message"),
  saveGlobal: document.getElementById("save-global"),
  from: document.getElementById("from"),
  to: document.getElementById("to"),
  subject: document.getElementById("subject"),
  date: document.getElementById("date"),
  headers: document.getElementById("headers"),
  body: document.getElementById("body"),
  attachments: document.getElementById("attachments"),
  provider: document.getElementById("provider"),
  model: document.getElementById("model"),
  baseUrl: document.getElementById("base-url"),
  apiKey: document.getElementById("api-key"),
  spamGuidance: document.getElementById("spam-guidance"),
  attentionGuidance: document.getElementById("attention-guidance"),
  parsedOutput: document.getElementById("parsed-output"),
  output: document.getElementById("output")
};

const state = {
  settings: null,
  context: null
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  registerListeners();
  await loadSettings();
  const { messageRef, shouldReplay } = parseMessageRefFromUrl();
  if (messageRef) {
    if (Number.isFinite(messageRef.messageId) && elements.messageId) {
      elements.messageId.value = String(messageRef.messageId);
    }
    await loadMessageContext(messageRef, { runReplay: shouldReplay });
    return;
  }
  setStatus("Enter a message ID or launch from the message list menu.", "info");
}

function registerListeners() {
  elements.openSettings?.addEventListener("click", () => {
    if (browser?.runtime?.openOptionsPage) {
      browser.runtime.openOptionsPage();
    }
  });
  elements.loadMessage?.addEventListener("click", async () => {
    const messageId = parseFiniteMessageId(elements.messageId?.value);
    if (messageId === null) {
      setStatus("Enter a valid numeric message ID.", "error");
      return;
    }
    await loadMessageContext(messageId);
  });
  elements.runReplay?.addEventListener("click", runReplay);
  elements.applyMessage?.addEventListener("click", reprocessMessage);
  elements.saveGlobal?.addEventListener("click", saveReplaySettingsGlobally);
}

function setStatus(text, tone = "info") {
  if (!elements.status) {
    return;
  }
  elements.status.textContent = text || "";
  elements.status.classList.remove("status-success", "status-warning", "status-error");
  if (text && tone && tone !== "info") {
    elements.status.classList.add(`status-${tone}`);
  }
}

function renderOutput(payload) {
  if (!elements.output) {
    return;
  }
  renderParsedOutput(payload);
  elements.output.textContent = JSON.stringify(payload, null, 2);
  elements.output.classList.remove("hidden");
}

function clearOutput() {
  if (elements.parsedOutput) {
    elements.parsedOutput.innerHTML = "";
    elements.parsedOutput.classList.add("hidden");
  }
  if (!elements.output) {
    return;
  }
  elements.output.textContent = "";
  elements.output.classList.add("hidden");
}

function renderParsedOutput(payload) {
  if (!elements.parsedOutput) {
    return;
  }
  const view = buildParsedReplayView(payload);
  if (!view) {
    elements.parsedOutput.innerHTML = "";
    elements.parsedOutput.classList.add("hidden");
    return;
  }
  const rows = [
    { label: "Status", value: view.status },
    { label: "Message", value: view.message },
    { label: "Classification", value: view.classification },
    { label: "Confidence", value: view.confidence },
    { label: "Needs attention", value: view.needsAttention },
    { label: "Attention score", value: view.attentionScore },
    { label: "Decision code", value: view.reasonCode },
    { label: "Reason", value: view.reason },
    { label: "Provider", value: view.provider },
    { label: "Model", value: view.model },
    { label: "Endpoint(s)", value: view.endpoints },
    { label: "Tokens", value: view.tokens }
  ].filter((item) => item.value);

  const gridHtml = rows
    .map(
      (item) => `<div class="parsed-item"><div class="parsed-label">${escapeHtml(item.label)}</div><div class="parsed-value">${escapeHtml(item.value)}</div></div>`
    )
    .join("");

  const blocks = [];
  if (view.spamRawResponse) {
    blocks.push(buildParsedCodeBlock("Spam raw response", view.spamRawResponse));
  }
  if (view.attentionRawResponse) {
    blocks.push(buildParsedCodeBlock("Attention raw response", view.attentionRawResponse));
  }
  if (view.responseText) {
    blocks.push(buildParsedCodeBlock("Response text", view.responseText));
  }

  elements.parsedOutput.innerHTML = `
    <div><strong>Parsed Summary</strong></div>
    <div class="parsed-grid">${gridHtml}</div>
    ${blocks.join("")}
  `;
  elements.parsedOutput.classList.remove("hidden");
}

function buildParsedCodeBlock(title, value) {
  return `
    <div class="parsed-block">
      <div class="parsed-block-title">${escapeHtml(title)}</div>
      <pre class="parsed-code">${escapeHtml(String(value || ""))}</pre>
    </div>
  `;
}

function buildParsedReplayView(result) {
  if (!result || typeof result !== "object") {
    return null;
  }
  const parsed = normalizeParsedClassification(result);
  const stats = result.stats && typeof result.stats === "object" ? result.stats : {};
  const provider = coalesceText(parsed.provider, result.provider, result.modelProvider);
  const model = coalesceText(parsed.model, result.selectedModel, result.model);
  const spamEndpoint = coalesceText(parsed.spamEndpoint, result.spamEndpoint);
  const attentionEndpoint = coalesceText(parsed.attentionEndpoint, result.attentionEndpoint);
  const endpoints = [spamEndpoint, attentionEndpoint].filter(Boolean).join(" | ");
  const tokens = formatTokenStats(stats);

  return {
    status: result.ok === false ? "failed" : "ok",
    message: coalesceText(result.message, parsed.errorMessage),
    classification: coalesceText(parsed.classification),
    confidence: formatMaybeNumber(parsed.confidence),
    needsAttention: formatMaybeBoolean(parsed.needsAttention),
    attentionScore: formatMaybeNumber(parsed.attentionScore),
    reasonCode: coalesceText(parsed.reasonCode),
    reason: coalesceText(parsed.reason),
    provider,
    model,
    endpoints,
    tokens,
    spamRawResponse: coalesceText(parsed.spamRawResponse),
    attentionRawResponse: coalesceText(parsed.attentionRawResponse),
    responseText: coalesceText(result.response)
  };
}

function normalizeParsedClassification(result) {
  const root = result.parsed && typeof result.parsed === "object" ? result.parsed : {};
  const nested =
    root.classification && typeof root.classification === "object" ? root.classification : root;
  return {
    classification: coalesceText(nested.classification, root.classification),
    confidence: asFiniteNumber(nested.confidence, root.confidence),
    reason: coalesceText(nested.reason, root.reason),
    needsAttention: asBooleanOrNull(nested.needsAttention, nested.needs_attention, root.needsAttention, root.needs_attention),
    attentionScore: asFiniteNumber(nested.attentionScore, nested.attention_score, root.attentionScore, root.attention_score),
    reasonCode: coalesceText(nested.reasonCode, nested.reason_code, root.reasonCode, root.reason_code),
    provider: coalesceText(root.provider),
    model: coalesceText(root.model),
    spamEndpoint: coalesceText(root.spamEndpoint),
    attentionEndpoint: coalesceText(root.attentionEndpoint),
    spamRawResponse: coalesceText(root.spamRawResponse),
    attentionRawResponse: coalesceText(root.attentionRawResponse),
    errorMessage: coalesceText(root.error, root.errorMessage)
  };
}

function coalesceText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function asFiniteNumber(...values) {
  for (const value of values) {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }
  return null;
}

function asBooleanOrNull(...values) {
  for (const value of values) {
    if (value === true || value === false) {
      return value;
    }
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return null;
}

function formatMaybeNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(3);
}

function formatMaybeBoolean(value) {
  if (value === true) {
    return "Yes";
  }
  if (value === false) {
    return "No";
  }
  return "";
}

function formatTokenStats(stats) {
  if (!stats || typeof stats !== "object") {
    return "";
  }
  const total = asFiniteNumber(stats.tokens, stats.totalTokens);
  const prompt = asFiniteNumber(stats.promptTokens);
  const completion = asFiniteNumber(stats.completionTokens);
  const parts = [];
  if (total !== null) {
    parts.push(`total ${total}`);
  }
  if (prompt !== null) {
    parts.push(`prompt ${prompt}`);
  }
  if (completion !== null) {
    parts.push(`completion ${completion}`);
  }
  return parts.join(" | ");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

async function loadSettings() {
  try {
    const settings = await browser.runtime.sendMessage({ type: "getSettings" });
    state.settings = settings || {};
    const provider = state.settings.modelProvider || "openai";
    if (elements.provider) {
      elements.provider.value = provider;
    }
    if (elements.model) {
      elements.model.value =
        provider === "ollama"
          ? state.settings.ollamaModel || state.settings.selectedModel || ""
          : state.settings.openAiModel || state.settings.selectedModel || "";
    }
    if (elements.baseUrl) {
      elements.baseUrl.value =
        provider === "ollama"
          ? state.settings.ollamaUrl || DEFAULT_OLLAMA_URL
          : state.settings.openAiBaseUrl || DEFAULT_OPENAI_BASE_URL;
    }
    if (elements.apiKey) {
      elements.apiKey.value = state.settings.openAiApiKey || "";
    }
    if (elements.spamGuidance) {
      elements.spamGuidance.value = state.settings.promptTemplate || "";
    }
    if (elements.attentionGuidance) {
      elements.attentionGuidance.value = state.settings.attentionPromptTemplate || "";
    }
  } catch (error) {
    console.error("Failed to load settings", error);
    setStatus("Could not load current settings.", "error");
  }
}

async function loadMessageContext(messageId, options = {}) {
  const messageRef = normalizeMessageRef(messageId);
  if (!messageRef) {
    setStatus("Missing message identifier.", "error");
    return;
  }
  const { runReplay = false } = options;
  setStatus(`Loading ${describeMessageRef(messageRef)}...`, "info");
  clearOutput();
  try {
    const response = await browser.runtime.sendMessage({
      type: "getMessageDebugContext",
      payload: messageRef
    });
    if (!response?.ok || !response?.context) {
      setStatus(response?.message || "Could not load message context.", "error");
      return;
    }
    const context = response.context;
    state.context = context;
    if (elements.messageId) {
      elements.messageId.value = Number.isFinite(Number(context.id)) ? String(context.id) : "";
    }
    if (elements.folder) {
      elements.folder.value = context.folder || "";
    }
    if (elements.from) {
      elements.from.value = context.from || "";
    }
    if (elements.to) {
      elements.to.value = context.to || "";
    }
    if (elements.subject) {
      elements.subject.value = context.subject || "";
    }
    if (elements.date) {
      elements.date.value = context.date || "";
    }
    if (elements.headers) {
      elements.headers.value = context.headersText || "";
    }
    if (elements.body) {
      elements.body.value = context.body || "";
    }
    if (elements.attachments) {
      elements.attachments.value = Array.isArray(context.attachments) ? context.attachments.join(", ") : "";
    }

    const last = context.lastClassification || {};
    if (last.provider && elements.provider) {
      elements.provider.value = last.provider;
    }
    if (last.model && elements.model) {
      elements.model.value = last.model;
    }
    if (last.providerBaseUrl && elements.baseUrl) {
      elements.baseUrl.value = last.providerBaseUrl;
    }
    setStatus("Message loaded. Replay to inspect decision traces.", "success");
    if (runReplay) {
      await runReplay();
    }
  } catch (error) {
    console.error("Failed to load message context", error);
    setStatus("Could not load message context.", "error");
  }
}

function normalizeMessageRef(input) {
  const directId = parseFiniteMessageId(input);
  if (directId !== null) {
    return { messageId: directId };
  }
  if (!input || typeof input !== "object") {
    return null;
  }
  const numericId = parseFiniteMessageId(input.messageId);
  const internetMessageId = String(input.internetMessageId || "").trim();
  const accountId = String(input.accountId || "").trim();
  const folder = String(input.folder || "").trim();
  if (numericId === null && !internetMessageId) {
    return null;
  }
  const normalized = {};
  if (numericId !== null) {
    normalized.messageId = numericId;
  }
  if (internetMessageId) {
    normalized.internetMessageId = internetMessageId;
  }
  if (accountId) {
    normalized.accountId = accountId;
  }
  if (folder) {
    normalized.folder = folder;
  }
  return normalized;
}

function parseMessageRefFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const messageId = parseFiniteMessageId(params.get("messageId"));
  const internetMessageId = String(params.get("internetMessageId") || "").trim();
  const accountId = String(params.get("accountId") || "").trim();
  const folder = String(params.get("folder") || "").trim();
  const shouldReplay = params.get("replay") === "1";
  const messageRef = normalizeMessageRef({
    messageId,
    internetMessageId,
    accountId,
    folder
  });
  return { messageRef, shouldReplay };
}

function describeMessageRef(messageRef = {}) {
  const messageId = parseFiniteMessageId(messageRef.messageId);
  if (messageId !== null) {
    return `message ${messageId}`;
  }
  if (messageRef.internetMessageId) {
    return `message-id ${messageRef.internetMessageId}`;
  }
  return "message";
}

function parseFiniteMessageId(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAttachments(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildReplayPayload() {
  const provider = elements.provider?.value || state.settings?.modelProvider || "openai";
  const model = elements.model?.value?.trim() || "";
  const baseUrl = elements.baseUrl?.value?.trim() || "";
  const apiKey = elements.apiKey?.value?.trim() || "";

  return {
    modelProvider: provider,
    selectedModel: model,
    openAiModel: model,
    openAiApiKey: apiKey,
    openAiBaseUrl: baseUrl || (provider === "ollama" ? DEFAULT_OLLAMA_URL : DEFAULT_OPENAI_BASE_URL),
    ollamaUrl: baseUrl || state.settings?.ollamaUrl || DEFAULT_OLLAMA_URL,
    promptTemplate: elements.spamGuidance?.value || "",
    attentionPromptTemplate: elements.attentionGuidance?.value || "",
    sample: {
      from: elements.from?.value?.trim() || "",
      to: elements.to?.value?.trim() || "",
      subject: elements.subject?.value?.trim() || "",
      date: elements.date?.value?.trim() || new Date().toISOString(),
      headers: elements.headers?.value || "",
      body: elements.body?.value || "",
      attachments: parseAttachments(elements.attachments?.value || "")
    }
  };
}

async function runReplay() {
  if (elements.runReplay) {
    elements.runReplay.disabled = true;
  }
  setStatus("Running replay...", "info");
  clearOutput();
  try {
    const payload = buildReplayPayload();
    const result = await browser.runtime.sendMessage({ type: "testPrompt", payload });
    renderOutput(result || {});
    if (!result?.ok) {
      setStatus(result?.message || "Replay failed.", "error");
      return;
    }
    const parsed = result?.parsed || {};
    const scoreText = typeof parsed.attentionScore === "number" ? `, attention ${parsed.attentionScore}` : "";
    setStatus(`Dry run complete: ${parsed.classification || "unknown"}${scoreText}. No mail was changed.`, "success");
  } catch (error) {
    console.error("Replay failed", error);
    setStatus("Replay failed.", "error");
  } finally {
    if (elements.runReplay) {
      elements.runReplay.disabled = false;
    }
  }
}

function buildCurrentMessageRef() {
  const messageId = parseFiniteMessageId(elements.messageId?.value);
  const ref = {};
  if (messageId !== null) {
    ref.messageId = messageId;
  }
  const internetMessageId = String(state.context?.messageId || "").trim();
  const accountId = String(state.context?.accountId || "").trim();
  const folder = String(elements.folder?.value || state.context?.folder || "").trim();
  if (internetMessageId) {
    ref.internetMessageId = internetMessageId;
  }
  if (accountId) {
    ref.accountId = accountId;
  }
  if (folder) {
    ref.folder = folder;
  }
  return Object.keys(ref).length ? ref : null;
}

function describeReprocessResult(result = {}) {
  const moved = result?.attentionMove?.moved ? "moved" : result?.attentionMove?.reason || "not moved";
  const scoreText = typeof result.attentionScore === "number" ? `, attention ${result.attentionScore}` : "";
  const actionText = result.actionTaken && result.actionTaken !== "none" ? `, action ${result.actionTaken}` : "";
  return `Reprocess complete: ${result.classification || result.status || "unknown"}${scoreText}${actionText}, ${moved}.`;
}

async function reprocessMessage() {
  const messageRef = buildCurrentMessageRef();
  if (!messageRef) {
    setStatus("Load a message before reprocessing it.", "error");
    return;
  }
  if (elements.applyMessage) {
    elements.applyMessage.disabled = true;
  }
  setStatus("Reprocessing message...", "info");
  clearOutput();
  try {
    const result = await browser.runtime.sendMessage({ type: "reprocessMessage", payload: messageRef });
    renderOutput(result || {});
    if (!result?.ok) {
      setStatus(result?.message || "Reprocess failed.", "error");
      return;
    }
    await loadMessageContext(
      {
        messageId: result.id || messageRef.messageId,
        internetMessageId: messageRef.internetMessageId,
        accountId: messageRef.accountId,
        folder: messageRef.folder
      },
      { runReplay: false }
    );
    setStatus(describeReprocessResult(result), "success");
    renderOutput(result);
  } catch (error) {
    console.error("Reprocess failed", error);
    setStatus("Reprocess failed.", "error");
  } finally {
    if (elements.applyMessage) {
      elements.applyMessage.disabled = false;
    }
  }
}

async function saveReplaySettingsGlobally() {
  if (elements.saveGlobal) {
    elements.saveGlobal.disabled = true;
  }
  setStatus("Saving replay config globally...", "info");
  try {
    const current = state.settings || (await browser.runtime.sendMessage({ type: "getSettings" })) || {};
    const provider = elements.provider?.value || current.modelProvider || "openai";
    const model = elements.model?.value?.trim() || "";
    const baseUrl = elements.baseUrl?.value?.trim() || "";
    const apiKey = elements.apiKey?.value?.trim() || "";

    const payload = {
      ...current,
      modelProvider: provider,
      selectedModel: model,
      openAiModel: provider === "ollama" ? current.openAiModel || "" : model,
      ollamaModel: provider === "ollama" ? model : current.ollamaModel || "",
      openAiApiKey: apiKey,
      openAiBaseUrl:
        provider === "ollama"
          ? current.openAiBaseUrl || DEFAULT_OPENAI_BASE_URL
          : baseUrl || DEFAULT_OPENAI_BASE_URL,
      ollamaUrl:
        provider === "ollama"
          ? baseUrl || current.ollamaUrl || DEFAULT_OLLAMA_URL
          : current.ollamaUrl || DEFAULT_OLLAMA_URL,
      promptTemplate: elements.spamGuidance?.value || "",
      attentionPromptTemplate: elements.attentionGuidance?.value || ""
    };

    const saveResult = await browser.runtime.sendMessage({ type: "saveSettings", payload });
    if (!saveResult?.ok) {
      setStatus(saveResult?.message || "Could not save settings.", "error");
      return;
    }
    state.settings = await browser.runtime.sendMessage({ type: "getSettings" });
    setStatus("Saved globally. New incoming mail now uses this configuration.", "success");
  } catch (error) {
    console.error("Failed to save replay settings globally", error);
    setStatus("Could not save settings.", "error");
  } finally {
    if (elements.saveGlobal) {
      elements.saveGlobal.disabled = false;
    }
  }
}
