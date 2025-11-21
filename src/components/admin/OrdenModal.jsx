import { useState } from 'react';
import { formatCurrency, formatDate, getEstadoBadge } from '../../utils/admin/dashboardUtils';
import { generarBoletaOrden, generarBoletaCSV, generarBoletaTexto } from '../../utils/admin/boletaUtils';

const OrdenModal = ({ show, orden, onClose, onUpdateEstado }) => {
  const [showSelectorFormato, setShowSelectorFormato] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!show || !orden) return null;

const handleEstadoChange = async (nuevoEstado) => {
  if (window.confirm(`¿Cambiar estado de orden ${orden.numeroOrden} a "${nuevoEstado}"?`)) {
    try {
      setIsUpdating(true);
      setActionError('');
      
      console.log('Iniciando cambio de estado en modal...');
      const resultado = await onUpdateEstado(orden.numeroOrden, nuevoEstado);
      
      if (!resultado.success) {
        console.error('Error en cambio de estado:', resultado.error);
        setActionError(resultado.error || 'No se pudo actualizar el estado');
      } else {
        console.log('Estado cambiado exitosamente desde modal');
        onClose();
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setActionError('Error al actualizar el estado: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  }
};

  const handleDescargarBoleta = () => {
    setShowSelectorFormato(true);
  };

  const handleSeleccionFormato = async (formato) => {
    setShowSelectorFormato(false);
    
    try {
      switch (formato) {
        case 'html':
          await generarBoletaOrden(orden);
          break;
        case 'csv':
          await generarBoletaCSV(orden);
          break;
        case 'txt':
          await generarBoletaTexto(orden);
          break;
        default:
          await generarBoletaOrden(orden);
      }
    } catch (error) {
      setActionError('Error al generar la boleta: ' + error.message);
    }
  };

  const handleCerrarSelector = () => {
    setShowSelectorFormato(false);
  };

  const botonesEstado = [
    {
      estado: 'Pendiente',
      label: 'Marcar como Pendiente',
      clase: 'btn-warning text-dark fw-bold',
      icono: 'bi-clock',
      mostrar: orden.estadoEnvio !== 'Pendiente'
    },
    {
      estado: 'Enviado',
      label: 'Marcar como Enviado',
      clase: 'btn-info text-dark fw-bold',
      icono: 'bi-truck',
      mostrar: orden.estadoEnvio !== 'Enviado'
    },
    {
      estado: 'Entregado',
      label: 'Marcar como Entregado',
      clase: 'btn-success text-white fw-bold',
      icono: 'bi-check-circle',
      mostrar: orden.estadoEnvio !== 'Entregado'
    },
    {
      estado: 'Cancelado',
      label: 'Marcar como Cancelado',
      clase: 'btn-danger text-white fw-bold',
      icono: 'bi-x-circle',
      mostrar: orden.estadoEnvio !== 'Cancelado'
    }
  ];

  return (
    <>
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-receipt me-2"></i>
                Detalles de Orden: <span className="text-primary">{orden.numeroOrden}</span>
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              
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

              {isUpdating && (
                <div className="alert alert-info">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Actualizando...</span>
                    </div>
                    Actualizando estado...
                  </div>
                </div>
              )}

              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-info-circle me-2"></i>
                        Información de la Orden
                      </h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          <tr>
                            <td className="fw-bold text-muted">Número:</td>
                            <td className="fw-semibold">{orden.numeroOrden}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">Fecha:</td>
                            <td>{formatDate(orden.fecha)}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">RUN Cliente:</td>
                            <td className="fw-semibold">{orden.run}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">Total:</td>
                            <td className="fw-bold text-primary fs-5">{formatCurrency(orden.total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-truck me-2"></i>
                        Estado del Envío
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <span className={`badge ${getEstadoBadge(orden.estadoEnvio)} fs-6 p-2`}>
                          {orden.estadoEnvio}
                        </span>
                      </div>
                      
                      <div className="d-grid gap-2">
                        {botonesEstado.map((boton) => 
                          boton.mostrar && (
                            <button 
                              key={boton.estado}
                              className={`btn ${boton.clase} btn-sm`}
                              onClick={() => handleEstadoChange(boton.estado)}
                              disabled={isUpdating}
                            >
                              <i className={`${boton.icono} me-2`}></i>
                              {boton.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h6 className="mb-0 fw-bold">
                    <i className="bi bi-box-seam me-2"></i>
                    Productos en la Orden
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Código</th>
                          <th>Producto</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-end">Precio Unitario</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.productos.map((producto, index) => (
                          <tr key={index}>
                            <td className="fw-semibold">{producto.codigo}</td>
                            <td>{producto.nombre}</td>
                            <td className="text-center">
                              <span className="badge bg-primary">{producto.cantidad}</span>
                            </td>
                            <td className="text-end">{formatCurrency(producto.precio)}</td>
                            <td className="text-end fw-bold">
                              {formatCurrency(producto.precio * producto.cantidad)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="4" className="text-end fw-bold fs-6">Total:</td>
                          <td className="text-end fw-bold text-primary fs-5">
                            {formatCurrency(orden.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleDescargarBoleta}
                disabled={isUpdating}
              >
                <i className="bi bi-download me-2"></i>
                Descargar Boleta
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isUpdating}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSelectorFormato && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-download me-2"></i>
                  Formato de Boleta
                </h5>
                <button type="button" className="btn-close" onClick={handleCerrarSelector}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Elige el formato para descargar la boleta:</p>
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-outline-primary text-start"
                    onClick={() => handleSeleccionFormato('html')}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    <strong>HTML</strong>
                    <br />
                    <small className="text-muted">Para imprimir y mejor visualización</small>
                  </button>
                  <button 
                    className="btn btn-outline-success text-start"
                    onClick={() => handleSeleccionFormato('csv')}
                  >
                    <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                    <strong>CSV</strong>
                    <br />
                    <small className="text-muted">Para abrir en Excel</small>
                  </button>
                  <button 
                    className="btn btn-outline-secondary text-start"
                    onClick={() => handleSeleccionFormato('txt')}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    <strong>Texto Plano</strong>
                    <br />
                    <small className="text-muted">Compatible universal</small>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={handleCerrarSelector}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdenModal;