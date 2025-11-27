import { formatCurrency, formatDate } from '../../utils/admin/dashboardUtils';

const OrdenesTable = ({ ordenes, onEdit, onDelete, onUpdateEstado }) => {

  const handleEliminarOrden = async (orden) => {
    const mensajeConfirmacion = `
¿Estás seguro de que quieres eliminar la orden ${orden.numeroOrden}?

• Cliente: ${orden.run}
• Total: ${formatCurrency(orden.total)}
• Productos: ${orden.productos.length} item(s)

 Esta acción no se puede deshacer.
    `.trim();

    if (window.confirm(mensajeConfirmacion)) {
      try {
        const resultado = await onDelete(orden.numeroOrden);
        if (!resultado.success) {
          alert(`Error al eliminar orden: ${resultado.error}`);
        }
      } catch (error) {
        alert('Error inesperado al eliminar la orden');
      }
    }
  };

  const getEstadoInfo = (estado) => {
    const estadoMap = {
      'Pendiente': {
        text: 'Pendiente',
        class: 'pendiente-custom text-dark',
        icon: 'bi-clock'
      },
      'Enviado': {
        text: 'Enviado',
        class: 'enviado-custom text-dark',
        icon: 'bi-truck'
      },
      'Entregado': {
        text: 'Entregado',
        class: 'entregado-custom text-dark',
        icon: 'bi-check-circle'
      },
      'Cancelado': {
        text: 'Cancelado',
        class: 'cancelado-custom text-dark',
        icon: 'bi-x-circle'
      }
    };

    return estadoMap[estado] || {
      text: estado,
      class: 'bg-secondary text-dark',
      icon: 'bi-question'
    };
  };

  return (
    <div className="card shadow">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">Lista de Órdenes</h6>
      </div>
      <div className="card-body">
        <style>
          {`
            .pendiente-custom {
              background-color: #ffeaa7 !important;
              border: 1px solid #fdcb6e;
            }
            .enviado-custom {
              background-color: #a3e1f4 !important;
              border: 1px solid #74b9ff;
            }
            .entregado-custom {
              background-color: #a3e4a3 !important;
              border: 1px solid #27ae60;
            }
            .cancelado-custom {
              background-color: #f8a4a4 !important;
              border: 1px solid #e74c3c;
            }
            .badge {
              font-weight: 600;
              padding: 0.5em 0.8em;
            }
          `}
        </style>

        <div className="table-responsive">
          <table className="table table-bordered table-hover" width="100%" cellSpacing="0">
            <thead className="thead-light">
              <tr>
                <th>Orden #</th>
                <th>Fecha</th>
                <th>RUN Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Productos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => {
                const estadoInfo = getEstadoInfo(orden.estadoEnvio);

                return (
                  <tr key={orden.numeroOrden}>
                    <td>
                      <strong>{orden.numeroOrden}</strong>
                    </td>
                    <td>{formatDate(orden.fecha)}</td>
                    <td>{orden.run}</td>
                    <td>
                      <strong>{formatCurrency(orden.total)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${estadoInfo.class} d-flex align-items-center justify-content-center`} style={{ minWidth: '100px' }}>
                        <i className={`${estadoInfo.icon} me-1`}></i>
                        {estadoInfo.text}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {orden.productos.length} producto(s)
                      </small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-primary"
                          onClick={() => onEdit(orden)}
                          title="Ver detalles y cambiar estado"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleEliminarOrden(orden)}
                          title="Eliminar orden"
                          disabled={orden.estadoEnvio === 'Entregado'}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                      {orden.estadoEnvio === 'Entregado' && (
                        <small className="text-muted d-block mt-1">
                          No se puede eliminar
                        </small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {ordenes.length === 0 && (
          <div className="text-center py-4">
            <i className="bi bi-inbox fa-3x text-muted mb-3"></i>
            <p className="text-muted">No se encontraron órdenes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdenesTable;