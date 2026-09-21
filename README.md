# 🏓 torneijirillos - Gestor de Torneos de Tenis de Mesa

**torneijirillos** es una aplicación web React en español para la gestión completa de torneos de Tenis de Mesa (Ping Pong), desde la fase de grupos hasta la coronación del campeón en eliminación directa.

## 🌟 Características
- **Fase de Configuración**: Configuración dinámica de N grupos (de 1 a 200 grupos, hasta 800 jugadores).
- **Fase de Grupos (Todos contra Todos)**: 6 enfrentamientos automáticos por grupo.
- **Calculadora Punto por Punto (Sets)**: Registro de puntos por set con determinación automática del ganador del set y del partido.
- **Tabla de Posiciones ITTF en Vivo**: Puntos (Victoria=2, Derrota=1) y criterios de desempate ITTF (enfrentamiento directo y ratio de sets en empates triples).
- **Cuadro Eliminatorio Directo (Knockout)**:
  - Clasificación de los 2 mejores de cada grupo.
  - Distribución equitativa y separación en mitades opuestas para jugadores del mismo grupo.
  - Asignación automática de pases directos (BYE) según rendimiento.
  - Árbol interactivo con desplazamiento horizontal y celebración con confeti para el Campeón.

## 🚀 Despliegue en GitHub Pages

```bash
# 1. Vincular el repositorio remoto de GitHub
git remote add origin https://github.com/TU_USUARIO/torneijirillos.git

# 2. Empujar el código a GitHub
git push -u origin main

# 3. Desplegar automáticamente en GitHub Pages
npm run deploy
```

La aplicación se publicará en: `https://TU_USUARIO.github.io/torneijirillos/`
