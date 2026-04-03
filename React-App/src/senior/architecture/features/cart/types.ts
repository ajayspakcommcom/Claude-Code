// CART FEATURE — types.ts
//
// Cart has its own CartItem type. It does NOT re-use Product from products/.
// It only stores what the cart needs: id, name, price, emoji, quantity.
// This is intentional — cart is decoupled from how products are fetched.

export interface CartItem {
  id:       number;
  name:     string;
  price:    number;
  emoji:    string;
  quantity: number;
}

export interface CartState {
  items:    CartItem[];
  total:    number;
  count:    number;
}
