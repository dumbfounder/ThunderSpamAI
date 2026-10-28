const SYSTEM_PROMPT_PREVIEW = [
  "SPAM PROMPT (pass 1):",
  "You are an email security assistant.",
  "Classify as spam, not_spam, or error.",
  "Return exactly one JSON object with this schema:",
  '{ "classification": "spam" | "not_spam" | "error", "confidence": 0.0-1.0, "reason": "<short summary>" }',
  "Do not add any extra keys or text outside of the JSON.",
  "",
  "ATTENTION PROMPT (pass 2; only for non-spam):",
  "Return exactly one JSON object with this schema:",
  '{ "attention_score": 1-10 }',
  "0 is reserved by the wrapper to represent spam.",
  "- Non-spam scoring rubric:",
  "  - 1-2: low-value bulk mail, marketing, newsletters, routine notifications",
  "  - 3-4: informational but not important",
  "  - 5-6: useful personal or work email worth reading",
  "  - 7-8: important email likely needing a response or action soon",
  "  - 9-10: urgent, high-impact, time-sensitive, or personally critical",
  "",
  "Wrapper behavior:",
  "- If spam => attention_score = 0",
  "- If non-spam => run attention pass and set needs_attention when score >= 6"
].join("\n");

const DEFAULT_CUSTOM_INSTRUCTIONS =
  "Focus the reason on the most important indicators found in the headers or body.";
const DEFAULT_ATTENTION_INSTRUCTIONS = "";

const DEFAULT_OPENAI_MODEL = "gpt-5.2";
const DEFAULT_ATTENTION_RETURN_INTERVAL_MINUTES = 30;
const OPENAI_MODEL_PRESETS = ["gpt-5.2", "openai-5.2", "gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o4-mini"];

const elements = {
  modelProvider: document.getElementById("model-provider"),
  ollamaUrl: document.getElementById("ollama-url"),
  ollamaModel: document.getElementById("ollama-model"),
  refreshModels: document.getElementById("refresh-models"),
  ollamaSettings: document.getElementById("ollama-settings"),
  openAiSettings: document.getElementById("openai-settings"),
  openAiBaseUrl: document.getElementById("openai-base-url"),
  openAiBaseUrlLabel: document.getElementById("openai-base-url-label"),
  openAiBaseUrlHint: document.getElementById("openai-base-url-hint"),
  openAiApiKey: document.getElementById("openai-api-key"),
  openAiApiKeyLabel: document.getElementById("openai-api-key-label"),
  openAiApiKeyHint: document.getElementById("openai-api-key-hint"),
  openAiModel: document.getElementById("openai-model"),
  openAiModelList: document.getElementById("openai-model-list"),
  promptTemplate: document.getElementById("prompt-template"),
  attentionPromptTemplate: document.getElementById("attention-prompt-template"),
  promptSystemPreview: document.getElementById("prompt-system-preview"),
  spamAction: document.getElementById("spam-action"),
  customFolder: document.getElementById("custom-folder"),
  saveButton: document.getElementById("save-settings"),
  saveButtonTop: document.getElementById("save-settings-top"),
  loadPreviousConfig: document.getElementById("load-previous-config"),
  restoreDefaults: document.getElementById("restore-defaults"),
  saveStatus: document.getElementById("save-status"),
  saveStatusTop: document.getElementById("save-status-top"),
  modelStatus: document.getElementById("model-status"),
  debugLogging: document.getElementById("debug-logging"),
  filterDelay: document.getElementById("filter-delay"),
  refreshLog: document.getElementById("refresh-log"),
  clearLog: document.getElementById("clear-log"),
  openMessageDebugger: document.getElementById("open-message-debugger"),
  openMessageDebuggerLog: document.getElementById("open-message-debugger-log"),
  logTableBody: document.getElementById("classification-log"),
  logEmpty: document.getElementById("log-empty"),
  debugLoadPending: document.getElementById("debug-load-pending"),
  debugRun: document.getElementById("debug-run"),
  debugSaveGlobal: document.getElementById("debug-save-global"),
  debugStatus: document.getElementById("debug-status"),
  debugMessageId: document.getElementById("debug-message-id"),
  debugFolder: document.getElementById("debug-folder"),
  debugFrom: document.getElementById("debug-from"),
  debugTo: document.getElementById("debug-to"),
  debugSubject: document.getElementById("debug-subject"),
  debugDate: document.getElementById("debug-date"),
  debugHeaders: document.getElementById("debug-headers"),
  debugBody: document.getElementById("debug-body"),
  debugAttachments: document.getElementById("debug-attachments"),
  debugProvider: document.getElementById("debug-provider"),
  debugBaseUrl: document.getElementById("debug-base-url"),
  debugModel: document.getElementById("debug-model"),
  debugApiKey: document.getElementById("debug-api-key"),
  debugPromptTemplate: document.getElementById("debug-prompt-template"),
  debugAttentionPromptTemplate: document.getElementById("debug-attention-prompt-template"),
  debugSpamPrompt: document.getElementById("debug-spam-prompt"),
  debugAttentionPrompt: document.getElementById("debug-attention-prompt"),
  debugOutput: document.getElementById("debug-output"),
  promptTestButton: document.getElementById("run-prompt-test"),
  promptTestStatus: document.getElementById("prompt-test-status"),
  promptTestOutput: document.getElementById("prompt-test-output"),
  promptTestFrom: document.getElementById("prompt-test-from"),
  promptTestTo: document.getElementById("prompt-test-to"),
  promptTestSubject: document.getElementById("prompt-test-subject"),
  promptTestBody: document.getElementById("prompt-test-body"),
  senderAddressesBody: document.getElementById("sender-addresses-body"),
  senderDomainsBody: document.getElementById("sender-domains-body"),
  senderAddressesEmpty: document.getElementById("sender-addresses-empty"),
  senderDomainsEmpty: document.getElementById("sender-domains-empty"),
  blockedAddressesList: document.getElementById("blocked-addresses-list"),
  blockedDomainsList: document.getElementById("blocked-domains-list"),
  blockedAddressesEmpty: document.getElementById("blocked-addresses-empty"),
  blockedDomainsEmpty: document.getElementById("blocked-domains-empty"),
  refreshSenderStats: document.getElementById("refresh-sender-stats"),
  senderStatsStatus: document.getElementById("sender-stats-status"),
  manualBlockAddress: document.getElementById("manual-block-address"),
  manualBlockDomain: document.getElementById("manual-block-domain"),
  addBlockAddress: document.getElementById("add-block-address"),
  addBlockDomain: document.getElementById("add-block-domain"),
  clearStatsButtons: Array.from(document.querySelectorAll("[data-clear-target]")),
  tabButtons: Array.from(document.querySelectorAll("[data-tab-target]")),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  statsLlmToday: document.getElementById("stat-llm-today"),
  statsLlmWeek: document.getElementById("stat-llm-week"),
  statsLlmMonth: document.getElementById("stat-llm-month"),
  statsLlmTotal: document.getElementById("stat-llm-total"),
  statsPrefilterToday: document.getElementById("stat-prefilter-today"),
  statsPrefilterWeek: document.getElementById("stat-prefilter-week"),
  statsPrefilterMonth: document.getElementById("stat-prefilter-month"),
  statsPrefilterTotal: document.getElementById("stat-prefilter-total"),
  statsSpamSummary: document.getElementById("stat-spam-summary"),
  statsNotSpamSummary: document.getElementById("stat-notspam-summary"),
  statsErrorSummary: document.getElementById("stat-error-summary"),
  statsBlockedAddresses: document.getElementById("stat-blocked-addresses"),
  statsBlockedDomains: document.getElementById("stat-blocked-domains"),
  refreshUnreadDomains: document.getElementById("refresh-unread-domains"),
  unreadDomainsUndo: document.getElementById("unread-domains-undo"),
  unreadDomainsStatus: document.getElementById("unread-domains-status"),
  unreadDomainsBody: document.getElementById("unread-domains-body"),
  unreadDomainsEmpty: document.getElementById("unread-domains-empty"),
  attentionRoutingEnabled: document.getElementById("attention-routing-enabled"),
  attentionLowMax: document.getElementById("attention-low-max"),
  attentionFolderLow: document.getElementById("attention-folder-low"),
  attentionCopySpam: document.getElementById("attention-copy-spam"),
  attentionMoveDelay: document.getElementById("attention-move-delay"),
  attentionReturnInterval: document.getElementById("attention-return-interval"),
  attentionFolderStatus: document.getElementById("attention-folder-status"),
  attentionFolderRefresh: document.getElementById("attention-folder-refresh"),
  attentionFolderOpen: document.getElementById("attention-folder-open"),
  attentionFolderMissing: document.getElementById("attention-folder-missing"),
  reprocessUnread: document.getElementById("reprocess-unread"),
  cancelReprocessUnread: document.getElementById("cancel-reprocess-unread"),
  reprocessUnreadStatus: document.getElementById("reprocess-unread-status")
};

const state = {
  folders: [],
  settings: {},
  classificationLog: [],
  lastPromptTest: null,
  senderStats: {
    addresses: [],
    domains: []
  },
  usageStats: null,
  activeTab: "model",
  unreadDomains: [],
  unreadRefreshTimer: null,
  lastUnreadAction: null,
  debugContext: null,
  reprocessUnreadJob: null,
  reprocessUnreadTimer: null,
  lastReprocessFinishedKey: ""
};

let settingsSyncTimer = null;
const SETTINGS_SYNC_DEBOUNCE_MS = 150;
const SETTINGS_SYNC_KEYS = new Set([
  "settingsSnapshot",
  "settingsSavedAt",
  "modelProvider",
  "openAiApiKey",
  "openAiModel",
  "openAiBaseUrl",
  "ollamaUrl",
  "ollamaModel",
  "selectedModel",
  "promptTemplate",
  "attentionPromptTemplate",
  "spamAction",
  "customFolder",
  "debugLogging",
  "filterDelayMs",
  "attentionRoutingEnabled",
  "attentionLowMax",
  "attentionFolderLow",
  "attentionCopySpam",
  "attentionMoveDelayMs",
  "attentionReturnIntervalMin",
  "blockedSenders",
  "blockedDomains"
]);

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  const startedAt = Date.now();
  registerListeners();
  setupTabs();
  if (elements.promptSystemPreview) {
    elements.promptSystemPreview.textContent = SYSTEM_PROMPT_PREVIEW;
  }
  initializeOpenAiModelOptions();
  await loadSettings();
  updateProviderVisibility();
  updateOpenAiProviderCopy();
  if (elements.modelProvider?.value === "ollama") {
    const modelName = state.settings.ollamaModel || state.settings.selectedModel || "";
    setModelStatus(
      modelName
        ? `Ollama selected. Current model: ${modelName}.`
        : "Ollama selected. Click Refresh models to check local models."
    );
    runBackgroundTask("Ollama model refresh", () => refreshModels(false));
  } else {
    setModelStatus(getNonOllamaStatusMessage());
  }
  updateCustomFolderState();
  runInitialBackgroundLoads();
  console.info("ThunderSpam AI options initial settings loaded", {
    durationMs: Date.now() - startedAt
  });
}

