// src/pages/admin/Usuarios.jsx
import { useState, useEffect } from 'react';
import UsuariosStats from '../../components/admin/UsuariosStats';
import UsuariosFiltros from '../../components/admin/UsuariosFiltros';
import UsuariosTable from '../../components/admin/UsuariosTable';
import UsuarioModal from '../../components/admin/UsuarioModal';
import UsuarioCreateModal from '../../components/admin/UsuarioCreateModal';
import ReporteModal from '../../components/admin/ReporteModal';
import { useUsuarios } from '../../utils/admin/useUsuarios';
import { generarReporteUsuarios } from '../../utils/admin/reportUtils';

// Componente para el mensaje de éxito
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

// Componente para mensaje de error
const ErrorAlert = ({ message, show, onClose }) => {
  if (!show || !message) return null;

  return (
    <div className="alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg" 
         style={{ zIndex: 9999, minWidth: '300px' }} role="alert">
      <div className="d-flex align-items-center">
        <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
        <strong>Error: {message}</strong>
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

// Componente para información de conexión
const ConexionInfo = ({ conexionInfo }) => {
  if (!conexionInfo) return null;

  return (
    <div className={`alert ${conexionInfo.conectado ? 'alert-success' : 'alert-warning'} mb-3`}>
      <div className="d-flex align-items-center">
        <i className={`bi ${conexionInfo.conectado ? 'bi-database-check' : 'bi-database-exclamation'} me-2`}></i>
        <div>
          <strong>{conexionInfo.conectado ? 'Conectado a Oracle Database' : 'Problema de conexión'}</strong>
          <div className="small">{conexionInfo.mensaje}</div>
          {conexionInfo.totalUsuarios !== undefined && (
            <div className="small">
              <strong>Usuarios en base de datos:</strong> {conexionInfo.totalUsuarios}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Usuarios = () => {
  const {
    usuarios,
    usuariosFiltrados,
    loading,
    editingUsuario,
    showModal,
    showCreateModal,
    filtros,
    estadisticas,
    error,
    conexionInfo,
    successMessage,
    showSuccessMessage,
    clearSuccessMessage,
    clearError,
    handleEdit,
    handleUpdateUsuario,
    handleDelete,
    handleCreate,
    handleCreateUsuario,
    handleCloseModal,
    handleCloseCreateModal,
    handleFiltroChange,
    handleLimpiarFiltros,
    refreshData
  } = useUsuarios();

  const [showReporteModal, setShowReporteModal] = useState(false);

  // Aplicar el fondo al body
  useEffect(() => {
    document.body.style.backgroundImage = 'url("../src/assets/tienda/fondostardew.png")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.minHeight = '100vh';
    
    // Limpiar cuando el componente se desmonte
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
    // Si el usuario elige CSV, abre el modal para escoger tipo (CSV o CSV Excel)
    if (formato === 'csv') {
      setShowReporteModal(true);
      return;
    }

    // Si el usuario elige JSON, genera directamente el archivo
    if (formato === 'json') {
      generarReporteUsuarios('json', usuariosFiltrados, estadisticas);
      return;
    }

    // Otros formatos adicionales (por compatibilidad futura)
    generarReporteUsuarios(formato, usuariosFiltrados, estadisticas);
  };

  const handleSeleccionFormato = (formato) => {
    generarReporteUsuarios(formato, usuariosFiltrados, estadisticas);
    setShowReporteModal(false);
  };

  if (loading) {
    return (
      <div className="container-fluid" style={{ padding: '20px', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center text-white">
            <div className="spinner-border text-white mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <div>
              <h5 className="mb-2">Cargando usuarios desde Oracle Database</h5>
              <p className="text-light mb-0">Conectando con la base de datos...</p>
              {conexionInfo && (
                <small className="text-info">{conexionInfo.mensaje}</small>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: '20px', minHeight: '100vh' }}>
      
      {/* Mensaje de éxito */}
      <SuccessAlert 
        message={successMessage}
        show={showSuccessMessage}
        onClose={clearSuccessMessage}
      />

      {/* Mensaje de error */}
      <ErrorAlert 
        message={error}
        show={!!error}
        onClose={clearError}
      />

      {/* Información de conexión */}
      <ConexionInfo conexionInfo={conexionInfo} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-white fw-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
            Gestión de Usuarios
          </h1>
          <p className="text-light mb-0">
            Base de datos Oracle Cloud • {usuarios.length} usuarios registrados
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-success shadow"
            onClick={handleCreate}
          >
            <i className="bi bi-person-plus me-2"></i>
            Crear Usuario
          </button>
          <button
            className="btn btn-outline-light shadow"
            onClick={refreshData}
            title="Actualizar datos"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualizar
          </button>
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

      {/* Estadísticas */}
      <UsuariosStats estadisticas={estadisticas} />

      {/* Filtros */}
      <UsuariosFiltros
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onLimpiarFiltros={handleLimpiarFiltros}
        resultados={{
          filtrados: usuariosFiltrados.length,
          totales: usuarios.length
        }}
      />

      {/* Tabla de usuarios */}
      <UsuariosTable
        usuarios={usuariosFiltrados}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal para crear usuario */}
      <UsuarioCreateModal
        show={showCreateModal}
        usuario={null}
        onSave={handleCreateUsuario}
        onClose={handleCloseCreateModal}
      />

      {/* Modal para ver/editar usuario */}
      <UsuarioModal
        show={showModal}
        usuario={editingUsuario}
        onClose={handleCloseModal}
        onUpdate={handleUpdateUsuario}
      />

      {/* Modal de reportes */}
      <ReporteModal
        show={showReporteModal}
        estadisticas={estadisticas}
        tipo="usuarios"
        onSeleccionarFormato={handleSeleccionFormato}
        onClose={() => setShowReporteModal(false)}
      />
    </div>
  );
};

export default Usuarios;