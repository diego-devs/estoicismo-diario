# 🏛️ Estoicismo Diario

Reflexiones estoicas diarias basadas en **"The Daily Stoic"** (Estoicismo Cotidiano) de **Ryan Holiday**.

Una meditación para cada día del año, con citas de Marco Aurelio, Séneca, Epicteto y otros grandes estoicos.

## 🔗 Ver el sitio

👉 **[diego-devs.github.io/estoicismo-diario](https://diego-devs.github.io/estoicismo-diario/)**

## 📋 Contenido

- 📅 **49 meditaciones** (1 enero — 18 febrero 2026) y creciendo diariamente
- 📖 Cita estoica original con autor y fuente
- 💭 Reflexión en español aplicable al día a día
- 🏷️ Tags temáticos por meditación

## 🏗️ Arquitectura

```
estoicismo-diario/
├── index.html              # Sitio web estático (vanilla HTML/CSS/JS)
└── articles/
    ├── index.json           # Índice de todos los artículos
    ├── 2026-01-01.json      # Artículo individual
    ├── 2026-01-02.json
    └── ...
```

### Formato de cada artículo

```json
{
  "date": "2026-01-01",
  "month": 1,
  "day": 1,
  "title": "Título de la meditación",
  "quote": "La cita estoica",
  "author": "Marco Aurelio",
  "source": "Meditaciones, 5.1",
  "reflection": "Reflexión en español...",
  "tags": ["control", "virtud"]
}
```

### 🔌 Listo para API

El sitio carga los artículos via `fetch()` desde los archivos JSON. Para migrar a una API, solo cambia el `BASE_URL` en el código — la estructura de datos ya está lista.

## ✨ Features

- 🌙 Diseño oscuro, minimalista y elegante
- 🔍 Búsqueda client-side (Ctrl+K)
- 📅 Filtro por mes
- 📱 Responsive — mobile-first
- ⬆️ Scroll to top
- ✨ Animaciones sutiles al scroll

## 🤖 Actualización automática

Se agrega una nueva meditación cada día a las 7:00 AM (CDMX) de forma automática.

## 🚀 Uso local

```bash
cd estoicismo-diario
python3 -m http.server 8080
# Abrir http://localhost:8080
```

---

*Inspirado en "The Daily Stoic" de Ryan Holiday y Stephen Hanselman.*
