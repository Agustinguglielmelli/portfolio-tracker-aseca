# Locust — Load Testing para Portfolio Tracker API

Pruebas de carga sobre el backend NestJS (`http://localhost:3000`) usando [Locust](https://locust.io/).

## Requisitos

- Python 3.10+ (si corrés localmente) — o Docker + docker-compose
- Backend corriendo en `http://localhost:3000` (local) o dentro del compose

---

## Opción A — Docker Compose (recomendado)

El servicio `locust` usa el **perfil `load-test`** para no levantarse por defecto junto al resto de la app.

```bash
# 1. Levantá el stack normal primero (si no está corriendo)
docker-compose up -d

# 2. Levantá sólo el servicio locust
docker-compose --profile load-test up locust
```

La UI estará disponible en [http://localhost:8089](http://localhost:8089).

---

## Opción B — Instalación local

```bash
# Desde la carpeta locust/ (o la raíz del proyecto)
pip3 install -r locust/requirements.txt
```

## Ejecución

### UI interactiva (recomendado para exploración)

```bash
locust -f locust/locustfile.py --host http://localhost:3000
```

Luego abrí [http://localhost:8089](http://localhost:8089) en el navegador.

Parámetros sugeridos para empezar:
- **Number of users**: 20
- **Spawn rate**: 2 users/sec
- **Run time**: 60s (opcional)

---

### Modo headless (CI / automatizado)

```bash
locust -f locust/locustfile.py \
  --headless \
  --users 20 \
  --spawn-rate 2 \
  --run-time 60s \
  --host http://localhost:3000 \
  --html locust/report.html
```

El reporte HTML se guarda en `locust/report.html`.

---

## Escenarios cubiertos

| Endpoint | Método | Peso |
|---|---|---|
| `POST /auth/register` | POST | setup |
| `POST /auth/login` | POST | setup |
| `GET /portfolio` | GET | 5 |
| `GET /portfolio/transactions` | GET | 3 |
| `POST /portfolio/buy` | POST | 2 |
| `POST /portfolio/sell` | POST | 1 |
| `GET /watchlist` | GET | 4 |
| `POST /watchlist` | POST | 2 |
| `GET /companies/search` | GET | 3 |
| `GET /prices/last-update` | GET | 2 |

---

## Criterios de éxito

- Tasa de fallos < 5%
- Tiempo de respuesta promedio < 500ms para GETs
- Tiempo de respuesta promedio < 1000ms para POSTs

---

## Tickers usados

`AAPL`, `MSFT`, `GOOGL`, `TSLA`, `AMZN`, `NVDA`, `META`

> El backend obtiene los precios de estos tickers desde yfinance. Si alguno falla con `400`, es comportamiento esperado (precio no disponible en ese momento) y Locust lo marca como éxito.
