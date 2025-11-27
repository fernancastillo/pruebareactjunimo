const OrdenesFiltros = ({ filtros, onFiltroChange, onLimpiarFiltros, resultados }) => {
  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">
          <i className="bi bi-funnel me-2"></i>
          Filtros y Ordenamiento
        </h6>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label small fw-bold">Número de Orden</label>
            <input
              type="text"
              className="form-control form-control-sm"
              name="numeroOrden"
              value={filtros.numeroOrden}
              onChange={onFiltroChange}
              placeholder="Buscar por número..."
            />
          </div>
          
          <div className="col-md-2">
            <label className="form-label small fw-bold">RUN Cliente</label>
            <input
              type="text"
              className="form-control form-control-sm"
              name="run"
              value={filtros.run}
              onChange={onFiltroChange}
              placeholder="Buscar por RUN..."
            />
          </div>
          
          <div className="col-md-2">
            <label className="form-label small fw-bold">Estado</label>
            <select
              className="form-select form-select-sm"
              name="estado"
              value={filtros.estado}
              onChange={onFiltroChange}
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          
          <div className="col-md-2">
            <label className="form-label small fw-bold">Fecha</label>
            <input
              type="date"
              className="form-control form-control-sm"
              name="fecha"
              value={filtros.fecha}
              onChange={onFiltroChange}
            />
          </div>
          
          <div className="col-md-3">
            <label className="form-label small fw-bold">Ordenar por</label>
            <select
              className="form-select form-select-sm"
              name="ordenarPor"
              value={filtros.ordenarPor}
              onChange={onFiltroChange}
            >
              <option value="numeroOrden">Número de Orden (A-Z)</option>
              <option value="numeroOrden-desc">Número de Orden (Z-A)</option>
              <option value="fecha">Fecha (Más antigua)</option>
              <option value="fecha-desc">Fecha (Más reciente)</option>
              <option value="total">Total (Menor a mayor)</option>
              <option value="total-desc">Total (Mayor a menor)</option>
              <option value="estado">Estado (A-Z)</option>
              <option value="estado-desc">Estado (Z-A)</option>
              <option value="run">RUN Cliente (A-Z)</option>
              <option value="run-desc">RUN Cliente (Z-A)</option>
            </select>
          </div>
        </div>
        
        <div className="row mt-3">
          <div className="col-md-6">
            <div className="d-flex align-items-center">
              <span className="badge bg-primary me-2">
                {resultados.filtradas} / {resultados.totales}
              </span>
              <small className="text-muted">
                {resultados.filtradas === resultados.totales 
                  ? 'Mostrando todas las órdenes' 
                  : `Mostrando ${resultados.filtradas} de ${resultados.totales} órdenes`}
              </small>
            </div>
          </div>
          <div className="col-md-6 text-end">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={onLimpiarFiltros}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenesFiltros;