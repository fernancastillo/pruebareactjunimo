import { useState, useEffect } from 'react';
import regionesComunasData from '../../data/regiones_comunas.json';

const PerfilModal = ({
  show,
  usuario,
  formData,
  guardando,
  cambioContrasenha,
  onClose,
  onChange,
  onSubmit,
  setCambioContrasenha
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [comunasFiltradas, setComunasFiltradas] = useState([]);

  useEffect(() => {
    if (formData.region) {
      const regionEncontrada = regionesComunasData.regiones.find(
        r => r.nombre === formData.region
      );
      if (regionEncontrada) {
        setComunasFiltradas(regionEncontrada.comunas);
      } else {
        setComunasFiltradas([]);
      }
    } else {
      setComunasFiltradas([]);
    }
  }, [formData.region]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validarFormulario()) {
      onSubmit(e);
    }
  };

  const handleRegionChange = (e) => {
    const regionSeleccionada = e.target.value;

    onChange({ target: { name: 'region', value: regionSeleccionada } });
    onChange({ target: { name: 'comuna', value: '' } });

    if (regionSeleccionada) {
      const regionEncontrada = regionesComunasData.regiones.find(
        r => r.nombre === regionSeleccionada
      );
      if (regionEncontrada) {
        setComunasFiltradas(regionEncontrada.comunas);
      } else {
        setComunasFiltradas([]);
      }
    } else {
      setComunasFiltradas([]);
    }

    if (errores.region) {
      setErrores(prev => ({
        ...prev,
        region: ''
      }));
    }
  };

  const handleComunaChange = (e) => {
    const comunaSeleccionada = e.target.value;
    onChange({ target: { name: 'comuna', value: comunaSeleccionada } });

    if (errores.comuna) {
      setErrores(prev => ({
        ...prev,
        comuna: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 9);
      onChange({ target: { name, value: soloNumeros } });
    } else {
      onChange(e);
    }
  };

  // Y en el JSX, muestra un indicador simple:
  {
    formData.password && formData.password.trim() && (
      <div className="alert alert-warning mb-3">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <strong>Contraseña:</strong> Se cambiará la contraseña al guardar
      </div>
    )
  }

  const validarEmail = (email) => {
    if (!email?.trim()) return 'El correo electrónico es obligatorio';

    const dominiosPermitidos = ['gmail.com', 'duoc.cl', 'profesor.duoc.cl'];
    const regex = new RegExp(`^[a-zA-Z0-9._%+-]+@(${dominiosPermitidos.join('|')})$`);

    if (!regex.test(email)) {
      return `Solo se permiten correos @duoc.cl, @profesor.duoc.cl o @gmail.com`;
    }

    return '';
  };

  const validarTelefono = (telefono) => {
    if (!telefono || telefono.trim() === '') return '';

    const soloNumeros = telefono.replace(/\D/g, '');

    if (soloNumeros.length !== 9) {
      return 'El teléfono debe tener 9 dígitos';
    }

    if (!soloNumeros.startsWith('9')) {
      return 'El teléfono debe empezar con 9';
    }

    return '';
  };

  const validarDireccion = (direccion) => {
    if (!direccion?.trim()) return 'La dirección es obligatoria';

    if (direccion.trim().length < 5) {
      return 'La dirección debe tener al menos 5 caracteres';
    }

    if (direccion.trim().length > 100) {
      return 'La dirección no puede tener más de 100 caracteres';
    }

    return '';
  };

  const validarNombre = (nombre) => {
    if (!nombre?.trim()) return 'El nombre es obligatorio';
    if (nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
    return '';
  };

  const validarApellidos = (apellidos) => {
    if (!apellidos?.trim()) return 'Los apellidos son obligatorios';
    if (apellidos.trim().length < 3) return 'Los apellidos deben tener al menos 3 caracteres';
    return '';
  };

  const validarPassword = (password) => {
    if (password && password.trim()) {
      if (password.length < 6 || password.length > 10) {
        return 'La contraseña debe tener entre 6 y 10 caracteres';
      }
    }
    return '';
  };

  const validarConfirmarPassword = (password, confirmarPassword) => {
    if (password && password.trim()) {
      if (!confirmarPassword) {
        return 'Debes confirmar la contraseña';
      }
      if (password !== confirmarPassword) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  };

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);

    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return edad;
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    const errorNombre = validarNombre(formData.nombre);
    if (errorNombre) nuevosErrores.nombre = errorNombre;

    const errorApellidos = validarApellidos(formData.apellidos);
    if (errorApellidos) nuevosErrores.apellidos = errorApellidos;

    const errorEmail = validarEmail(formData.correo);
    if (errorEmail) nuevosErrores.correo = errorEmail;

    if (formData.telefono && formData.telefono.trim() !== '') {
      const errorTelefono = validarTelefono(formData.telefono);
      if (errorTelefono) nuevosErrores.telefono = errorTelefono;
    }

    const errorDireccion = validarDireccion(formData.direccion);
    if (errorDireccion) nuevosErrores.direccion = errorDireccion;

    if (formData.region && !formData.comuna) {
      nuevosErrores.comuna = 'Debe seleccionar una comuna para la región elegida';
    }
    if (formData.comuna && !formData.region) {
      nuevosErrores.region = 'Debe seleccionar una región para la comuna elegida';
    }

    if (formData.fecha_nacimiento) {
      const fechaNacimiento = new Date(formData.fecha_nacimiento);
      const hoy = new Date();
      const edad = calcularEdad(formData.fecha_nacimiento);

      if (fechaNacimiento > hoy) {
        nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura';
      } else if (edad < 10) {
        nuevosErrores.fecha_nacimiento = 'Debe ser mayor de 10 años';
      }
    }

    // Solo validar contraseñas si se está cambiando
    if (cambioContrasenha) {
      const errorPassword = validarPassword(formData.password);
      if (errorPassword) nuevosErrores.password = errorPassword;

      const errorConfirmarPassword = validarConfirmarPassword(formData.password, formData.confirmarPassword);
      if (errorConfirmarPassword) nuevosErrores.confirmarPassword = errorConfirmarPassword;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const getInputClass = (campo) => {
    return errores[campo] ? 'form-control is-invalid' : 'form-control';
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-pencil-square me-2"></i>
              Editar Perfil
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={guardando}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Indicador de estado de contraseña */}
              {cambioContrasenha ? (
                <div className="alert alert-warning mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Contraseña:</strong> Se cambiará la contraseña al guardar
                </div>
              ) : (
                <div className="alert alert-info mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Contraseña:</strong> Se mantendrá la contraseña actual
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Nombre <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={getInputClass('nombre')}
                      name="nombre"
                      value={formData.nombre || ''}
                      onChange={handleChange}
                      placeholder="Ej: Ana María"
                      minLength="3"
                      required
                    />
                    {errores.nombre && (
                      <div className="invalid-feedback d-block">
                        <i className="bi bi-x-circle me-1"></i>
                        {errores.nombre}
                      </div>
                    )}
                    <div className="form-text">
                      Mínimo 3 caracteres
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Apellidos <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={getInputClass('apellidos')}
                      name="apellidos"
                      value={formData.apellidos || ''}
                      onChange={handleChange}
                      placeholder="Ej: González Pérez"
                      minLength="3"
                      required
                    />
                    {errores.apellidos && (
                      <div className="invalid-feedback d-block">
                        <i className="bi bi-x-circle me-1"></i>
                        {errores.apellidos}
                      </div>
                    )}
                    <div className="form-text">
                      Mínimo 3 caracteres
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Correo Electrónico <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className={getInputClass('correo')}
                  name="correo"
                  value={formData.correo || ''}
                  onChange={handleChange}
                  placeholder="Ej: usuario@duoc.cl"
                  required
                />
                {errores.correo && (
                  <div className="invalid-feedback d-block">
                    <i className="bi bi-x-circle me-1"></i>
                    {errores.correo}
                  </div>
                )}
                <small className="text-muted">
                  Dominios permitidos: gmail.com, duoc.cl, profesor.duoc.cl
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Teléfono</label>
                <input
                  type="text"
                  className={getInputClass('telefono')}
                  name="telefono"
                  value={formData.telefono || ''}
                  onChange={handleChange}
                  placeholder="912345678"
                  maxLength="9"
                />
                {errores.telefono && (
                  <div className="invalid-feedback d-block">
                    <i className="bi bi-x-circle me-1"></i>
                    {errores.telefono}
                  </div>
                )}
                <small className="text-muted">
                  Opcional. Si se ingresa, debe empezar con 9 y tener 9 dígitos
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Dirección <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={getInputClass('direccion')}
                  name="direccion"
                  value={formData.direccion || ''}
                  onChange={handleChange}
                  placeholder="Ej: Av. Principal 123"
                  minLength="5"
                  maxLength="100"
                  required
                />
                {errores.direccion && (
                  <div className="invalid-feedback d-block">
                    <i className="bi bi-x-circle me-1"></i>
                    {errores.direccion}
                  </div>
                )}
                <small className="text-muted">
                  Entre 5 y 100 caracteres
                </small>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Región</label>
                    <select
                      className={`form-select ${errores.region ? 'is-invalid' : ''}`}
                      name="region"
                      value={formData.region || ''}
                      onChange={handleRegionChange}
                    >
                      <option value="">Seleccionar región...</option>
                      {regionesComunasData.regiones.map(region => (
                        <option key={region.id} value={region.nombre}>
                          {region.nombre}
                        </option>
                      ))}
                    </select>
                    {errores.region && (
                      <div className="invalid-feedback d-block">
                        <i className="bi bi-x-circle me-1"></i>
                        {errores.region}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Comuna</label>
                    <select
                      className={`form-select ${errores.comuna ? 'is-invalid' : ''}`}
                      name="comuna"
                      value={formData.comuna || ''}
                      onChange={handleComunaChange}
                      disabled={!formData.region}
                    >
                      <option value="">Seleccionar comuna...</option>
                      {comunasFiltradas.map(comuna => (
                        <option key={comuna} value={comuna}>
                          {comuna}
                        </option>
                      ))}
                    </select>
                    {errores.comuna && (
                      <div className="invalid-feedback d-block">
                        <i className="bi bi-x-circle me-1"></i>
                        {errores.comuna}
                      </div>
                    )}
                    <div className="form-text">
                      {!formData.region ? 'Primero selecciona una región' : `${comunasFiltradas.length} comunas disponibles`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Fecha de Nacimiento</label>
                <input
                  type="date"
                  className={getInputClass('fecha_nacimiento')}
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento || ''}
                  onChange={handleChange}
                />
                {errores.fecha_nacimiento && (
                  <div className="invalid-feedback d-block">
                    <i className="bi bi-x-circle me-1"></i>
                    {errores.fecha_nacimiento}
                  </div>
                )}
                <small className="text-muted">
                  Mayor de 10 años
                </small>
              </div>

              <hr />

              <h6 className="fw-bold mb-3">Cambiar Contraseña (Opcional)</h6>

              <div className="mb-3">
                <label className="form-label fw-bold">Nueva Contraseña</label>
                <div className="input-group">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    className={getInputClass('password')}
                    name="password"
                    value={formData.password || ''}
                    onChange={handleChange}
                    placeholder="Dejar vacío para mantener la actual"
                    maxLength="10"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    <i className={`bi ${mostrarPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                {errores.password && (
                  <div className="invalid-feedback d-block">
                    <i className="bi bi-x-circle me-1"></i>
                    {errores.password}
                  </div>
                )}
                <small className="text-muted">Entre 6 y 10 caracteres (opcional)</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Confirmar Contraseña</label>
                <div className="input-group">
                  <input
                    type={mostrarConfirmarPassword ? "text" : "password"}
                    className={getInputClass('confirmarPassword')}
                    name="confirmarPassword"
                    value={formData.confirmarPassword || ''}
                    onChange={handleChange}
                    placeholder="Repetir contraseña"
                    maxLength="10"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                  >
                    <i className={`bi ${mostrarConfirmarPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                {errores.confirmarPassword && (
                  <div className="invalid-feedback d-block">
                    <i className="bi bi-x-circle me-1"></i>
                    {errores.confirmarPassword}
                  </div>
                )}
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Los campos marcados con <span className="text-danger">*</span> son obligatorios.
                La contraseña solo se actualizará si se completa el campo.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={guardando}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Guardando...</span>
                    </div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PerfilModal;