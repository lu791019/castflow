export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        歡迎使用 CastFlow — 從 Podcast 音訊到社群上架的 AI 內容管線。
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">最近集數</h3>
          <p className="mt-1 text-sm text-muted-foreground">尚無集數</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">本週排程</h3>
          <p className="mt-1 text-sm text-muted-foreground">尚無排程</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">已發布</h3>
          <p className="mt-1 text-sm text-muted-foreground">0 篇</p>
        </div>
      </div>
    </div>
  );
}
