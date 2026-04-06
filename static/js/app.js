/**
 * LLM Top 10 Security Lab — Main App Logic
 * Vanilla ES6+, no frameworks.
 */

import { t } from "./i18n.js";

// =============================================================================
// STATE
// =============================================================================

const state = {
  lang: "en",
  mode: "attack",          // attack | defend | custom | scorecard
  attacks: [],             // populated from /api/attacks
  selectedAttackId: null,
  attackResults: {},        // attack_id -> last result
  running: false,
  scorecardResults: null,
  scorecardRunning: false,
  scorecardProgress: { completed: 0, total: 0 },
};

// =============================================================================
// DOM REFS
// =============================================================================

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const dom = {};

function cacheDom() {
  dom.sidebar = $(".sidebar");
  dom.attackList = $(".sidebar__attacks");
  dom.modeButtons = $$(".mode-btn");
  dom.main = $(".main");
  dom.hamburger = $(".hamburger");
  dom.langButtons = $$(".lang-toggle__btn");
  dom.overlay = $(".sidebar-overlay");
}

function toggleSidebar(open) {
  const isOpen = open ?? !dom.sidebar.classList.contains("sidebar--open");
  dom.sidebar.classList.toggle("sidebar--open", isOpen);
  dom.overlay.classList.toggle("sidebar-overlay--open", isOpen);
}

// =============================================================================
// HELPERS
// =============================================================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderMd(str) {
  // Escape first, then apply minimal markdown: **bold**, `code`
  let out = escapeHtml(str);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/`([^`]+)`/g, '<code style="background:var(--bg);padding:1px 5px;border-radius:3px;font-size:12px;">$1</code>');
  return out;
}

function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  dom.langButtons.forEach((btn) => {
    btn.classList.toggle("lang-toggle__btn--active", btn.dataset.lang === lang);
  });
  $(".header__title-text").textContent = t("app_title", lang);
  renderSidebar();
  renderMain();
}

// =============================================================================
// API
// =============================================================================

async function fetchJSON(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || body.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error(t("error_timeout", state.lang));
    throw err;
  }
}

async function loadAttacks() {
  try {
    const data = await fetchJSON("/api/attacks");
    state.attacks = data.attacks;
  } catch (err) {
    console.error("Failed to load attacks:", err);
    state.attacks = [];
  }
}

async function runAttack(attackId, userPrompt, canary) {
  return fetchJSON("/api/attack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attack_id: attackId, user_prompt: userPrompt || undefined, canary }),
  });
}

async function runDefend(attackId, userPrompt, canary, defenses) {
  return fetchJSON("/api/defend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attack_id: attackId, user_prompt: userPrompt || undefined, canary, defenses }),
  });
}

async function runCustom(systemPrompt, context, userPrompt, canary) {
  return fetchJSON("/api/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_prompt: systemPrompt, context: context || undefined, user_prompt: userPrompt, canary }),
  });
}

async function runScorecard(canary) {
  return fetchJSON("/api/scorecard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ canary }),
  });
}

// =============================================================================
// SIDEBAR RENDERING
// =============================================================================

function renderSidebar() {
  const lang = state.lang;

  // Attack list
  dom.attackList.innerHTML = state.attacks
    .map((atk) => {
      const isActive = atk.id === state.selectedAttackId;
      const result = state.attackResults[atk.id];
      let statusIcon = "\u2013";
      let statusClass = "attack-item__status--pending";
      if (result) {
        if (result.success) {
          statusIcon = "\u2717";
          statusClass = "attack-item__status--fail";
        } else {
          statusIcon = "\u2713";
          statusClass = "attack-item__status--success";
        }
      }
      return `
        <div class="attack-item${isActive ? " attack-item--active" : ""}" data-id="${atk.id}" tabindex="0" role="button" aria-label="${escapeHtml(atk.label)}">
          <div class="attack-item__id">
            <span>${escapeHtml(atk.owasp_id)}${atk.id.startsWith("llm01b") ? "b" : atk.id.startsWith("llm01a") ? "a" : ""}</span>
            <span class="attack-item__status ${statusClass}">${statusIcon}</span>
          </div>
          <div class="attack-item__name">${escapeHtml(atk.label.replace(/ \(LLM\d+\)/, ""))}</div>
          <div class="attack-item__badge">${escapeHtml(atk.owasp_name)}</div>
        </div>`;
    })
    .join("");

  // Attack item click handlers
  dom.attackList.querySelectorAll(".attack-item").forEach((el) => {
    el.addEventListener("click", () => selectAttack(el.dataset.id));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectAttack(el.dataset.id); }
    });
  });

  // Mode buttons
  dom.modeButtons.forEach((btn) => {
    btn.classList.toggle("mode-btn--active", btn.dataset.mode === state.mode);
  });
}

function selectAttack(id) {
  state.selectedAttackId = id;
  // Close mobile sidebar
  toggleSidebar(false);
  renderSidebar();
  renderMain();
}

// =============================================================================
// MAIN PANEL RENDERING
// =============================================================================

function renderMain() {
  switch (state.mode) {
    case "attack":  renderAttackMode(); break;
    case "defend":  renderDefendMode(); break;
    case "custom":  renderCustomMode(); break;
    case "scorecard": renderScorecardMode(); break;
  }
}

// -- Attack Mode -----------------------------------------------------------

function renderAttackMode() {
  const lang = state.lang;
  const atk = state.attacks.find((a) => a.id === state.selectedAttackId);

  if (!atk) {
    dom.main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">\u2694\ufe0f</div>
        <div class="empty-state__text">${t("empty_title", lang)}</div>
        <div class="empty-state__sub">${t("empty_sub", lang)}</div>
      </div>`;
    return;
  }

  const result = state.attackResults[atk.id];
  const canaryVisible = atk.has_canary;

  dom.main.innerHTML = `
    <div class="attack-header fade-in">
      <div class="attack-header__owasp">${escapeHtml(atk.owasp_id)} \u00b7 ${escapeHtml(atk.owasp_name)}</div>
      <h1 class="attack-header__title">${escapeHtml(atk.label.replace(/ \(LLM\d+\)/, ""))}</h1>
      <p class="attack-header__desc">${escapeHtml(atk.description)}</p>
    </div>
    <div class="form-group">
      <label for="user-prompt">${t("label_user_prompt", lang)}</label>
      <textarea id="user-prompt" rows="4">${escapeHtml(atk.default_user_prompt)}</textarea>
    </div>
    ${canaryVisible ? `
    <div class="form-group">
      <label for="canary">${t("label_canary", lang)}</label>
      <input type="text" id="canary" value="BANANA SUNDAE" />
      <div class="form-group__hint">${t("canary_hint", lang)}</div>
    </div>` : ""}
    <button class="btn btn--primary" id="btn-run" ${state.running ? "disabled" : ""}>
      ${state.running ? `<span class="spinner"></span> ${t("btn_running", lang)}` : `\u25b6 ${t("btn_run_attack", lang)}`}
    </button>
    <div id="results-area" style="margin-top:20px;">
      ${state.running ? renderSkeletons() : ""}
      ${result ? renderAttackResult(result) : ""}
    </div>`;

  // Bind run button
  const btnRun = $("#btn-run");
  btnRun.addEventListener("click", () => handleRunAttack(atk));
}

