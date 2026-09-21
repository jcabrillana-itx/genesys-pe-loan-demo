# Demo Predictive Engagement — Simulador de préstamos

Sitio estático de demostración para el caso de uso "abandono de simulación de
préstamo con retargeting" (reunión ICBC). No es un sitio bancario real: es un
mockup genérico ("Banco Demo") para poder instrumentar Genesys Predictive
Engagement sobre un dominio público real.

## Cómo terminar de conectarlo a Predictive Engagement

1. En la org de laboratorio de Genesys Cloud: **Admin > Global Settings >
   Tracking Snippet tab** y copiar el snippet (ya trae tu Org ID y región).
2. En la misma sección, pestaña **Web tracking**, agregar como dominio
   permitido el dominio de GitHub Pages (por ejemplo
   `jcabrillana-itx.github.io`), sin `https://` ni rutas.
3. Pegar el snippet en `index.html`, reemplazando el comentario
   `<!-- GENESYS_TRACKING_SNIPPET_PLACEHOLDER -->`.
4. Commit + push — GitHub Pages redeploya solo en 1-2 minutos.

## Eventos custom que dispara el sitio (`app.js`)

| Evento | Cuándo se dispara | Uso en el Action Map |
|---|---|---|
| `simulador_prestamo_iniciado` | Al enviar el formulario de simulación | Señal temprana de interés |
| `simulador_prestamo_completado` | Al mostrarse el resultado de la simulación | Evento clave del segmento "abandonó sin contratar" |
| `prestamo_contratado` | Click en "Contratar ahora" | Evento de conversión — excluir del segmento de abandono |
| `simulador_prestamo_abandonado` | Click en "Lo pienso y vuelvo después" | Trigger explícito para mostrar el Action Map en vivo sin esperar timeout de sesión |

## Armar el Action Map de la demo

Segmento sugerido: visitantes con evento `simulador_prestamo_completado` **o**
`simulador_prestamo_abandonado`, sin evento `prestamo_contratado` en la misma
sesión. Acción: oferta de mensajería / offer de WhatsApp (o el paso siguiente
que se quiera mostrar en Architect).
