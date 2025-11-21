import React, { useState } from 'react';
import { Card, Button, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { cartService } from '../../../utils/tienda/cartService';
import PaymentConfirmationModal from '../../../components/tienda/PaymentConfirmationModal';
import CreditCardModal from '../../../components/tienda/CreditCardModal';

const CartSummary = ({ cartItems, total, onCheckout, user }) => {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);

  const hasLowStock = cartItems.some(item => {
    const stockReal = JSON.parse(localStorage.getItem('app_productos'))?.find(p => p.codigo === item.codigo)?.stock || item.stock;
    return item.cantidad > stockReal;
  });
  
  const isCartEmpty = cartItems.length === 0;

  const envio = cartService.calculateShipping(total);
  const hasDuocDiscount = cartService.hasDuocDiscount(user);
  const duocDiscount = hasDuocDiscount ? cartService.calculateDuocDiscount(total) : 0;
  const subtotal = total;
  const codeDiscount = appliedDiscount ? cartService.calculateDiscount(subtotal, appliedDiscount.code) : 0;
  const totalFinal = cartService.calculateFinalTotal(subtotal, envio, duocDiscount, appliedDiscount?.code);

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError('Por favor ingresa un código de descuento');
      return;
    }

    const discountInfo = cartService.validateDiscountCode(discountCode);
    if (discountInfo) {
      setAppliedDiscount({
        code: discountCode,
        info: discountInfo
      });
      setDiscountError('');
    } else {
      setDiscountError('Código de descuento inválido');
      setAppliedDiscount(null);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handleContinueToPayment = () => {
    setShowPaymentModal(false);
    setShowCreditCardModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowCreditCardModal(false);
    
    if (typeof onCheckout === 'function') {
      onCheckout(totalFinal, appliedDiscount?.code, paymentData);
    } else {
      alert('Error: No se pudo procesar el pago. Intenta nuevamente.');
    }
  };

  return (
    <>
      <Card 
        className="shadow-lg border-3 border-dark rounded-4"
        style={{
          backgroundColor: '#87CEEB',
          fontFamily: "'Lato', sans-serif"
        }}
      >
        <Card.Header 
          className="border-3 border-dark rounded-top-4"
          style={{
            background: 'linear-gradient(135deg, #87CEEB, #5F9EA0)',
          }}
        >
          <h5 
            className="mb-0 text-center fw-bold"
            style={{
              fontFamily: "'Indie Flower', cursive",
              color: '#000000',
              fontSize: '1.5rem',
            }}
          >
            Resumen del Pedido
          </h5>
        </Card.Header>
        
        <Card.Body>
          {hasLowStock && (
            <Alert 
              variant="warning" 
              className="small border-3 border-dark rounded-3"
              style={{
                backgroundColor: '#dedd8ff5',
                color: '#000000',
                fontWeight: '600'
              }}
            >
              Algunos productos tienen stock limitado
            </Alert>
          )}

          {hasDuocDiscount && (
            <Alert 
              variant="info" 
              className="small border-3 border-dark rounded-3"
              style={{
                backgroundColor: '#90EE90',
                color: '#000000',
                fontWeight: '600'
              }}
            >
              ¡Descuento DUOC activado! 20% de descuento adicional
            </Alert>
          )}
          
          <div className="mb-3">
            <label 
              className="form-label fw-bold mb-2"
              style={{ color: '#000000' }}
            >
              Código de Descuento
            </label>
            {!appliedDiscount ? (
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Ingresa código ej: SV2500"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="border-3 border-dark fw-bold"
                  style={{ 
                    color: '#000000',
                    backgroundColor: '#FFFFFF'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyDiscount();
                    }
                  }}
                />
                <Button 
                  variant="outline-dark"
                  className="border-3 border-dark fw-bold"
                  style={{
                    backgroundColor: '#dedd8ff5',
                    color: '#000000'
                  }}
                  onClick={handleApplyDiscount}
                >
                  Aplicar
                </Button>
              </InputGroup>
            ) : (
              <div className="d-flex justify-content-between align-items-center p-2 rounded-3 border-3 border-success"
                style={{
                  backgroundColor: '#90EE90',
                  color: '#000000'
                }}
              >
                <div>
                  <Badge bg="success" className="me-2 border-2 border-dark" style={{ backgroundColor: '#28a745', color: '#FFFFFF' }}>
                    ✅
                  </Badge>
                  <span className="fw-bold">{appliedDiscount.code}</span> - {appliedDiscount.info.description}
                </div>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  className="border-2 border-dark"
                  style={{
                    backgroundColor: '#dedd8ff5',
                    color: '#000000'
                  }}
                  onClick={handleRemoveDiscount}
                >
                  ✕
                </Button>
              </div>
            )}
            {discountError && (
              <div 
                className="text-danger small mt-1 fw-bold"
                style={{ color: '#dc3545' }}
              >
                {discountError}
              </div>
            )}
          </div>

          <div 
            className="d-flex justify-content-between mb-2 fw-semibold"
            style={{ color: '#000000' }}
          >
            <span>Productos ({cartItems.reduce((sum, item) => sum + item.cantidad, 0)})</span>
            <span style={{ color: '#000000' }}>${subtotal.toLocaleString('es-CL')}</span>
          </div>

          {hasDuocDiscount && (
            <div 
              className="d-flex justify-content-between mb-2 fw-semibold"
              style={{ color: '#000000' }}
            >
              <span>
                Descuento DUOC 20% 
                <Badge bg="success" className="ms-2 border-2 border-dark" style={{ backgroundColor: '#90EE90', color: '#000000' }}>
                  🎓
                </Badge>
              </span>
              <span style={{ color: '#FF6B6B' }}>-${duocDiscount.toLocaleString('es-CL')}</span>
            </div>
          )}

          {appliedDiscount && (
            <div 
              className="d-flex justify-content-between mb-2 fw-semibold"
              style={{ color: '#000000' }}
            >
              <span>
                Descuento {appliedDiscount.code}
                <Badge bg="info" className="ms-2 border-2 border-dark" style={{ backgroundColor: '#87CEEB', color: '#000000' }}>
                  💰
                </Badge>
              </span>
              <span style={{ color: '#FF6B6B' }}>-${codeDiscount.toLocaleString('es-CL')}</span>
            </div>
          )}
          
          <div 
            className="d-flex justify-content-between mb-2 fw-semibold"
            style={{ color: '#000000' }}
          >
            <span>
              Envío
              {envio === 0 ? (
                <Badge bg="success" className="ms-2 border-2 border-dark" style={{ backgroundColor: '#90EE90', color: '#000000' }}>
                  Gratis
                </Badge>
              ) : (
                <Badge bg="secondary" className="ms-2 border-2 border-dark" style={{ backgroundColor: '#dedd8ff5', color: '#000000' }}>
                  ${envio.toLocaleString('es-CL')}
                </Badge>
              )}
            </span>
            <span className={envio === 0 ? "fw-bold text-success" : "fw-bold"} style={{ color: envio === 0 ? '#000000' : '#000000' }}>
              {envio === 0 ? 'Gratis' : `$${envio.toLocaleString('es-CL')}`}
            </span>
          </div>

          {total < 30000 && (
            <div 
              className="small mb-3 p-2 rounded-3 border-2 border-dark text-center"
              style={{
                backgroundColor: '#dedd8ff5',
                color: '#000000',
                fontWeight: '500'
              }}
            >
              Agrega ${(30000 - total).toLocaleString('es-CL')} más para envío gratis
            </div>
          )}
          
          <hr style={{ borderColor: '#000000', opacity: '0.6', borderWidth: '2px' }} />
          
          <div 
            className="d-flex justify-content-between mb-3 fw-bold"
            style={{ fontSize: '1.2rem', color: '#000000' }}
          >
            <strong>Total Final</strong>
            <strong style={{ color: '#000000', fontSize: '1.4rem' }}>
              ${totalFinal.toLocaleString('es-CL')}
            </strong>
          </div>

          {(hasDuocDiscount || envio === 0 || appliedDiscount) && (
            <div 
              className="text-center p-2 rounded-3 border-2 border-dark mb-3"
              style={{
                backgroundColor: '#90EE90',
                color: '#000000',
                fontWeight: '600'
              }}
            >
              Total ahorrado: 
              ${(duocDiscount + codeDiscount + (envio === 0 ? 3990 : 0)).toLocaleString('es-CL')}
            </div>
          )}
          
          {!user ? (
            <Alert 
              variant="info" 
              className="small border-3 border-dark rounded-3"
              style={{
                backgroundColor: '#dedd8ff5',
                color: '#000000',
                fontWeight: '600'
              }}
            >
              Inicia sesión para proceder con la compra
            </Alert>
          ) : null}
          
          <div className="d-grid gap-2">
            <Button
              variant="success"
              size="lg"
              className="border-3 border-dark rounded-pill fw-bold py-3"
              style={{
                background: '#dedd8ff5',
                color: '#000000',
                transition: 'all 0.3s ease'
              }}
              onClick={handleOpenPaymentModal}
              disabled={isCartEmpty || !user || hasLowStock}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(222, 221, 143, 0.6)';
                  e.currentTarget.style.backgroundColor = '#FFD700';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#dedd8ff5';
              }}
            >
              {!user ? 'Inicia Sesión para Comprar' : 
               hasLowStock ? 'Revisa el Stock' : 
               `Finalizar Compra - $${totalFinal.toLocaleString('es-CL')}`}
            </Button>
            
            {isCartEmpty && (
              <Button 
                as={Link} 
                to="/productos" 
                variant="outline-dark" 
                className="rounded-pill fw-bold py-2 border-3"
                style={{
                  backgroundColor: '#dedd8ff5',
                  color: '#000000',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(222, 221, 143, 0.6)';
                  e.currentTarget.style.backgroundColor = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#dedd8ff5';
                }}
              >
                Seguir Comprando
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      <PaymentConfirmationModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        onContinue={handleContinueToPayment}
        totalFinal={totalFinal}
      />

      <CreditCardModal
        show={showCreditCardModal}
        onHide={() => setShowCreditCardModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        totalFinal={totalFinal}
        discountCode={appliedDiscount?.code}
      />
    </>
  );
};

export default CartSummary;