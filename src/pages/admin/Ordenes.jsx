import { useState, useEffect } from 'react';
import OrdenesStats from '../../components/admin/OrdenesStats';
import OrdenesFiltros from '../../components/admin/OrdenesFiltros';
import OrdenesTable from '../../components/admin/OrdenesTable';
import OrdenModal from '../../components/admin/OrdenModal';
import ReporteModal from '../../components/admin/ReporteModal';
import { useOrdenes } from '../../utils/admin/useOrdenes';
import { generarReporteOrdenes } from '../../utils/admin/reportUtils';

// Componente para mostrar mensajes de éxito
const SuccessAlert = ({ message, show, onClose }) => {
  if (!show) return null;

  return (
    <div className="alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg"
      style={{ zIndex: 9999, minWidth: '300px' }} role="alert">
      <div className="d-flex align-items-center">
        <i className="bi bi-check-circle-fill me-2 fs-5"></i>
        <strong>{message}</strong>
        <button
          type="button"
          className="btn-close ms-2"
          onClick={onClose}
          aria-label="Cerrar"
        ></button>
      </div>
    </div>
  );
};

const Ordenes = () => {
  const {
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
    handleLimpiarFiltros
  } = useOrdenes();

  const [showReporteModal, setShowReporteModal] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    document.body.style.backgroundImage = 'url("../src/assets/tienda/fondostardew.png")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.minHeight = '100vh';

    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.minHeight = '';
    };
  }, []);

  const handleGenerarReporte = (formato) => {
    try {
      if (formato === 'csv') {
        setShowReporteModal(true);
      } else {
        generarReporteOrdenes(formato, ordenesFiltradas);
      }
    } catch (error) {
      setActionError('Error al generar el reporte: ' + error.message);
    }
  };

  const handleSeleccionFormato = (formato) => {
    try {
      generarReporteOrdenes(formato, ordenesFiltradas);
      setShowReporteModal(false);
    } catch (error) {
      setActionError('Error al generar el reporte: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid" style={{ padding: '20px', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-white" role="status">
            <span className="visually-hidden">Cargando órdenes...</span>
          </div>
          <span className="ms-2 text-white">Cargando órdenes desde Oracle...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid" style={{ padding: '20px', minHeight: '100vh' }}>
        <div className="alert alert-danger">
          <h4>Error al cargar órdenes</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: '20px', minHeight: '100vh' }}>

      <SuccessAlert
        message={successMessage}
        show={showSuccessMessage}
        onClose={clearSuccessMessage}
      />

      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error:</strong> {actionError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError('')}
          ></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-white fw-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
          Gestión de Órdenes
        </h1>
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-primary shadow"
            onClick={() => handleGenerarReporte('csv')}
          >
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
            Reporte CSV
          </button>
          <button
            className="btn btn-warning shadow"
            onClick={() => handleGenerarReporte('json')}
          >
            <i className="bi bi-file-code me-2"></i>
            Reporte JSON
          </button>
        </div>
      </div>

      <OrdenesStats estadisticas={estadisticas} />

      <OrdenesFiltros
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onLimpiarFiltros={handleLimpiarFiltros}
        resultados={{
          filtradas: ordenesFiltradas.length,
          totales: ordenes.length
        }}
      />

      <OrdenesTable
        ordenes={ordenesFiltradas}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateEstado={handleUpdateEstado}
      />

      <OrdenModal
        show={showModal}
        orden={editingOrden}
        onClose={handleCloseModal}
        onUpdateEstado={handleUpdateEstado}
      />

      <ReporteModal
        show={showReporteModal}
        estadisticas={estadisticas}
        tipo="ordenes"
        onSeleccionarFormato={handleSeleccionFormato}
        onClose={() => setShowReporteModal(false)}
      />
    </div>
  );
};

export default Ordenes;