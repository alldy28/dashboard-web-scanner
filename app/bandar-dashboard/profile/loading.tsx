import { Skeleton } from "@/components/ui/skeleton";

// Ini adalah halaman 'loading.tsx' standar dari Next.js App Router
// Ini akan ditampilkan secara otomatis saat data di 'page.tsx' sedang di-fetch.
export default function ProfileLoading() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <Skeleton className="h-10 w-64" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skeleton untuk Kartu Profil */}
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-10 w-full" />{" "}
            {/* <-- [TAMBAH BARU] Skeleton untuk No Telp */}
            <Skeleton className="h-20 w-full" />{" "}
            {/* <-- [TAMBAH] Skeleton untuk Textarea */}
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Skeleton untuk Kartu Password */}
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
