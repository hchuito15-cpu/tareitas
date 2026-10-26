# Tareitas 🌸

To-do list para Meni. Es una **PWA** (HTML + CSS + JS, sin compilar): en el Samsung se instala desde Chrome y queda como una app normal (ícono, pantalla completa, funciona sin internet).

**App publicada:** <https://hchuito15-cpu.github.io/tareitas/>

Para actualizarla después de hacer cambios:

```bash
git add -A && git commit -m "Cambios" && git push
```

En un minuto GitHub Pages publica la nueva versión y la app del teléfono la toma la próxima vez que se abra con internet.

## Probarla en la Mac (como si fuera un Galaxy S23)

1. Abre la Terminal en esta carpeta y levanta el servidor:
   ```bash
   python3 -m http.server 8080
   ```
2. En Chrome abre `http://localhost:8080`.
3. Abre DevTools (`Cmd + Opt + I`) y activa la vista de celular (`Cmd + Shift + M`).
4. Arriba, en **Dimensions → Edit… → Add custom device**, crea:
   - Nombre: `Galaxy S23` · Ancho `360` · Alto `780` · Device pixel ratio `3`
   - Tipo: **Mobile** (para simular el dedo)
5. Elige "Galaxy S23" en la lista. Arrastra con el mouse para hacer los gestos.

También funciona con el trackpad (dos dedos) y con atajos: `n` nueva tarea · `h` horario · `Esc` cerrar.

## Gestos

| Dónde | Gesto | Qué hace |
|---|---|---|
| Espacio vacío de abajo | Deslizar hacia arriba (o tocar) | Nueva tarea |
| Tarjeta | Tocar | Ver la tarea completa |
| Tarjeta | Deslizar a la derecha | Botón de eliminar (si deslizas hasta el fondo, la borra) |
| Círculo de la tarjeta | Tocar | Marcar como hecha |
| Borde izquierdo, saludo o espacio vacío | Deslizar a la derecha | Horario (también el botón 📅) |
| Horario | Deslizar a la izquierda | Volver (también el botón de lista) |
| Borde derecho o cualquier parte | Deslizar a la izquierda | Materias (también el botón 📚) |
| Materias | Deslizar a la derecha | Volver |
| Pestañas de arriba | Tocar | Tareas / Materiales / Proyectos (el botón de al lado ordena y filtra) |
| Título del horario | Jalar hacia abajo | Editar horario (también el lápiz; ✓ para terminar) |
| Parte de arriba de una hoja | Deslizar hacia abajo | Cerrarla |

En Android, el gesto/botón **atrás** cierra lo que esté abierto. En la pantalla principal avisa "Desliza otra vez para salir" y el siguiente sale de la app. En Samsung con navegación por gestos, los bordes son "atrás": para el horario o materias desliza empezando un poco hacia adentro (por ejemplo, sobre el saludo).

Los exámenes avisan dentro de la app; para una alarma real en el teléfono usa "Agregar a Google Calendar" en el examen.

## Instalarla en el Samsung

La app necesita estar en una dirección `https://` para instalarse.

- **GitHub Pages** (gratis, permanente): sube esta carpeta a un repositorio y activa *Settings → Pages*.
- **Netlify** (gratis): arrastra esta carpeta en <https://app.netlify.com/drop> y crea una cuenta para que no caduque.

Luego, en el Samsung: abre la dirección en **Chrome → ⋮ → Agregar a pantalla principal → Instalar**.

Para una prueba rápida en el teléfono sin publicar: con el servidor corriendo y el teléfono en la misma Wi-Fi, abre `http://IP-DE-TU-MAC:8080` (la IP sale con `ipconfig getifaddr en0`). Funciona, pero sin modo offline ni instalación.

## Dónde se guardan los datos

En el propio teléfono (`localStorage` de Chrome). Si se borran los datos de Chrome o se desinstala la app, se pierden.

## Archivos

- `index.html` — estructura de las pantallas
- `styles.css` — colores, tipografía y animaciones (los colores están arriba, en `:root`)
- `app.js` — lógica; los saludos y sus horarios están hasta arriba en `GREETINGS`
- `sw.js`, `manifest.webmanifest`, `icons/` — lo necesario para instalarla como app
