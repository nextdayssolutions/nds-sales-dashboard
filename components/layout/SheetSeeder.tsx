"use client";

import { useEffect } from "react";
import { seedSheetsIfEmpty } from "@/lib/sheet-seed";
import { seedCustomersIfEmpty } from "@/lib/customer-store";
import { seedSalesIfEmpty } from "@/lib/sales-seed";

export function SheetSeeder() {
  useEffect(() => {
    seedSheetsIfEmpty();
    seedCustomersIfEmpty();
    seedSalesIfEmpty();
  }, []);
  return null;
}
