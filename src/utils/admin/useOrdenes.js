import { useState, useEffect } from 'react';
import { dataService } from '../dataService';

export const useOrdenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrden, setEditingOrden] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    numeroOrden: '',
    run: '',
    estado: '',
    fecha: ''
  });

  useEffect(() => {
    loadOrdenes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [ordenes, filtros]);

 const normalizarOrdenes = (ordenesBD) => {
  if (!Array.isArray(ordenesBD)) return [];
  
  return ordenesBD.map(orden => {
    // Asegurar que el run sea siempre un string
    const runUsuario = orden.usuario ? 
      (orden.usuario.run ? orden.usuario.run.toString() : '') : 
      '';
    
    return {
      numeroOrden: orden.numeroOrden || '',
      fecha: orden.fecha || '',
      run: runUsuario, // Ahora siempre será string
      estadoEnvio: orden.estadoEnvio || 'Pendiente',
      total: orden.total || 0,
      usuario: orden.usuario || null,
      detalles: orden.detalles || [],
      productos: orden.detalles ? orden.detalles.map(detalle => ({
        codigo: detalle.producto ? detalle.producto.codigo : '',
        nombre: detalle.producto ? detalle.producto.nombre : '',
        cantidad: detalle.cantidad || 0,
        precio: detalle.producto ? detalle.producto.precio : 0
      })) : []
    };
  });
};

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ordenesResponse = await dataService.getOrdenes();
      const ordenesNormalizadas = normalizarOrdenes(ordenesResponse);
      
      setOrdenes(ordenesNormalizadas);
      
    } catch (error) {
      setError(`Error al cargar órdenes: ${error.message}`);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

const aplicarFiltros = () => {
  if (!Array.isArray(ordenes)) {
    setOrdenesFiltradas([]);
    return;
  }

  let filtered = [...ordenes];

  if (filtros.numeroOrden) {
    filtered = filtered.filter(orden => 
      orden.numeroOrden && orden.numeroOrden.toLowerCase().includes(filtros.numeroOrden.toLowerCase())
    );
  }

  if (filtros.run) {
    filtered = filtered.filter(orden => {
      // Convertir tanto el run de la orden como el filtro a string para comparar
      const runOrden = orden.run ? orden.run.toString() : '';
      const runFiltro = filtros.run.toString();
      return runOrden.includes(runFiltro);
    });
  }

  if (filtros.estado) {
    filtered = filtered.filter(orden => 
      orden.estadoEnvio === filtros.estado
    );
  }

  if (filtros.fecha) {
    filtered = filtered.filter(orden => 
      orden.fecha === filtros.fecha
    );
  }

  setOrdenesFiltradas(filtered);
};

  const handleEdit = (orden) => {
    setEditingOrden(orden);
    setShowModal(true);
  };

  const handleUpdateEstado = async (numeroOrden, nuevoEstado) => {
    try {
      console.log('Actualizando estado de orden:', numeroOrden, '->', nuevoEstado);

      // Usar el nuevo método updateOrdenEstado
      await dataService.updateOrdenEstado(numeroOrden, nuevoEstado);
      console.log('Estado actualizado exitosamente');
      
      // Recargar las órdenes para reflejar el cambio
      await loadOrdenes();
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      
      // Si falla con updateOrdenEstado, intentar con updateOrden como fallback
      try {
        console.log('Intentando con updateOrden como fallback...');
        await dataService.updateOrden({
          numeroOrden: numeroOrden,
          estadoEnvio: nuevoEstado
        });
        
        console.log('Estado actualizado exitosamente con fallback');
        await loadOrdenes();
        return { success: true };
        
      } catch (fallbackError) {
        console.error('Error también con fallback:', fallbackError);
        return { 
          success: false, 
          error: `No se pudo actualizar el estado: ${error.message}` 
        };
      }
    }
  };

  const handleDelete = async (numeroOrden) => {
    try {
      await dataService.deleteOrden(numeroOrden);
      await loadOrdenes();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrden(null);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      numeroOrden: '',
      run: '',
      estado: '',
      fecha: ''
    });
  };

  const refreshData = () => {
    loadOrdenes();
  };

  const calcularEstadisticasOrdenes = (ordenes) => {
    const totalOrdenes = ordenes.length;
    const pendientes = ordenes.filter(o => o.estadoEnvio === 'Pendiente').length;
    const enviadas = ordenes.filter(o => o.estadoEnvio === 'Enviado').length;
    const entregadas = ordenes.filter(o => o.estadoEnvio === 'Entregado').length;
    const canceladas = ordenes.filter(o => o.estadoEnvio === 'Cancelado').length;
    const ingresosTotales = ordenes
      .filter(o => o.estadoEnvio === 'Entregado')
      .reduce((sum, orden) => sum + orden.total, 0);

    return {
      totalOrdenes,
      pendientes,
      enviadas,
      entregadas,
      canceladas,
      ingresosTotales
    };
  };

  const estadisticas = calcularEstadisticasOrdenes(ordenes);

  return {
    ordenes,
    ordenesFiltradas,
    loading,
    error,
    editingOrden,
    showModal,
    filtros,
    estadisticas,
    handleEdit,
    handleUpdateEstado,
    handleDelete,
    handleCloseModal,
    handleFiltroChange,
    handleLimpiarFiltros,
    refreshData,
    onEdit: handleEdit,
    onUpdate: handleUpdateEstado,
    onDelete: handleDelete,
    onCloseModal: handleCloseModal
  };
};