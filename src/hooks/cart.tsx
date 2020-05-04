import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartItems = await AsyncStorage.getItem('@GoMarketPlace:products');

      if (cartItems) {
        setProducts(JSON.parse(cartItems));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(item =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity > 0 ? item.quantity - 1 : item.quantity,
              }
            : item,
        )
        .filter(item => !!item.quantity);

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  /*
   *Recebe o produto adicionado na dashboar
   *Produto já existe no carrinho?
   *Sim, chama increment()
   *Não, cria novo produto com qtde=1 e atualiza os products com setProducts
   */
  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        increment(product.id);
      } else {
        const newProduct = { ...product, quantity: 1 };

        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
