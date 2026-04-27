import { useState, useEffect } from 'react';
import { orders as ordersApi, type ApiOrder } from '../lib/api.js';
import { OrdersList } from '../components/orders/OrdersList.js';
import { OrderDetail } from '../components/orders/OrderDetail.js';

interface OrdersPageProps {
  onNavigateToCreate: () => void;
}

export function OrdersPage({ onNavigateToCreate }: OrdersPageProps) {
  const [orderList, setOrderList] = useState<ApiOrder[]>([]);
  const [selected, setSelected] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list()
      .then(({ orders }) => setOrderList(orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.1em' }}>Loading orders…</span>
      </div>
    );
  }

  if (selected) {
    return (
      <OrderDetail
        order={selected}
        onBack={() => setSelected(null)}
        onFinalise={(updated) => {
          setSelected(updated);
          setOrderList((prev) => prev.map((o) => o.order.id === updated.order.id ? updated : o));
        }}
      />
    );
  }

  return (
    <OrdersList
      orders={orderList}
      onOpen={async (o) => {
        // Load full order with generations
        try {
          const full = await ordersApi.get(o.order.id);
          setSelected(full);
        } catch {
          setSelected(o);
        }
      }}
      onCreateNew={onNavigateToCreate}
    />
  );
}