function runInitialBackgroundLoads() {
  runBackgroundTask("folder list", loadFolders);
  runBackgroundTask("sender stats", loadSenderStats);
  runBackgroundTask("usage stats", loadUsageStats);
  runBackgroundTask("attention folder status", loadAttentionFolderStatus);
  runBackgroundTask("classification log", loadClassificationLog);
  runBackgroundTask("reprocess status", loadReprocessUnreadStatus);
}

function runBackgroundTask(label, task) {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error(`ThunderSpam AI ${label} load failed`, error);
    });
}

function registerListeners() {
  if (elements.modelProvider) {
    elements.modelProvider.addEventListener("change", handleProviderChange);
  }
  elements.refreshModels.addEventListener("click", () => refreshModels(true));
  elements.saveButton.addEventListener("click", saveSettings);
  if (elements.saveButtonTop) {
    elements.saveButtonTop.addEventListener("click", saveSettings);
  }
  elements.loadPreviousConfig?.addEventListener("click", loadPreviousConfig);
  elements.restoreDefaults.addEventListener("click", restoreDefaults);
  elements.spamAction.addEventListener("change", updateCustomFolderState);
  elements.attentionFolderRefresh?.addEventListener("click", () => loadAttentionFolderStatus({ showStatus: true }));
  elements.attentionFolderOpen?.addEventListener("click", openFolderPicker);
  elements.reprocessUnread?.addEventListener("click", reprocessUnreadMessages);
  elements.cancelReprocessUnread?.addEventListener("click", cancelReprocessUnreadMessages);
  if (elements.promptTestButton) {
    elements.promptTestButton.addEventListener("click", runPromptTest);
  }
  elements.refreshLog.addEventListener("click", loadClassificationLog);
  elements.clearLog.addEventListener("click", clearClassificationLog);
  elements.openMessageDebugger?.addEventListener("click", () => openMessageDebugPage());
  elements.openMessageDebuggerLog?.addEventListener("click", () => openMessageDebugPage());
  document.addEventListener("click", handleSenderActionClick);
  document.addEventListener("click", handleLogActionClick);
  elements.refreshSenderStats?.addEventListener("click", () => loadSenderStats({ showStatus: true }));
  elements.refreshUnreadDomains?.addEventListener("click", () => loadUnreadDomains({ showStatus: true }));
  elements.unreadDomainsUndo?.addEventListener("click", undoUnreadDomainAction);
  elements.addBlockAddress?.addEventListener("click", () => handleManualBlockAdd("address"));
  elements.addBlockDomain?.addEventListener("click", () => handleManualBlockAdd("domain"));
  elements.manualBlockAddress?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleManualBlockAdd("address");
    }
  });
  elements.manualBlockDomain?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleManualBlockAdd("domain");
    }
  });
  elements.clearStatsButtons.forEach((button) => {
    button.addEventListener("click", () => handleClearStats(button.dataset.clearTarget));
  });
  if (browser?.storage?.onChanged) {
    browser.storage.onChanged.addListener(handleStorageChanged);
  }
}

function handleStorageChanged(changes, area) {
  if (area !== "local" || !changes || typeof changes !== "object") {
    return;
  }
  const changedKeys = Object.keys(changes);
  if (!changedKeys.length) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(changes, "classificationLog")) {
    const nextLog = changes.classificationLog?.newValue;
    state.classificationLog = Array.isArray(nextLog) ? nextLog : [];
    renderClassificationLog();
  }
  if (Object.prototype.hasOwnProperty.call(changes, "reprocessUnreadJob")) {
    state.reprocessUnreadJob = normalizeReprocessUnreadJob(changes.reprocessUnreadJob?.newValue);
    renderReprocessUnreadStatus();
  }
  const relevant = changedKeys.some((key) => SETTINGS_SYNC_KEYS.has(key));
  if (!relevant) {
    return;
  }
  scheduleSettingsSync();
}

function scheduleSettingsSync() {
  if (settingsSyncTimer) {
    clearTimeout(settingsSyncTimer);
  }
  settingsSyncTimer = setTimeout(async () => {
    settingsSyncTimer = null;
    try {
      await loadSettings();
      syncDebuggerWithSettings();
      setSaveStatus("Settings updated from latest saved values.");
    } catch (error) {
      console.error("Failed to sync settings after storage change", error);
    }
  }, SETTINGS_SYNC_DEBOUNCE_MS);
}

function setupTabs() {
  if (!elements.tabButtons?.length || !elements.tabPanels?.length) {
    return;
  }
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tabTarget);
    });
  });
  const defaultTab = state.activeTab || elements.tabButtons[0]?.dataset.tabTarget || "model";
  activateTab(defaultTab);
}

function activateTab(tabId) {
  if (!tabId) {
    return;
  }
  state.activeTab = tabId;
  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tabTarget === tabId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.tabIndex = isActive ? 0 : -1;
  });
  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabId);
  });
  if (tabId === "unread") {
    loadUnreadDomains();
    scheduleUnreadDomainAutoRefresh();
  } else {
    clearUnreadDomainAutoRefresh();
  }
  if (tabId === "attention") {
    loadReprocessUnreadStatus();
  }
}

function handleProviderChange() {
  const provider = elements.modelProvider?.value || "openai";
  state.settings.modelProvider = provider;
  updateProviderVisibility();
  updateOpenAiProviderCopy();
  if (provider === "ollama") {
    refreshModels(true);
  } else {
    if (state.settings.openAiModel && elements.openAiModel) {
      setOpenAiModelValue(state.settings.openAiModel);
    }
    setModelStatus(getNonOllamaStatusMessage());
  }
}

function updateProviderVisibility() {
  const provider = elements.modelProvider?.value || "openai";
  const isOllama = provider === "ollama";
  if (elements.ollamaSettings) {
    elements.ollamaSettings.classList.toggle("hidden", !isOllama);
  }
  if (elements.openAiSettings) {
    elements.openAiSettings.classList.toggle("hidden", isOllama);
  }
  if (elements.refreshModels) {
    elements.refreshModels.disabled = !isOllama;
  }
  if (elements.ollamaModel) {
    elements.ollamaModel.disabled = !isOllama;
  }
  if (elements.ollamaUrl) {
    elements.ollamaUrl.disabled = !isOllama;
  }
}

function updateOpenAiProviderCopy() {
  const provider = elements.modelProvider?.value || "openai";
  const isOpenAi = provider === "openai";
  if (elements.openAiApiKeyLabel) {
    elements.openAiApiKeyLabel.textContent = isOpenAi ? "OpenAI API key" : "API key (optional)";
  }
  if (elements.openAiApiKeyHint) {
    elements.openAiApiKeyHint.classList.toggle("hidden", !isOpenAi);
  }
  if (elements.openAiBaseUrlLabel) {
    elements.openAiBaseUrlLabel.textContent = isOpenAi ? "Base URL" : "Local API base URL";
  }
  if (elements.openAiBaseUrlHint) {
    elements.openAiBaseUrlHint.textContent = isOpenAi
      ? "Set an OpenAI-compatible API base URL. Leave as-is for the default OpenAI endpoint."
      : "Set the base URL for your local OpenAI-compatible server (for example, http://127.0.0.1:1234/v1).";
  }
  if (elements.openAiBaseUrl) {
    elements.openAiBaseUrl.placeholder = isOpenAi ? "https://api.openai.com/v1" : "http://127.0.0.1:1234/v1";
  }
}

function getNonOllamaStatusMessage() {
  const provider = elements.modelProvider?.value || "openai";
  if (provider === "openai") {
    return "OpenAI API selected. Configure your API key and model below.";
  }
  if (provider === "openai_compatible") {
    return "Local OpenAI-compatible endpoint selected. Configure the base URL and model below.";
  }
  return "";
}

async function handleManualBlockAdd(type) {
  const input = type === "domain" ? elements.manualBlockDomain : elements.manualBlockAddress;
  if (!input) {
    return;
  }
  const value = input.value.trim();
  if (!value) {
    setSaveStatus(`Enter a ${type === "domain" ? "domain" : "full email address"} to block.`);
    return;
  }
  input.disabled = true;
  const button = type === "domain" ? elements.addBlockDomain : elements.addBlockAddress;
  if (button) {
    button.disabled = true;
  }
  const normalizedValue = type === "domain" ? normalizeDomainValue(value) : value.toLowerCase();
  try {
    const success = await blockSenderValue(type, normalizedValue, null);
    if (success) {
      input.value = "";
    }
  } finally {
    input.disabled = false;
    if (button) {
      button.disabled = false;
    }
  }
}

function handleSenderActionClick(event) {
  const target = event.target.closest("[data-sender-action]");
  if (!target) {
    return;
  }
  const action = target.dataset.senderAction;
  const type = target.dataset.senderType;
  const value = target.dataset.senderValue;
  if (!action || !type || !value) {
    return;
  }
  if (action === "block") {
    blockSenderValue(type, value, target);
  } else if (action === "unblock") {
    unblockSenderValue(type, value, target);
  } else if (action === "remove_stat") {
    removeSenderStat(type, value, target);
  }
}

document.addEventListener("click", handleUnreadDomainActionClick);

function handleUnreadDomainActionClick(event) {
  const target = event.target.closest("[data-unread-domain-action]");
  if (!target) {
    return;
  }
  const action = target.dataset.unreadDomainAction;
  const domain = target.dataset.domain;
  if (!action || !domain) {
    return;
  }
  if (action === "mark_read") {
    markUnreadDomainAsRead(domain, target);
  } else if (action === "block_domain") {
    blockUnreadDomain(domain, target);
  } else if (action === "mark_spam") {
    markUnreadDomainAsSpam(domain, target);
  } else if (action === "delete") {
    deleteUnreadDomainMessages(domain, target);
  }
}

