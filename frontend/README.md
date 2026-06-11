# Финпульс — фронтенд

Веб-интерфейс сервиса учёта личных и семейных финансов. React + TypeScript + Vite.
Свёрстан по макетам: дашборд, операции, отчёты, семья, категории, лимиты, авторизация.

## Стек

- **React 18 + TypeScript + Vite** — SPA, быстрый дев-сервер
- **React Router** — маршрутизация, защита приватных страниц
- **TanStack Query** — загрузка/кэширование данных, инвалидация после мутаций
- **axios** — HTTP-клиент с перехватчиками (JWT в заголовке, обработка 401)
- **Recharts** — кольцевая и линейная диаграммы в отчётах
- **@tabler/icons-webfont** — иконки

## Запуск

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

По умолчанию `VITE_USE_MOCK=true` — приложение работает **без бэкенда** на встроенных
мок-данных (одна семья, 4 участника, ~60 операций за 6 месяцев, отчёты считаются на лету).
Логин — любой email/пароль.

## Подключение к бэкенду

Когда поднимешь API по контракту `../openapi/openapi.yaml`:

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api/v1
```

Дев-сервер проксирует `/api` на `http://localhost:8080` (см. `vite.config.ts`).
Весь слой запросов — в `src/api/`:

- `contract.ts` — единый интерфейс `Api` (его реализуют и HTTP, и мок)
- `http.ts` — реальные вызовы по OpenAPI
- `mock.ts` — in-memory реализация для разработки без бэка
- `queries.ts` — хуки TanStack Query поверх `api`

Типы в `src/types.ts` соответствуют схемам из OpenAPI — менять контракт нужно синхронно.

## Структура

```
src/
  api/           слой данных (контракт, http, mock, react-query хуки, токены)
  auth/          контекст авторизации (JWT в localStorage)
  components/    Layout (сайдбар), PageHeader, UI-примитивы
  lib/           форматирование денег/дат, расчёт периодов
  pages/         экраны: Login, Dashboard, Operations, Reports, Family, Categories, Limits
  types.ts       типы доменной модели (зеркало OpenAPI)
```

## Сборка

```bash
npm run build      # tsc + vite build -> dist/
npm run preview    # предпросмотр прод-сборки
```
