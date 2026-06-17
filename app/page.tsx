import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
        <h1 className="text-center text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          そろタイム
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg leading-8 text-slate-600 sm:text-xl">
          問題をといて、タイムをはかって、
          <br className="hidden sm:block" />
          毎日少しずつ、そろばんを練習しよう。
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-orange-600"
          >
            練習をはじめる
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            練習記録を見る
          </Link>
        </div>

        <section className="mt-16 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-3xl">🧮</div>
            <h2 className="mt-3 text-lg font-bold">見取り算</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              数字を見て、すばやく正しく計算します。
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-3xl">🧠</div>
            <h2 className="mt-3 text-lg font-bold">暗算</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              頭の中で考えて、集中して答えを出します。
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-3xl">✖️➗</div>
            <h2 className="mt-3 text-lg font-bold">かけ算・わり算</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              級・段に合わせて、問題の難しさが変わります。
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-3xl">📈</div>
            <h2 className="mt-3 text-lg font-bold">練習記録</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              直近10件の結果をのこして、成長を見られます。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
