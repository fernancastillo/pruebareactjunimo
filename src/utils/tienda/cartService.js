// utils/tienda/cartService.js
import { dataService } from '../dataService';

const CART_KEY = 'junimoCart';

export const cartService = {
  getCart: () => {
    try {
      const cartJSON = localStorage.getItem(CART_KEY);
      return cartJSON ? JSON.parse(cartJSON) : [];
    } catch (error) {
      return [];
    }
  },

  saveCart: (cartItems) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    } catch (error) {
      return false;
    }
  },

  getCurrentStock: async (productCode) => {
    try {
      const producto = await dataService.getProductoById(productCode);
      
      const stock = 
        producto.stockActual !== undefined ? producto.stockActual :
        producto.stock_actual !== undefined ? producto.stock_actual :
        producto.stock !== undefined ? producto.stock : 0;
      
      return stock;
    } catch (error) {
      return 0;
    }
  },

  checkAvailableStock: async (productCode, cantidadDeseada) => {
    try {
      const currentStock = await cartService.getCurrentStock(productCode);
      
      if (currentStock === undefined || currentStock === null) {
        return false;
      }
      
      return currentStock >= cantidadDeseada;
    } catch (error) {
      return false;
    }
  },

  calculateShipping: (subtotal) => {
    return subtotal > 30000 ? 0 : 3990;
  },

  hasDuocDiscount: (user) => {
    if (!user || !user.email) return false;
    
    const email = user.email.toLowerCase();
    return email.endsWith('@duoc.cl') || email.endsWith('@duocuc.cl');
  },

  calculateDuocDiscount: (subtotal) => {
    return Math.round(subtotal * 0.2);
  },

  updateQuantity: async (productCode, newQuantity) => {
    try {
      const stockDisponible = await cartService.checkAvailableStock(productCode, newQuantity);
      if (!stockDisponible) {
        throw new Error('No hay suficiente stock disponible');
      }

      const cartItems = cartService.getCart();
      
      const safeQuantity = newQuantity === 0 ? 1 : Math.max(1, newQuantity);
      
      const updatedCart = cartItems.map(item =>
        item.codigo === productCode
          ? { ...item, cantidad: safeQuantity }
          : item
      );

      cartService.saveCart(updatedCart);
      
      return updatedCart;
    } catch (error) {
      throw error;
    }
  },

  removeItem: (productCode) => {
    try {
      const cartItems = cartService.getCart();
      const updatedCart = cartItems.filter(item => item.codigo !== productCode);
      
      cartService.saveCart(updatedCart);
      
      return updatedCart;
    } catch (error) {
      return cartService.getCart();
    }
  },

  calculateTotal: (cartItems = null) => {
    const items = cartItems || cartService.getCart();
    return items.reduce((total, item) => {
      const precio = item.precioOferta || item.precio;
      return total + (precio * item.cantidad);
    }, 0);
  },

  clearCart: () => {
    try {
      localStorage.removeItem(CART_KEY);
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    } catch (error) {
      return false;
    }
  },

  addToCart: async (producto, cantidad = 1) => {
    try {
      const cartItems = cartService.getCart();
      
      const stockDisponible = await cartService.checkAvailableStock(producto.codigo, cantidad);
      if (!stockDisponible) {
        throw new Error('No hay suficiente stock disponible');
      }

      const existingItemIndex = cartItems.findIndex(item => item.codigo === producto.codigo);
      
      if (existingItemIndex !== -1) {
        const nuevaCantidadTotal = cartItems[existingItemIndex].cantidad + cantidad;
        const stockParaNuevaCantidad = await cartService.checkAvailableStock(producto.codigo, nuevaCantidadTotal);
        
        if (!stockParaNuevaCantidad) {
          throw new Error('No hay suficiente stock disponible para la cantidad solicitada');
        }
        
        cartItems[existingItemIndex].cantidad += cantidad;
      } else {
        const productoParaCarrito = {
          ...producto,
          cantidad: cantidad
        };
        
        if (producto.precioOferta && producto.enOferta) {
          productoParaCarrito.precioOriginal = producto.precio;
          productoParaCarrito.precio = producto.precioOferta;
          productoParaCarrito.enOferta = true;
          productoParaCarrito.descuento = producto.descuento;
        }
        
        cartItems.push(productoParaCarrito);
      }
      
      cartService.saveCart(cartItems);
      
      return cartItems;
    } catch (error) {
      throw error;
    }
  },

  getProductDetails: async (productCode) => {
    try {
      const producto = await dataService.getProductoById(productCode);
      return producto;
    } catch (error) {
      return null;
    }
  },

  validateDiscountCode: (code) => {
    const validCodes = {
      'SV2500': {
        discount: 2500,
        type: 'fixed',
        minPurchase: 0,
        description: 'Descuento especial de $2.500',
        valid: true
      },
      'DUOC20': {
        discount: 20,
        type: 'percentage',
        minPurchase: 0,
        description: '20% de descuento DUOC',
        valid: true
      },
      'ENVIOGRATIS': {
        discount: 3990,
        type: 'shipping',
        minPurchase: 0,
        description: 'Envío gratis',
        valid: true
      }
    };

    return validCodes[code] || null;
  },

  calculateDiscount: (total, discountCode) => {
    if (!discountCode) return 0;

    const discountInfo = cartService.validateDiscountCode(discountCode);
    if (!discountInfo) return 0;

    if (total < discountInfo.minPurchase) {
      return 0;
    }

    if (discountInfo.type === 'fixed') {
      return Math.min(discountInfo.discount, total);
    } else if (discountInfo.type === 'percentage') {
      return (total * discountInfo.discount) / 100;
    } else if (discountInfo.type === 'shipping') {
      return 0;
    }

    return 0;
  },

  calculateFinalTotal: (subtotal, shipping, duocDiscount = 0, discountCode = '') => {
    const codeDiscount = cartService.calculateDiscount(subtotal, discountCode);
    
    let envioFinal = shipping;
    if (discountCode === 'ENVIOGRATIS') {
      envioFinal = 0;
    }
    
    let finalTotal = subtotal - duocDiscount - codeDiscount + envioFinal;
    
    return Math.max(0, finalTotal);
  },

  getTotalItems: () => {
    const cartItems = cartService.getCart();
    return cartItems.reduce((total, item) => total + item.cantidad, 0);
  },

  refreshCartProducts: async () => {
    try {
      const cartItems = cartService.getCart();
      const updatedCartItems = [];
      
      for (const item of cartItems) {
        try {
          const productoActualizado = await dataService.getProductoById(item.codigo);
          
          if (productoActualizado) {
            const productoParaCarrito = {
              ...productoActualizado,
              cantidad: item.cantidad
            };
            
            if (productoActualizado.precioOferta && productoActualizado.enOferta) {
              productoParaCarrito.precioOriginal = productoActualizado.precio;
              productoParaCarrito.precio = productoActualizado.precioOferta;
              productoParaCarrito.enOferta = true;
              productoParaCarrito.descuento = productoActualizado.descuento;
            }
            
            updatedCartItems.push(productoParaCarrito);
          }
        } catch (error) {
          updatedCartItems.push(item);
        }
      }
      
      cartService.saveCart(updatedCartItems);
      return updatedCartItems;
    } catch (error) {
      return cartService.getCart();
    }
  }
};