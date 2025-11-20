// utils/tienda/orderCreationService.js
import { dataService } from '../dataService';

export const orderCreationService = {
  // Generar número de orden único
  generateOrderNumber: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SO${timestamp}${random}`;
  },

  // Crear orden con detalles para BD Oracle
  createOrderWithDetails: (user, cartItems, totalFinal, discountCode = '', paymentData = null) => {
    try {
      console.log('🔄 Creando estructura de orden con detalles...');
      
      // Validaciones esenciales
      if (!user || !user.run) {
        throw new Error('Usuario no válido para crear orden');
      }
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('El carrito está vacío');
      }

      if (!totalFinal || totalFinal <= 0) {
        throw new Error('Total final debe ser mayor a 0');
      }

      const numeroOrden = orderCreationService.generateOrderNumber();
      const fecha = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Crear la estructura COMPLETA de orden con detalles
      const ordenCompleta = {
        numeroOrden: numeroOrden,
        fecha: fecha,
        usuario: {
          run: user.run // Solo el RUN, Spring JPA maneja la relación
        },
        estadoEnvio: 'Pendiente',
        total: Math.round(totalFinal), // Asegurar que es entero
        detalles: cartItems.map(item => ({
          producto: {
            codigo: item.codigo // Solo el código, Spring JPA maneja la relación
          },
          cantidad: item.cantidad
        }))
      };

      console.log('📦 Estructura completa de orden creada:');
      console.log('   Número Orden:', ordenCompleta.numeroOrden);
      console.log('   Fecha:', ordenCompleta.fecha);
      console.log('   RUN Usuario:', ordenCompleta.usuario.run);
      console.log('   Total:', ordenCompleta.total);
      console.log('   Detalles:', ordenCompleta.detalles.length, 'productos');
      
      return ordenCompleta;
      
    } catch (error) {
      console.error('❌ Error creando estructura de orden:', error);
      throw error;
    }
  },

  // Guardar orden en BD Oracle
  saveOrder: async (orderData) => {
    try {
      console.log('💾 Guardando orden completa en BD Oracle...');
      
      // Validar estructura antes de enviar
      if (!orderData.detalles || orderData.detalles.length === 0) {
        throw new Error('La orden debe tener al menos un detalle');
      }

      if (!orderData.numeroOrden) {
        throw new Error('La orden debe tener un número de orden');
      }

      console.log('📤 Enviando al endpoint /addOrden...');
      console.log('📊 Datos enviados:', JSON.stringify(orderData, null, 2));
      
      const result = await dataService.addOrden(orderData);
      
      console.log('✅ Orden guardada exitosamente en BD:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error al guardar orden en BD Oracle:', error);
      throw new Error(`No se pudo guardar la orden en la base de datos: ${error.message}`);
    }
  },

  // Procesar compra completa (FUNCIÓN PRINCIPAL)
  processCompletePurchase: async (user, cartItems, totalFinal, discountCode = '', paymentData = null) => {
    try {
      console.log('=== INICIANDO PROCESAMIENTO DE COMPRA COMPLETA ===');
      console.log('👤 Usuario:', user.run);
      console.log('📦 Productos en carrito:', cartItems.length);
      console.log('💰 Total final:', totalFinal);
      
      if (cartItems.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // 1. Crear la estructura completa de orden con detalles
      const ordenCompleta = orderCreationService.createOrderWithDetails(
        user, 
        cartItems, 
        totalFinal, 
        discountCode, 
        paymentData
      );

      console.log('🔄 Orden creada, procediendo a guardar en BD...');
      
      // 2. Guardar la orden completa (que incluye los detalles)
      const ordenGuardada = await orderCreationService.saveOrder(ordenCompleta);
      
      console.log('✅ PROCESAMIENTO DE COMPRA EXITOSO');
      console.log('📦 Orden guardada:', ordenGuardada);
      
      return {
        success: true,
        order: ordenGuardada,
        message: 'Compra procesada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ ERROR EN PROCESAMIENTO DE COMPRA:', error);
      throw new Error(`No se pudo procesar la compra: ${error.message}`);
    }
  },

  // Método auxiliar para verificar stock antes de procesar
  validateStock: (cartItems) => {
    // Aquí podrías implementar validación de stock contra la BD
    console.log('🔍 Validando stock de productos...');
    return true; // Por ahora siempre true, implementar lógica real después
  }
};