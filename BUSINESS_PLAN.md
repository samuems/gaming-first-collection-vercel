# Gaming-First Collection
## Plan de Producto — Versión para Empresas

---

## ¿Qué es?

**Gaming-First Collection** es un motor de juego de colección de personajes diseñado para ser integrado dentro de plataformas de casino o entretenimiento existentes.

El producto funciona como una capa de juego adicional que los operadores ofrecen a sus jugadores junto con su catálogo habitual (slots, mesas en vivo, etc.). El jugador colecciona personajes, construye su equipo y compite en torneos o batallas directas — todo sin abandonar la plataforma del operador.

---

## Problema que resuelve

Los casinos online compiten principalmente por atención en el momento de la sesión. Una vez que el jugador cierra la app, no hay motivo para volver hasta que quiera apostar de nuevo.

Un juego de colección añade **retención entre sesiones**: el jugador vuelve para:
- Ver si abrió una carta nueva
- Competir en el torneo de esta semana
- Subir de nivel sus personajes
- Revisar los resultados de sus batallas

Esto aumenta las visitas diarias y el tiempo en plataforma sin necesidad de añadir más juegos de casino.

---

## Modelo de negocio para el operador

El operador recibe una **licencia del motor de juego** y lo integra en su plataforma. Puede personalizar:

- El nombre y la estética de los personajes (cartas, luchadores, monstruos, futbolistas, mascotas, naves espaciales…)
- Las imágenes y el tema visual
- La terminología (no tiene que llamarse "carta" — puede ser "jugador", "héroe", "piloto"…)

La mecánica de juego es siempre la misma. Solo cambia la capa visual. Esto permite al operador tener un producto que siente como **suyo** sin haberlo construido desde cero.

---

## Cómo funciona el juego (para el jugador)

### 1. Colección
El jugador acumula personajes a través de cofres (paquetes de sobre) que puede abrir con los créditos de la plataforma. Cada personaje tiene:
- **Rareza:** Común, Raro, Épico, Legendario
- **Afinidad elemental:** Fuego, Agua, Aire, Tierra, Rayo, Hielo, Naturaleza, Luz, Sombra
- **Estadísticas:** Poder y Velocidad

Existen entre 40 y 60 personajes distintos. El jugador empieza con 5 personajes comunes.

### 2. Progresión
Los personajes suben de nivel cuando el jugador consigue **copias duplicadas** del mismo personaje. Al subir de nivel, aumentan sus estadísticas. No hay sistema de experiencia ni sesiones de grinding — la progresión viene del ritmo natural de abrircolección.

### 3. Equipo (Lineup)
El jugador selecciona 5 personajes para su equipo activo. El orden importa: el personaje en el puesto 1 siempre lucha contra el personaje en el puesto 1 del rival.

### 4. Batallas
Las batallas ocurren **de forma automática en segundo plano** — el motor calcula el resultado completo en el momento en que el jugador pulsa "Buscar rival". No hay habilidad en tiempo real ni esperas.

Una vez calculado el resultado, el jugador puede elegir entre ver el resultado directamente o ver un **replay animado** de la batalla: una presentación visual ronda por ronda que reconstruye lo que pasó a partir de los registros almacenados. El replay no es una batalla en vivo — es una narración animada del resultado ya decidido, diseñada para hacerlo más entretenido y comprensible.

Formato: 5 rondas. En cada ronda, un personaje de cada bando lucha entre sí. Gana quien gane 3 de las 5 rondas.

La puntuación de cada ronda se calcula con:
- Poder base del personaje
- Bonificación de afinidad (si el elemento del atacante es fuerte contra el del defensor)

Esto añade una capa de **estrategia**: construir un equipo con las afinidades correctas importa.

### 5. Torneos
El operador puede activar torneos semanales o por temporada. Los jugadores inscriben su equipo antes de que empiece. Una vez iniciado, el sistema simula todas las batallas automáticamente y genera una clasificación. Sin esperas, sin matchmaking en tiempo real.

