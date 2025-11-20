import { dataService } from '../dataService';

export const orderService = {
  // Obtener todas las órdenes SOLO desde la base de datos
  getAllOrders: async () => {
    try {
      const orders = await dataService.getOrdenes();
      console.log('🔍 Órdenes obtenidas SOLO desde BD Oracle:', orders?.length || 0);
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      console.error('Error al obtener órdenes desde BD Oracle:', error);
      return [];
    }
  },

  // Obtener órdenes de un usuario específico por RUN desde BD
  getUserOrders: async (userRun) => {
    try {
      console.log('🔍 Buscando órdenes en BD Oracle para RUN:', userRun);
      
      if (!userRun) {
        console.error('RUN del usuario no proporcionado');
        return [];
      }

      const orders = await orderService.getAllOrders();
      
      console.log('🎯 BUSQUEDA EN BD ORACLE:');
      
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
            console.log(`✅ ORDEN ENCONTRADA EN BD:`, {
              numeroOrden: order.numeroOrden,
              usuario: usuario,
              runEncontrado: usuario.run || usuario.id
            });
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`📊 RESULTADO BD: ${userOrders.length} órdenes encontradas de ${orders.length} totales`);
      
      return userOrders;
    } catch (error) {
      console.error('Error al obtener órdenes del usuario desde BD:', error);
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
      console.error('Error al obtener detalles de orden desde BD:', error);
      return null;
    }
  }
};