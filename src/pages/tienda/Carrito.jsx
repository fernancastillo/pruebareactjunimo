import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../utils/tienda/authService';
import { cartService } from '../../utils/tienda/cartService';
import CartItem from '../../components/tienda/cart/CartItem';
import CartSummary from '../../components/tienda/cart/CartSummary';
import EmptyCart from '../../components/tienda/cart/EmptyCart';
import { orderCreationService } from '../../utils/tienda/orderCreationService';
import carritoImage from '../../assets/tienda/carrito.png';

const Carrito = () => {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const navigate = useNavigate();

  const loadCart = () => {
    try {
      const items = cartService.getCart();
      if (items && items.length > 0) {
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      setCartItems([]);
    }
  };

  const syncStock = async () => {
    try {
      setSyncLoading(true);
      await cartService.syncLocalStockWithDB();
      loadCart();
    } catch (error) {
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    syncStock();
    
    const handleCartUpdate = () => {
      loadCart();
    };
    
    const handleAuthChange = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      loadCart();
    };

    const handleStockUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('stockUpdated', handleStockUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, []);

  const handleUpdateQuantity = async (productCode, newQuantity) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.updateQuantity(productCode, newQuantity);
      setCartItems(updatedCart);
    } catch (error) {
      alert(error.message);
      loadCart();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (productCode) => {
    try {
      const updatedCart = cartService.removeItem(productCode);
      setCartItems(updatedCart);
    } catch (error) {
      alert('Error al eliminar producto: ' + error.message);
    }
  };

  const handleClearCartClick = () => {
    setShowClearCartModal(true);
  };

  const confirmClearCart = () => {
    cartService.clearCart();
    setCartItems([]);
    setShowClearCartModal(false);
  };

 const handleCheckout = async (totalFinal, discountCode = '', paymentData = null) => {
  if (!user) {
    navigate('/login');
    return;
  }

  try {
    if (cartItems.length === 0) {
      throw new Error('El carrito está vacío');
    }

    for (const item of cartItems) {
      const stockDisponible = await cartService.checkAvailableStock(item.codigo, item.cantidad);
      if (!stockDisponible) {
        throw new Error(`Stock insuficiente para: ${item.nombre}. Por favor, actualiza las cantidades.`);
      }
    }

    const resultadoCompra = await orderCreationService.processCompletePurchase(
      user, 
      cartItems,
      totalFinal, 
      discountCode, 
      paymentData
    );

    if (!resultadoCompra.success) {
      throw new Error(resultadoCompra.error);
    }

    const ordenCreada = resultadoCompra.order;

    cartService.clearCart();
    setCartItems([]);

    alert('¡Pago exitoso! Tu compra ha sido procesada correctamente.\n\n' +
          `Número de orden: ${ordenCreada.numeroOrden}\n` +
          `Total pagado: $${totalFinal.toLocaleString('es-CL')}\n\n` +
          'Serás redirigido a la página principal...');
    
    setTimeout(() => {
      navigate('/index', { replace: true });
      setTimeout(() => window.scrollTo(0, 0), 100);
    }, 500);

  } catch (error) {
    alert('Error al procesar la compra: ' + error.message);
  }
};

  const total = cartService.calculateTotal(cartItems);

  if (cartItems.length === 0) {
    return (
      <div 
        className="min-vh-100 w-100"
        style={{
          backgroundImage: 'url("src/assets/tienda/fondostardew.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          fontFamily: "'Lato', sans-serif"
        }}
      >
        <div style={{ height: '80px' }}></div>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div 
      className="min-vh-100 w-100"
      style={{
        backgroundImage: 'url("https://images3.alphacoders.com/126/1269904.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Lato', sans-serif"
      }}
    >
      <div style={{ height: '80px' }}></div>
      
      <Container className="py-4">
        {showAlert && (
          <Alert 
            variant="success" 
            className="text-center rounded-4 border-3 border-dark shadow"
            style={{
              backgroundColor: '#87CEEB',
              color: '#000000',
              fontWeight: '600',
              fontFamily: "'Lato', sans-serif"
            }}
          >
            ¡Compra realizada con éxito! Redirigiendo a tus pedidos...
          </Alert>
        )}
        
        <Row className="mb-4">
          <Col>
            <div className="text-center">
              <div className="mb-3">
                <img
                  src={carritoImage}
                  alt="Mi Carrito de Compras"
                  className="img-fluid"
                  style={{
                    maxWidth: '600px',
                    width: '100%',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.8))'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallbackElement = document.getElementById('fallback-title');
                    if (fallbackElement) {
                      fallbackElement.style.display = 'block';
                    }
                  }}
                />
              </div>
              
              <h1 
                id="fallback-title"
                className="text-center mb-3"
                style={{
                  fontFamily: "'Indie Flower', cursive",
                  color: '#000000',
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8)',
                  display: 'none'
                }}
              >
                Mi Carrito de Compras
              </h1>
              
              <p 
                className="text-center fs-5"
                style={{
                  color: '#000000',
                  fontWeight: '500',
                  textShadow: '1px 1px 2px rgba(255, 255, 255, 0.7)',
                  fontFamily: "'Lato', sans-serif"
                }}
              >
                Revisa y modifica los productos en tu carrito
              </p>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <div 
              className="rounded-4 p-4 shadow-lg border-3 border-dark"
              style={{
                backgroundColor: '#87CEEB',
                fontFamily: "'Lato', sans-serif"
              }}
            >
              {loading && (
                <div className="text-center mb-3">
                  <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Actualizando carrito...</p>
                </div>
              )}
              
              {cartItems.map(item => (
                <CartItem 
                  key={item.codigo}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  disabled={loading}
                />
              ))}
              
              <Row className="mt-4">
                <Col>
                  <div className="d-flex justify-content-between">
                    <Button 
                      as={Link} 
                      to="/productos" 
                      variant="outline-dark" 
                      className="rounded-pill px-4 py-2 fw-bold border-3"
                      style={{
                        backgroundColor: '#dedd8ff5',
                        color: '#000000',
                        transition: 'all 0.3s ease',
                        fontFamily: "'Lato', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(222, 221, 143, 0.6)';
                        e.target.style.backgroundColor = '#FFD700';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.backgroundColor = '#dedd8ff5';
                      }}
                    >
                      ← Seguir Comprando
                    </Button>
                    
                    <Button 
                      variant="outline-danger" 
                      className="rounded-pill px-4 py-2 fw-bold border-3"
                      style={{
                        backgroundColor: '#dedd8ff5',
                        color: '#000000',
                        borderColor: '#dc3545',
                        transition: 'all 0.3s ease',
                        fontFamily: "'Lato', sans-serif"
                      }}
                      onClick={handleClearCartClick}
                      disabled={loading}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                          e.target.style.backgroundColor = '#FFD700';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.backgroundColor = '#dedd8ff5';
                        }
                      }}
                    >
                      Vaciar Carrito
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
          
          <Col lg={4}>
            <CartSummary 
              cartItems={cartItems}
              total={total}
              onCheckout={handleCheckout}
              user={user}
              disabled={loading}
            />
          </Col>
        </Row>
      </Container>

      <Modal
        show={showClearCartModal}
        onHide={() => setShowClearCartModal(false)}
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
              Vaciar Carrito
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
              <div 
                className="display-1"
                style={{ color: '#000000' }}
              >
                🛒
              </div>
            </div>
            <h5 
              className="fw-bold mb-3"
              style={{ 
                color: '#000000',
              }}
            >
              ¿Estás seguro de que quieres vaciar el carrito?
            </h5>
            <p 
              className="mb-3 fw-semibold"
              style={{ 
                color: '#000000',
                fontSize: '1.1rem'
              }}
            >
              Se eliminarán {cartItems.reduce((sum, item) => sum + item.cantidad, 0)} productos
            </p>
            <p 
              className="fw-semibold text-danger"
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
            onClick={() => setShowClearCartModal(false)}
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
            onClick={confirmClearCart}
            className="rounded-pill px-4 py-2 border-3 border-dark fw-bold"
            style={{
              background: 'linear-gradient(135deg, #dc3545, #c82333)',
              color: '#FFFFFF',
              border: 'none'
            }}
          >
            Sí, Vaciar Carrito
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Carrito;