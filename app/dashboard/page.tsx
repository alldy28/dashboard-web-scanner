import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Halo Admin, selamat datang di Dashboard Manajemen Produk Dinar &
            Dirham.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
