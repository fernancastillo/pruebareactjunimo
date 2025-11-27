import { useState, useEffect } from 'react';
import { dataService } from '../dataService';

export const useOrdenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrden, setEditingOrden] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [filtros, setFiltros] = useState({
    numeroOrden: '',
    run: '',
    estado: '',
    fecha: '',
    ordenarPor: 'numeroOrden'
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
      const runUsuario = orden.usuario ?
        (orden.usuario.run ? orden.usuario.run.toString() : '') :
        '';

      return {
        numeroOrden: orden.numeroOrden || '',
        fecha: orden.fecha || '',
        run: runUsuario,
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

    filtered = ordenarOrdenes(filtered, filtros.ordenarPor);

    setOrdenesFiltradas(filtered);
  };

  const ordenarOrdenes = (ordenes, criterio) => {
    if (!Array.isArray(ordenes)) return [];

    const ordenesOrdenadas = [...ordenes];

    switch (criterio) {
      case 'numeroOrden':
        return ordenesOrdenadas.sort((a, b) => a.numeroOrden.localeCompare(b.numeroOrden));
      case 'numeroOrden-desc':
        return ordenesOrdenadas.sort((a, b) => b.numeroOrden.localeCompare(a.numeroOrden));
      case 'fecha':
        return ordenesOrdenadas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      case 'fecha-desc':
        return ordenesOrdenadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      case 'total':
        return ordenesOrdenadas.sort((a, b) => a.total - b.total);
      case 'total-desc':
        return ordenesOrdenadas.sort((a, b) => b.total - a.total);
      case 'estado':
        return ordenesOrdenadas.sort((a, b) => a.estadoEnvio.localeCompare(b.estadoEnvio));
      case 'estado-desc':
        return ordenesOrdenadas.sort((a, b) => b.estadoEnvio.localeCompare(a.estadoEnvio));
      case 'run':
        return ordenesOrdenadas.sort((a, b) => a.run.localeCompare(b.run));
      case 'run-desc':
        return ordenesOrdenadas.sort((a, b) => b.run.localeCompare(a.run));
      default:
        return ordenesOrdenadas;
    }
  };

  const handleEdit = (orden) => {
    setEditingOrden(orden);
    setShowModal(true);
  };

  const handleUpdateEstado = async (numeroOrden, nuevoEstado) => {
    try {
      await dataService.updateOrdenEstado(numeroOrden, nuevoEstado);

      await loadOrdenes();

      setSuccessMessage(`Estado de orden ${numeroOrden} actualizado a "${nuevoEstado}"`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      return { success: true };
    } catch (error) {
      try {
        await dataService.updateOrden({
          numeroOrden: numeroOrden,
          estadoEnvio: nuevoEstado
        });

        await loadOrdenes();
        
        setSuccessMessage(`Estado de orden ${numeroOrden} actualizado a "${nuevoEstado}"`);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        return { success: true };

      } catch (fallbackError) {
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
      
      setSuccessMessage(`Orden ${numeroOrden} eliminada correctamente`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
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
      fecha: '',
      ordenarPor: 'numeroOrden'
    });
  };

  const clearSuccessMessage = () => {
    setShowSuccessMessage(false);
    setSuccessMessage('');
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
    successMessage,
    showSuccessMessage,
    clearSuccessMessage,
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