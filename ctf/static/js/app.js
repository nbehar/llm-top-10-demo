/**
 * BSides Colombia 2026 — CTF de IA
 * Vanilla JS — no frameworks, no build step
 * All user content set via textContent (never innerHTML) to prevent XSS.
 */

// ── State ────────────────────────────────────────────────────────────────────

const estado = {
  participante: null,    // { apodo, token }
  retos: [],
  resueltos: new Set(),
  retoActivo: null,
  ctfActivo: true,
  primerAcceso: {},      // { challenge_id: apodo }
  leaderboard: [],
};

// ── Persistence ──────────────────────────────────────────────────────────────

function guardarSesion(apodo, token) {
  localStorage.setItem("ctf_apodo", apodo);
  localStorage.setItem("ctf_token", token);
}

function cargarSesion() {
  const apodo = localStorage.getItem("ctf_apodo");
  const token = localStorage.getItem("ctf_token");
  return apodo && token ? { apodo, token } : null;
}

function borrarSesion() {
  localStorage.removeItem("ctf_apodo");
  localStorage.removeItem("ctf_token");
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function clearEl(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function setVisible(id, visible) {
  const node = document.getElementById(id);
  if (node) node.classList.toggle("oculto", !visible);
}

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Error ${res.status}`);
  }
  return data;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer = null;

function mostrarNotificacion(texto, tipo = "info", duracion = 4000) {
  const toastEl = document.getElementById("notificacion");
  document.getElementById("notificacion-icono").textContent =
    tipo === "exito" ? "✅" : tipo === "error" ? "❌" : "ℹ️";
  document.getElementById("notificacion-texto").textContent = texto;
  toastEl.className = tipo;
  toastEl.classList.remove("oculto");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add("oculto"), duracion);
}

// ── Countdown ────────────────────────────────────────────────────────────────

// 2026-04-25T22:00:00 America/Bogota (UTC-5) = 2026-04-26T03:00:00Z
const CTF_FIN_UTC = new Date("2026-04-26T03:00:00Z");

function actualizarContador() {
  const delta = CTF_FIN_UTC - new Date();
  if (delta <= 0) {
    ["cd-dias", "cd-horas", "cd-minutos", "cd-segundos"].forEach((id) => setText(id, "00"));
    document.querySelector(".countdown")?.classList.add("terminado");
    estado.ctfActivo = false;
    return;
  }
  setText("cd-dias",    String(Math.floor(delta / 86400000)).padStart(2, "0"));
  setText("cd-horas",   String(Math.floor((delta % 86400000) / 3600000)).padStart(2, "0"));
  setText("cd-minutos", String(Math.floor((delta % 3600000) / 60000)).padStart(2, "0"));
  setText("cd-segundos",String(Math.floor((delta % 60000) / 1000)).padStart(2, "0"));
}

// ── Participant area ──────────────────────────────────────────────────────────

function renderParticipanteArea() {
  const area = document.getElementById("participante-area");
  clearEl(area);

  if (!estado.participante) {
    const btn = el("button", "btn btn-primario", "Unirse al CTF");
    btn.addEventListener("click", abrirModal);
    area.appendChild(btn);
    return;
  }

  const badge = el("span", "apodo-badge");
  badge.textContent = `👤 ${estado.participante.apodo}`;

  const btnSalir = el("button", "btn btn-ghost", "Salir");
  btnSalir.addEventListener("click", () => {
    borrarSesion();
    estado.participante = null;
    estado.resueltos.clear();
    renderParticipanteArea();
    renderGridRetos();
    setVisible("mis-estadisticas", false);
    abrirModal();
  });

  area.appendChild(badge);
  area.appendChild(btnSalir);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function abrirModal() {
  setVisible("modal-registro", true);
  setVisible("modal-overlay", true);
  setTimeout(() => document.getElementById("input-apodo")?.focus(), 50);
}

function cerrarModal() {
  setVisible("modal-registro", false);
  setVisible("modal-overlay", false);
}

async function registrarParticipante(apodo) {
  const data = await apiFetch("/api/participante", {
    method: "POST",
    body: JSON.stringify({ apodo }),
  });
  estado.participante = { apodo: data.apodo, token: data.token };
  guardarSesion(data.apodo, data.token);
  return data;
}

// ── Challenge grid ────────────────────────────────────────────────────────────

function renderGridRetos() {
  const grid = document.getElementById("grid-retos");
  clearEl(grid);

  if (!estado.retos.length) {
    const spinner = el("div", "spinner-contenedor");
    spinner.appendChild(el("div", "spinner"));
    spinner.appendChild(el("p", null, "Cargando retos…"));
    grid.appendChild(spinner);
    return;
  }

  const resueltos = estado.resueltos.size;
  const total = estado.retos.length;
  const progresoEl = document.querySelector(".progreso-retos");
  if (progresoEl) progresoEl.textContent = `${resueltos}/${total}`;

  estado.retos.forEach((r) => {
    const resuelto = estado.resueltos.has(r.id);
    const tieneFirstBlood = !estado.primerAcceso[r.id];

    const card = el("div");
    card.className = [
      "reto-card",
      resuelto ? "resuelto" : "",
      r.id === estado.retoActivo ? "activo" : "",
      tieneFirstBlood && !resuelto ? "primer-acceso-disponible" : "",
    ].filter(Boolean).join(" ");
    card.dataset.id = r.id;
    card.tabIndex = 0;
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `${r.titulo} — ${r.categoria} — ${r.puntos} puntos${resuelto ? " — Resuelto" : ""}`);

    card.appendChild(el("div", "reto-card__categoria", r.categoria));
    card.appendChild(el("div", "reto-card__titulo", r.titulo));
    card.appendChild(el("div", "reto-card__puntos", `${r.puntos} pts`));

    card.addEventListener("click", () => seleccionarReto(r.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleccionarReto(r.id); }
    });

    grid.appendChild(card);
  });
}

// ── Challenge panel ───────────────────────────────────────────────────────────

function seleccionarReto(id) {
  const reto = estado.retos.find((r) => r.id === id);
  if (!reto) return;
  estado.retoActivo = id;
  renderGridRetos();
  renderPanelReto(reto);
  document.getElementById("panel-reto").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderPanelReto(reto) {
  const resuelto = estado.resueltos.has(reto.id);

  setText("panel-categoria", reto.categoria);
  setText("panel-puntos", `${reto.puntos} pts${!estado.primerAcceso[reto.id] ? " +25🩸 disponible" : ""}`);
  setText("panel-titulo-reto", reto.titulo);
  setText("panel-descripcion", reto.descripcion);

  // First blood notice
  const fbAviso = document.getElementById("panel-primer-acceso");
  if (estado.primerAcceso[reto.id]) {
    setText("panel-primer-acceso-usuario", `Primer acceso: ${estado.primerAcceso[reto.id]}`);
    fbAviso.classList.remove("oculto");
  } else {
    fbAviso.classList.add("oculto");
  }

  // Hint
  const listaPistas = document.getElementById("lista-pistas");
  clearEl(listaPistas);
  listaPistas.appendChild(el("div", "pista-item", reto.pista));
  setVisible("panel-pistas", true);

  // Reset attack UI
  document.getElementById("prompt-usuario").value = "";
  setVisible("bloque-respuesta", false);
  setText("respuesta-modelo", "");

  // Reset flag UI
  document.getElementById("input-bandera").value = "";
  const feedbackEl = document.getElementById("feedback-bandera");
  clearEl(feedbackEl);

  if (resuelto) {
    const msg = el("div", "feedback-correcto", "✅ ¡Ya resolviste este reto!");
    feedbackEl.appendChild(msg);
    document.getElementById("btn-enviar-bandera").disabled = true;
  } else {
    document.getElementById("btn-enviar-bandera").disabled = false;
  }

  document.getElementById("btn-ejecutar-ataque").disabled = false;
  setVisible("panel-reto", true);
}

// ── Run attack ────────────────────────────────────────────────────────────────

async function ejecutarAtaque() {
  if (!estado.retoActivo) return;
  const prompt = document.getElementById("prompt-usuario").value.trim();
  if (!prompt) { mostrarNotificacion("Escribe un prompt antes de ejecutar.", "error"); return; }

  const btn = document.getElementById("btn-ejecutar-ataque");
  btn.disabled = true;
  btn.textContent = "Ejecutando…";

  setVisible("bloque-respuesta", false);
  setText("respuesta-modelo", "");

  try {
    const data = await apiFetch("/api/attack", {
      method: "POST",
      body: JSON.stringify({ challenge_id: estado.retoActivo, user_prompt: prompt }),
    });
    setText("respuesta-modelo", data.respuesta);
    setVisible("bloque-respuesta", true);
    setVisible("bandera-seccion", true);
    document.getElementById("bloque-respuesta").scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    mostrarNotificacion(err.message || "Error al ejecutar el ataque.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "▶ Ejecutar ataque";
  }
}

// ── Submit flag ───────────────────────────────────────────────────────────────

async function enviarBandera() {
  if (!estado.participante) { mostrarNotificacion("Debes unirte al CTF primero.", "error"); abrirModal(); return; }
  if (!estado.ctfActivo) { mostrarNotificacion("El CTF ha terminado. ¡Gracias por participar!", "info"); return; }

  const bandera = document.getElementById("input-bandera").value.trim();
  if (!bandera) { mostrarNotificacion("Ingresa la bandera que encontraste.", "error"); return; }

  const btn = document.getElementById("btn-enviar-bandera");
  btn.disabled = true;
  btn.textContent = "Verificando…";

  const feedbackEl = document.getElementById("feedback-bandera");
  clearEl(feedbackEl);

  try {
    const data = await apiFetch("/api/flag", {
      method: "POST",
      body: JSON.stringify({
        apodo: estado.participante.apodo,
        token: estado.participante.token,
        challenge_id: estado.retoActivo,
        bandera,
      }),
    });

    if (data.correcto && !data.ya_resuelto) {
      feedbackEl.appendChild(el("div", "feedback-correcto", data.mensaje));
      estado.resueltos.add(estado.retoActivo);
      renderGridRetos();
      actualizarMisEstadisticas();
      await cargarLeaderboard();
      mostrarNotificacion(data.mensaje, "exito", 6000);
      btn.disabled = true;
    } else if (data.ya_resuelto) {
      feedbackEl.appendChild(el("div", "feedback-correcto", "✅ ¡Ya resolviste este reto!"));
    } else {
      feedbackEl.appendChild(el("div", "feedback-incorrecto", "❌ Bandera incorrecta. ¡Sigue intentando!"));
      btn.disabled = false;
      btn.textContent = "Enviar 🚩";
    }
  } catch (err) {
    feedbackEl.appendChild(el("div", "feedback-incorrecto", `❌ ${err.message}`));
    btn.disabled = false;
    btn.textContent = "Enviar 🚩";
  }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

async function cargarLeaderboard() {
  try {
    const data = await apiFetch("/api/leaderboard");
    estado.leaderboard = data;
    renderLeaderboard(data);
    setText("marcador-actualizacion", `Actualizado: ${new Date().toLocaleTimeString("es-CO")}`);
  } catch { /* non-critical */ }
}

function renderLeaderboard(datos) {
  const contenedor = document.getElementById("marcador");
  clearEl(contenedor);

  if (!datos.length) {
    contenedor.appendChild(el("p", "marcador-vacio", "Nadie en el marcador todavía. ¡Sé el primero!"));
    return;
  }

  const miApodo = estado.participante?.apodo;

  const table = document.createElement("table");
  table.className = "marcador-tabla";

  // Header
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  ["#", "Apodo", "Pts", "✓", "🩸"].forEach((h) => tr.appendChild(el("th", null, h)));
  thead.appendChild(tr);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");
  datos.forEach((p) => {
    const row = document.createElement("tr");
    if (p.apodo === miApodo) row.className = "mi-fila";

    const tdRango = el("td", "rango-celda", `#${p.rango}`);
    const tdApodo = el("td", "apodo-celda", p.apodo === miApodo ? `${p.apodo} 👈` : p.apodo);
    const tdPuntos = el("td", "puntos-celda", String(p.puntos));
    const tdResueltos = el("td", null, String(p.resueltos));
    const tdBlood = el("td", "primer-acceso-celda", p.primer_acceso_count > 0 ? `🩸${p.primer_acceso_count}` : "");

    row.appendChild(tdRango);
    row.appendChild(tdApodo);
    row.appendChild(tdPuntos);
    row.appendChild(tdResueltos);
    row.appendChild(tdBlood);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  contenedor.appendChild(table);
}

// ── My stats ──────────────────────────────────────────────────────────────────

function actualizarMisEstadisticas() {
  if (!estado.participante) return;
  setVisible("mis-estadisticas", true);
  const miEntrada = estado.leaderboard.find((p) => p.apodo === estado.participante.apodo);
  setText("stat-resueltos", String(estado.resueltos.size));
  setText("stat-puntos", String(miEntrada?.puntos ?? 0));
  setText("stat-posicion", miEntrada ? `#${miEntrada.rango}` : "#—");
}

// ── CTF status ────────────────────────────────────────────────────────────────

async function cargarEstadoCTF() {
  try {
    const data = await apiFetch("/api/ctf/status");
    estado.ctfActivo = data.activo;
    estado.primerAcceso = data.primer_acceso || {};

    if (!data.activo && !document.querySelector(".ctf-terminado-banner")) {
      const banner = el("div", "ctf-terminado-banner",
        "🏁 El CTF ha terminado. ¡Gracias por participar en BSides Colombia 2026!");
      const header = document.getElementById("ctf-header");
      header.parentNode.insertBefore(banner, header.nextSibling);
    }
  } catch { /* non-critical */ }
}

// ── Sync solved ───────────────────────────────────────────────────────────────

async function cargarMisResueltos() {
  if (!estado.participante) return;
  try {
    const data = await apiFetch(
      `/api/mis-soluciones/${encodeURIComponent(estado.participante.apodo)}?token=${encodeURIComponent(estado.participante.token)}`
    );
    estado.resueltos = new Set(data.resueltos);
    renderGridRetos();
    actualizarMisEstadisticas();
  } catch { /* non-critical */ }
}

// ── Load challenges ───────────────────────────────────────────────────────────

async function cargarRetos() {
  try {
    const data = await apiFetch("/api/challenges");
    estado.retos = data;
    renderGridRetos();
  } catch (err) {
    const grid = document.getElementById("grid-retos");
    clearEl(grid);
    grid.appendChild(el("p", "error-retos", `Error al cargar los retos: ${err.message}`));
  }
}

// ── Event wiring ──────────────────────────────────────────────────────────────

function conectarEventos() {
  document.getElementById("form-registro")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const apodo = document.getElementById("input-apodo").value.trim();
    const errorEl = document.getElementById("apodo-error");
    errorEl.classList.add("oculto");
    errorEl.textContent = "";

    const btn = document.getElementById("btn-unirse");
    btn.disabled = true;
    btn.textContent = "Uniéndose…";

    try {
      await registrarParticipante(apodo);
      cerrarModal();
      renderParticipanteArea();
      await cargarMisResueltos();
      actualizarMisEstadisticas();
      mostrarNotificacion(`¡Bienvenido al CTF, ${apodo}!`, "exito");
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("oculto");
    } finally {
      btn.disabled = false;
      btn.textContent = "Unirse al CTF";
    }
  });

  document.getElementById("input-apodo")?.addEventListener("input", function () {
    setText("apodo-contador", `${this.value.length} / 24`);
  });

  document.getElementById("btn-cerrar-panel")?.addEventListener("click", () => {
    setVisible("panel-reto", false);
    estado.retoActivo = null;
    renderGridRetos();
  });

  document.getElementById("btn-ejecutar-ataque")?.addEventListener("click", ejecutarAtaque);

  document.getElementById("btn-limpiar-prompt")?.addEventListener("click", () => {
    document.getElementById("prompt-usuario").value = "";
    setVisible("bloque-respuesta", false);
    setText("respuesta-modelo", "");
    clearEl(document.getElementById("feedback-bandera"));
  });

  document.getElementById("prompt-usuario")?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); ejecutarAtaque(); }
  });

  document.getElementById("btn-enviar-bandera")?.addEventListener("click", enviarBandera);

  document.getElementById("input-bandera")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); enviarBandera(); }
  });

  document.getElementById("modal-overlay")?.addEventListener("click", () => {
    if (estado.participante) cerrarModal();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const sesion = cargarSesion();
  if (sesion) estado.participante = sesion;

  conectarEventos();
  renderParticipanteArea();

  if (!estado.participante) abrirModal();

  await cargarEstadoCTF();

  actualizarContador();
  setInterval(actualizarContador, 1000);

  await cargarRetos();
  await cargarLeaderboard();

  if (estado.participante) {
    await cargarMisResueltos();
    actualizarMisEstadisticas();
  }

  setInterval(async () => {
    await cargarLeaderboard();
    if (estado.participante) actualizarMisEstadisticas();
  }, 30000);

  setInterval(async () => {
    await cargarEstadoCTF();
    renderGridRetos();
    if (estado.retoActivo) {
      const reto = estado.retos.find((r) => r.id === estado.retoActivo);
      if (reto) renderPanelReto(reto);
    }
  }, 60000);
}

document.addEventListener("DOMContentLoaded", init);
