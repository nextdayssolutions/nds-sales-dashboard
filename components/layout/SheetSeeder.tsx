"use client";

import { useEffect } from "react";
import { seedSheetsIfEmpty } from "@/lib/sheet-seed";
import { seedCustomersIfEmpty } from "@/lib/customer-store";
import { seedSalesIfEmpty } from "@/lib/sales-seed";
import { seedProductsIfEmpty } from "@/lib/products-store";

export function SheetSeeder() {
  useEffect(() => {
    seedProductsIfEmpty();
    seedSheetsIfEmpty();
    seedCustomersIfEmpty();
    seedSalesIfEmpty();
  }, []);
  return null;
}
