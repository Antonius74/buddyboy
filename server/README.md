# Leaderboard Server

Backend minimo (Node.js senza dipendenze) per la classifica server-side.

## Avvio locale

```bash
node server/leaderboard-server.js
```

Di default usa `http://localhost:8787` e salva i dati in `server/leaderboard.json`.

## Endpoint

- `GET /api/leaderboard`
- `POST /api/register` con body JSON `{ "playerId": "...", "name": "..." }`
- `POST /api/score` con body JSON `{ "playerId": "...", "name": "...", "score": 1234, "difficulty": 3, "won": true }`

## Note deploy

GitHub Pages e' statico: non puo' scrivere file server-side.
Per avere classifica condivisa serve deployare questo server su un servizio backend (Render, Railway, Fly.io, VPS, ecc.) e passare al gioco il parametro URL:

```text
?api=https://tuo-backend.example.com/api
```
