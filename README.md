# FarmIoT — Система управления фермерским хозяйством

## Назначение

Веб-приложение для комплексного управления фермерским хозяйством. Система объединяет учёт поголовья скота, посевов, ветеринарных мероприятий, финансов и планирование работ, а также принимает и визуализирует данные IoT-датчиков (температура, влажность почвы, GPS-трекинг) в реальном времени.

## Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Серверная часть | Python, FastAPI, SQLAlchemy, Pydantic |
| Клиентская часть | React, TypeScript, Tailwind CSS |
| База данных | TimescaleDB (расширение PostgreSQL 15) |
| IoT-протокол | MQTT — брокер Mosquitto, клиент Paho-MQTT |
| Картография | Яндекс.Карты (JavaScript API 2.1) |
| Контейнеризация | Docker, Docker Compose |
| Симулятор IoT | Python, paho-mqtt |

## Структура проекта

```
├── backend/
│   ├── main.py           — FastAPI: REST API (CRUD + удаление)
│   ├── models.py         — модели SQLAlchemy (Animal, Crop, SensorData, VetRecord, WorkPlan, FinanceRecord, Calculation)
│   ├── schemas.py        — Pydantic-схемы
│   ├── mqtt_client.py    — MQTT-клиент (приём телеметрии)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/App.tsx       — основной компонент (карта, модули, CRUD)
│   ├── src/index.tsx
│   ├── src/index.css
│   ├── public/index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── simulator/
│   ├── simulator.py      — генератор данных датчиков (MQTT publish)
│   ├── requirements.txt
│   └── Dockerfile
├── mosquitto/
│   └── config/mosquitto.conf
├── docker-compose.yml
└── README.md
```

## Модули системы

| Модуль | Назначение |
|--------|-----------|
| Панель управления | Дашборд с показаниями датчиков (температура, влажность), интерактивная карта (Яндекс.Карты) с маркерами GPS-устройств, определение ближайших датчиков к выбранной точке, геолокация пользователя |
| Учёт поголовья | Реестр животных (кличка, вид, порода, дата рождения, статус), добавление/удаление записей |
| Учёт посевов | Реестр культур (название, площадь, даты посадки/сбора, статус), добавление/удаление записей |
| Ветеринарный учёт | История осмотров и лечения животных, выбор животного из списка, запись описания, лечения и стоимости |
| Планирование работ | Календарь задач с планируемой датой и статусом выполнения |
| Расчёт кормов | Расчёт необходимого количества кормов и удобрений |
| Финансы | Учёт доходов и расходов по категориям |
| IoT-телеметрия | Приём данных от датчиков по MQTT, сохранение в TimescaleDB, обновление на карте |

## Архитектура

```
 IoT-датчики  ──MQTT──▶  Mosquitto  ──▶  FastAPI (mqtt_client.py)  ──▶  TimescaleDB
                                                                 │
 React (SPA :3000)  ◀──REST API──  FastAPI (:8000)  ◀────────────┘
```

- **FastAPI** предоставляет REST API для CRUD-операций по всем модулям, а также эндпоинты `/sensors` для получения данных датчиков.
- **SQLAlchemy** управляет миграциями и созданием таблиц при старте сервера.
- **MQTT-клиент** подписывается на топик датчиков и сохраняет данные в таблицу `sensor_data`.
- **React** взаимодействует с FastAPI через HTTP-запросы (axios), отображает карту с маркерами датчиков.
- **TimescaleDB** хранит временные ряды телеметрии, обеспечивая высокую скорость вставки и выборки.

## REST API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/sensors` | Последние показания датчиков |
| GET | `/animals` | Список животных |
| POST | `/animals` | Добавить животное |
| DELETE | `/animals/{id}` | Удалить животное |
| GET | `/crops` | Список посевов |
| POST | `/crops` | Добавить посев |
| DELETE | `/crops/{id}` | Удалить посев |
| GET | `/vet` | Список ветеринарных записей |
| POST | `/vet` | Добавить ветеринарную запись |
| DELETE | `/vet/{id}` | Удалить ветеринарную запись |
| GET | `/tasks` | Список задач |
| POST | `/tasks` | Добавить задачу |
| DELETE | `/tasks/{id}` | Удалить задачу |
| GET | `/finance` | Финансовые записи |
| POST | `/finance` | Добавить запись |
| DELETE | `/finance/{id}` | Удалить запись |
| GET | `/calculations` | Расчёты кормов/удобрений |
| POST | `/calculations` | Добавить расчёт |
| DELETE | `/calculations/{id}` | Удалить расчёт |

