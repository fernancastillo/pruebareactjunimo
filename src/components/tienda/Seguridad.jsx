// components/tienda/Seguridad.js
import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { perfilService } from '../../utils/tienda/perfilService';
import { authService } from '../../utils/tienda/authService';

const Seguridad = () => {
  const [formData, setFormData] = useState({
    contrasenhaActual: '',
    nuevaContrasenha: '',
    confirmarContrasenha: ''
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ show: false, tipo: '', texto: '' });

  const usuarioActual = authService.getCurrentUser();

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.contrasenhaActual) {
      nuevosErrores.contrasenhaActual = 'La contraseña actual es requerida';
    }

    if (!formData.nuevaContrasenha) {
      nuevosErrores.nuevaContrasenha = 'La nueva contraseña es requerida';
    } else if (formData.nuevaContrasenha.length < 6) {
      nuevosErrores.nuevaContrasenha = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmarContrasenha) {
      nuevosErrores.confirmarContrasenha = 'Confirma tu nueva contraseña';
    } else if (formData.nuevaContrasenha !== formData.confirmarContrasenha) {
      nuevosErrores.confirmarContrasenha = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario escribe
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Limpiar mensaje cuando el usuario modifica algún campo
    if (mensaje.show) {
      setMensaje({ show: false, tipo: '', texto: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      const resultado = await perfilService.actualizarContrasenha(
        usuarioActual.run,
        formData.contrasenhaActual,
        formData.nuevaContrasenha
      );

      if (resultado.success) {
        setMensaje({
          show: true,
          tipo: 'success',
          texto: resultado.message
        });
        // Limpiar formulario
        setFormData({
          contrasenhaActual: '',
          nuevaContrasenha: '',
          confirmarContrasenha: ''
        });
      } else {
        setMensaje({
          show: true,
          tipo: 'danger',
          texto: resultado.message
        });
      }
    } catch (error) {
      setMensaje({
        show: true,
        tipo: 'danger',
        texto: 'Error al actualizar la contraseña. Intente nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-4" style={{ fontFamily: "'Lato', sans-serif", fontWeight: '600' }}>
        Cambiar Contraseña
      </h4>

      {mensaje.show && (
        <Alert 
          variant={mensaje.tipo} 
          className="mb-4 border-3 border-dark rounded-4"
          style={{
            backgroundColor: mensaje.tipo === 'success' ? '#87CEEB' : '#f8d7da',
            color: '#000000',
            fontWeight: '600'
          }}
        >
          {mensaje.texto}
        </Alert>
      )}

      <Card 
        className="border-3 border-dark rounded-4"
        style={{ 
          backgroundColor: '#87CEEB'
        }}
      >
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600' }}>
                    Contraseña Actual
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="contrasenhaActual"
                    value={formData.contrasenhaActual}
                    onChange={handleInputChange}
                    isInvalid={!!errores.contrasenhaActual}
                    className="border-3 border-dark rounded-4"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      fontFamily: "'Lato', sans-serif"
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errores.contrasenhaActual}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600' }}>
                    Nueva Contraseña
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="nuevaContrasenha"
                    value={formData.nuevaContrasenha}
                    onChange={handleInputChange}
                    isInvalid={!!errores.nuevaContrasenha}
                    className="border-3 border-dark rounded-4"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      fontFamily: "'Lato', sans-serif"
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errores.nuevaContrasenha}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Mínimo 6 caracteres
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600' }}>
                    Confirmar Contraseña
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmarContrasenha"
                    value={formData.confirmarContrasenha}
                    onChange={handleInputChange}
                    isInvalid={!!errores.confirmarContrasenha}
                    className="border-3 border-dark rounded-4"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      fontFamily: "'Lato', sans-serif"
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errores.confirmarContrasenha}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-pill px-4 py-2 border-3 border-dark fw-bold"
                style={{
                  backgroundColor: '#dedd8ff5',
                  color: '#000000',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Lato', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(222, 221, 143, 0.6)';
                  e.target.style.backgroundColor = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#dedd8ff5';
                }}
              >
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Seguridad;