function renderSkeletons() {
  return `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
}

function renderAttackResult(r) {
  const lang = state.lang;
  const cause = r.cause;
  const effect = r.effect;
  const impact = r.impact;

  let causeContent = "";

  // System prompt
  if (cause.system_prompt) {
    causeContent += `
      <div class="code-block__label">${t("label_system", lang)}</div>
      <div class="code-block">${escapeHtml(cause.system_prompt)}</div>`;
  }

  // Context documents
  if (cause.context_documents && cause.context_documents.length > 0) {
    causeContent += `<div class="code-block__label">${t("label_context_docs", lang)}</div>`;
    cause.context_documents.forEach((doc) => {
      const isInjection = doc === cause.injection_text;
      if (isInjection) {
        causeContent += `
          <div class="injection-callout__label">${escapeHtml(cause.injection_label || t("label_injection", lang))}</div>
          <div class="injection-callout">${escapeHtml(doc)}</div>`;
      } else {
        causeContent += `<div class="code-block">${escapeHtml(doc)}</div>`;
      }
    });
  }

  // User prompt / injection
  if (cause.injection_text && !cause.context_documents) {
    causeContent += `
      <div class="injection-callout__label">${escapeHtml(cause.injection_label || t("label_injection", lang))}</div>
      <div class="injection-callout">${escapeHtml(cause.injection_text)}</div>`;
  } else if (cause.user_prompt && !cause.context_documents) {
    causeContent += `
      <div class="code-block__label">${t("label_user_message", lang)}</div>
      <div class="code-block">${escapeHtml(cause.user_prompt)}</div>`;
  }

  if (cause.user_prompt && cause.context_documents) {
    causeContent += `
      <div class="code-block__label">${t("label_user_message", lang)}</div>
      <div class="code-block">${escapeHtml(cause.user_prompt)}</div>`;
  }

  // Effect — model response with canary highlighted
  const modelResponse = effect.model_response || "";

  // Impact
  const isSucceeded = impact.verdict === "ATTACK_SUCCEEDED";
  const verdictIcon = isSucceeded ? "\ud83d\udea8" : "\u2705";
  const verdictText = isSucceeded ? t("verdict_succeeded", lang) : t("verdict_blocked", lang);
  const verdictClass = isSucceeded ? "verdict--succeeded" : "verdict--blocked";

  // Full prompt
  let fullPromptHtml = "";
  if (r.full_prompt && r.full_prompt.messages) {
    fullPromptHtml = r.full_prompt.messages
      .map((m) => `<strong>[${escapeHtml(m.role)}]</strong>\n${escapeHtml(m.content)}`)
      .join("\n\n---\n\n");
  }

  return `
    <div class="card fade-in">
      <div class="card__header">
        <span class="card__title">${t("title_cause", lang)}</span>
        <span class="card__badge">${escapeHtml(r.owasp_id || "")}</span>
      </div>
      <div class="card__text">${escapeHtml(cause.description || "")}</div>
      ${causeContent}
      ${cause.how_it_works ? `<div class="card__text" style="margin-top:8px;">${escapeHtml(cause.how_it_works)}</div>` : ""}
    </div>

    <div class="card fade-in">
      <div class="card__header">
        <span class="card__title">${t("title_effect", lang)}</span>
      </div>
      <div class="code-block__label">${t("label_model_response", lang)}</div>
      <div class="model-output">${modelResponse}</div>
      <div class="card__text" style="margin-top:12px;">${renderMd(effect.explanation || "")}</div>
    </div>

    <div class="card fade-in">
      <div class="card__header">
        <span class="card__title">${t("title_impact", lang)}</span>
      </div>
      <div class="${verdictClass}">${verdictIcon} ${verdictText}</div>
      <div class="card__text" style="margin-top:8px;">${escapeHtml(impact.consequence || "")}</div>
      ${impact.attack_type ? `<div class="card__text" style="color:var(--text-muted);font-size:12px;">${escapeHtml(impact.attack_type)}</div>` : ""}
    </div>

    <div class="collapsible" id="full-prompt-collapsible">
      <button class="collapsible__trigger" aria-expanded="false">
        <span class="collapsible__arrow">\u25b6</span>
        ${t("label_full_prompt", lang)}
      </button>
      <div class="collapsible__body">
        <div class="model-output">${fullPromptHtml}</div>
      </div>
    </div>`;
}

async function handleRunAttack(atk) {
  if (state.running) return;
  state.running = true;
  renderMain();

  const userPrompt = $("#user-prompt")?.value || atk.default_user_prompt;
  const canary = $("#canary")?.value || "BANANA SUNDAE";

  try {
    const result = await runAttack(atk.id, userPrompt, canary);
    state.attackResults[atk.id] = result;
  } catch (err) {
    state.attackResults[atk.id] = null;
    alert(err.message || t("error_generic", state.lang));
  } finally {
    state.running = false;
    renderSidebar();
    renderMain();
    bindCollapsibles();
  }
}

// -- Defend Mode -----------------------------------------------------------

function renderDefendMode() {
  const lang = state.lang;
  const atk = state.attacks.find((a) => a.id === state.selectedAttackId);

  if (!atk) {
    dom.main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">\ud83d\udee1\ufe0f</div>
        <div class="empty-state__text">${t("empty_title", lang)}</div>
        <div class="empty-state__sub">${t("empty_sub", lang)}</div>
      </div>`;
    return;
  }

  dom.main.innerHTML = `
    <div class="attack-header fade-in">
      <div class="attack-header__owasp">${escapeHtml(atk.owasp_id)} \u00b7 ${escapeHtml(atk.owasp_name)}</div>
      <h1 class="attack-header__title">${escapeHtml(atk.label.replace(/ \(LLM\d+\)/, ""))}</h1>
      <p class="attack-header__desc">${escapeHtml(atk.description)}</p>
    </div>
    <div class="form-group">
      <label>${t("label_select_defenses", lang)}</label>
      <div class="defense-toggles">
        <label class="defense-toggle"><input type="checkbox" value="prompt_guard" checked /><span>\ud83d\udee1 ${t("defense_prompt_guard", lang)}</span></label>
        <label class="defense-toggle"><input type="checkbox" value="output_scan" checked /><span>\ud83d\udcca ${t("defense_output_scan", lang)}</span></label>
        <label class="defense-toggle"><input type="checkbox" value="context_scan" checked /><span>\ud83d\udcc4 ${t("defense_context_scan", lang)}</span></label>
        <label class="defense-toggle"><input type="checkbox" value="hardening" checked /><span>\ud83d\udd12 ${t("defense_hardening", lang)}</span></label>
        <label class="defense-toggle"><input type="checkbox" value="guardrail" checked /><span>\ud83e\udd16 ${t("defense_guardrail", lang)}</span></label>
      </div>
    </div>
    <div class="form-group">
      <label for="user-prompt-d">${t("label_user_prompt", lang)}</label>
      <textarea id="user-prompt-d" rows="4">${escapeHtml(atk.default_user_prompt)}</textarea>
    </div>
    ${atk.has_canary ? `
    <div class="form-group">
      <label for="canary-d">${t("label_canary", lang)}</label>
      <input type="text" id="canary-d" value="BANANA SUNDAE" />
    </div>` : ""}
    <button class="btn btn--primary" id="btn-run-defend" ${state.running ? "disabled" : ""}>
      ${state.running ? `<span class="spinner"></span> ${t("btn_running", lang)}` : `\ud83d\udee1 ${t("btn_run_attack", lang)}`}
    </button>
    <div id="results-area" style="margin-top:20px;">
      ${state.running ? renderSkeletons() : ""}
      <div id="defend-results"></div>
    </div>`;

  // Toggle active class on defense labels
  $$(".defense-toggle").forEach((label) => {
    const cb = $("input", label);
    label.classList.toggle("defense-toggle--active", cb.checked);
    cb.addEventListener("change", () => label.classList.toggle("defense-toggle--active", cb.checked));
  });

  // Bind run
  $("#btn-run-defend").addEventListener("click", async () => {
    if (state.running) return;
    state.running = true;
    renderDefendMode();

    const userPrompt = $("#user-prompt-d")?.value || atk.default_user_prompt;
    const canary = $("#canary-d")?.value || "BANANA SUNDAE";
    const defenses = [...$$(".defense-toggle input:checked")].map((cb) => cb.value);

    try {
      const result = await runDefend(atk.id, userPrompt, canary, defenses);
      state.running = false;
      renderDefendMode();
      const area = $("#defend-results");
      if (area) area.innerHTML = renderDefendResult(result);
    } catch (err) {
      state.running = false;
      renderDefendMode();
      alert(err.message || t("error_generic", state.lang));
    }
  });
}

