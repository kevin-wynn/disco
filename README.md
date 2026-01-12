# Disco

A music collection management app built with Astro, React, and SQLite.

## Getting Started

### Prerequisites

- Node.js
- Yarn (v1.22.21)

### Installation

```bash
yarn install
```

### Running Locally

```bash
yarn dev
```

This starts the development server at `http://localhost:4321`.

### Building for Production

```bash
yarn build
```

Preview the production build:

```bash
yarn preview
```

## Database Schema

The app uses SQLite with Drizzle ORM. The database file is `disco.db`.

### Tables

#### `artists`

| Column      | Type    | Description                              |
| :---------- | :------ | :--------------------------------------- |
| `id`        | INTEGER | Primary key                              |
| `name`      | TEXT    | Artist name                              |
| `discogs_id`| INTEGER | Discogs artist ID                        |
| `image_url` | TEXT    | URL to artist image                      |
| `deleted_at`| INTEGER | Soft delete timestamp                    |

#### `albums`

| Column      | Type    | Description                              |
| :---------- | :------ | :--------------------------------------- |
| `id`        | INTEGER | Primary key                              |
| `title`     | TEXT    | Album title                              |
| `year`      | TEXT    | Release year                             |
| `genres`    | TEXT    | Comma-separated genres                   |
| `styles`    | TEXT    | Comma-separated styles                   |
| `discogs_id`| INTEGER | Discogs release ID                       |
| `image_url` | TEXT    | URL to album cover                       |
| `deleted_at`| INTEGER | Soft delete timestamp                    |
| `artist_id` | INTEGER | Foreign key → `artists.id` (required)    |

#### `tracks`

| Column      | Type    | Description                              |
| :---------- | :------ | :--------------------------------------- |
| `id`        | INTEGER | Primary key                              |
| `title`     | TEXT    | Track title                              |
| `duration`  | TEXT    | Track duration                           |
| `deleted_at`| INTEGER | Soft delete timestamp                    |
| `album_id`  | INTEGER | Foreign key → `albums.id` (required)     |

## Testing

Tests are written with Vitest.

### Run Tests (Watch Mode)

```bash
yarn test
```

### Run Tests Once

```bash
yarn test:run
```

### Run Tests with Coverage

```bash
yarn test:coverage
```

Coverage reports are generated in `text`, `json`, and `html` formats.
