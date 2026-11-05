# dropnova-tienda · Vercel + Supabase

Tienda multimarca chilena, con pago contra entrega sujeto a confirmación. **No se habilitan pedidos reales por defecto.** Esta versión está alineada con las cinco tablas que se crearon en Supabase: `productos`, `pedidos`, `pedido_items`, `historial_pedidos` y `administradores`.

## Despliegue

1. Descomprime `dropnova-tienda-vercel.zip` y sube **la carpeta `dropnova-tienda`** en Vercel → New Project → choose a folder; alternativa: súbela a GitHub y haz Import. **No uses el ZIP anterior.**
2. Nombra el proyecto `dropnova-tienda` y publícalo primero en dominio temporal `.vercel.app`.
3. En Vercel → Project Settings → Environment Variables crea los valores que aparecen en `.env.example`, para Production, Preview y Development si se utilizarán. **Pega los secretos tú mismo en Vercel, nunca por chat**.
4. En Supabase → Project Settings → API Keys: copia `SUPABASE_URL` desde Project URL, `SUPABASE_ANON_KEY` desde anon/publishable compatible y `SUPABASE_SERVICE_ROLE_KEY` desde la clave service_role/secret. No añadas el prefijo `NEXT_PUBLIC_` a secretos, ni los pongas en archivos públicos.
5. Deja `ACCEPT_ORDERS=false` hasta tener productos reales, validación de cobertura y haber probado el flujo extremo a extremo. Una vez configuradas las variables usa Redeploy.
6. Verifica la página `/` y el acceso `/admin` con el usuario creado en Supabase Auth que figure en `administradores`.
7. Agrega productos reales mediante Supabase Table Editor (la columna `activo` debe ser `true` y `stock` mayor que 0 para mostrarse). Precios en CLP, disponibilidad y logística deben confirmarse. El precio y stock siempre se validan de nuevo desde el servidor.
8. Para activar pedidos reales necesitarás además limitar abuso/bots, revisar política de privacidad, zona de entrega y costos de envío; después cambiar `ACCEPT_ORDERS=true`. No se enviará nada automáticamente a Dropi sin API aprobada.
9. Cuando el despliegue temporal esté probado, añade `dropnova.cl` y `www.dropnova.cl` en Project → Domains. **No borres el dominio desde Team Domains.**

## Seguridad

- Todas las tablas deben conservar RLS activada y `anon` y `authenticated` sin permisos directos de lectura/escritura. El servidor usa la clave service_role exclusivamente en funciones `/api`.
- Login del panel: correo/contraseña de Supabase Auth; cada petición administrativa verifica el token firmado con `getUser` y la pertenencia del UID a `administradores`. Los tokens de sesión solo permanecen en memoria de la pestaña (al recargar se inicia sesión de nuevo).
- La API de login debe protegerse con Rate Limiting/WAF en Vercel; no está incorporado un mecanismo distribuido de rate limit en este código base. También se recomienda CAPTCHA en el formulario de pedidos y mecanismos anti-abuso.
- La creación del pedido y sus líneas se realiza en llamadas sucesivas; en caso de error se intenta eliminar el pedido incompleto. **Para producción con carga real, implementar una transacción SQL/RPC única y controles de idempotencia.** No activar compras sin ese endurecimiento.
- El endpoint de catálogo filtra artículos activos con stock. `imagen_url` solo debe contener URLs HTTPS confiables.
- No se comprueba cobertura contra-entrega de Dropi en tiempo real: los pedidos son solicitudes sujetas a confirmación.
- El link `https://app.dropi.cl/auth/register?afl=107911` es de referidos a Dropi y **no** transmite pedidos a Dropi.

## Estructura

- `public/index.html`: landing, carrito y WhatsApp.
- `public/admin.html`: login, listado, cambios de estado y exportación.
- `api/products.js`: catálogo público verificado.
- `api/orders.js`: solicitudes COD (desactivadas por defecto).
- `api/admin/*`: endpoints privados protegidos por sesión y lista de administradores.
- `lib/common.js`: cliente Supabase servidor y validación de administrador.
- `.env.example`: nombres de las variables.

**No contiene contraseñas ni credenciales reales.**

## Recuperar contraseña

1. En Supabase Auth → URL Configuration añade `https://dropnova-tienda.vercel.app/recuperar` a las Redirect URLs (conserva la URL `/admin` existente).
2. Publica esta nueva versión **en el proyecto Vercel existente** `dropnova-tienda` usando "Deploy to an existing project" o Vercel CLI. Las variables anteriores permanecen en el proyecto. No crees un segundo proyecto.
3. Visita `/recuperar`, introduce tu correo administrativo y solicita un enlace nuevo desde esa página; **no** uses el botón "Send password recovery" de Supabase Users para este flujo, porque puede redirigir a la Site URL general.
4. Abre el enlace del correo más reciente, crea una contraseña nueva y luego entra en `/admin`. Nunca compartas el enlace ni el token.
5. Este flujo utiliza la clave pública del endpoint `/api/auth-config`; la clave privada permanece en Vercel y no se entrega al navegador.
