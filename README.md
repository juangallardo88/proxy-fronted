# Proxy IA — Frontend

Frontend en **React + Vite** del caso de estudio *"Plataforma de consumo de IA con Proxy de rate limiting y cuotas"*.
Consume el backend Spring Boot ([proxy-backend](https://github.com/juangallardo88/proxy-backend)) desplegado en Railway.

## Funcionalidades

| Requerimiento | Dónde |
|---|---|
| Interfaz tipo chat para enviar prompts | `src/components/Chat.jsx` |
| Indicador de tokens usados vs disponibles, actualizado después de cada request | `src/components/QuotaGauge.jsx` (medidor de arco) |
| Contador de requests por minuto con cuenta regresiva hasta el reset | `src/components/RateSlots.jsx` (una ranura por request y temporizador circular) |
| Al alcanzar el rate limit: botón de envío deshabilitado y countdown | `Chat.jsx` + `App.jsx` (usa el header `Retry-After` del 429) |
| Al agotar la cuota mensual: modal de upgrade con pago simulado | `src/components/UpgradeModal.jsx` (se abre con el 402) |
| Historial de uso en gráfica de barras (últimos 7 días) | `src/components/UsageChart.jsx` |
| Badge del plan actual con colores diferenciados | `src/components/PlanBadge.jsx` (FREE gris, PRO morado, ENTERPRISE dorado) |
| Estimador de tokens antes de enviar | `Chat.jsx` (≈ caracteres / 4, la misma regla del backend) |

Además:
- Cada respuesta muestra su recorrido por la cadena de proxies (Rate limit, Cuota, IA). Si un proxy la detiene, se marca en rojo el paso que la bloqueó con su código (429 o 402). Ver `src/components/ProxyChain.jsx`.
- El estado de cuota se consulta cada 10 s y al terminar cada countdown, para mostrarlo en tiempo real.
- Cada usuario se identifica con el header `X-User-Id`. Se genera uno automáticamente y se puede cambiar desde la barra superior para probar varios usuarios.
- Si el backend no responde, aparece un aviso con botón para reintentar.

## Estructura

```
src/
├── App.jsx               estado global: cuota, rate limit, mensajes, modal
├── api.js                cliente HTTP del backend
├── utils.js              estimador de tokens, planes, formatos
├── hooks/useNow.js       reloj para los countdowns
├── components/
│   ├── Chat.jsx
│   ├── ProxyChain.jsx
│   ├── QuotaGauge.jsx
│   ├── RateSlots.jsx
│   ├── UsageChart.jsx
│   ├── PlanBadge.jsx
│   └── UpgradeModal.jsx
├── main.jsx
└── styles.css
```

## Variables de entorno

| Variable | Ejemplo |
|---|---|
| `VITE_API_URL` | `https://proxy-backend-production.up.railway.app` |

Si no se define, usa `http://localhost:8080`. Copia `.env.example` a `.env` para trabajar en local.

## Ejecutar en local

Requisitos: Node 20.19 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

El backend debe estar corriendo (en local con `mvn spring-boot:run` o en Railway).

## Desplegar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio `proxy-fronted`.
2. Vercel detecta Vite (también está `vercel.json`). Build: `npm run build`, salida: `dist`.
3. En **Environment Variables** agrega `VITE_API_URL` con la URL pública del backend en Railway (sin `/` al final).
4. **Deploy**. Si cambias la variable después, haz **Redeploy** para que tome el valor nuevo.
5. Copia la URL de Vercel y ponla en Railway en la variable `CORS_ALLOWED_ORIGINS` del backend.

## Pago simulado

El modal de upgrade simula una pasarela: pide nombre, tarjeta, vencimiento y CVC, espera 1,5 s y llama a `POST /api/quota/upgrade`.
No se realiza ningún cobro y al backend solo se envían los últimos 4 dígitos. Tarjeta de prueba: `4242 4242 4242 4242`.
