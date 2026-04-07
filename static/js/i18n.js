/**
 * i18n — EN/ES translations for LLM Top 10 Security Lab
 */

const TRANSLATIONS = {
  en: {
    // Header
    app_title: "LLM Top 10 Security Lab",
    app_subtitle: "OWASP",

    // Modes
    mode_attack: "Attack Lab",
    mode_defend: "Defense Lab",
    mode_custom: "Custom Prompt",
    mode_scorecard: "Scorecard",

    // Attack form
    label_user_prompt: "User prompt",
    label_canary: "Canary phrase",
    canary_hint: "If the AI says this, the attack worked",
    btn_run_attack: "Run Attack",
    btn_running: "Running\u2026",

    // Custom form
    label_select_attack: "Select an attack",
    label_system_prompt: "System Prompt",
    label_context: "Context Documents (optional \u2014 simulates RAG)",
    label_custom_user: "User Prompt",
    btn_run_prompt: "Run Prompt",
    label_model_output: "Model Response",

    // Scorecard
    label_scorecard_canary: "Canary",
    btn_run_all: "Run All Attacks",
    btn_running_all: "Running\u2026",
    col_attack: "Attack",
    col_owasp: "OWASP",
    col_detection: "Detection",
    col_result: "Result",
    verdict_hit: "HIT",
    verdict_safe: "SAFE",
    verdict_error: "ERROR",
    score_label: "attacks succeeded",

    // Result panels
    title_cause: "\u2460 The Cause",
    title_effect: "\u2461 The Effect",
    title_impact: "\u2462 The Impact",
    label_full_prompt: "Full Prompt Sent to Model",
    label_system: "System prompt (what the developer set)",
    label_injection: "Injection",
    label_user_message: "User message",
    label_context_docs: "Context documents",
    label_model_response: "Model response",
    verdict_succeeded: "ATTACK SUCCEEDED",
    verdict_blocked: "ATTACK BLOCKED",

    // Defense
    defense_prompt_guard: "Prompt Guard 2",
    defense_output_scan: "LLM Guard \u2014 Output",
    defense_context_scan: "LLM Guard \u2014 Context",
    defense_hardening: "Prompt Hardening",
    defense_guardrail: "Guardrail Model",
    label_select_defenses: "Select defense tools",

    // Empty state
    empty_title: "Select an attack",
    empty_sub: "Choose an attack from the sidebar to begin",

    // Footer
    footer_text: "Workshop by Nikolas Behar",

    // Workshops
    workshop_llm: "LLM Top 10",
    workshop_mcp: "MCP Top 10",
    workshop_agentic: "Agentic AI",

    // Tabs
    tab_info: "Info",
    tab_attack: "Attack",
    tab_defend: "Defense",
    tab_custom: "Custom Prompt",
    tab_scorecard: "Scorecard",

    // Slide deck
    slide_what: "What is",
    slide_how: "How This Attack Works",
    slide_impact: "Real-World Impact",
    slide_prevent: "How to Prevent It",
    slide_prev: "Prev",
    slide_next: "Next",

    // Detection methods
    detect_canary: "Canary detection \u2014 a secret phrase is hidden in the system prompt. If it appears in the output, the attack succeeded.",
    detect_secret: "Secret detection \u2014 checks if the model leaked specific confidential strings (credentials, keys, internal data).",
    detect_code: "Code analysis \u2014 checks if the model generated code with security vulnerabilities (XSS, SQL injection).",
    detect_action: "Action detection \u2014 checks if the model issued destructive commands (delete, drop, rm) without confirmation.",
    detect_hallucination: "Hallucination detection \u2014 checks if the model fabricated information (fake libraries, fake court cases).",

    // Errors
    error_timeout: "The model is taking too long. Please try again.",
    error_generic: "Something went wrong. Please try again.",
    error_no_key: "API key not configured. Set GROQ_API_KEY.",
  },

  es: {
    app_title: "Laboratorio de Seguridad LLM Top 10",
    app_subtitle: "OWASP",

    mode_attack: "Laboratorio de Ataques",
    mode_defend: "Laboratorio de Defensa",
    mode_custom: "Prompt Personalizado",
    mode_scorecard: "Puntaje",

    label_user_prompt: "Prompt del usuario",
    label_canary: "Frase canaria",
    canary_hint: "Si la IA dice esto, el ataque funcion\u00f3",
    btn_run_attack: "Ejecutar Ataque",
    btn_running: "Ejecutando\u2026",

    label_select_attack: "Selecciona un ataque",
    label_system_prompt: "Prompt del Sistema",
    label_context: "Documentos de Contexto (opcional \u2014 simula RAG)",
    label_custom_user: "Prompt del Usuario",
    btn_run_prompt: "Ejecutar Prompt",
    label_model_output: "Respuesta del Modelo",

    label_scorecard_canary: "Canario",
    btn_run_all: "Ejecutar Todos los Ataques",
    btn_running_all: "Ejecutando\u2026",
    col_attack: "Ataque",
    col_owasp: "OWASP",
    col_detection: "Detecci\u00f3n",
    col_result: "Resultado",
    verdict_hit: "EXITOSO",
    verdict_safe: "SEGURO",
    verdict_error: "ERROR",
    score_label: "ataques exitosos",

    title_cause: "\u2460 La Causa",
    title_effect: "\u2461 El Efecto",
    title_impact: "\u2462 El Impacto",
    label_full_prompt: "Prompt Completo Enviado al Modelo",
    label_system: "Prompt del sistema (lo que el desarrollador configur\u00f3)",
    label_injection: "Inyecci\u00f3n",
    label_user_message: "Mensaje del usuario",
    label_context_docs: "Documentos de contexto",
    label_model_response: "Respuesta del modelo",
    verdict_succeeded: "ATAQUE EXITOSO",
    verdict_blocked: "ATAQUE BLOQUEADO",

    defense_prompt_guard: "Prompt Guard 2",
    defense_output_scan: "LLM Guard \u2014 Salida",
    defense_context_scan: "LLM Guard \u2014 Contexto",
    defense_hardening: "Endurecimiento de Prompt",
    defense_guardrail: "Modelo de Protecci\u00f3n",
    label_select_defenses: "Seleccionar herramientas de defensa",

    empty_title: "Selecciona un ataque",
    empty_sub: "Elige un ataque de la barra lateral para comenzar",

    footer_text: "Taller por Nikolas Behar",

    // Workshops
    workshop_llm: "LLM Top 10",
    workshop_mcp: "MCP Top 10",
    workshop_agentic: "IA Ag\u00e9ntica",

    // Tabs
    tab_info: "Info",
    tab_attack: "Ataque",
    tab_defend: "Defensa",
    tab_custom: "Prompt Personalizado",
    tab_scorecard: "Puntaje",

    // Slide deck
    slide_what: "\u00bfQu\u00e9 es",
    slide_how: "C\u00f3mo Funciona Este Ataque",
    slide_impact: "Impacto en el Mundo Real",
    slide_prevent: "C\u00f3mo Prevenirlo",
    slide_prev: "Anterior",
    slide_next: "Siguiente",

    // Detection methods
    detect_canary: "Detecci\u00f3n canaria \u2014 una frase secreta est\u00e1 oculta en el prompt del sistema. Si aparece en la salida, el ataque funcion\u00f3.",
    detect_secret: "Detecci\u00f3n de secretos \u2014 verifica si el modelo filtr\u00f3 cadenas confidenciales espec\u00edficas (credenciales, claves, datos internos).",
    detect_code: "An\u00e1lisis de c\u00f3digo \u2014 verifica si el modelo gener\u00f3 c\u00f3digo con vulnerabilidades de seguridad (XSS, inyecci\u00f3n SQL).",
    detect_action: "Detecci\u00f3n de acciones \u2014 verifica si el modelo emiti\u00f3 comandos destructivos (eliminar, borrar) sin confirmaci\u00f3n.",
    detect_hallucination: "Detecci\u00f3n de alucinaciones \u2014 verifica si el modelo fabric\u00f3 informaci\u00f3n (bibliotecas falsas, casos judiciales falsos).",

    error_timeout: "El modelo est\u00e1 tardando demasiado. Int\u00e9ntalo de nuevo.",
    error_generic: "Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo.",
    error_no_key: "Clave API no configurada. Establece GROQ_API_KEY.",
  },
};

/**
 * Get a translation string for the current language.
 * @param {string} key
 * @param {string} lang - "en" or "es"
 * @returns {string}
 */
export function t(key, lang = "en") {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

export default TRANSLATIONS;
