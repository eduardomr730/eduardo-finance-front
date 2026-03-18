import {
  createBudget,
  createExpense,
  createIncome,
  deleteBudget,
  deleteExpense,
  deleteIncome,
  updateBudget,
  updateExpense,
  updateIncome,
} from "@/app/actions";
import { ensureSchema } from "@/lib/db";
import {
  formatCurrency,
  formatMonthLabel,
  getDashboardData,
  normalizeMonth,
} from "@/lib/finance";

type HomeProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-white/70 bg-white/80 text-slate-950";

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function fieldClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400";
}

function buttonClassName(tone: "primary" | "secondary" | "danger" = "primary") {
  if (tone === "secondary") {
    return "rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950";
  }

  if (tone === "danger") {
    return "rounded-2xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-200";
  }

  return "rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800";
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonth(resolvedSearchParams?.month);
  const databaseReady = await ensureSchema();

  if (!databaseReady) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <div className="rounded-[2rem] border border-amber-200 bg-white/90 p-8 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-amber-700">
            Configuracion pendiente
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Falta conectar la base de datos.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            En Railway crea un servicio Postgres, copia su variable{" "}
            <code className="rounded bg-slate-100 px-2 py-1 text-sm">
              DATABASE_URL
            </code>{" "}
            en esta app y vuelve a desplegar. La primera vez que arranque, las
            tablas se crearán automáticamente.
          </p>
          <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-sm text-slate-100">
            DATABASE_URL=postgres://usuario:password@host:5432/database
          </div>
        </div>
      </main>
    );
  }

  const data = await getDashboardData(month);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(211,227,253,0.9),_rgba(242,246,251,0.6)_35%,_#f7f4ee_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl shadow-slate-200/70 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Finance Hub
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Tus finanzas del mes, claras y editables.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Gestiona ingresos, crea tus propios budgets y registra gastos
                asociados para ver rápido si vas dentro o fuera de objetivo.
              </p>
            </div>

            <form className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-medium text-slate-600" htmlFor="month">
                Mes que quieres revisar
              </label>
              <input
                id="month"
                name="month"
                type="month"
                defaultValue={data.month}
                className={fieldClassName()}
              />
              <button className={buttonClassName("secondary")} type="submit">
                Cambiar mes
              </button>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                Vista actual
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatMonthLabel(data.month)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ingresos del mes" value={formatCurrency(data.totals.income)} />
            <StatCard label="Capacidad en budgets" value={formatCurrency(data.totals.budgeted)} />
            <StatCard
              label="Gastos del mes"
              value={formatCurrency(data.totals.spent)}
              tone={data.totals.spent > data.totals.income ? "warn" : "default"}
            />
            <StatCard
              label="Disponible"
              value={formatCurrency(data.totals.remaining)}
              tone={data.totals.remaining >= 0 ? "good" : "warn"}
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
            <SectionTitle
              title="Ingresos"
              subtitle="Puedes añadir, cambiar o borrar cada entrada mensual."
            />

            <form action={createIncome} className="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4">
              <input type="hidden" name="returnMonth" value={data.month} />
              <input
                name="month"
                type="month"
                defaultValue={data.month}
                className={fieldClassName()}
              />
              <input
                name="source"
                type="text"
                placeholder="Origen o descripcion"
                className={fieldClassName()}
              />
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Cantidad"
                className={fieldClassName()}
                required
              />
              <textarea
                name="note"
                rows={2}
                placeholder="Nota opcional"
                className={fieldClassName()}
              />
              <button className={buttonClassName()} type="submit">
                Guardar ingreso
              </button>
            </form>

            <div className="mt-4 space-y-4">
              {data.incomes.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Todavia no hay ingresos guardados para este mes.
                </p>
              ) : (
                data.incomes.map((income) => (
                  <div key={income.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                    <form action={updateIncome} className="grid gap-3">
                      <input type="hidden" name="id" value={income.id} />
                      <input type="hidden" name="returnMonth" value={data.month} />
                      <input
                        name="month"
                        type="month"
                        defaultValue={income.month}
                        className={fieldClassName()}
                      />
                      <input
                        name="source"
                        type="text"
                        defaultValue={income.source}
                        placeholder="Origen o descripcion"
                        className={fieldClassName()}
                      />
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={income.amount}
                        className={fieldClassName()}
                        required
                      />
                      <textarea
                        name="note"
                        rows={2}
                        defaultValue={income.note}
                        placeholder="Nota opcional"
                        className={fieldClassName()}
                      />
                      <div className="flex gap-3">
                        <button className={buttonClassName()} type="submit">
                          Actualizar
                        </button>
                      </div>
                    </form>

                    <form action={deleteIncome} className="mt-3">
                      <input type="hidden" name="id" value={income.id} />
                      <input type="hidden" name="returnMonth" value={data.month} />
                      <button className={buttonClassName("danger")} type="submit">
                        Borrar
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
            <SectionTitle
              title="Budgets"
              subtitle="Tus categorias y limites mensuales personalizados."
            />

            <form action={createBudget} className="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4">
              <input type="hidden" name="returnMonth" value={data.month} />
              <input
                name="name"
                type="text"
                placeholder="Nombre del budget"
                className={fieldClassName()}
                required
              />
              <input
                name="category"
                type="text"
                placeholder="Categoria"
                className={fieldClassName()}
              />
              <input
                name="monthlyLimit"
                type="number"
                min="0"
                step="0.01"
                placeholder="Limite mensual"
                className={fieldClassName()}
                required
              />
              <textarea
                name="note"
                rows={2}
                placeholder="Nota opcional"
                className={fieldClassName()}
              />
              <button className={buttonClassName()} type="submit">
                Crear budget
              </button>
            </form>

            <div className="mt-4 space-y-4">
              {data.budgets.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Crea tu primer budget y luego podrás asociarle gastos.
                </p>
              ) : (
                data.budgets.map((budget) => {
                  const ratio =
                    budget.monthlyLimit === 0
                      ? 0
                      : Math.min((budget.spentAmount / budget.monthlyLimit) * 100, 100);
                  const remaining = budget.monthlyLimit - budget.spentAmount;

                  return (
                    <div key={budget.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                      <div className="mb-4 rounded-[1.25rem] bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                              {budget.category || "Sin categoria"}
                            </p>
                            <p className="mt-1 text-xl font-semibold text-slate-950">
                              {budget.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">Gastado este mes</p>
                            <p className="mt-1 text-lg font-semibold text-slate-950">
                              {formatCurrency(budget.spentAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 h-3 rounded-full bg-slate-200">
                          <div
                            className={`h-3 rounded-full ${
                              remaining >= 0 ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Limite: {formatCurrency(budget.monthlyLimit)}
                          </span>
                          <span
                            className={
                              remaining >= 0 ? "text-emerald-700" : "text-rose-700"
                            }
                          >
                            {remaining >= 0 ? "Te quedan" : "Te pasas"}{" "}
                            {formatCurrency(Math.abs(remaining))}
                          </span>
                        </div>
                      </div>

                      <form action={updateBudget} className="grid gap-3">
                        <input type="hidden" name="id" value={budget.id} />
                        <input type="hidden" name="returnMonth" value={data.month} />
                        <input
                          name="name"
                          type="text"
                          defaultValue={budget.name}
                          className={fieldClassName()}
                          required
                        />
                        <input
                          name="category"
                          type="text"
                          defaultValue={budget.category}
                          placeholder="Categoria"
                          className={fieldClassName()}
                        />
                        <input
                          name="monthlyLimit"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={budget.monthlyLimit}
                          className={fieldClassName()}
                          required
                        />
                        <textarea
                          name="note"
                          rows={2}
                          defaultValue={budget.note}
                          placeholder="Nota opcional"
                          className={fieldClassName()}
                        />
                        <button className={buttonClassName()} type="submit">
                          Guardar cambios
                        </button>
                      </form>

                      <form action={deleteBudget} className="mt-3">
                        <input type="hidden" name="id" value={budget.id} />
                        <input type="hidden" name="returnMonth" value={data.month} />
                        <button className={buttonClassName("danger")} type="submit">
                          Borrar budget
                        </button>
                      </form>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
            <SectionTitle
              title="Gastos"
              subtitle="Cada gasto suma al budget que elijas en el mes seleccionado."
            />

            {data.budgets.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Primero crea al menos un budget para poder registrar gastos.
              </div>
            ) : (
              <form action={createExpense} className="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4">
                <input type="hidden" name="returnMonth" value={data.month} />
                <select
                  name="budgetId"
                  defaultValue={data.budgets[0]?.id}
                  className={fieldClassName()}
                >
                  {data.budgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} · {budget.category || "Sin categoria"}
                    </option>
                  ))}
                </select>
                <input
                  name="spentOn"
                  type="date"
                  defaultValue={`${data.month}-01`}
                  className={fieldClassName()}
                  required
                />
                <input
                  name="description"
                  type="text"
                  placeholder="Descripcion del gasto"
                  className={fieldClassName()}
                  required
                />
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cantidad"
                  className={fieldClassName()}
                  required
                />
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Nota opcional"
                  className={fieldClassName()}
                />
                <button className={buttonClassName()} type="submit">
                  Guardar gasto
                </button>
              </form>
            )}

            <div className="mt-4 space-y-4">
              {data.expenses.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Todavia no hay gastos registrados en {formatMonthLabel(data.month)}.
                </p>
              ) : (
                data.expenses.map((expense) => (
                  <div key={expense.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                          {expense.budgetName}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">{expense.spentOn}</p>
                    </div>

                    <form action={updateExpense} className="grid gap-3">
                      <input type="hidden" name="id" value={expense.id} />
                      <input type="hidden" name="returnMonth" value={data.month} />
                      <select
                        name="budgetId"
                        defaultValue={expense.budgetId}
                        className={fieldClassName()}
                      >
                        {data.budgets.map((budget) => (
                          <option key={budget.id} value={budget.id}>
                            {budget.name} · {budget.category || "Sin categoria"}
                          </option>
                        ))}
                      </select>
                      <input
                        name="spentOn"
                        type="date"
                        defaultValue={expense.spentOn}
                        className={fieldClassName()}
                        required
                      />
                      <input
                        name="description"
                        type="text"
                        defaultValue={expense.description}
                        className={fieldClassName()}
                        required
                      />
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={expense.amount}
                        className={fieldClassName()}
                        required
                      />
                      <textarea
                        name="note"
                        rows={2}
                        defaultValue={expense.note}
                        placeholder="Nota opcional"
                        className={fieldClassName()}
                      />
                      <button className={buttonClassName()} type="submit">
                        Actualizar gasto
                      </button>
                    </form>

                    <form action={deleteExpense} className="mt-3">
                      <input type="hidden" name="id" value={expense.id} />
                      <input type="hidden" name="returnMonth" value={data.month} />
                      <button className={buttonClassName("danger")} type="submit">
                        Borrar gasto
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
