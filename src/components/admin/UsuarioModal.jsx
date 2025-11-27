import { useState } from 'react';
import UsuarioForm from './UsuarioForm';

const UsuarioModal = ({ show, usuario, onClose, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleSubmit = async (usuarioData) => {
    try {
      setIsSubmitting(true);
      
      await onUpdate(usuario.run, usuarioData);
      
    } catch (error) {
      alert(`Error al actualizar usuario: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-gear me-2"></i>
              Editar Usuario: {usuario?.nombre} {usuario?.apellidos}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>
          <div className="modal-body">
            {isSubmitting && (
              <div className="alert alert-info">
                <div className="d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Actualizando...</span>
                  </div>
                  Actualizando usuario...
                </div>
              </div>
            )}
            
            {usuario && (
              <UsuarioForm
                usuario={usuario}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuarioModal;