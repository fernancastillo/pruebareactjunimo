import { dataService } from '../dataService';

export const orderCreationService = {
  getLastOrderNumber: async () => {
    try {
      const orders = await dataService.getOrdenes();

      if (!orders || orders.length === 0) {
        return 'SO1000';
      }

      let maxNumber = 0;

      orders.forEach(order => {
        if (order.numeroOrden && order.numeroOrden.startsWith('SO')) {
          const numberPart = order.numeroOrden.substring(2);
          const number = parseInt(numberPart);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      });

      if (maxNumber === 0) {
        return 'SO1000';
      }

      return `SO${maxNumber}`;
    } catch (error) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 100);
      return `SO${timestamp}${random}`;
    }
  },

  generateSequentialOrderNumber: async () => {
    try {
      const lastOrderNumber = await orderCreationService.getLastOrderNumber();
      const numberMatch = lastOrderNumber.match(/\d+/);

      if (!numberMatch) {
        return 'SO1000';
      }

      const currentNumber = parseInt(numberMatch[0]);
      const nextNumber = currentNumber + 1;

      return `SO${nextNumber}`;
    } catch (error) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 100);
      return `SO${timestamp}${random}`;
    }
  },

  createOrderWithDetails: async (user, cartItems, totalFinal, discountCode = '', paymentData = null) => {
    try {
      if (!user || !user.run) {
        throw new Error('Usuario no válido para crear orden');
      }

      if (!cartItems || cartItems.length === 0) {
        throw new Error('El carrito está vacío');
      }

      if (!totalFinal || totalFinal <= 0) {
        throw new Error('Total final debe ser mayor a 0');
      }

      const numeroOrden = await orderCreationService.generateSequentialOrderNumber();
      const fecha = new Date().toISOString().split('T')[0];

      const ordenCompleta = {
        numeroOrden: numeroOrden,
        fecha: fecha,
        usuario: {
          run: user.run
        },
        estadoEnvio: 'Pendiente',
        total: Math.round(totalFinal),
        detalles: cartItems.map(item => ({
          producto: {
            codigo: item.codigo
          },
          cantidad: item.cantidad
        }))
      };

      return ordenCompleta;
    } catch (error) {
      throw error;
    }
  },

  saveOrder: async (orderData) => {
    try {
      if (!orderData.usuario || !orderData.usuario.run) {
        throw new Error('Estructura de usuario inválida');
      }

      if (!orderData.detalles || orderData.detalles.length === 0) {
        throw new Error('La orden debe tener al menos un detalle');
      }

      const result = await dataService.addOrden(orderData);
      return result;
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.message.includes('500')) {
        errorMessage = 'Error interno del servidor. Por favor, contacta al administrador.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Servicio no disponible. Intenta más tarde.';
      }
      
      throw new Error(errorMessage);
    }
  },

  processCompletePurchase: async (user, cartItems, totalFinal, discountCode = '', paymentData = null) => {
    try {
      if (cartItems.length === 0) {
        throw new Error('El carrito está vacío');
      }

      const ordenCompleta = await orderCreationService.createOrderWithDetails(
        user,
        cartItems,
        totalFinal,
        discountCode,
        paymentData
      );

      const ordenGuardada = await orderCreationService.saveOrder(ordenCompleta);

      return {
        success: true,
        order: ordenGuardada,
        message: 'Compra procesada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  },

  validateStock: (cartItems) => {
    return true;
  }
};