function renderDefendResult(r) {
  const lang = state.lang;
  const scanner = r.scanner || {};

  // Undefended result
  const undefIcon = r.undefended?.success ? "\ud83d\udea8" : "\u2705";
  const undefText = r.undefended?.success ? t("verdict_succeeded", lang) : t("verdict_blocked", lang);
  const undefClass = r.undefended?.success ? "verdict--succeeded" : "verdict--blocked";

  // Per-defense results
  let defensePanels = "";
  const defenseOrder = ["input_scan", "context_scan", "hardening", "output_scan", "guardrail"];
  for (const key of defenseOrder) {
    const d = scanner[key];
    if (!d) continue;
    const icon = d.detected ? "\ud83d\udee1\ufe0f" : (d.action === "applied" ? "\ud83d\udd12" : "\u2705");
    const statusColor = d.detected ? "var(--green)" : (d.action === "applied" ? "var(--blue)" : "var(--text-muted)");
    const riskBar = d.risk_score > 0 ? `<div class="progress" style="margin:8px 0;height:4px;"><div class="progress__bar" style="width:${Math.round(d.risk_score * 100)}%;background:${d.detected ? 'var(--green)' : 'var(--text-muted)'};"></div></div>` : "";

    let extraDetails = "";
    if (d.violations && d.violations.length > 0) {
      extraDetails = `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">${d.violations.map((v) => `\u2022 ${escapeHtml(v)}`).join("<br>")}</div>`;
    }
    if (d.findings && d.findings.length > 0) {
      extraDetails = `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">${d.findings.map((f) => `\u2022 ${escapeHtml(f.type)}${f.matched ? ": " + escapeHtml(f.matched.join(", ")) : ""}`).join("<br>")}</div>`;
    }
    if (d.flagged_docs && d.flagged_docs.length > 0) {
      extraDetails = `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">${d.flagged_docs.map((fd) => `\u2022 Doc ${fd.doc_index}: ${fd.findings.map((f) => f.type).join(", ")}`).join("<br>")}</div>`;
    }

    defensePanels += `
      <div style="padding:12px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-weight:500;color:${statusColor};">${icon} ${escapeHtml(d.tool)}</span>
          <span style="font-size:12px;color:var(--text-muted);">${escapeHtml(d.action)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-sec);margin-top:4px;">${escapeHtml(d.details)}</div>
        ${riskBar}${extraDetails}
      </div>`;
  }

  // Defended result
  const defIcon = r.defended?.success ? "\ud83d\udea8" : "\u2705";
  const defText = r.defended?.success ? t("verdict_succeeded", lang) : t("verdict_blocked", lang);
  const defClass = r.defended?.success ? "verdict--succeeded" : "verdict--blocked";

  return `
    <div class="card fade-in">
      <div class="card__header"><span class="card__title">\u2460 Without Defense</span></div>
      <div class="${undefClass}">${undefIcon} ${undefText}</div>
      <div class="model-output" style="margin-top:12px;max-height:200px;overflow-y:auto;">${escapeHtml(r.undefended?.model_output || "")}</div>
    </div>

    <div class="card fade-in">
      <div class="card__header"><span class="card__title">\u2461 Defense Results</span></div>
      ${defensePanels || '<div class="card__text">No defenses selected.</div>'}
    </div>

    <div class="card fade-in">
      <div class="card__header"><span class="card__title">\u2462 With Defense</span></div>
      <div class="${defClass}">${defIcon} ${defText}</div>
      <div class="model-output" style="margin-top:12px;max-height:200px;overflow-y:auto;">${escapeHtml(r.defended?.model_output || "")}</div>
    </div>`;
}

// -- Custom Mode -----------------------------------------------------------

function renderCustomMode() {
  const lang = state.lang;

  dom.main.innerHTML = `
    <div class="attack-header fade-in">
      <h1 class="attack-header__title">${t("mode_custom", lang)}</h1>
      <p class="attack-header__desc">Write your own system prompt, context, and user prompt to test the model.</p>
    </div>
    <div class="form-group">
      <label for="custom-system">${t("label_system_prompt", lang)}</label>
      <textarea id="custom-system" rows="6" placeholder="You are a helpful assistant..."></textarea>
    </div>
    <div class="form-group">
      <label for="custom-context">${t("label_context", lang)}</label>
      <textarea id="custom-context" rows="4" placeholder="Optional RAG documents..."></textarea>
    </div>
    <div class="form-group">
      <label for="custom-user">${t("label_custom_user", lang)}</label>
      <textarea id="custom-user" rows="4" placeholder="Hello, what can you do?"></textarea>
    </div>
    <div class="form-group">
      <label for="custom-canary">${t("label_canary", lang)}</label>
      <input type="text" id="custom-canary" value="BANANA SUNDAE" />
    </div>
    <button class="btn btn--primary" id="btn-run-custom" ${state.running ? "disabled" : ""}>
      ${state.running ? `<span class="spinner"></span> ${t("btn_running", lang)}` : `\u25b6 ${t("btn_run_prompt", lang)}`}
    </button>
    <div id="custom-result" style="margin-top:20px;"></div>`;

  $("#btn-run-custom").addEventListener("click", async () => {
    if (state.running) return;
    const sys = $("#custom-system").value;
    const ctx = $("#custom-context").value;
    const usr = $("#custom-user").value;
    const canary = $("#custom-canary").value;
    if (!sys || !usr) return;

    state.running = true;
    renderCustomMode();

    try {
      const result = await runCustom(sys, ctx, usr, canary);
      state.running = false;
      renderCustomMode();
      const area = $("#custom-result");
      if (area) {
        const canaryNote = result.canary_found
          ? `<div class="badge-canary" style="margin-bottom:12px;">\ud83d\udea8 Canary found in output</div>`
          : "";
        area.innerHTML = `
          <div class="card fade-in">
            <div class="card__header"><span class="card__title">${t("label_model_output", lang)}</span></div>
            ${canaryNote}
            <div class="model-output">${escapeHtml(result.model_output)}</div>
          </div>`;
      }
    } catch (err) {
      state.running = false;
      renderCustomMode();
      alert(err.message || t("error_generic", state.lang));
    }
  });
}