## Запуск

### Через Docker Compose

```bash
docker-compose up --build
```

### Сервисы и порты

| Сервис | URL | Порт |
|--------|-----|------|
| Frontend (React) | http://localhost:3000 | 3000 |
| Backend (FastAPI) | http://localhost:8000 | 8000 |
| TimescaleDB | postgresql://localhost:5432 | 5432 |
| Mosquitto MQTT | localhost:1883 | 1883 |
| Mosquitto WebSocket | ws://localhost:9001 | 9001 |

### Переменные окружения

Создайте файл `.env` в корне проекта:

```
POSTGRES_USER=farm_user
POSTGRES_PASSWORD=farm_password
POSTGRES_DB=farm_db
DATABASE_URL=postgresql://farm_user:farm_password@db:5432/farm_db
MQTT_BROKER=mosquitto
```

## Настройка карты

Для работы Яндекс.Карт нужно получить бесплатный API-ключ:
1. Перейдите на https://developer.tech.yandex.ru/
2. Создайте ключ для «JavaScript API и HTTP Геокодер» (бесплатно)
3. Вставьте ключ в файл `frontend/src/App.tsx`:
```typescript
const YANDEX_MAPS_API_KEY = "ваш_ключ";
```
4. Пересоберите фронтенд: `docker-compose restart frontend`

## IoT-датчики

Симулятор (`simulator/simulator.py`) генерирует и отправляет по MQTT данные от трёх типов датчиков:

| Датчик | Тип | Формат данных |
|--------|-----|---------------|
| Температура | `temperature` | `{"sensor_type": "temperature", "value": 25.3, "latitude": ..., "longitude": ..., "device_id": "sensor_temp_01"}` |
| Влажность почвы | `humidity` | `{"sensor_type": "humidity", "value": 62.1, "latitude": ..., "longitude": ..., "device_id": "sensor_hum_01"}` |
| GPS-трекер | `gps` | `{"sensor_type": "gps", "latitude": ..., "longitude": ..., "device_id": "gps_tracker_01"}` |

## База данных

### Таблица `animals`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| name | VARCHAR | Кличка |
| species | VARCHAR | Вид |
| breed | VARCHAR | Порода |
| birth_date | DATE | Дата рождения |
| status | VARCHAR | Статус |

### Таблица `crops`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| name | VARCHAR | Название культуры |
| area | FLOAT | Площадь (га) |
| planting_date | DATE | Дата посадки |
| expected_harvest_date | DATE | Ожидаемая дата сбора |
| status | VARCHAR | Статус |

### Таблица `sensor_data`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| sensor_type | VARCHAR | Тип датчика |
| value | FLOAT (nullable) | Значение |
| latitude | FLOAT (nullable) | Широта |
| longitude | FLOAT (nullable) | Долгота |
| timestamp | DATETIME | Время измерения |
| device_id | VARCHAR | ID устройства |

### Таблица `vet_records`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| animal_id | INTEGER FK | Ссылка на животное |
| record_date | DATE | Дата записи |
| description | TEXT | Описание |
| treatment | VARCHAR | Лечение |
| cost | FLOAT | Стоимость |

### Таблица `work_plans`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| title | VARCHAR | Задача |
| description | TEXT | Описание |
| planned_date | DATE | Планируемая дата |
| is_completed | INTEGER | Статус (0/1) |

### Таблица `finance`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| category | VARCHAR | Категория |
| amount | FLOAT | Сумма |
| is_income | INTEGER | 1 — доход, 0 — расход |
| record_date | DATE | Дата |
| description | TEXT | Описание |

### Таблица `calculations`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| item_type | VARCHAR | Корм / Удобрение |
| target_id | INTEGER | ID животного или посева |
| quantity | FLOAT | Количество |
| unit | VARCHAR | Единица измерения |
| calculation_date | DATE | Дата расчёта |