async function markUnreadDomainAsRead(domain, button) {
  if (!domain) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  setUnreadDomainsStatus(`Marking ${domain} as read…`);
  try {
    const response = await browser.runtime.sendMessage({
      type: "markDomainReadEverywhere",
      payload: { domain }
    });
    if (!response?.ok) {
      setUnreadDomainsStatus(response?.message || "Failed to mark domain as read.");
      return;
    }
    removeUnreadDomainRow(domain, button);
    setUnreadUndoState("mark_read", domain, response?.undo);
    await loadUnreadDomains();
    setUnreadDomainsStatus(`Marked ${response.markedCount ?? 0} message(s) from ${domain} as read.`);
  } catch (error) {
    console.error("Failed to mark domain as read", error);
    setUnreadDomainsStatus("Failed to mark domain as read.");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function blockUnreadDomain(domain, button) {
  if (!domain) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  setUnreadDomainsStatus(`Blocking ${domain}…`);
  try {
    const response = await browser.runtime.sendMessage({
      type: "blockSender",
      payload: { blockType: "domain", value: domain }
    });
    if (!response?.ok) {
      setUnreadDomainsStatus(response?.message || "Failed to block domain.");
      return;
    }
    removeUnreadDomainRow(domain, button);
    setUnreadUndoState("block_domain", domain, { domain });
    await loadUnreadDomains();
    setUnreadDomainsStatus(`Blocked ${domain}.`);
  } catch (error) {
    console.error("Failed to block domain", error);
    setUnreadDomainsStatus("Failed to block domain.");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function markUnreadDomainAsSpam(domain, button) {
  if (!domain) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  setUnreadDomainsStatus(`Marking ${domain} as spam…`);
  try {
    const response = await browser.runtime.sendMessage({
      type: "markDomainSpamEverywhere",
      payload: { domain }
    });
    if (!response?.ok) {
      setUnreadDomainsStatus(response?.message || "Failed to mark domain as spam.");
      return;
    }
    removeUnreadDomainRow(domain, button);
    setUnreadUndoState("mark_spam", domain, response?.undo);
    await loadUnreadDomains();
    setUnreadDomainsStatus(`Marked ${response.markedCount ?? 0} message(s) from ${domain} as spam.`);
  } catch (error) {
    console.error("Failed to mark domain as spam", error);
    setUnreadDomainsStatus("Failed to mark domain as spam.");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function deleteUnreadDomainMessages(domain, button) {
  if (!domain) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  setUnreadDomainsStatus(`Deleting ${domain} unread messages…`);
  try {
    const response = await browser.runtime.sendMessage({
      type: "deleteDomainUnreadEverywhere",
      payload: { domain }
    });
    if (!response?.ok) {
      setUnreadDomainsStatus(response?.message || "Failed to delete unread messages.");
      return;
    }
    removeUnreadDomainRow(domain, button);
    setUnreadUndoState("delete", domain, response?.undo);
    await loadUnreadDomains();
    setUnreadDomainsStatus(`Deleted ${response.deletedCount ?? 0} message(s) from ${domain}.`);
  } catch (error) {
    console.error("Failed to delete unread messages", error);
    setUnreadDomainsStatus("Failed to delete unread messages.");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

function scheduleUnreadDomainAutoRefresh() {
  clearUnreadDomainAutoRefresh();
  state.unreadRefreshTimer = window.setInterval(() => {
    if (state.activeTab === "unread") {
      loadUnreadDomains();
    }
  }, 60000);
}

function clearUnreadDomainAutoRefresh() {
  if (state.unreadRefreshTimer) {
    window.clearInterval(state.unreadRefreshTimer);
    state.unreadRefreshTimer = null;
  }
}

function openFolderPicker() {
  if (!elements.customFolder) {
    return;
  }
  if (!state.folders?.length) {
    loadFolders();
    return;
  }
  elements.customFolder.focus();
}

function removeUnreadDomainRow(domain, button) {
  const row = button?.closest("tr");
  if (row) {
    row.remove();
  }
  if (!elements.unreadDomainsBody?.children?.length) {
    elements.unreadDomainsEmpty?.classList.remove("hidden");
  }
}

function setUnreadUndoState(action, domain, undoPayload) {
  state.lastUnreadAction = undoPayload
    ? { action, domain, undo: undoPayload }
    : null;
  if (elements.unreadDomainsUndo) {
    elements.unreadDomainsUndo.classList.toggle("hidden", !state.lastUnreadAction);
  }
}

async function undoUnreadDomainAction() {
  const last = state.lastUnreadAction;
  if (!last) {
    return;
  }
  setUnreadDomainsStatus(`Undoing ${last.domain}…`);
  try {
    if (last.action === "block_domain") {
      await browser.runtime.sendMessage({
        type: "unblockSender",
        payload: { blockType: "domain", value: last.domain }
      });
    } else {
      await browser.runtime.sendMessage({
        type: "undoUnreadDomainAction",
        payload: { action: last.action, undo: last.undo }
      });
    }
    await loadUnreadDomains();
    setUnreadDomainsStatus(`Undid action for ${last.domain}.`);
  } catch (error) {
    console.error("Failed to undo unread action", error);
    setUnreadDomainsStatus("Undo failed.");
  } finally {
    setUnreadUndoState(null, null, null);
  }
}

async function blockSenderValue(type, value, button) {
  if (!value) {
    return false;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    const response = await browser.runtime.sendMessage({
      type: "blockSender",
      payload: { blockType: type, value }
    });
    if (!response?.ok) {
      console.error("Failed to block sender", response?.message);
      setSaveStatus(response?.message || "Could not block sender.");
      return false;
    }
    state.settings.blockedSenders = response.blockedSenders || [];
    state.settings.blockedDomains = response.blockedDomains || [];
    renderBlocklist();
    renderSenderStats();
    await loadUsageStats();
    setSaveStatus(`Blocked ${value}.`);
    return true;
  } catch (error) {
    console.error("Failed to block sender", error);
    setSaveStatus("Block failed. Check console for details.");
    return false;
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function removeSenderStat(type, value, button) {
  if (!value) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    await browser.runtime.sendMessage({
      type: "removeSenderStat",
      payload: { statType: type, value }
    });
    await loadSenderStats();
    setSenderStatsStatus(`Removed ${value} from top ${type === "domain" ? "domains" : "addresses"}.`);
  } catch (error) {
    console.error("Failed to remove sender stat", error);
    setSenderStatsStatus("Remove failed. Check console for details.");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function handleClearStats(target) {
  if (!target) {
    return;
  }
  try {
    await browser.runtime.sendMessage({ type: "clearSenderStats", payload: { statType: target } });
    await loadSenderStats();
    setSenderStatsStatus(`Cleared ${target === "domains" ? "domain" : "email"} stats.`);
  } catch (error) {
    console.error("Failed to clear sender stats", error);
    setSenderStatsStatus("Clear failed. Check console for details.");
  }
}

async function unblockSenderValue(type, value, button) {
  if (!value) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    const response = await browser.runtime.sendMessage({
      type: "unblockSender",
      payload: { blockType: type, value }
    });
    if (!response?.ok) {
      console.error("Failed to unblock sender", response?.message);
      setSaveStatus(response?.message || "Could not unblock sender.");
      return;
    }
    state.settings.blockedSenders = response.blockedSenders || [];
    state.settings.blockedDomains = response.blockedDomains || [];
    renderBlocklist();
    renderSenderStats();
    await loadUsageStats();
    setSaveStatus(`Removed ${value} from block list.`);
  } catch (error) {
    console.error("Failed to unblock sender", error);
    setSaveStatus("Unblock failed. Check console for details.");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function loadFolders() {
  try {
    const folders = await browser.runtime.sendMessage({ type: "listFolders" });
    state.folders = Array.isArray(folders) ? folders : [];
    populateFolderDropdown();
  } catch (error) {
    console.error("Failed to load folders", error);
  }
}

function populateFolderDropdown() {
  const select = elements.customFolder;
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a folder…";
  select.appendChild(placeholder);

  state.folders.forEach((folder) => {
    const option = document.createElement("option");
    option.value = JSON.stringify({ accountId: folder.accountId, path: folder.path });
    option.textContent = folder.displayPath;
    select.appendChild(option);
  });

  if (state.settings?.customFolder) {
    setSelectedFolder(state.settings.customFolder);
  }
}

async function loadSenderStats(options = {}) {
  const { showStatus = false } = options;
  let hadError = false;
  if (elements.refreshSenderStats) {
    elements.refreshSenderStats.disabled = true;
  }
  if (showStatus) {
    setSenderStatsStatus("Refreshing…");
  }
  try {
    const stats = await browser.runtime.sendMessage({ type: "getSenderStats" });
    state.senderStats = {
      addresses: Array.isArray(stats?.addresses) ? stats.addresses : [],
      domains: Array.isArray(stats?.domains) ? stats.domains : []
    };
    renderSenderStats();
  } catch (error) {
    console.error("Failed to load sender stats", error);
    hadError = true;
    if (showStatus) {
      setSenderStatsStatus("Failed to refresh.");
    }
  } finally {
    if (elements.refreshSenderStats) {
      elements.refreshSenderStats.disabled = false;
    }
    if (showStatus && !hadError) {
      setSenderStatsStatus("");
    }
  }
}

async function loadUsageStats() {
  try {
    const stats = await browser.runtime.sendMessage({ type: "getUsageStats" });
    state.usageStats = stats;
    renderUsageStats(stats);
  } catch (error) {
    console.error("Failed to load usage stats", error);
  }
}

async function loadUnreadDomains(options = {}) {
  const { showStatus = false } = options;
  if (elements.refreshUnreadDomains) {
    elements.refreshUnreadDomains.disabled = true;
  }
  if (showStatus) {
    setUnreadDomainsStatus("Refreshing…");
  }
  try {
    const stats = await browser.runtime.sendMessage({ type: "getUnreadDomainStats", payload: { limit: 20 } });
    state.unreadDomains = Array.isArray(stats) ? stats : [];
    renderUnreadDomains();
  } catch (error) {
    console.error("Failed to load unread domains", error);
    if (showStatus) {
      setUnreadDomainsStatus("Failed to refresh.");
    }
  } finally {
    if (elements.refreshUnreadDomains) {
      elements.refreshUnreadDomains.disabled = false;
    }
    if (showStatus) {
      setUnreadDomainsStatus("");
    }
  }
}

async function loadAttentionFolderStatus(options = {}) {
  const { showStatus = false } = options;
  if (elements.attentionFolderRefresh) {
    elements.attentionFolderRefresh.disabled = true;
  }
  if (showStatus) {
    setAttentionFolderStatus("Checking…");
  }
  try {
    const response = await browser.runtime.sendMessage({ type: "getAttentionFolderStatus" });
    renderAttentionFolderStatus(response);
    if (Array.isArray(response?.missing) && response.missing.length === 0) {
      await browser.runtime.sendMessage({ type: "attentionFoldersCreated" });
    }
  } catch (error) {
    console.error("Failed to load attention folder status", error);
    if (showStatus) {
      setAttentionFolderStatus("Failed to check folders.");
    }
  } finally {
    if (elements.attentionFolderRefresh) {
      elements.attentionFolderRefresh.disabled = false;
    }
  }
}

function renderUsageStats(stats) {
  if (!stats) {
    setStatValue(elements.statsLlmToday, "–");
    setStatValue(elements.statsLlmWeek, "–");
    setStatValue(elements.statsLlmMonth, "–");
    setStatValue(elements.statsLlmTotal, "–");
    setStatValue(elements.statsPrefilterToday, "–");
    setStatValue(elements.statsPrefilterWeek, "–");
    setStatValue(elements.statsPrefilterMonth, "–");
    setStatValue(elements.statsPrefilterTotal, "–");
    setStatValue(elements.statsSpamSummary, "–");
    setStatValue(elements.statsNotSpamSummary, "–");
    setStatValue(elements.statsErrorSummary, "–");
    setStatValue(elements.statsBlockedAddresses, "–");
    setStatValue(elements.statsBlockedDomains, "–");
    return;
  }
  const llm = stats.llmCalls || {};
  setStatValue(elements.statsLlmToday, llm.today ?? 0);
  setStatValue(elements.statsLlmWeek, llm.week ?? 0);
  setStatValue(elements.statsLlmMonth, llm.month ?? 0);
  setStatValue(elements.statsLlmTotal, llm.total ?? 0);

  const prefiltered = stats.preFiltered || {};
  setStatValue(elements.statsPrefilterToday, prefiltered.today ?? 0);
  setStatValue(elements.statsPrefilterWeek, prefiltered.week ?? 0);
  setStatValue(elements.statsPrefilterMonth, prefiltered.month ?? 0);
  setStatValue(elements.statsPrefilterTotal, prefiltered.total ?? 0);

  setStatValue(elements.statsSpamSummary, formatSummaryLine(stats.spam));
  setStatValue(elements.statsNotSpamSummary, formatSummaryLine(stats.notSpam));
  setStatValue(elements.statsErrorSummary, formatSummaryLine(stats.error));

  setStatValue(elements.statsBlockedAddresses, stats?.totals?.blockedAddresses ?? 0);
  setStatValue(elements.statsBlockedDomains, stats?.totals?.blockedDomains ?? 0);
}

function renderUnreadDomains() {
  const tbody = elements.unreadDomainsBody;
  if (!tbody) {
    return;
  }
  tbody.innerHTML = "";
  const entries = Array.isArray(state.unreadDomains) ? state.unreadDomains : [];
  if (!entries.length) {
    elements.unreadDomainsEmpty?.classList.remove("hidden");
    return;
  }
  elements.unreadDomainsEmpty?.classList.add("hidden");
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    const domain = entry?.domain || "";
    const count = typeof entry?.count === "number" ? entry.count : Number(entry?.count) || 0;
    row.innerHTML = `
      <td>${escapeHtml(domain)}</td>
      <td>${count}</td>
      <td>
        <div class="table-buttons">
          <button type="button" data-unread-domain-action="mark_read" data-domain="${escapeHtml(domain)}">
            Mark as read
          </button>
          <button type="button" data-unread-domain-action="block_domain" data-domain="${escapeHtml(domain)}">
            Block domain
          </button>
          <button type="button" data-unread-domain-action="mark_spam" data-domain="${escapeHtml(domain)}">
            Mark as spam
          </button>
          <button type="button" data-unread-domain-action="delete" data-domain="${escapeHtml(domain)}">
            Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderAttentionFolderStatus(status) {
  const missingList = elements.attentionFolderMissing;
  if (!missingList) {
    return;
  }
  missingList.innerHTML = "";
  const missing = Array.isArray(status?.missing) ? status.missing : [];
  if (!missing.length) {
    setAttentionFolderStatus("All attention folders are available.");
    return;
  }
  setAttentionFolderStatus(`Missing ${missing.length} folder${missing.length === 1 ? "" : "s"}.`);
  missing.forEach((name) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${escapeHtml(name)}</span>
      <button type="button" data-attention-folder-copy="${escapeHtml(name)}">Copy name</button>
    `;
    missingList.appendChild(item);
  });
}

function renderSenderStats() {
  renderSenderTable(
    elements.senderAddressesBody,
    elements.senderAddressesEmpty,
    state.senderStats.addresses,
    "address"
  );
  renderSenderTable(
    elements.senderDomainsBody,
    elements.senderDomainsEmpty,
    state.senderStats.domains,
    "domain"
  );
}

function renderSenderTable(tbody, emptyElement, items, type) {
  if (!tbody) {
    return;
  }
  tbody.innerHTML = "";
  const entries = Array.isArray(items)
    ? items.filter((entry) => !isValueBlocked(type, entry?.value))
    : [];
  if (!entries.length) {
    if (emptyElement) {
      emptyElement.classList.remove("hidden");
    }
    return;
  }
  if (emptyElement) {
    emptyElement.classList.add("hidden");
  }
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    const value = entry?.value || "";
    const count = typeof entry?.count === "number" ? entry.count : Number(entry?.count) || 0;
    const blocked = isValueBlocked(type, value);
    const safeValue = escapeHtml(value);
    const actionCell = value
      ? `<div class="table-buttons">
          <button type="button" data-sender-action="block" data-sender-type="${type}" data-sender-value="${escapeHtml(
            value
          )}" ${blocked ? "disabled" : ""}>${blocked ? "Blocked" : "Block"}</button>
          <button type="button" data-sender-action="remove_stat" data-sender-type="${type}" data-sender-value="${escapeHtml(
            value
          )}">Remove</button>
        </div>`
      : "";
    row.innerHTML = `
      <td title="${safeValue}">${safeValue}</td>
      <td>${count}</td>
      <td>${actionCell}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderBlocklist() {
  renderBlockListGroup(
    elements.blockedAddressesList,
    elements.blockedAddressesEmpty,
    state.settings.blockedSenders || [],
    "address"
  );
  renderBlockListGroup(
    elements.blockedDomainsList,
    elements.blockedDomainsEmpty,
    state.settings.blockedDomains || [],
    "domain"
  );
}

function renderBlockListGroup(listElement, emptyElement, values, type) {
  if (!listElement) {
    return;
  }
  listElement.innerHTML = "";
  const entries = Array.isArray(values) ? values : [];
  if (!entries.length) {
    if (emptyElement) {
      emptyElement.classList.remove("hidden");
    }
    return;
  }
  if (emptyElement) {
    emptyElement.classList.add("hidden");
  }
  entries.forEach((value) => {
    const item = document.createElement("li");
    const safeValue = escapeHtml(value);
    item.innerHTML = `
      <span title="${safeValue}">${safeValue}</span>
      <button type="button" data-sender-action="unblock" data-sender-type="${type}" data-sender-value="${escapeHtml(
        value
      )}">Remove</button>
    `;
    listElement.appendChild(item);
  });
}

async function loadSettings() {
  try {
    const settings = await browser.runtime.sendMessage({ type: "getSettings" });
    const provider = settings.modelProvider || "openai";
    const blockedSenders = normalizeBlockValues(settings.blockedSenders);
    const blockedDomains = normalizeBlockValues(settings.blockedDomains);
    state.settings = {
      ...settings,
      modelProvider: provider,
      openAiApiKey: settings.openAiApiKey || "",
      openAiModel: settings.openAiModel || "",
      openAiBaseUrl: settings.openAiBaseUrl || "",
      ollamaModel: settings.ollamaModel || settings.selectedModel || "",
      blockedSenders,
      blockedDomains
    };
    elements.modelProvider.value = provider;
    elements.ollamaUrl.value = settings.ollamaUrl ?? "";
    if (elements.openAiBaseUrl) {
      elements.openAiBaseUrl.value = state.settings.openAiBaseUrl;
    }
    if (elements.openAiApiKey) {
      elements.openAiApiKey.value = state.settings.openAiApiKey;
    }
    if (elements.openAiModel) {
      const openAiValue =
        state.settings.openAiModel ||
        (provider === "openai" || provider === "openai_compatible" ? settings.selectedModel : "") ||
        elements.openAiModel.value ||
        DEFAULT_OPENAI_MODEL;
      setOpenAiModelValue(openAiValue);
      state.settings.openAiModel = openAiValue;
    }
    elements.promptTemplate.value =
      typeof settings.promptTemplate === "string"
        ? settings.promptTemplate
        : DEFAULT_CUSTOM_INSTRUCTIONS;
    if (elements.attentionPromptTemplate) {
      elements.attentionPromptTemplate.value =
        typeof settings.attentionPromptTemplate === "string"
          ? settings.attentionPromptTemplate
          : DEFAULT_ATTENTION_INSTRUCTIONS;
    }
    elements.spamAction.value = settings.spamAction ?? "move_junk";
    elements.debugLogging.checked = Boolean(settings.debugLogging);
    if (elements.filterDelay) {
      elements.filterDelay.value = Number.isFinite(settings.filterDelayMs) ? settings.filterDelayMs : 1500;
    }
    if (elements.attentionRoutingEnabled) {
      elements.attentionRoutingEnabled.checked = settings.attentionRoutingEnabled !== false;
    }
    if (elements.attentionLowMax) {
      elements.attentionLowMax.value = Number.isFinite(settings.attentionLowMax) ? settings.attentionLowMax : 4;
    }
    if (elements.attentionFolderLow) {
      elements.attentionFolderLow.value = settings.attentionFolderLow ?? "Attention - Low Priority";
    }
    if (elements.attentionCopySpam) {
      elements.attentionCopySpam.checked = Boolean(settings.attentionCopySpam);
    }
    if (elements.attentionMoveDelay) {
      const delayMs = Number(settings.attentionMoveDelayMs ?? 5000);
      elements.attentionMoveDelay.value = Number.isFinite(delayMs) ? Math.max(1, Math.round(delayMs / 1000)) : 5;
    }
    if (elements.attentionReturnInterval) {
      elements.attentionReturnInterval.value = clampAttentionInterval(
        settings.attentionReturnIntervalMin,
        DEFAULT_ATTENTION_RETURN_INTERVAL_MINUTES
      );
    }
    if (provider === "ollama") {
      setSelectedModel(settings.selectedModel || state.settings.ollamaModel);
    }
    setSelectedFolder(settings.customFolder);
    renderBlocklist();
  } catch (error) {
    console.error("Failed to load settings", error);
  }
}

function setSelectedModel(model) {
  if (!model) {
    return;
  }
  const existing = Array.from(elements.ollamaModel.options).find((opt) => opt.value === model);
  if (!existing) {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    elements.ollamaModel.appendChild(option);
  }
  elements.ollamaModel.value = model;
  state.settings.selectedModel = model;
}

function setSelectedFolder(folderSetting) {
  if (!folderSetting) {
    elements.customFolder.value = "";
    return;
  }
  const targetValue = JSON.stringify(folderSetting);
  const option = Array.from(elements.customFolder.options).find((opt) => opt.value === targetValue);
  if (option) {
    elements.customFolder.value = option.value;
    return;
  }
  const fallback = document.createElement("option");
  fallback.value = targetValue;
  fallback.textContent = `${folderSetting.accountId} ➝ ${folderSetting.path}`;
  elements.customFolder.appendChild(fallback);
  elements.customFolder.value = fallback.value;
}

async function refreshModels(force = false) {
  if (elements.modelProvider?.value !== "ollama") {
    setModelStatus("");
    return;
  }
  setModelStatus("Checking models…");
  try {
    const models = await browser.runtime.sendMessage({ type: "listModels", force });
    const desiredModel = state.settings.ollamaModel || state.settings.selectedModel;
    updateModelOptions(models, desiredModel);
    const count = Array.isArray(models) ? models.length : 0;
    if (!count) {
      setModelStatus("No models detected. Use `ollama pull` to download one.");
      return;
    }
    setModelStatus(`Loaded ${count} model${count === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error("Unable to refresh models", error);
    setModelStatus("Could not reach Ollama. Is it running?");
  }
}

async function runPromptTest() {
  if (!elements.promptTestButton) {
    return;
  }
  const provider = elements.modelProvider?.value || "openai";
  const selectedModel =
    provider === "ollama" ? elements.ollamaModel.value : elements.openAiModel?.value?.trim() || "";
  const payload = {
    modelProvider: provider,
    ollamaUrl: elements.ollamaUrl.value.trim() || "http://127.0.0.1:11434",
    selectedModel,
    promptTemplate: elements.promptTemplate.value,
    attentionPromptTemplate: elements.attentionPromptTemplate?.value || "",
    openAiApiKey: elements.openAiApiKey?.value?.trim() || "",
    openAiModel: elements.openAiModel?.value?.trim() || "",
    openAiBaseUrl: elements.openAiBaseUrl?.value?.trim() || "https://api.openai.com/v1",
    sample: {
      from: elements.promptTestFrom?.value?.trim() || "",
      to: elements.promptTestTo?.value?.trim() || "",
      subject: elements.promptTestSubject?.value?.trim() || "",
      body: elements.promptTestBody?.value || "",
      date: new Date().toISOString()
    }
  };

  if (provider === "openai") {
    if (!payload.openAiApiKey) {
      setPromptTestStatus("Enter an OpenAI API key before running a test.", "error");
      return;
    }
    if (!payload.selectedModel) {
      setPromptTestStatus("Set an OpenAI model ID before running a test.", "error");
      return;
    }
    ensureOpenAiModelOption(payload.selectedModel);
    state.settings.openAiModel = payload.selectedModel;
  } else if (provider === "openai_compatible") {
    if (!payload.selectedModel) {
      setPromptTestStatus("Set a model ID before running a test.", "error");
      return;
    }
    ensureOpenAiModelOption(payload.selectedModel);
    state.settings.openAiModel = payload.selectedModel;
  } else {
    state.settings.ollamaModel = payload.selectedModel;
  }
  state.settings.selectedModel = payload.selectedModel;
  setPromptTestStatus("Running prompt test…", "info");
  clearPromptTestOutput();
  elements.promptTestButton.disabled = true;

  try {
    const result = await browser.runtime.sendMessage({ type: "testPrompt", payload });
    state.lastPromptTest = result;
    if (Array.isArray(result?.models)) {
      updateModelOptions(result.models, result.selectedModel || payload.selectedModel);
    }
    if (result?.selectedModel) {
      if (provider === "ollama" && elements.ollamaModel) {
        elements.ollamaModel.value = result.selectedModel;
        state.settings.selectedModel = result.selectedModel;
        state.settings.ollamaModel = result.selectedModel;
      } else if ((provider === "openai" || provider === "openai_compatible") && elements.openAiModel) {
        elements.openAiModel.value = result.selectedModel;
        state.settings.selectedModel = result.selectedModel;
        state.settings.openAiModel = result.selectedModel;
      }
    }

    let tone = "success";
    let message = result?.message || "Prompt test completed (dry run; no mail changed).";
    const parsed = result?.parsed;
    if (!result?.ok) {
      tone = "error";
      if (!message) {
        message = "Prompt test failed.";
      }
    } else if (parsed) {
      if (parsed.attentionScore === null || parsed.needsAttention === null) {
        tone = "error";
        message = "Prompt test failed: attention fields are missing in the response.";
      } else {
        tone = parsed.classification === "spam" ? "warning" : "success";
        const confidence =
          typeof parsed.confidence === "number"
            ? ` (confidence ${(parsed.confidence * 100).toFixed(1)}%)`
            : "";
        message = `Dry run classified as ${parsed.classification}${confidence}. No mail was changed.`;
      }
    }
    setPromptTestStatus(message, tone);
    renderPromptTestOutput(result);
  } catch (error) {
    console.error("Failed to test prompt", error);
    setPromptTestStatus(`Prompt test failed: ${error.message || error}`, "error");
  } finally {
    elements.promptTestButton.disabled = false;
  }
}

async function saveSettings() {
  clearStatus();
  const provider = elements.modelProvider?.value || "openai";
  const openAiModel = elements.openAiModel?.value?.trim() || "";
  let openAiBaseUrl = elements.openAiBaseUrl?.value?.trim() || "";
  if (!openAiBaseUrl) {
    openAiBaseUrl = "https://api.openai.com/v1";
  }
  const selectedModel =
    provider === "ollama" ? elements.ollamaModel.value : openAiModel;
  ensureOpenAiModelOption(openAiModel);
  const payload = {
    modelProvider: provider,
    ollamaUrl: elements.ollamaUrl.value.trim() || "http://127.0.0.1:11434",
    selectedModel,
    ollamaModel: elements.ollamaModel.value,
    openAiApiKey: elements.openAiApiKey?.value?.trim() || "",
    openAiModel,
    openAiBaseUrl,
    promptTemplate: elements.promptTemplate.value,
    attentionPromptTemplate: elements.attentionPromptTemplate?.value || "",
    attentionRoutingEnabled: elements.attentionRoutingEnabled?.checked ?? true,
    attentionLowMax: clampAttentionThreshold(elements.attentionLowMax?.value, 4),
    attentionFolderLow: elements.attentionFolderLow?.value?.trim() || "Attention - Low Priority",
    attentionCopySpam: elements.attentionCopySpam?.checked ?? false,
    attentionMoveDelayMs: clampAttentionDelay(elements.attentionMoveDelay?.value, 5) * 1000,
    attentionReturnIntervalMin: clampAttentionInterval(
      elements.attentionReturnInterval?.value,
      DEFAULT_ATTENTION_RETURN_INTERVAL_MINUTES
    ),
    spamAction: elements.spamAction.value,
    debugLogging: elements.debugLogging.checked,
    filterDelayMs: elements.filterDelay ? clampFilterDelay(elements.filterDelay.value) : 1500,
    blockedSenders: state.settings.blockedSenders || [],
    blockedDomains: state.settings.blockedDomains || []
  };
  if (elements.filterDelay) {
    elements.filterDelay.value = payload.filterDelayMs;
  }
  if (elements.spamAction.value === "move_custom" && elements.customFolder.value) {
    payload.customFolder = JSON.parse(elements.customFolder.value);
  } else {
    payload.customFolder = null;
  }

  try {
    const requiresPromptTest = hasPromptRelevantChanges(state.settings, payload);
    const saveResult = await browser.runtime.sendMessage({ type: "saveSettings", payload });
    if (!saveResult?.ok) {
      const message = saveResult?.message || "Save failed.";
      setSaveStatus(message);
      setPromptTestStatus(message, "error");
      return false;
    }
    state.settings = { ...state.settings, ...payload };
    state.settings.selectedModel = selectedModel;
    state.settings.openAiApiKey = payload.openAiApiKey;
    if (provider === "ollama") {
      state.settings.ollamaModel = selectedModel;
    } else {
      state.settings.openAiModel = selectedModel;
      state.settings.openAiBaseUrl = payload.openAiBaseUrl;
    }
    if (requiresPromptTest) {
      setSaveStatus("Saved. Run prompt test to verify attention fields.");
      setPromptTestStatus("Model or endpoint changed. Run prompt test to validate.", "warning");
    } else {
      setSaveStatus("Saved.");
    }
    return true;
  } catch (error) {
    console.error("Failed to save settings", error);
    setSaveStatus("Save failed. Check console for details.");
    return false;
  }
}

async function loadPreviousConfig() {
  if (!elements.loadPreviousConfig) {
    return;
  }
  clearStatus();
  elements.loadPreviousConfig.disabled = true;
  try {
    const latest = await browser.runtime.sendMessage({ type: "getLatestConfigBackup" });
    if (!latest?.ok || !latest.backup) {
      setSaveStatus(latest?.message || "No previous config backup found.");
      return;
    }
    const savedAt = formatTimestamp(latest.backup.savedAt);
    const details = [
      `Load the previous ThunderSpam AI configuration saved at ${savedAt}?`,
      "",
      "This will replace the current saved settings, including provider, model, prompts, folders, blocklists, and any API key stored in the backup.",
      "Unsaved edits on this page will be discarded."
    ].join("\n");
    if (!window.confirm(details)) {
      setSaveStatus("Previous config load canceled.");
      return;
    }
    setSaveStatus("Loading previous config…");
    const result = await browser.runtime.sendMessage({
      type: "restoreLatestConfigBackup",
      payload: { expectedHash: latest.backup.hash || "", confirmed: true }
    });
    if (!result?.ok) {
      setSaveStatus(result?.message || "Could not load previous config.");
      return;
    }
    await loadSettings();
    updateProviderVisibility();
    updateOpenAiProviderCopy();
    updateCustomFolderState();
    syncDebuggerWithSettings();
    if (elements.modelProvider?.value === "ollama") {
      await refreshModels(true);
    } else {
      setModelStatus(getNonOllamaStatusMessage());
    }
    setSaveStatus(`Loaded previous config from ${formatTimestamp(result.backup?.savedAt || latest.backup.savedAt)}.`);
  } catch (error) {
    console.error("Failed to load previous config", error);
    setSaveStatus("Could not load previous config. Check console for details.");
  } finally {
    elements.loadPreviousConfig.disabled = false;
  }
}

function restoreDefaults() {
  if (elements.modelProvider) {
    elements.modelProvider.value = "openai";
    state.settings.modelProvider = "openai";
  }
  elements.ollamaUrl.value = "http://127.0.0.1:11434";
  elements.promptTemplate.value = DEFAULT_CUSTOM_INSTRUCTIONS;
  if (elements.attentionPromptTemplate) {
    elements.attentionPromptTemplate.value = DEFAULT_ATTENTION_INSTRUCTIONS;
  }
  if (elements.attentionRoutingEnabled) {
    elements.attentionRoutingEnabled.checked = true;
  }
  if (elements.attentionLowMax) {
    elements.attentionLowMax.value = 4;
  }
  if (elements.attentionFolderLow) {
    elements.attentionFolderLow.value = "Attention - Low Priority";
  }
  if (elements.attentionCopySpam) {
    elements.attentionCopySpam.checked = false;
  }
  if (elements.attentionMoveDelay) {
    elements.attentionMoveDelay.value = 5;
  }
  if (elements.attentionReturnInterval) {
    elements.attentionReturnInterval.value = DEFAULT_ATTENTION_RETURN_INTERVAL_MINUTES;
  }
  elements.spamAction.value = "move_junk";
  elements.customFolder.value = "";
  elements.debugLogging.checked = true;
  if (elements.ollamaModel.options.length) {
    elements.ollamaModel.selectedIndex = 0;
  }
  if (elements.openAiBaseUrl) {
    elements.openAiBaseUrl.value = "https://api.openai.com/v1";
    state.settings.openAiBaseUrl = "https://api.openai.com/v1";
  }
  if (elements.openAiApiKey) {
    elements.openAiApiKey.value = "";
    state.settings.openAiApiKey = "";
  }
  if (elements.openAiModel) {
    setOpenAiModelValue(DEFAULT_OPENAI_MODEL);
    state.settings.openAiModel = DEFAULT_OPENAI_MODEL;
  }
  state.settings.selectedModel = elements.ollamaModel.value || "";
  state.settings.ollamaModel = state.settings.selectedModel;
  state.settings.blockedSenders = [];
  state.settings.blockedDomains = [];
  state.settings.promptTemplate = DEFAULT_CUSTOM_INSTRUCTIONS;
  state.settings.attentionPromptTemplate = DEFAULT_ATTENTION_INSTRUCTIONS;
  state.settings.attentionRoutingEnabled = true;
  state.settings.attentionLowMax = 4;
  state.settings.attentionFolderLow = "Attention - Low Priority";
  state.settings.attentionCopySpam = false;
  state.settings.attentionMoveDelayMs = 5000;
  state.settings.attentionReturnIntervalMin = DEFAULT_ATTENTION_RETURN_INTERVAL_MINUTES;
  if (elements.filterDelay) {
    elements.filterDelay.value = 1500;
    state.settings.filterDelayMs = 1500;
  }
  updateCustomFolderState();
  updateProviderVisibility();
  renderBlocklist();
}

function updateCustomFolderState() {
  const shouldEnable = elements.spamAction.value === "move_custom";
  elements.customFolder.disabled = !shouldEnable;
}

function setSaveStatus(text) {
  if (elements.saveStatus) {
    elements.saveStatus.textContent = text;
  }
  if (elements.saveStatusTop) {
    elements.saveStatusTop.textContent = text;
  }
  window.setTimeout(() => {
    if (elements.saveStatus && elements.saveStatus.textContent === text) {
      elements.saveStatus.textContent = "";
    }
    if (elements.saveStatusTop && elements.saveStatusTop.textContent === text) {
      elements.saveStatusTop.textContent = "";
    }
  }, 5000);
}

function clearStatus() {
  if (elements.saveStatus) {
    elements.saveStatus.textContent = "";
  }
  if (elements.saveStatusTop) {
    elements.saveStatusTop.textContent = "";
  }
}

function setModelStatus(text) {
  elements.modelStatus.textContent = text;
}

function clampFilterDelay(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return Math.max(0, Math.min(60000, numeric));
}

function clampAttentionThreshold(value, fallback) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(10, numeric));
}

function clampAttentionDelay(value, fallback) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(300, numeric));
}

function clampAttentionInterval(value, fallback) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(60, numeric));
}

function hasPromptRelevantChanges(previous, next) {
  const prev = previous || {};
  const nextValue = next || {};
  if (prev.modelProvider !== nextValue.modelProvider) {
    return true;
  }
  if ((prev.ollamaUrl || "") !== (nextValue.ollamaUrl || "")) {
    return true;
  }
  if ((prev.openAiBaseUrl || "") !== (nextValue.openAiBaseUrl || "")) {
    return true;
  }
  if ((prev.openAiModel || "") !== (nextValue.openAiModel || "")) {
    return true;
  }
  if ((prev.ollamaModel || "") !== (nextValue.ollamaModel || "")) {
    return true;
  }
  if ((prev.selectedModel || "") !== (nextValue.selectedModel || "")) {
    return true;
  }
  return false;
}

function setPromptTestStatus(text, tone = "info") {
  const el = elements.promptTestStatus;
  if (!el) {
    return;
  }
  el.textContent = text;
  el.classList.remove("status-success", "status-warning", "status-error");
  if (text && tone && tone !== "info") {
    el.classList.add(`status-${tone}`);
  }
}

function clearPromptTestOutput() {
  const output = elements.promptTestOutput;
  if (!output) {
    return;
  }
  output.textContent = "";
  output.classList.add("hidden");
  state.lastPromptTest = null;
}

function renderPromptTestOutput(result) {
  const output = elements.promptTestOutput;
  if (!output) {
    return;
  }
  if (!result) {
    clearPromptTestOutput();
    return;
  }
  const payload = {
    classification: result?.parsed,
    response: result?.response,
    stats: result?.stats || undefined,
    message: result?.message || undefined,
    promptPreview: result?.promptPreview || undefined,
    attentionPromptPreview: result?.attentionPromptPreview || undefined
  };
  output.textContent = JSON.stringify(payload, null, 2);
  output.classList.remove("hidden");
}

function updateModelOptions(models, desired) {
  const select = elements.ollamaModel;
  select.innerHTML = "";
  state.settings = state.settings || {};
  if (!Array.isArray(models) || models.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No models found";
    select.appendChild(option);
    select.value = "";
    state.settings.selectedModel = "";
    state.settings.ollamaModel = "";
    return;
  }
  models.forEach((model) => {
    if (!model?.name) {
      return;
    }
    const option = document.createElement("option");
    option.value = model.name;
    option.textContent = model.name;
    select.appendChild(option);
  });
  if (select.options.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No models found";
    select.appendChild(option);
    select.value = "";
    state.settings.selectedModel = "";
    return;
  }
  const hasDesired = desired && models.some((model) => model?.name === desired);
  const chosen = hasDesired ? desired : models[0].name;
  select.value = chosen;
  state.settings.selectedModel = chosen;
  state.settings.ollamaModel = chosen;
}

async function loadClassificationLog() {
  try {
    const log = await browser.runtime.sendMessage({ type: "getClassificationLog" });
    state.classificationLog = Array.isArray(log) ? log : [];
    renderClassificationLog();
  } catch (error) {
    console.error("Failed to load classification log", error);
  }
}

function renderClassificationLog() {
  const tbody = elements.logTableBody;
  tbody.innerHTML = "";
  if (!state.classificationLog.length) {
    elements.logEmpty.classList.remove("hidden");
    return;
  }
  elements.logEmpty.classList.add("hidden");

  state.classificationLog.forEach((entry) => {
    const row = document.createElement("tr");
    const unsubscribe = formatUnsubscribeForDisplay(entry.unsubscribeLink);
    const unsubscribeTitle = escapeHtml(unsubscribe.title);
    const unsubscribeContent = unsubscribe.href
      ? `<a href="${escapeHtml(unsubscribe.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          unsubscribe.display
        )}</a>`
      : escapeHtml(unsubscribe.display);
    const classificationBlockButtons = getBlockButtons(entry.from || "");
    const attentionFlag = formatAttentionFlag(entry.needsAttention);
    const attentionScore = formatAttentionScore(entry.attentionScore);
    const reasonCode = entry.reasonCode ? String(entry.reasonCode) : "";
    const endpointSummary = [entry.spamEndpoint, entry.attentionEndpoint].filter(Boolean).join(" | ");
    const parsedMessageId = parseFiniteMessageId(entry.id);
    const messageId = parsedMessageId !== null ? String(parsedMessageId) : "";
    const internetMessageId = String(entry.messageId || "").trim();
    const accountId = String(entry.accountId || "").trim();
    const folder = String(entry.folder || "").trim();
    const debugDataAttrs = [
      `data-log-message-id="${escapeHtml(messageId)}"`,
      `data-log-internet-message-id="${escapeHtml(internetMessageId)}"`,
      `data-log-account-id="${escapeHtml(accountId)}"`,
      `data-log-folder="${escapeHtml(folder)}"`
    ].join(" ");
    const hasDebugLocator = Boolean(messageId || internetMessageId);
    const debugButtons = hasDebugLocator
      ? `<div class="inline-actions">
          <button type="button" class="inline-action" data-log-action="open_debug" ${debugDataAttrs}>Open debugger</button>
          <button type="button" class="inline-action" data-log-action="retry_debug" ${debugDataAttrs}>Retry</button>
        </div>`
      : "";
    const fromActions = `${classificationBlockButtons}${debugButtons}`;
    row.innerHTML = `
      <td>${formatTimestamp(entry.timestamp)}</td>
      <td title="${escapeHtml(entry.subject || "")}">${escapeHtml(truncate(entry.subject, 60))}</td>
      <td title="${escapeHtml(entry.from || "")}">
        ${escapeHtml(truncate(entry.from, 40))}
        ${fromActions}
      </td>
      <td>${escapeHtml(entry.provider || "")}</td>
      <td>${escapeHtml(entry.model || "")}</td>
      <td title="${escapeHtml(endpointSummary)}">${escapeHtml(truncate(endpointSummary, 64))}</td>
      <td class="classification-${escapeHtml((entry.classification || "").replace(/\s+/g, "_"))}">${escapeHtml(entry.classification || "")}</td>
      <td>${escapeHtml(reasonCode)}</td>
      <td>${formatScore(entry.score)}</td>
      <td>${escapeHtml(attentionFlag)}</td>
      <td>${escapeHtml(attentionScore)}</td>
      <td>${escapeHtml(entry.action || "none")}</td>
      <td title="${unsubscribeTitle}">${unsubscribeContent}</td>
      <td title="${escapeHtml(entry.reason || "")}">${escapeHtml(truncate(entry.reason, 80))}</td>
      <td title="${escapeHtml(entry.rawResponse || "")}">${escapeHtml(truncate(entry.rawResponse, 80))}</td>
    `;
    tbody.appendChild(row);
  });
}

function setDebugStatus(text, tone = "info") {
  const el = elements.debugStatus;
  if (!el) {
    return;
  }
  el.textContent = text || "";
  el.classList.remove("status-success", "status-warning", "status-error");
  if (text && tone && tone !== "info") {
    el.classList.add(`status-${tone}`);
  }
}

function clearDebugOutput() {
  if (!elements.debugOutput) {
    return;
  }
  elements.debugOutput.textContent = "";
  elements.debugOutput.classList.add("hidden");
}

function renderDebugOutput(payload) {
  if (!elements.debugOutput) {
    return;
  }
  elements.debugOutput.textContent = JSON.stringify(payload, null, 2);
  elements.debugOutput.classList.remove("hidden");
}

function syncDebuggerWithSettings() {
  if (elements.debugProvider) {
    elements.debugProvider.value = state.settings.modelProvider || "openai";
  }
  if (elements.debugModel) {
    if ((state.settings.modelProvider || "openai") === "ollama") {
      elements.debugModel.value = state.settings.ollamaModel || state.settings.selectedModel || "";
    } else {
      elements.debugModel.value = state.settings.openAiModel || state.settings.selectedModel || "";
    }
  }
  if (elements.debugBaseUrl) {
    if ((state.settings.modelProvider || "openai") === "ollama") {
      elements.debugBaseUrl.value = state.settings.ollamaUrl || "http://127.0.0.1:11434";
    } else {
      elements.debugBaseUrl.value = state.settings.openAiBaseUrl || "https://api.openai.com/v1";
    }
  }
  if (elements.debugApiKey) {
    elements.debugApiKey.value = state.settings.openAiApiKey || "";
  }
  if (elements.debugPromptTemplate) {
    elements.debugPromptTemplate.value = state.settings.promptTemplate || "";
  }
  if (elements.debugAttentionPromptTemplate) {
    elements.debugAttentionPromptTemplate.value = state.settings.attentionPromptTemplate || "";
  }
}

function parseDebugAttachments(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function populateDebugContext(context = {}, options = {}) {
  const { keepOverrides = false } = options;
  state.debugContext = context || null;
  if (elements.debugMessageId) {
    elements.debugMessageId.value = context?.id ? String(context.id) : "";
  }
  if (elements.debugFolder) {
    elements.debugFolder.value = context?.folder || "";
  }
  if (elements.debugFrom) {
    elements.debugFrom.value = context?.from || "";
  }
  if (elements.debugTo) {
    elements.debugTo.value = context?.to || "";
  }
  if (elements.debugSubject) {
    elements.debugSubject.value = context?.subject || "";
  }
  if (elements.debugDate) {
    elements.debugDate.value = context?.date || "";
  }
  if (elements.debugHeaders) {
    elements.debugHeaders.value = context?.headersText || "";
  }
  if (elements.debugBody) {
    elements.debugBody.value = context?.body || "";
  }
  if (elements.debugAttachments) {
    const attachmentValue = Array.isArray(context?.attachments) ? context.attachments.join(", ") : "";
    elements.debugAttachments.value = attachmentValue;
  }

  const entry = context?.lastClassification || {};
  if (elements.debugSpamPrompt) {
    elements.debugSpamPrompt.value = entry?.spamPrompt || "";
  }
  if (elements.debugAttentionPrompt) {
    elements.debugAttentionPrompt.value = entry?.attentionPrompt || "";
  }

  if (!keepOverrides) {
    if (elements.debugProvider) {
      elements.debugProvider.value = entry?.provider || state.settings.modelProvider || "openai";
    }
    if (elements.debugModel) {
      elements.debugModel.value = entry?.model || "";
    }
    if (elements.debugBaseUrl) {
      elements.debugBaseUrl.value =
        entry?.providerBaseUrl ||
        ((entry?.provider || state.settings.modelProvider || "openai") === "ollama"
          ? state.settings.ollamaUrl || "http://127.0.0.1:11434"
          : state.settings.openAiBaseUrl || "https://api.openai.com/v1");
    }
    if (elements.debugApiKey) {
      elements.debugApiKey.value = state.settings.openAiApiKey || "";
    }
    if (elements.debugPromptTemplate) {
      elements.debugPromptTemplate.value = state.settings.promptTemplate || "";
    }
    if (elements.debugAttentionPromptTemplate) {
      elements.debugAttentionPromptTemplate.value = state.settings.attentionPromptTemplate || "";
    }
  }
}

async function openDebugFromMessageId(messageId, options = {}) {
  const { runReplay = false } = options;
  const numericId = Number(messageId);
  if (!Number.isFinite(numericId)) {
    setDebugStatus("Invalid message ID for debugger.", "error");
    return;
  }
  setDebugStatus(`Loading message ${numericId}…`);
  try {
    const response = await browser.runtime.sendMessage({
      type: "getMessageDebugContext",
      payload: { messageId: numericId }
    });
    if (!response?.ok || !response?.context) {
      setDebugStatus(response?.message || "Could not load message debug context.", "error");
      return;
    }
    activateTab("diagnostics");
    populateDebugContext(response.context);
    clearDebugOutput();
    setDebugStatus("Message loaded for debug replay.", "success");
    if (runReplay) {
      await runDebugReplay();
    }
  } catch (error) {
    console.error("Failed to load message debug context", error);
    setDebugStatus("Failed to load message debug context.", "error");
  }
}

async function consumePendingDebugRequest() {
  try {
    const pending = await browser.runtime.sendMessage({ type: "consumePendingDebugRequest" });
    if (!pending?.messageId) {
      return;
    }
    await openDebugFromMessageId(pending.messageId);
  } catch (error) {
    console.error("Failed to consume pending debug request", error);
  }
}

function buildDebugReplayPayload() {
  const provider = elements.debugProvider?.value || state.settings.modelProvider || "openai";
  const modelValue = elements.debugModel?.value?.trim() || "";
  const baseUrlValue = elements.debugBaseUrl?.value?.trim() || "";
  const apiKeyValue = elements.debugApiKey?.value?.trim() || "";
  const sample = {
    from: elements.debugFrom?.value?.trim() || "",
    to: elements.debugTo?.value?.trim() || "",
    subject: elements.debugSubject?.value?.trim() || "",
    body: elements.debugBody?.value || "",
    date: elements.debugDate?.value?.trim() || new Date().toISOString(),
    headers: elements.debugHeaders?.value || "",
    attachments: parseDebugAttachments(elements.debugAttachments?.value || "")
  };
  return {
    modelProvider: provider,
    selectedModel: modelValue,
    openAiModel: modelValue,
    openAiApiKey: apiKeyValue,
    openAiBaseUrl:
      baseUrlValue || (provider === "ollama" ? "http://127.0.0.1:11434" : "https://api.openai.com/v1"),
    ollamaUrl: baseUrlValue || state.settings.ollamaUrl || "http://127.0.0.1:11434",
    promptTemplate: elements.debugPromptTemplate?.value || "",
    attentionPromptTemplate: elements.debugAttentionPromptTemplate?.value || "",
    spamPrompt: elements.debugSpamPrompt?.value || "",
    attentionPrompt: elements.debugAttentionPrompt?.value || "",
    sample
  };
}

async function runDebugReplay() {
  if (elements.debugRun) {
    elements.debugRun.disabled = true;
  }
  setDebugStatus("Running debug replay…");
  try {
    const payload = buildDebugReplayPayload();
    const result = await browser.runtime.sendMessage({ type: "testPrompt", payload });
    if (!result?.ok) {
      setDebugStatus(result?.message || "Debug replay failed.", "error");
      renderDebugOutput(result || { ok: false, message: "Debug replay failed." });
      return;
    }
    const parsed = result?.parsed || {};
    if (elements.debugSpamPrompt && typeof parsed.spamPrompt === "string" && parsed.spamPrompt.trim()) {
      elements.debugSpamPrompt.value = parsed.spamPrompt;
    }
    if (elements.debugAttentionPrompt && typeof parsed.attentionPrompt === "string") {
      elements.debugAttentionPrompt.value = parsed.attentionPrompt;
    }
    const attentionScoreText =
      typeof parsed.attentionScore === "number" ? `, attention_score ${parsed.attentionScore}` : "";
    setDebugStatus(
      `Replay completed: ${parsed.classification || "unknown"}${attentionScoreText}.`,
      parsed.classification === "error" ? "warning" : "success"
    );
    renderDebugOutput(result);
  } catch (error) {
    console.error("Debug replay failed", error);
    setDebugStatus("Debug replay failed.", "error");
  } finally {
    if (elements.debugRun) {
      elements.debugRun.disabled = false;
    }
  }
}

async function saveDebugValuesGlobally() {
  const provider = elements.debugProvider?.value || "openai";
  const modelValue = elements.debugModel?.value?.trim() || "";
  const baseUrlValue = elements.debugBaseUrl?.value?.trim() || "";
  const apiKeyValue = elements.debugApiKey?.value?.trim() || "";

  if (elements.modelProvider) {
    elements.modelProvider.value = provider;
  }
  handleProviderChange();

  if (provider === "ollama") {
    if (elements.ollamaUrl) {
      elements.ollamaUrl.value = baseUrlValue || "http://127.0.0.1:11434";
    }
    if (modelValue) {
      setSelectedModel(modelValue);
    }
  } else {
    if (elements.openAiBaseUrl) {
      elements.openAiBaseUrl.value = baseUrlValue || "https://api.openai.com/v1";
    }
    if (elements.openAiApiKey) {
      elements.openAiApiKey.value = apiKeyValue;
    }
    if (elements.openAiModel) {
      setOpenAiModelValue(modelValue || DEFAULT_OPENAI_MODEL);
    }
  }

  if (elements.promptTemplate) {
    elements.promptTemplate.value = elements.debugPromptTemplate?.value || "";
  }
  if (elements.attentionPromptTemplate) {
    elements.attentionPromptTemplate.value = elements.debugAttentionPromptTemplate?.value || "";
  }

  const ok = await saveSettings();
  if (ok) {
    setDebugStatus("Replay provider/model/prompts saved globally.", "success");
  } else {
    setDebugStatus("Could not save replay values globally.", "error");
  }
}

async function openMessageDebugPage(messageRef = null, autoReplay = false) {
  const payload = {
    autoReplay: Boolean(autoReplay)
  };
  if (messageRef && typeof messageRef === "object") {
    const numericId = parseFiniteMessageId(messageRef.messageId);
    if (numericId !== null) {
      payload.messageId = numericId;
    }
    const internetMessageId = String(messageRef.internetMessageId || "").trim();
    const accountId = String(messageRef.accountId || "").trim();
    const folder = String(messageRef.folder || "").trim();
    if (internetMessageId) {
      payload.internetMessageId = internetMessageId;
    }
    if (accountId) {
      payload.accountId = accountId;
    }
    if (folder) {
      payload.folder = folder;
    }
  } else {
    const numericId = parseFiniteMessageId(messageRef);
    if (numericId !== null) {
      payload.messageId = numericId;
    }
  }
  try {
    const result = await browser.runtime.sendMessage({
      type: "openMessageDebugPage",
      payload
    });
    if (!result?.ok) {
      setSaveStatus(result?.message || "Could not open message debugger.");
    }
  } catch (error) {
    console.error("Failed to open message debugger page", error);
    setSaveStatus("Could not open message debugger.");
  }
}

function handleLogActionClick(event) {
  const target = event.target.closest("[data-log-action]");
  if (!target) {
    return;
  }
  const action = target.dataset.logAction;
  const messageId = String(target.dataset.logMessageId || "").trim();
  const internetMessageId = String(target.dataset.logInternetMessageId || "").trim();
  const accountId = String(target.dataset.logAccountId || "").trim();
  const folder = String(target.dataset.logFolder || "").trim();
  if (!action || (!messageId && !internetMessageId)) {
    return;
  }
  const messageRef = {
    messageId,
    internetMessageId,
    accountId,
    folder
  };
  if (action === "open_debug") {
    openMessageDebugPage(messageRef, false);
    return;
  }
  if (action === "retry_debug") {
    openMessageDebugPage(messageRef, true);
  }
}

async function clearClassificationLog() {
  try {
    await browser.runtime.sendMessage({ type: "clearClassificationLog" });
    state.classificationLog = [];
    renderClassificationLog();
  } catch (error) {
    console.error("Failed to clear classification log", error);
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function formatScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return "";
  }
  return score.toFixed(2);
}

function formatAttentionFlag(value) {
  if (value === true) {
    return "Yes";
  }
  if (value === false) {
    return "No";
  }
  return "";
}

function formatAttentionScore(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  return String(value);
}

function parseFiniteMessageId(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatUnsubscribeForDisplay(value) {
  if (value === null || value === undefined) {
    return { title: "", display: "", href: "" };
  }
  const text = String(value).trim();
  if (!text) {
    return { title: "", display: "", href: "" };
  }
  return {
    title: text,
    display: truncate(text, 60),
    href: isSafeUnsubscribeHref(text) ? text : ""
  };
}

function truncate(value, length) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
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

function isSafeUnsubscribeHref(value) {
  const lowered = String(value || "").toLowerCase();
  return lowered.startsWith("http://") || lowered.startsWith("https://") || lowered.startsWith("mailto:");
}

function isValueBlocked(type, value) {
  if (!value || !type) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (type === "domain") {
    return (state.settings.blockedDomains || []).includes(normalized);
  }
  if ((state.settings.blockedSenders || []).includes(normalized)) {
    return true;
  }
  const rawDomain = normalized.includes("@") ? normalized.split("@")[1] : "";
  const domain = normalizeDomainValue(rawDomain);
  if (domain && (state.settings.blockedDomains || []).includes(domain)) {
    return true;
  }
  return false;
}

function normalizeBlockValues(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const unique = new Set();
  values.forEach((value) => {
    if (typeof value !== "string") {
      return;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized) {
      unique.add(normalized);
    }
  });
  return Array.from(unique);
}

function setSenderStatsStatus(text) {
  if (elements.senderStatsStatus) {
    elements.senderStatsStatus.textContent = text || "";
  }
}

function setUnreadDomainsStatus(text) {
  if (elements.unreadDomainsStatus) {
    elements.unreadDomainsStatus.textContent = text || "";
  }
}

function setAttentionFolderStatus(text) {
  if (elements.attentionFolderStatus) {
    elements.attentionFolderStatus.textContent = text || "";
  }
}

function setReprocessUnreadStatus(text) {
  if (elements.reprocessUnreadStatus) {
    elements.reprocessUnreadStatus.textContent = text || "";
  }
}

document.addEventListener("click", handleAttentionFolderCopy);

function handleAttentionFolderCopy(event) {
  const target = event.target.closest("[data-attention-folder-copy]");
  if (!target) {
    return;
  }
  const name = target.dataset.attentionFolderCopy;
  if (!name) {
    return;
  }
  copyToClipboard(name)
    .then(() => {
      setAttentionFolderStatus(`Copied "${name}" to clipboard.`);
    })
    .catch(() => {
      setAttentionFolderStatus("Copy failed. Select and copy the name manually.");
    });
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "");
  temp.style.position = "absolute";
  temp.style.left = "-9999px";
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}

async function reprocessUnreadMessages() {
  setReprocessUnreadStatus("Starting reprocess...");
  try {
    const response = await browser.runtime.sendMessage({ type: "reprocessUnread" });
    if (!response?.ok) {
      setReprocessUnreadStatus(response?.message || "Reprocess failed.");
      return;
    }
    state.reprocessUnreadJob = normalizeReprocessUnreadJob(response.job);
    renderReprocessUnreadStatus();
  } catch (error) {
    console.error("Failed to reprocess unread messages", error);
    setReprocessUnreadStatus("Reprocess failed.");
  }
}

async function cancelReprocessUnreadMessages() {
  if (elements.cancelReprocessUnread) {
    elements.cancelReprocessUnread.disabled = true;
  }
  setReprocessUnreadStatus("Canceling reprocess...");
  try {
    const response = await browser.runtime.sendMessage({ type: "cancelReprocessUnread" });
    if (!response?.ok) {
      setReprocessUnreadStatus(response?.message || "Cancel failed.");
      renderReprocessUnreadStatus();
      return;
    }
    state.reprocessUnreadJob = normalizeReprocessUnreadJob(response.job);
    renderReprocessUnreadStatus();
  } catch (error) {
    console.error("Failed to cancel reprocess unread", error);
    setReprocessUnreadStatus("Cancel failed.");
  }
}

async function loadReprocessUnreadStatus() {
  try {
    const response = await browser.runtime.sendMessage({ type: "getReprocessUnreadStatus" });
    state.reprocessUnreadJob = normalizeReprocessUnreadJob(response?.job);
    renderReprocessUnreadStatus();
  } catch (error) {
    console.error("Failed to load reprocess status", error);
  }
}

function normalizeReprocessUnreadJob(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const numeric = (value) => (Number.isFinite(value) ? value : Number.parseInt(value, 10) || 0);
  return {
    ...raw,
    queued: numeric(raw.queued),
    total: raw.total === null || raw.total === undefined ? null : numeric(raw.total),
    processed: numeric(raw.processed),
    skipped: numeric(raw.skipped),
    errors: numeric(raw.errors),
    moved: numeric(raw.moved),
    spamActions: numeric(raw.spamActions),
    timeouts: numeric(raw.timeouts),
    status: String(raw.status || "")
  };
}

function isReprocessUnreadRunning(job = state.reprocessUnreadJob) {
  return Boolean(job && (job.status === "running" || job.status === "cancel_requested"));
}

function renderReprocessUnreadStatus() {
  const job = state.reprocessUnreadJob;
  const running = isReprocessUnreadRunning(job);
  if (elements.reprocessUnread) {
    elements.reprocessUnread.disabled = running;
  }
  if (elements.cancelReprocessUnread) {
    elements.cancelReprocessUnread.disabled = !running || job?.status === "cancel_requested";
  }
  scheduleReprocessUnreadStatusRefresh(running);
  if (!job) {
    setReprocessUnreadStatus("");
    return;
  }
  const total = job.total ?? job.queued ?? 0;
  const denominator = total || "?";
  const counts = `${job.processed || 0}/${denominator}`;
  const outcomes =
    `${job.moved || 0} moved, ${job.spamActions || 0} spam action(s), ` +
    `${job.errors || 0} error(s), ${job.timeouts || 0} timeout(s)`;
  const currentSubject = job.current?.subject ? ` Current: ${truncate(job.current.subject, 80)}` : "";
  switch (job.status) {
    case "running":
      setReprocessUnreadStatus(`Running ${counts}: ${outcomes}.${currentSubject}`);
      break;
    case "cancel_requested":
      setReprocessUnreadStatus(`Canceling ${counts}: ${outcomes}.${currentSubject}`);
      break;
    case "completed":
      setReprocessUnreadStatus(`Completed ${counts}: ${outcomes}.`);
      refreshAfterReprocessFinishedOnce(job);
      break;
    case "canceled":
      setReprocessUnreadStatus(`Canceled ${counts}: ${outcomes}.`);
      refreshAfterReprocessFinishedOnce(job);
      break;
    case "interrupted":
      setReprocessUnreadStatus(`Interrupted ${counts}: ${outcomes}. Start again to continue.`);
      break;
    case "failed":
      setReprocessUnreadStatus(`Failed ${counts}: ${job.message || "Reprocess failed."}`);
      refreshAfterReprocessFinishedOnce(job);
      break;
    default:
      setReprocessUnreadStatus(job.message || "");
      break;
  }
}

function scheduleReprocessUnreadStatusRefresh(running) {
  if (state.reprocessUnreadTimer) {
    window.clearInterval(state.reprocessUnreadTimer);
    state.reprocessUnreadTimer = null;
  }
  if (!running) {
    return;
  }
  state.reprocessUnreadTimer = window.setInterval(() => {
    loadReprocessUnreadStatus();
  }, 1000);
}

function refreshAfterReprocessFinishedOnce(job = {}) {
  const key = `${job.jobId || "unknown"}:${job.status || "unknown"}`;
  if (state.lastReprocessFinishedKey === key) {
    return;
  }
  state.lastReprocessFinishedKey = key;
  runBackgroundTask("classification log", loadClassificationLog);
  runBackgroundTask("usage stats", loadUsageStats);
  if (state.activeTab === "unread") {
    runBackgroundTask("unread domains", loadUnreadDomains);
  }
}

function setStatValue(element, value) {
  if (!element) {
    return;
  }
  element.textContent = value ?? "0";
}

function formatSummaryLine(bucket = {}) {
  const today = bucket.today ?? 0;
  const week = bucket.week ?? 0;
  const month = bucket.month ?? 0;
  const total = bucket.total ?? 0;
  return `${today} / ${week} / ${month} / ${total}`;
}

function getBlockButtons(fromValue) {
  if (!fromValue) {
    return "";
  }
  const info = parseAddress(fromValue);
  if (!info.address && !info.domain) {
    return "";
  }
  const buttons = [];
  if (info.address) {
    buttons.push(
      `<button type="button" class="inline-action" data-sender-action="block" data-sender-type="address" data-sender-value="${escapeHtml(
        info.address
      )}">Block email</button>`
    );
  }
  if (info.domain) {
    buttons.push(
      `<button type="button" class="inline-action" data-sender-action="block" data-sender-type="domain" data-sender-value="${escapeHtml(
        info.domain
      )}">Block domain</button>`
    );
  }
  if (!buttons.length) {
    return "";
  }
  return `<div class="inline-actions">${buttons.join("")}</div>`;
}

function parseAddress(value) {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const address = match ? match[0].toLowerCase() : "";
  const rawDomain = address.includes("@") ? address.split("@")[1] : "";
  const domain = normalizeDomainValue(rawDomain);
  return { address, domain };
}

function normalizeDomainValue(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) {
    return "";
  }
  const parts = normalized.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return normalized;
  }
  const lastTwo = parts.slice(-2).join(".");
  const lastThree = parts.slice(-3).join(".");
  const knownSecondLevel = new Set([
    "co.uk",
    "org.uk",
    "gov.uk",
    "ac.uk",
    "sch.uk",
    "com.au",
    "net.au",
    "org.au",
    "edu.au",
    "gov.au",
    "co.nz",
    "org.nz",
    "gov.nz",
    "ac.nz",
    "co.jp",
    "ne.jp",
    "or.jp",
    "co.in",
    "net.in",
    "org.in",
    "ac.in",
    "edu.in",
    "gov.in",
    "com.br",
    "net.br",
    "org.br",
    "com.mx",
    "com.ar",
    "com.tr",
    "com.sa",
    "com.sg",
    "com.my",
    "com.ph",
    "co.za",
    "co.kr",
    "or.kr",
    "co.id",
    "web.id",
    "co.il",
    "org.il",
    "co.th",
    "co.ke",
    "co.ug",
    "co.tz",
    "co.gh",
    "com.tw",
    "com.hk",
    "com.cn",
    "net.cn",
    "org.cn"
  ]);
  if (knownSecondLevel.has(lastTwo)) {
    return lastThree;
  }
  return lastTwo;
}

function initializeOpenAiModelOptions() {
  if (!elements.openAiModelList) {
    return;
  }
  const list = elements.openAiModelList;
  const existing = new Set(Array.from(list.options).map((option) => option.value));
  OPENAI_MODEL_PRESETS.forEach((model) => {
    if (!existing.has(model)) {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      list.appendChild(option);
    }
  });
}

function ensureOpenAiModelOption(value) {
  if (!elements.openAiModelList || !value) {
    return;
  }
  const list = elements.openAiModelList;
  const exists = Array.from(list.options).some((option) => option.value === value);
  if (!exists) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    list.appendChild(option);
  }
}

function setOpenAiModelValue(value) {
  if (!elements.openAiModel) {
    return;
  }
  if (!value) {
    ensureOpenAiModelOption(DEFAULT_OPENAI_MODEL);
    elements.openAiModel.value = DEFAULT_OPENAI_MODEL;
    return;
  }
  ensureOpenAiModelOption(value);
  elements.openAiModel.value = value;
}
