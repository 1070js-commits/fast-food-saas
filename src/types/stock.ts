export type Ingredient = {
  id: string;
  business_id: string;
  name: string;
  unit: "g" | "kg" | "ml" | "l" | "cl" | "piece" | string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  created_at?: string;
};

export type Recipe = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
  created_at: string;
  ingredient?: Ingredient;
};

export type StockMovement = {
  id: string;
  ingredient_id: string;
  delta: number;
  reason: "order" | "reception" | "adjustment" | "loss";
  order_id: string | null;
  user_id: string | null;
  created_at: string;
};

export type LowStockAlert = Ingredient & {
  is_low: boolean;
  is_out: boolean;
};
