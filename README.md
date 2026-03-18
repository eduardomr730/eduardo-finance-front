# Finance Hub

Aplicacion sencilla para llevar finanzas personales con:

- ingresos mensuales
- budgets personalizados
- gastos asociados a budgets
- edicion y borrado completo de todos los datos
- creacion automatica de tablas en el primer arranque

## Variables

Crea una variable `DATABASE_URL` apuntando a tu Postgres.

```bash
DATABASE_URL=postgres://usuario:password@host:5432/database
```

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue en Railway

1. Crea un servicio web usando este repositorio.
2. Crea un servicio PostgreSQL en el mismo proyecto.
3. Añade la variable `DATABASE_URL` del Postgres al servicio web.
4. Despliega.

No hace falta ejecutar migraciones manuales: la aplicacion crea las tablas necesarias con `CREATE TABLE IF NOT EXISTS` cuando arranca por primera vez.
