# Finance OS

Aplicacion web personal de gestion financiera full-stack con foco en un caso real en Espana: convivencia de salario por cuenta ajena e ingresos como autonomo. La app separa caja aparente de caja real disponible y modela correctamente IVA, IRPF retenido, IRPF efectivo estimado, provisiones fiscales, presupuestos, inversiones y patrimonio.

## Stack

- Next.js 16 + TypeScript
- App Router + route handlers
- Prisma ORM
- PostgreSQL
- Tailwind CSS v4
- Recharts
- React Query
- React Hook Form + Zod
- Vitest

## Capacidades incluidas

- Dashboard con KPIs, comparativas y graficas
- Modulo de transacciones multi-cuenta
- Presupuestos mensuales por categoria
- Sistema editable de categorias y subcategorias en modelo de datos
- Modulo de autonomo con facturas, IVA, IRPF retenido, IRPF estimado y provision pendiente
- Vista fiscal mensual
- Inversiones manuales
- Patrimonio neto y evolucion temporal
- Forecast mensual
- Panel de settings financieros
- Seed con datos realistas del caso descrito
- Dockerfile y configuracion para Railway

## Arquitectura

La app esta organizada para mantener el dominio financiero desacoplado de la UI:

- `domain/finance`: logica financiera pura y testeable
- `server/finance-service.ts`: consultas y agregados para las vistas
- `app/api/*`: route handlers con validacion Zod
- `prisma/schema.prisma`: modelo de datos extensible
- `components/*`: shell, cards, charts y bloques de UI reutilizables

La logica diferencial del autonomo vive fuera de React y se prueba con tests unitarios.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```bash
cp .env.example .env
```

Variables:

- `DATABASE_URL`: conexion Prisma a PostgreSQL
- `DIRECT_URL`: conexion directa para migraciones en Railway/Postgres
- `NEXT_PUBLIC_APP_NAME`: nombre publico de la app
- `APP_URL`: URL base de la app

## Arranque local paso a paso

1. Instala dependencias:

```bash
npm install
```

2. Asegura que tienes un PostgreSQL accesible y configura `.env`.

3. Genera el cliente y aplica esquema:

```bash
npm run db:generate
npm run db:migrate:dev
```

4. Carga datos demo:

```bash
npm run db:seed
```

5. Arranca la app:

```bash
npm run dev
```

6. Abre `http://localhost:3000`.

## Scripts utiles

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run db:migrate:dev`
- `npm run db:migrate:deploy`
- `npm run db:seed`
- `npm run db:push`

## Seed demo

El seed crea:

- salario bruto anual `30000`
- neto mensual demo `2050`
- facturacion recurrente de autonomo con base `1949.65`
- IVA `21%`
- IRPF retenido `15%`
- IRPF efectivo estimado `24%`
- cuota de autonomo `90`
- gastos mensuales realistas
- inversion mensual de `500` en SP500
- snapshots de 6 meses para dashboard, forecast y patrimonio

## Despliegue en Railway

### 1. Crear proyecto

1. Crea un proyecto nuevo en Railway.
2. Conecta este repositorio GitHub.
3. Anade un servicio PostgreSQL desde Railway.

### 2. Configurar variables

Configura en Railway:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `DIRECT_URL=${{Postgres.DATABASE_PUBLIC_URL}}` si Railway te la ofrece; si no, usa el mismo valor que `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME=Finance OS`
- `APP_URL=https://tu-dominio.railway.app`

### 3. Build y start

Railway usara:

- build: `npm install && npm run build`
- start: `npx prisma migrate deploy && npm run start`

La configuracion ya esta reflejada en `railway.json`.

### 4. Ejecutar migraciones

Opcion recomendada:

- deja que el `startCommand` ejecute `prisma migrate deploy`

Opcion manual:

```bash
npx prisma migrate deploy
```

### 5. Seed en Railway

Solo si quieres el entorno demo:

```bash
npm run db:seed
```

Puedes ejecutarlo desde Railway CLI o un one-off command.

### 6. Verificar despliegue

- abre la URL publicada
- confirma que `/dashboard` carga
- revisa que `/api/dashboard` devuelve JSON
- revisa logs por si Prisma detecta falta de migraciones

## Migraciones

En desarrollo:

```bash
npm run db:migrate:dev
```

En produccion:

```bash
npm run db:migrate:deploy
```

## Tests

Ejecuta:

```bash
npm run test
```

Incluye:

- unit tests del dominio financiero
- test basico de integracion del route handler de facturas

## Troubleshooting

### Prisma no conecta

- verifica `DATABASE_URL`
- confirma que PostgreSQL esta accesible
- ejecuta `npm run db:generate`

### La app arranca pero no hay datos

- ejecuta `npm run db:seed`
- revisa que el usuario demo `eduardo@example.com` existe

### Railway arranca pero falla en `start`

- confirma que hay migraciones aplicadas
- revisa logs de `prisma migrate deploy`
- asegure que `DATABASE_URL` y `DIRECT_URL` estan definidas

### Cambios de esquema

1. modifica `prisma/schema.prisma`
2. ejecuta `npm run db:migrate:dev`
3. vuelve a correr `npm run db:seed` si necesitas refrescar demo
