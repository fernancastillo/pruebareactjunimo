// utils/dataService.js
const API_BASE_URL = 'http://localhost:8094/v1';

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `Error HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    try {
      const result = await response.json();
      return result;
    } catch (jsonError) {
      return { success: true };
    }
    
  } catch (error) {
    throw new Error(`Error al llamar ${endpoint}: ${error.message}`);
  }
};

export const dataService = {
  initializeData: () => {
    return true;
  },

  // PRODUCTOS
  getProductos: async () => {
    return await apiCall('/productos', { method: 'GET' });
  },

  getProductoById: async (codigo) => {
    return await apiCall(`/productoById/${codigo}`, { method: 'GET' });
  },

  getProductoByName: async (nombre) => {
    return await apiCall(`/productoByName/${nombre}`, { method: 'GET' });
  },

  getProductosByCategoria: async (categoriaId) => {
    return await apiCall(`/productosByCategoria/${categoriaId}`, { method: 'GET' });
  },

  getProductosByNombre: async (nombre) => {
    return await apiCall(`/productosByNombre?nombre=${encodeURIComponent(nombre)}`, { method: 'GET' });
  },

  getProductosStockCritico: async () => {
    return await apiCall('/productosStockCritico', { method: 'GET' });
  },

  getProductosByPrecio: async (precioMin, precioMax) => {
    return await apiCall(`/productosByPrecio?precioMin=${precioMin}&precioMax=${precioMax}`, { method: 'GET' });
  },

  addProducto: async (producto) => {
    return await apiCall('/addProducto', {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  },

  updateProducto: async (producto) => {
    return await apiCall('/updateProducto', {
      method: 'PUT',
      body: JSON.stringify(producto),
    });
  },

  deleteProducto: async (codigo) => {
    return await apiCall(`/deleteProducto/${codigo}`, { method: 'DELETE' });
  },

  // USUARIOS
  getUsuarios: async () => {
    return await apiCall('/usuarios', { method: 'GET' });
  },

  getUsuarioById: async (run) => {
    return await apiCall(`/usuariosById/${run}`, { method: 'GET' });
  },

  getUsuarioByCorreo: async (correo) => {
    return await apiCall(`/usuariosByCorreo/${correo}`, { method: 'GET' });
  },

  getUsuarioByTipo: async (tipo) => {
    return await apiCall(`/usuariosByTipo/${tipo}`, { method: 'GET' });
  },

  addUsuario: async (usuario) => {
    return await apiCall('/addUsuario', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  },

  updateUsuario: async (usuario) => {
    return await apiCall('/updateUsuario', {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  },

  deleteUsuario: async (run) => {
    return await apiCall(`/deleteUsuario/${run}`, { method: 'DELETE' });
  },

  // CATEGORÍAS
  getCategorias: async () => {
    return await apiCall('/categorias', { method: 'GET' });
  },

  getCategoriaById: async (id) => {
    return await apiCall(`/categoriaById/${id}`, { method: 'GET' });
  },

  getCategoriaByName: async (nombre) => {
    return await apiCall(`/categoriaByName/${nombre}`, { method: 'GET' });
  },

  addCategoria: async (categoria) => {
    return await apiCall('/addCategoria', {
      method: 'POST',
      body: JSON.stringify(categoria),
    });
  },

  // ÓRDENES
  getOrdenes: async () => {
    return await apiCall('/ordenes', { method: 'GET' });
  },

  getOrdenByNumero: async (numero) => {
    return await apiCall(`/OrdenByNumero/${numero}`, { method: 'GET' });
  },

  addOrden: async (orden) => {
    return await apiCall('/addOrden', {
      method: 'POST',
      body: JSON.stringify(orden),
    });
  },

  updateOrden: async (orden) => {
    return await apiCall('/updateOrden', {
      method: 'PUT',
      body: JSON.stringify(orden),
    });
  },

  deleteOrden: async (numero) => {
    return await apiCall(`/deleteOrden/${numero}`, { method: 'DELETE' });
  },

  // DETALLE ORDEN
  getDetallesOrdenes: async () => {
    return await apiCall('/detallesOrdenes', { method: 'GET' });
  },

  getDetalleOrdenById: async (id) => {
    return await apiCall(`/detallesOrdenesById/${id}`, { method: 'GET' });
  },

  addDetalleOrden: async (detalle) => {
    return await apiCall('/addDetalleOrden', {
      method: 'POST',
      body: JSON.stringify(detalle),
    });
  },

  // MÉTODOS ESPECIALES
  getProductosPorCategoria: async (categoriaNombre) => {
    try {
      const categorias = await dataService.getCategorias();
      const categoria = categorias.find(cat => cat.nombre === categoriaNombre);
      
      if (categoria) {
        return await dataService.getProductosByCategoria(categoria.id);
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  // VERIFICAR ESTADO DE DATOS
  checkDataStatus: async () => {
    try {
      const productos = await dataService.getProductos();
      const usuarios = await dataService.getUsuarios();
      const ordenes = await dataService.getOrdenes();
      
      return {
        productos: {
          count: productos.length,
          loaded: productos.length > 0
        },
        usuarios: {
          count: usuarios.length,
          loaded: usuarios.length > 0
        },
        ordenes: {
          count: ordenes.length,
          loaded: ordenes.length > 0
        }
      };
    } catch (error) {
      return {
        productos: { count: 0, loaded: false },
        usuarios: { count: 0, loaded: false },
        ordenes: { count: 0, loaded: false }
      };
    }
  }
};