// ============================================================
// Helper: envía un evento custom a Predictive Engagement si el
// snippet ya está cargado (ac = Action Cloud / Journey SDK).
// Mientras no se pegue el snippet real en index.html, esto solo
// deja un log en consola para poder probar el flujo del sitio.
// Doc: https://all.docs.genesys.com/ATC/Current/SDK/Record
//   ac('record', eventName, { atributo: valor, ... })
// ============================================================
function trackEvent(eventName, attributes) {
  attributes = attributes || {};
  if (typeof ac === 'function') {
    ac('record', eventName, attributes);
  }
  console.log('[PE track]', eventName, attributes);
}

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
  trackEvent('simulador_prestamo_abandonado', {
    monto: Number(amountInput.value),
    plazo_meses: Number(document.getElementById('term').value)
  });

  resultBox.classList.add('hidden');
  alert('Evento de abandono enviado a Predictive Engagement (ver consola / Action Map).');
});
