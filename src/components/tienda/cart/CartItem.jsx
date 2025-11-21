import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import { cartService } from '../../../utils/tienda/cartService';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const [stockReal, setStockReal] = useState(item.stock || 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quantityInput, setQuantityInput] = useState(item.cantidad.toString());
  const [loading, setLoading] = useState(false);
  const [verifyingStock, setVerifyingStock] = useState(false);
  const [stockError, setStockError] = useState('');

  useEffect(() => {
    setQuantityInput(item.cantidad.toString());
  }, [item.cantidad]);

  useEffect(() => {
    const verificarStock = async () => {
      try {
        setVerifyingStock(true);
        setStockError('');
        
        const stockActual = await cartService.getCurrentStock(item.codigo);
        
        const stockFinal = stockActual !== undefined && stockActual !== null ? stockActual : 0;
        setStockReal(stockFinal);
        
        if (stockFinal === 0) {
          setStockError('Producto sin stock disponible');
        } else if (item.cantidad > stockFinal) {
          setStockError(`Cantidad en carrito (${item.cantidad}) excede stock disponible (${stockFinal})`);
        }
        
      } catch (error) {
        setStockError('Error verificando stock');
        const fallbackStock = item.stockActual || item.stock || 0;
        setStockReal(fallbackStock);
      } finally {
        setVerifyingStock(false);
      }
    };

    verificarStock();
    
    const handleStockUpdate = () => {
      verificarStock();
    };

    window.addEventListener('cartUpdated', handleStockUpdate);
    window.addEventListener('stockUpdated', handleStockUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleStockUpdate);
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, [item.codigo, item.nombre, item.cantidad, item.stockActual, item.stock]);

  const handleQuantityChange = async (newQuantity) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setStockError('');
      
      if (newQuantity < 1) {
        setStockError('La cantidad debe ser al menos 1');
        return;
      }
      
      await onUpdateQuantity(item.codigo, newQuantity);
      
    } catch (error) {
      setStockError(error.message);
      const stockActual = await cartService.getCurrentStock(item.codigo);
      setStockReal(stockActual !== undefined && stockActual !== null ? stockActual : 0);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuantityInput(value);
    setStockError('');
    
    if (value === '') {
      return;
    }
    
    const newQuantity = parseInt(value) || 0;
    
    if (newQuantity >= 1 && newQuantity <= stockReal) {
      handleQuantityChange(newQuantity);
    } else if (newQuantity > stockReal) {
      setStockError(`Solo hay ${stockReal} unidades disponibles de ${item.nombre}`);
      setQuantityInput(item.cantidad.toString());
    } else if (newQuantity < 1) {
      setStockError('La cantidad debe ser al menos 1');
      setQuantityInput(item.cantidad.toString());
    }
  };

  const handleInputBlur = (e) => {
    if (e.target.value === '') {
      setQuantityInput(item.cantidad.toString());
    }
  };

  const handleRemoveClick = () => {
    setShowDeleteModal(true);
  };

  const confirmRemove = () => {
    onRemove(item.codigo);
    setShowDeleteModal(false);
  };

  const decreaseQuantity = () => {
    if (item.cantidad > 1) {
      handleQuantityChange(item.cantidad - 1);
    } else {
      handleRemoveClick();
    }
  };

  const increaseQuantity = () => {
    handleQuantityChange(item.cantidad + 1);
  };

  const precioUnitario = item.precioOferta || item.precio;
  const subtotal = precioUnitario * item.cantidad;

  return (
    <>
      <Row 
        className="align-items-center py-3 border-bottom mx-0 rounded-4 mb-3 border-3 border-dark position-relative"
        style={{
          backgroundColor: '#87CEEB',
          transition: 'all 0.3s ease',
          fontFamily: "'Lato', sans-serif",
          opacity: loading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* BOTÓN ELIMINAR - EN ESQUINA SUPERIOR DERECHA */}
        <Button 
          variant="outline-danger" 
          size="sm"
          className="position-absolute top-0 end-0 border-2 fw-bold"
          style={{
            backgroundColor: '#FFB6C1',
            color: '#000000',
            borderColor: '#dc3545',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            transform: 'translate(25%, -25%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            fontSize: '12px'
          }}
          onClick={handleRemoveClick}
          disabled={loading}
          title="Eliminar producto"
        >
          ✕
        </Button>

        {/* Imagen del producto */}
        <Col md={2}>
          <img 
            src={item.imagen} 
            alt={item.nombre}
            className="img-fluid rounded border-2 border-dark"
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjODdDRUVCIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5JbWFnZW48L3RleHQ+Cjwvc3ZnPgo=';
            }}
          />
        </Col>
        
        {/* Información del producto */}
        <Col md={3}>
          <h6 
            className="mb-1 fw-bold"
            style={{ color: '#000000' }}
          >
            {item.nombre}
          </h6>
          <Badge 
            bg="success" 
            className="mb-1 border-2 border-dark"
            style={{ 
              backgroundColor: '#dedd8ff5',
              color: '#000000',
              fontFamily: "'Lato', sans-serif"
            }}
          >
            {item.categoria}
          </Badge>
          
          {item.enOferta && (
            <Badge bg="danger" className="ms-1 border-2 border-dark">
              Oferta -{item.descuento}%
            </Badge>
          )}
          
          {stockReal < 10 && stockReal > 0 && (
            <Badge bg="warning" text="dark" className="ms-1 border-2 border-dark">
              Stock Bajo
            </Badge>
          )}
          {stockReal === 0 && (
            <Badge bg="danger" className="ms-1 border-2 border-dark">
              Sin Stock
            </Badge>
          )}
        </Col>
        
        {/* Precio unitario */}
        <Col md={2}>
          <div className="text-center">
            {item.enOferta ? (
              <div>
                <span 
                  className="text-muted text-decoration-line-through small d-block"
                  style={{ color: '#000000' }}
                >
                  ${item.precioOriginal?.toLocaleString('es-CL') || item.precio.toLocaleString('es-CL')}
                </span>
                <span 
                  className="fw-bold text-danger"
                  style={{ 
                    fontSize: '1.1rem'
                  }}
                >
                  ${precioUnitario.toLocaleString('es-CL')}
                </span>
              </div>
            ) : (
              <span 
                className="fw-bold"
                style={{ 
                  color: '#000000',
                  fontSize: '1.1rem'
                }}
              >
                ${precioUnitario.toLocaleString('es-CL')}
              </span>
            )}
          </div>
        </Col>
        
        {/* Control de cantidad */}
        <Col md={3}>
          <div className="d-flex align-items-center justify-content-center">
            <Button 
              variant="outline-dark" 
              size="sm"
              className="border-3 fw-bold"
              style={{
                backgroundColor: '#dedd8ff5',
                color: '#000000',
                minWidth: '40px'
              }}
              onClick={decreaseQuantity}
              disabled={item.cantidad <= 1 || loading || stockReal === 0}
            >
              -
            </Button>
            
            <div className="position-relative mx-2">
              <Form.Control
                type="number"
                value={quantityInput}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                min="1"
                max={stockReal}
                disabled={loading || stockReal === 0}
                className="text-center border-3 border-dark fw-bold"
                style={{ 
                  width: '70px',
                  color: '#000000',
                  backgroundColor: '#FFFFFF'
                }}
              />
              {loading && (
                <div className="position-absolute top-50 start-50 translate-middle">
                  <Spinner animation="border" size="sm" />
                </div>
              )}
            </div>
            
            <Button 
              variant="outline-dark" 
              size="sm"
              className="border-3 fw-bold"
              style={{
                backgroundColor: '#dedd8ff5',
                color: '#000000',
                minWidth: '40px'
              }}
              onClick={increaseQuantity}
              disabled={item.cantidad >= stockReal || loading || stockReal === 0}
            >
              +
            </Button>
          </div>
          
          <div className="text-center small mt-1">
            {verifyingStock ? (
              <span className="text-warning fw-semibold">
                <Spinner animation="border" size="sm" /> Verificando stock...
              </span>
            ) : (
              <span 
                className={`fw-semibold ${
                  stockReal === 0 ? 'text-danger' : 
                  stockReal < 5 ? 'text-warning' : 'text-success'
                }`}
              >
                {stockReal === 0 ? 'Sin stock' : `Stock: ${stockReal} disponible${stockReal !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          
          {stockError && (
            <Alert 
              variant="danger" 
              className="small mt-2 p-2 border-2 border-dark"
              style={{
                backgroundColor: '#FFB6C1',
                color: '#000000',
                fontWeight: '600'
              }}
            >
              {stockError}
            </Alert>
          )}
        </Col>
        
        {/* Subtotal - AHORA CON ESPACIO LIBRE */}
        <Col md={2}>
          <div 
            className="text-center fw-bold"
            style={{ 
              color: '#000000',
              fontSize: '1.1rem',
              minWidth: '100px'
            }}
          >
            ${subtotal.toLocaleString('es-CL')}
          </div>
        </Col>
      </Row>

      {/* Modal de confirmación para eliminar */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        <Modal.Header 
          closeButton
          className="border-3 border-dark"
          style={{
            backgroundColor: '#87CEEB',
          }}
        >
          <Modal.Title className="fw-bold" style={{ color: '#000000' }}>
            <span style={{ fontFamily: "'Indie Flower', cursive" }}>
              Confirmar Eliminación
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: '#87CEEB',
          }}
        >
          <div className="text-center">
            <div className="mb-3">
              <img 
                src={item.imagen} 
                alt={item.nombre}
                className="img-fluid rounded border-3 border-dark"
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjODdDRUVCIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5JbWFnZW48L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
            </div>
            <h5 
              className="fw-bold mb-3"
              style={{ 
                color: '#000000',
              }}
            >
              ¿Estás seguro de que quieres eliminar?
            </h5>
            <p 
              className="mb-3 fw-semibold"
              style={{ 
                color: '#000000',
                fontSize: '1.1rem'
              }}
            >
              "{item.nombre}"
            </p>
            <p 
              className="fw-semibold"
              style={{ color: '#000000' }}
            >
              Esta acción no se puede deshacer
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer
          className="border-3 border-dark"
          style={{
            backgroundColor: '#87CEEB',
          }}
        >
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            className="rounded-pill px-4 py-2 border-3 border-dark fw-bold"
            style={{
              backgroundColor: '#dedd8ff5',
              color: '#000000'
            }}
          >
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmRemove}
            className="rounded-pill px-4 py-2 border-3 border-dark fw-bold"
            style={{
              background: 'linear-gradient(135deg, #dc3545, #c82333)',
              color: '#FFFFFF',
              border: 'none'
            }}
          >
            Sí, Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CartItem;