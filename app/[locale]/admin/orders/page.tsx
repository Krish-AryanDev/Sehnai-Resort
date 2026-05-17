import { requireAdmin } from "@/lib/admin-auth";
import { listOrdersForAdmin } from "@/lib/order-repo";
import { OrdersList } from "./_components/OrdersList";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listOrdersForAdmin();

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>
          Orders
        </h1>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", color: "#78716c", fontSize: 13 }}>
          {orders.length} {orders.length === 1 ? "order" : "orders"} (last 200)
        </div>
      </div>

      <OrdersList
        rows={orders.map((o) => ({
          id: o.id,
          shortCode: o.shortCode,
          fulfillment: o.fulfillment,
          status: o.status,
          paymentMode: o.paymentMode,
          paymentStatus: o.paymentStatus,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          roomNumber: o.roomNumber,
          totalPaise: o.totalPaise,
          createdAt: o.createdAt,
        }))}
      />
    </div>
  );
}