### 6. Batallas 1v1 Instantáneas
Además de los torneos, el jugador puede buscar una batalla rápida en cualquier momento. El sistema busca un rival real en la plataforma y, si no lo encuentra, usa un oponente bot con nombre y estadísticas reales.

El resultado se calcula y almacena de forma instantánea. A continuación el jugador puede ver directamente quién ganó y el marcador de rondas, o elegir ver el **replay animado** — una recreación visual ronda a ronda que convierte los datos del combate en una experiencia de visionado entretenida.

---

## Lo que ve el operador (Back Office)

El operador tiene acceso a un panel de administración donde puede:

- **Gestionar operadores y claves de API** — cada cliente tiene su propia clave de acceso
- **Gestionar el catálogo de personajes** — añadir, editar o desactivar personajes del juego
- **Personalizar por operador** — cambiar nombres e imágenes de los personajes para cada cliente
- **Gestionar torneos** — crear torneos, abrirlos a inscripción, activarlos y cerrarlos
- **Configurar cofres** — ajustar las probabilidades de rareza por operador
- **Ver historial de batallas** — todas las partidas de todos los operadores, con estadísticas de uso

---

## Hoja de ruta de versiones

### MVP0 — Motor base ✅ Completado
Todo el núcleo del juego:
- Colección de personajes
- Sistema de rareza y afinidad elemental
- Progresión por duplicados
- Constructor de equipo (5 slots)
- Motor de batalla determinista (5 rondas)
- Torneos automáticos
- Sistema de cofres con probabilidades configurables
- Historial de batallas con replay
- Panel de administración completo
- API lista para integración

### MVP1 — Batallas Instantáneas + Demo de Jugador ✅ Completado
- Búsqueda de rival en tiempo real con fallback a bot
- Resultado inmediato con replay animado de las rondas
- Interfaz de demostración para el jugador (lobby estilo casino, colección, equipo, arena, historial, tienda)
- La demo sirve tanto para presentar el producto al operador como de referencia de implementación

### MVP2 — Sistema Competitivo
- Rating (Elo) por jugador
- Ligas y temporadas
- Clasificación global por operador
- Notificaciones en tiempo real (resultado de torneo, nueva carta disponible)
- Panel de analíticas de engagement para el operador

### MVP3 — Temporadas
- Pases de temporada
- Puntos de batalla (Battle Points) y recompensas de temporada
- Reset de rating entre temporadas
- Recompensas exclusivas de temporada

### MVP4 — Contenido Premium
- Personajes de edición limitada
- Cosméticos (marcos de carta, efectos visuales)
- Temas de temporada personalizados por operador
- Contenido exclusivo para jugadores VIP del operador

### MVP5 — Capa Social
- Perfiles de jugador
- Lista de amigos
- Retos directos amigo vs amigo
- Historial público de enfrentamientos
- Modo espectador de torneos

### MVP6 — Profundidad de Juego
- Habilidades especiales por personaje
- Afinidades adicionales
- Nuevos modos de batalla
- Gremios / equipos
- Intercambio de personajes entre jugadores
- Mercado interno

---

## Diferenciadores clave

**Sin habilidad en tiempo real.** El juego no requiere reflejos ni disponibilidad instantánea. El jugador prepara su equipo cuando quiere y los resultados se calculan solos. Esto lo hace compatible con el perfil de usuario de casino.

**Temática completamente intercambiable.** El mismo motor puede ser "cartas de dragones" para un operador y "jugadores de fútbol" para otro. El operador tiene un producto que siente como propio.

**Integración limpia.** El operador llama a la API con sus propias cabeceras de autenticación. No hay que migrar usuarios ni cambiar la infraestructura existente.

**Escalable por fases.** Un operador puede empezar solo con colección y torneos, y activar batallas instantáneas o temporadas cuando esté listo. No tiene que lanzar todo a la vez.

---

## Estado actual

El producto tiene MVP0 y MVP1 completamente construidos y desplegados. Existe una demo funcional accesible online que un operador puede explorar con su propia clave de API y ver el flujo completo del jugador: coleccionar, construir equipo, buscar rival, ver batalla, ver resultados.
