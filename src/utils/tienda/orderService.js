import { dataService } from '../dataService';

export const orderService = {
  // Obtener todas las órdenes SOLO desde la base de datos
  getAllOrders: async () => {
    try {
      const orders = await dataService.getOrdenes();
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      return [];
    }
  },

  // Obtener órdenes de un usuario específico por RUN desde BD
  getUserOrders: async (userRun) => {
    try {
      if (!userRun) {
        return [];
      }

      const orders = await orderService.getAllOrders();

      // Buscar órdenes que coincidan con el RUN del usuario
      const userOrders = orders.filter(order => {
        // Verificar si el objeto usuario tiene el RUN que buscamos
        const usuario = order.usuario;
        if (usuario && typeof usuario === 'object') {
          const runMatch =
            usuario.run == userRun || // == para comparación flexible
            usuario.id == userRun ||
            usuario.runUsuario == userRun;

          if (runMatch) {
            return true;
          }
        }

        return false;
      });

      return userOrders;
    } catch (error) {
      return [];
    }
  },

  // Obtener detalles completos de una orden desde BD
  getOrderWithDetails: async (orderNumber) => {
    try {
      const orders = await orderService.getAllOrders();
      const order = orders.find(o => o.numeroOrden === orderNumber);

      if (!order) {
        return null;
      }

      // Transformar la estructura para que sea compatible con el frontend
      const transformedOrder = {
        ...order,
        // Convertir detalles a productos
        productos: order.detalles ? order.detalles.map(detalle => ({
          codigo: detalle.producto?.codigo,
          nombre: detalle.producto?.nombre,
          cantidad: detalle.cantidad,
          precio: detalle.producto?.precio,
          imagen: detalle.producto?.imagen
        })) : [],
        // Asegurar formato de fecha
        fecha: order.fecha ? new Date(order.fecha).toLocaleDateString('es-CL') : 'Fecha no disponible'
      };

      return transformedOrder;
    } catch (error) {
      return null;
    }
  }
};