// -- Scorecard Mode --------------------------------------------------------

function renderScorecardMode() {
  const lang = state.lang;
  const sc = state.scorecardResults;
  const prog = state.scorecardProgress;

  let tableHtml = "";
  if (sc) {
    const rows = sc.results
      .map((r) => {
        const isHit = r.success;
        const icon = r.verdict.startsWith("ERROR") ? "\u26a0\ufe0f" : isHit ? "\ud83d\udea8" : "\ud83d\udee1";
        const label = r.verdict.startsWith("ERROR") ? t("verdict_error", lang) : isHit ? t("verdict_hit", lang) : t("verdict_safe", lang);
        const color = r.verdict.startsWith("ERROR") ? "var(--amber)" : isHit ? "var(--red)" : "var(--green)";
        return `<tr>
          <td>${escapeHtml(r.attack_name)}</td>
          <td>${escapeHtml(r.owasp_id)}</td>
          <td>${escapeHtml(r.success_criteria)}</td>
          <td style="color:${color};font-weight:600;">${icon} ${label}</td>
        </tr>`;
      })
      .join("");
    tableHtml = `
      <table class="scorecard-table">
        <thead><tr>
          <th>${t("col_attack", lang)}</th>
          <th>${t("col_owasp", lang)}</th>
          <th>${t("col_detection", lang)}</th>
          <th>${t("col_result", lang)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="score-summary">${sc.succeeded}/${sc.total} ${t("score_label", lang)}</div>`;
  }

  const progressPct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;

  dom.main.innerHTML = `
    <div class="attack-header fade-in">
      <h1 class="attack-header__title">${t("mode_scorecard", lang)}</h1>
    </div>
    <div class="form-group">
      <label for="sc-canary">${t("label_scorecard_canary", lang)}</label>
      <input type="text" id="sc-canary" value="BANANA SUNDAE" />
    </div>
    <button class="btn btn--primary" id="btn-run-scorecard" ${state.scorecardRunning ? "disabled" : ""}>
      ${state.scorecardRunning ? `<span class="spinner"></span> ${t("btn_running_all", lang)}` : `\ud83d\udcca ${t("btn_run_all", lang)}`}
    </button>
    ${state.scorecardRunning ? `
      <div class="progress" style="margin-top:16px;">
        <div class="progress__bar" style="width:${progressPct}%"></div>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">${prog.completed}/${prog.total}</div>` : ""}
    <div id="scorecard-results" style="margin-top:20px;">
      ${tableHtml}
    </div>`;

  $("#btn-run-scorecard").addEventListener("click", handleRunScorecard);
}

async function handleRunScorecard() {
  if (state.scorecardRunning) return;
  state.scorecardRunning = true;
  state.scorecardResults = null;
  state.scorecardProgress = { completed: 0, total: state.attacks.length };
  renderScorecardMode();

  const canary = $("#sc-canary")?.value || "BANANA SUNDAE";

  try {
    const result = await runScorecard(canary);
    state.scorecardResults = result;
    // Also update per-attack results for sidebar indicators
    result.results.forEach((r) => {
      state.attackResults[r.attack_id] = { success: r.success };
    });
  } catch (err) {
    alert(err.message || t("error_generic", state.lang));
  } finally {
    state.scorecardRunning = false;
    state.scorecardProgress = { completed: 0, total: 0 };
    renderSidebar();
    renderScorecardMode();
  }
}

// =============================================================================
// COLLAPSIBLES
// =============================================================================

function bindCollapsibles() {
  $$(".collapsible__trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const parent = trigger.closest(".collapsible");
      const isOpen = parent.classList.toggle("collapsible--open");
      trigger.setAttribute("aria-expanded", isOpen);
    });
  });
}

// =============================================================================
// EVENT BINDING
// =============================================================================

function bindEvents() {
  // Mode buttons
  dom.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      renderSidebar();
      renderMain();
    });
  });

  // Language toggle
  dom.langButtons.forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  // Hamburger
  dom.hamburger.addEventListener("click", () => toggleSidebar());

  // Close sidebar on overlay or main click (mobile)
  dom.overlay.addEventListener("click", () => toggleSidebar(false));
  dom.main.addEventListener("click", () => toggleSidebar(false));
}

// =============================================================================
// INIT
// =============================================================================

async function init() {
  cacheDom();
  bindEvents();
  await loadAttacks();
  renderSidebar();
  renderMain();
}

document.addEventListener("DOMContentLoaded", init);
