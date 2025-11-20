import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { orderService } from '../../utils/tienda/orderService';
import { authService } from '../../utils/tienda/authService';
import { Link } from 'react-router-dom';
import PedidosHeader from '../../components/tienda/PedidosHeader';
import EmptyOrders from '../../components/tienda/EmptyOrders';
import OrderCard from '../../components/tienda/OrderCard';

const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const loadUserOrders = async () => {
      console.log('=== INICIANDO CARGA DE PEDIDOS ===');
      
      const currentUser = authService.getCurrentUser();
      console.log('Usuario actual desde authService:', currentUser);
      setUser(currentUser);
      
      if (!currentUser) {
        console.log('No hay usuario autenticado');
        setLoading(false);
        return;
      }

      const userRun = currentUser.run || currentUser.id;
      console.log('RUN del usuario a buscar:', userRun);

      try {
        // Obtener órdenes del usuario
        const userOrders = await orderService.getUserOrders(userRun);
        console.log('Órdenes encontradas para el usuario:', userOrders);

        if (userOrders.length === 0) {
          setDebugInfo(`No se encontraron órdenes para el usuario ${currentUser.nombre} (RUN: ${userRun}).`);
        } else {
          // Obtener detalles completos para cada orden
          const ordersWithDetails = await Promise.all(
            userOrders.map(async (order) => {
              const orderWithDetails = await orderService.getOrderWithDetails(order.numeroOrden);
              return orderWithDetails || order; // Fallback a la orden básica si hay error
            })
          );

          // Ordenar por fecha (más reciente primero)
          const sortedOrders = ordersWithDetails
            .map(order => ({
              ...order,
              productos: order.productos || [],
              fecha: order.fecha || 'Fecha no disponible'
            }))
            .sort((a, b) => {
              try {
                const dateA = a.fecha.split('/').reverse().join('-');
                const dateB = b.fecha.split('/').reverse().join('-');
                return new Date(dateB) - new Date(dateA);
              } catch (error) {
                return 0;
              }
            });

          setOrders(sortedOrders);
        }
        
      } catch (error) {
        console.error('Error crítico al cargar órdenes:', error);
        setDebugInfo(`Error al cargar órdenes: ${error.message}`);
        setOrders([]);
      }
      
      setLoading(false);
    };

    loadUserOrders();
  }, []);

  if (loading) {
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
        <div className="navbar-spacer"></div>
        <Container className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-white">Cargando tus pedidos...</p>
        </Container>
      </div>
    );
  }

  if (!user) {
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
        <div className="navbar-spacer"></div>
        <Container className="text-center py-5">
          <div 
            className="rounded-4 p-5 mx-auto"
            style={{
              backgroundColor: 'rgba(222, 221, 143, 0.95)',
              border: '3px solid #000000',
              maxWidth: '500px'
            }}
          >
            <h3 className="text-dark mb-3">Debes iniciar sesión para ver tus pedidos</h3>
            <Button as={Link} to="/login" variant="primary" className="mt-3">
              Iniciar Sesión
            </Button>
          </div>
        </Container>
      </div>
    );
  }

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
      <div className="navbar-spacer"></div>
      
      <Container className="py-4">
        <PedidosHeader />
        
        {/* Información de diagnóstico */}
        {debugInfo && (
          <Alert variant="info" className="mb-4">
            <Alert.Heading>Información</Alert.Heading>
            {debugInfo}
          </Alert>
        )}
        
        {orders.length === 0 ? (
          <EmptyOrders user={user} />
        ) : (
          <Row>
            <Col>
              {orders.map(order => (
                <OrderCard 
                  key={order.numeroOrden} 
                  order={order} 
                />
              ))}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Pedidos;