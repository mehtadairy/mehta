import React from 'react';
import AdminDeliveryPricing from '@/components/admin/AdminDeliveryPricing';

export default function AdminShippingPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminDeliveryPricing />
      </div>
    </div>
  );
}
