import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    id: string;
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const stableId = `${item.productId}-${item.variantId ?? 'default'}`;
                const cartItem = { ...item, id: stableId };
                const existingItem = get().items.find(
                    (i) => i.productId === cartItem.productId && i.variantId === cartItem.variantId
                );

                if (existingItem) {
                    set({
                        items: get().items.map((i) =>
                            i.productId === cartItem.productId && i.variantId === cartItem.variantId
                                ? { ...i, quantity: i.quantity + cartItem.quantity }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...get().items, cartItem] });
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },
            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id);
                    return;
                }
                set({
                    items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
        }),
        {
            name: 'nairobimart-cart',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
