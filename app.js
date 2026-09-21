// ============================================================
// Datos del "cliente logueado" para la demo: se piden en un mini
// login en pantalla (nunca se hardcodean en el código, porque este
// archivo es público en GitHub Pages). Simula que en la app real
// de ICBC el visitante ya está autenticado — Predictive Engagement
// por sí solo no conoce la identidad de un visitante anónimo.
// Se mandan como customAttributes en los eventos para que se vean
// en el timeline de Live Now, y como valor Static value en el
// Action Map para el envío del HSM (ver documento de transparencia).
// ============================================================
const demoCustomer = { nombre: null, telefono: null };

// ============================================================
// Helper: envía un evento custom a Predictive Engagement vía el
// Journey plugin del snippet unificado de Genesys Cloud.
// Se espera a Journey.ready antes de mandar comandos (si el
// evento llega antes, queda en cola y se manda apenas esté listo).
// Doc: https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/journeyPlugin
//   Genesys('command', 'Journey.record', { eventName, customAttributes })
// ============================================================
let peJourneyReady = false;
const pePendingEvents = [];

function peFlushPending() {
  while (pePendingEvents.length) {
    const [eventName, attributes] = pePendingEvents.shift();
    window.Genesys('command', 'Journey.record', { eventName, customAttributes: attributes });
  }
}

if (typeof window.Genesys === 'function') {
  window.Genesys('subscribe', 'Journey.ready', function () {
    peJourneyReady = true;
    console.log('[PE] Journey.ready');
    peFlushPending();
  });
}

function trackEvent(eventName, attributes) {
  attributes = attributes || {};
  console.log('[PE track]', eventName, attributes);
  if (typeof window.Genesys !== 'function') return;
  if (peJourneyReady) {
    window.Genesys('command', 'Journey.record', { eventName, customAttributes: attributes });
  } else {
    pePendingEvents.push([eventName, attributes]);
  }
}

const loginSection = document.getElementById('login');
const loginForm = document.getElementById('login-form');
const simulatorSection = document.getElementById('simulator');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  demoCustomer.nombre = document.getElementById('login-name').value.trim();
  demoCustomer.telefono = document.getElementById('login-phone').value.trim();

  // Evento de identificación: dispara apenas "loguea", para que
  // aparezca con nombre/teléfono desde el arranque en Live Now.
  trackEvent('visitante_identificado', {
    nombre: demoCustomer.nombre,
    telefono: demoCustomer.telefono
  });

  loginSection.classList.add('hidden');
  simulatorSection.classList.remove('hidden');
});

const amountInput = document.getElementById('amount');
const amountOutput = document.getElementById('amount-output');
const form = document.getElementById('simulator-form');
const resultBox = document.getElementById('result');
const confirmationBox = document.getElementById('confirmation');
const btnContratar = document.getElementById('btn-contratar');
const btnSalir = document.getElementById('btn-salir');

function formatCurrency(value) {
  return '$' + Number(value).toLocaleString('es-AR');
}

amountInput.addEventListener('input', () => {
  amountOutput.textContent = formatCurrency(amountInput.value);
});

function estimateQuota(amount, termMonths) {
  const monthlyRate = 0.065; // tasa demostrativa, no real
  const quota = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return Math.round(quota);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = Number(amountInput.value);
  const term = Number(document.getElementById('term').value);
  const quota = estimateQuota(amount, term);

  // Evento: el visitante corrió el simulador — dispara al enviar el form.
  trackEvent('simulador_prestamo_iniciado', { monto: amount, plazo_meses: term });

  document.getElementById('result-amount').textContent = formatCurrency(amount);
  document.getElementById('result-term').textContent = term + ' meses';
  document.getElementById('result-quota').textContent = formatCurrency(quota) + ' /mes';

  resultBox.classList.remove('hidden');
  confirmationBox.classList.add('hidden');

  // Evento: el visitante llegó a ver un resultado concreto de simulación.
  // Este es el evento clave para armar el segmento de "abandono de
  // simulación de préstamo" en el Action Map.
  trackEvent('simulador_prestamo_completado', { monto: amount, plazo_meses: term, cuota_estimada: quota });
});

btnContratar.addEventListener('click', () => {
  // Evento de conversión: si se dispara, el visitante NO debería
  // entrar al segmento de abandono (excluirlo por este evento).
  trackEvent('prestamo_contratado', {
    monto: Number(amountInput.value),
    plazo_meses: Number(document.getElementById('term').value)
  });

  resultBox.classList.add('hidden');
  confirmationBox.classList.remove('hidden');
});

btnSalir.addEventListener('click', () => {
  // Evento explícito de abandono, útil para mostrar el trigger del
  // Action Map en vivo sin tener que esperar un timeout de sesión.
  // Incluye "telefono" para que el Architect Flow pueda recuperarlo
  // vía "Get Journey Session" y disparar el HSM de WhatsApp.
  trackEvent('simulador_prestamo_abandonado', {
    monto: Number(amountInput.value),
    plazo_meses: Number(document.getElementById('term').value),
    telefono: demoCustomer.telefono,
    nombre: demoCustomer.nombre
  });

  resultBox.classList.add('hidden');
  alert('Evento de abandono enviado a Predictive Engagement (ver consola / Action Map).');
});
