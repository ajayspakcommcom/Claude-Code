// Shared component used across all three senior testing topics.
// A realistic shopping cart with: fetch products, add to cart,
// remove from cart, checkout (POST), discount codes.

import React, { useState, useEffect } from "react";

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface CheckoutResult {
  orderId: string;
  total: number;
}

const DISCOUNT_CODES: Record<string, number> = {
  SAVE10: 0.1,
  HALF50: 0.5,
};

export const ShoppingCart: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [orderId, setOrderId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then((data: Product[]) => { setProducts(data); setLoading(false); })
      .catch(() => { setError("Failed to load products"); setLoading(false); });
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const applyDiscount = () => {
    const rate = DISCOUNT_CODES[discount.toUpperCase()];
    if (rate) {
      setDiscountRate(rate);
      setDiscountError("");
    } else {
      setDiscountError("Invalid code");
      setDiscountRate(0);
    }
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal * (1 - discountRate);

  const checkout = async () => {
    if (cart.length === 0) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, discountCode: discount }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data: CheckoutResult = await res.json();
      setOrderId(data.orderId);
      setStatus("success");
      setCart([]);
    } catch {
      setStatus("error");
    }
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = categoryFilter === "all" ? products : products.filter(p => p.category === categoryFilter);

  if (loading) return <p>Loading products…</p>;
  if (error) return <p role="alert">{error}</p>;

  if (status === "success") {
    return (
      <div data-testid="order-confirmation">
        <h2>Order confirmed!</h2>
        <p>Order ID: <span data-testid="order-id">{orderId}</span></p>
        <p>Total paid: <span data-testid="order-total">${total.toFixed(2)}</span></p>
        <button onClick={() => { setStatus("idle"); setDiscount(""); setDiscountRate(0); }}>
          Shop again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter */}
      <div role="group" aria-label="Category filter">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            aria-pressed={categoryFilter === cat}
            data-testid={`filter-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product list */}
      <ul aria-label="Products">
        {filtered.map(p => (
          <li key={p.id} data-testid={`product-${p.id}`}>
            <span>{p.name}</span>
            <span data-testid={`price-${p.id}`}>${p.price.toFixed(2)}</span>
            <button onClick={() => addToCart(p)} aria-label={`Add ${p.name} to cart`}>
              Add to cart
            </button>
          </li>
        ))}
      </ul>

      {/* Cart */}
      <section aria-label="Shopping cart">
        <h2>Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            <ul>
              {cart.map(item => (
                <li key={item.id} data-testid={`cart-item-${item.id}`}>
                  <span>{item.name}</span>
                  <span>×{item.qty}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            {/* Discount */}
            <div>
              <input
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="Discount code"
                aria-label="Discount code"
              />
              <button onClick={applyDiscount}>Apply</button>
              {discountError && <p role="alert">{discountError}</p>}
              {discountRate > 0 && (
                <p data-testid="discount-applied">
                  {discountRate * 100}% discount applied!
                </p>
              )}
            </div>

            {/* Totals */}
            <p>Subtotal: <span data-testid="subtotal">${subtotal.toFixed(2)}</span></p>
            {discountRate > 0 && (
              <p>Discount: −${(subtotal * discountRate).toFixed(2)}</p>
            )}
            <p>Total: <span data-testid="total">${total.toFixed(2)}</span></p>

            <button
              onClick={checkout}
              disabled={status === "submitting"}
              aria-disabled={status === "submitting"}
            >
              {status === "submitting" ? "Processing…" : "Checkout"}
            </button>
            {status === "error" && <p role="alert">Checkout failed. Please try again.</p>}
          </>
        )}
      </section>
    </div>
  );
};
