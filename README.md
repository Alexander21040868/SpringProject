# Финпульс — учёт личных и семейных финансов

Backend-система на Spring Boot с элементами микросервисной архитектуры: пользователи ведут
доходы и расходы, объединяются в семьи, классифицируют операции по категориям и строят отчёты
за произвольные периоды. Доступ к данным разграничен по ролевой модели семьи и защищён JWT.
https://fin-pulse.online
## Архитектура

Единая точка входа — **API Gateway**; за ним три сервиса и общий PostgreSQL.

```
                 ┌────────────┐
   браузер  ───▶ │  frontend  │ (nginx, React)
                 └─────┬──────┘
                       │ /api/ → gateway
                 ┌─────▼──────┐
                 │  gateway   │  :8080  (Spring Cloud Gateway)
                 └──┬───┬───┬─┘
        /auth,/users│   │   │/reports
                ┌───▼─┐ │ ┌─▼───────┐
                │auth │ │ │ reports │ :8083 ── REST(JWT) ──┐
                │:8081│ │ └─────────┘                      │
                └──┬──┘ │/families,/operations,...         │
                   │  ┌─▼────┐                             │
                   │  │ core │ :8082 ◀──────────────────────┘
                   │  └──┬───┘
              ┌────▼─────▼────┐
              │   postgres    │  БД: auth, core
              └───────────────┘
```

| Сервис | Порт | Назначение | БД |
|---|---|---|---|
| `gateway` | 8080 | Маршрутизация `/api/v1/**`, CORS | — |
| `auth-service` | 8081 | Регистрация, вход, выдача/обновление JWT, профиль | `auth` |
| `core-service` | 8082 | Семьи, участники, приглашения, категории, операции, лимиты | `core` |
| `reports-service` | 8083 | Отчёты и аналитика (читает операции из core по REST) | — |
| `frontend` | 8088 | React-приложение (nginx) | — |

**Почему так:** auth и reports вынесены в отдельные сервисы (как требует ТЗ). reports не имеет
своей БД — он синхронно ходит в core по REST, пробрасывая JWT пользователя, поэтому контроль
доступа не дублируется. Между сервисами — синхронный REST (для отчётов важна согласованность
ответа в реальном времени; очередь здесь избыточна).

## Запуск через Docker Compose

Нужен только Docker. Из корня проекта сначала создайте `.env` с секретами
(в репозиторий он не коммитится), затем поднимите систему:

```bash
cp .env.example .env 
docker compose up --build
```

Поднимется PostgreSQL (с автосозданием БД `auth` и `core`), все сервисы и фронтенд.
Миграции схемы применяет Flyway при старте каждого сервиса.

- Фронтенд: <http://localhost>
- API через шлюз: <http://localhost/api/v1> (тот же порт 80, проксируется на шлюз)
- PostgreSQL и сервисы наружу не публикуются — доступны только внутри docker-сети

Остановить и удалить контейнеры (данные в томе сохранятся):

```bash
docker compose down
```

Полная очистка вместе с данными БД:

```bash
docker compose down -v
```

### Быстрая проверка API

API доступен через тот же 80-й порт (frontend проксирует `/api/` на шлюз):

```bash
curl -X POST http://localhost/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"password123","name":"Я"}'
```

## Переменные окружения

Значения по умолчанию подходят для локального запуска; для прода переопределите секрет и пароли.

| Переменная | Сервисы | По умолчанию | Назначение |
|---|---|---|---|
| `JWT_SECRET` | auth, core, reports | `dev-secret-…` | Общий секрет подписи JWT (HS512). **Сменить в проде.** |
| `DB_USERNAME` | postgres, auth, core | `finpulse` | Пользователь БД |
| `DB_PASSWORD` | postgres, auth, core | `finpulse` | Пароль БД |
| `DB_URL` | auth, core | `jdbc:postgresql://postgres:5432/<db>` | JDBC URL |
| `SPRING_PROFILES_ACTIVE` | auth, core | `postgres` | Профиль БД (иначе встроенная H2) |
| `CORE_URL` | reports | `http://core:8082` | Адрес core для межсервисных вызовов |
| `AUTH_URI` / `CORE_URI` / `REPORTS_URI` | gateway | `http://<svc>:<port>` | Адреса сервисов для маршрутизации |
| `VITE_USE_MOCK` | frontend (build-arg) | `false` | `true` — фронт работает на моках без бэка |

## Тесты

```bash
mvn test          # все модули
mvn -pl core-service test   # отдельный модуль
```

Покрыто: бизнес-логика операций и отчётов, разграничение доступа (роли OWNER/MEMBER/VIEWER),
валидация входных данных, обработка ошибок, REST API и работа с БД. Сервисы auth и core
тестируются интеграционно (`@SpringBootTest` + MockMvc на встроенной H2), построение отчётов
в reports — юнит-тестами на подставных данных из core.

## Локальный запуск без Docker

Каждый сервис — самостоятельное Spring Boot приложение. По умолчанию (без профиля `postgres`)
поднимается на встроенной H2, внешняя БД не нужна:

```bash
cd auth-service   && mvn spring-boot:run   # :8081
cd core-service   && mvn spring-boot:run   # :8082
cd reports-service && mvn spring-boot:run  # :8083
cd gateway        && mvn spring-boot:run   # :8080
```

Фронтенд в режиме разработки (моки включены по умолчанию):

```bash
cd frontend && npm install && npm run dev   # :5173
```

## Технологии

Spring Boot 3.3, Spring MVC, Spring Security (JWT), Spring Data JPA, Bean Validation,
Flyway, Spring Cloud Gateway, Resilience4j (Retry + Circuit Breaker), Apache POI (xlsx),
PostgreSQL / H2, React 18 + TypeScript + Vite. Контракт API — `openapi/openapi.yaml`.

Отчёты выгружаются в `csv` и `xlsx` (параметр `format` эндпоинта `/reports/export`).
Вызовы reports → core защищены таймаутами, повторами и предохранителем (circuit breaker).

## Структура репозитория

```
finpulse/                 родительский Maven-реактор
├─ gateway/               API Gateway
├─ auth-service/          сервис аутентификации
├─ core-service/          доменный сервис
├─ reports-service/       сервис отчётов
├─ frontend/              React-приложение
├─ openapi/openapi.yaml   контракт API
├─ docker/                init-скрипт PostgreSQL
└─ docker-compose.yml
```
