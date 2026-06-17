import { Suspense } from "react";
import PracticeClientPage from "./PracticeClientPage";

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-6 text-slate-800 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-bold text-slate-700">読み込み中...</p>
            </div>
          </div>
        </main>
      }
    >
      <PracticeClientPage />
    </Suspense>
  );
}
