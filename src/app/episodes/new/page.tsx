import { UploadForm } from "@/components/episodes/upload-form";

export default function NewEpisodePage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">上傳新集數</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        上傳音訊檔案，系統會自動壓縮並準備轉錄。
      </p>
      <UploadForm />
    </div>
  );
}
