import React from 'react';
import { Card, Badge, Table } from 'react-bootstrap';

const OrderCard = ({ order }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pendiente': return 'warning';
      case 'Enviado': return 'primary';
      case 'Entregado': return 'success';
      case 'Cancelado': return 'danger';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString('es-CL') || '0'}`;
  };

  const getProductImage = (producto) => {
    if (producto.imagen) {
      return producto.imagen;
    }
    
    try {
      const productos = JSON.parse(localStorage.getItem('app_productos') || '[]');
      const productoCompleto = productos.find(p => p.codigo === producto.codigo);
      return productoCompleto?.imagen;
    } catch (error) {
      console.error('Error al buscar imagen del producto:', error);
    }
    
    return `https://via.placeholder.com/50x50/2E8B57/FFFFFF?text=${producto.codigo || 'Prod'}`;
  };

  const getFallbackImage = () => {
    return 'https://via.placeholder.com/50x50/2E8B57/FFFFFF?text=Imagen';
  };

  // Verificar si la orden tiene productos
  const hasProducts = order.productos && order.productos.length > 0;

  return (
    <Card 
      className="mb-4 shadow-lg border-3 border-dark rounded-4"
      style={{
        backgroundColor: '#87CEEB',
        fontFamily: "'Lato', sans-serif",
        overflow: 'hidden'
      }}
    >
      <Card.Header 
        className="d-flex justify-content-between align-items-center border-3 border-dark"
        style={{
          backgroundColor: '#dedd8ff5',
          fontFamily: "'Lato', sans-serif"
        }}
      >
        <div>
          <strong style={{ color: '#000000', fontSize: '1.2rem' }}>
            Orden #{order.numeroOrden}
          </strong>
          <small 
            className="ms-2"
            style={{ 
              color: '#000000',
              fontWeight: '500'
            }}
          >
            {order.fecha}
          </small>
        </div>
        <Badge 
          bg={getStatusVariant(order.estadoEnvio)}
          className="px-3 py-2"
          style={{ 
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          {order.estadoEnvio?.toUpperCase() || 'PENDIENTE'}
        </Badge>
      </Card.Header>
      
      <Card.Body className="p-0" style={{ backgroundColor: '#87CEEB' }}>
        {hasProducts ? (
          <>
            <Table 
              responsive 
              className="mb-0 rounded"
              style={{
                backgroundColor: '#87CEEB',
                margin: '0'
              }}
            >
              <thead>
                <tr>
                  <th style={{ 
                    color: '#000000', 
                    fontWeight: '600',
                    backgroundColor: '#87CEEB',
                    borderBottom: '2px solid #000000',
                    padding: '1rem'
                  }}>
                    Producto
                  </th>
                  <th style={{ 
                    color: '#000000', 
                    fontWeight: '600',
                    backgroundColor: '#87CEEB',
                    borderBottom: '2px solid #000000',
                    padding: '1rem'
                  }}>
                    Cantidad
                  </th>
                  <th style={{ 
                    color: '#000000', 
                    fontWeight: '600',
                    backgroundColor: '#87CEEB',
                    borderBottom: '2px solid #000000',
                    padding: '1rem'
                  }}>
                    Precio Unitario
                  </th>
                  <th style={{ 
                    color: '#000000', 
                    fontWeight: '600',
                    backgroundColor: '#87CEEB',
                    borderBottom: '2px solid #000000',
                    padding: '1rem'
                  }}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.productos.map((item, index) => (
                  <tr key={`${item.codigo}-${index}`}>
                    <td style={{ 
                      padding: '1rem',
                      backgroundColor: '#87CEEB',
                      borderBottom: index === order.productos.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.2)'
                    }}>
                      <div className="d-flex align-items-center">
                        <img 
                          src={getProductImage(item)}
                          alt={item.nombre}
                          className="me-3"
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '2px solid #000000'
                          }}
                          onError={(e) => {
                            e.target.src = getFallbackImage();
                          }}
                        />
                        <div>
                          <div 
                            className="fw-bold"
                            style={{ color: '#000000' }}
                          >
                            {item.nombre || 'Producto sin nombre'}
                          </div>
                          <small 
                            className="text-muted"
                            style={{ color: '#000000' }}
                          >
                            Código: {item.codigo || 'N/A'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td style={{ 
                      color: '#000000', 
                      fontWeight: '500',
                      padding: '1rem',
                      backgroundColor: '#87CEEB',
                      borderBottom: index === order.productos.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.2)'
                    }}>
                      {item.cantidad || 0}
                    </td>
                    <td style={{ 
                      color: '#000000', 
                      fontWeight: '500',
                      padding: '1rem',
                      backgroundColor: '#87CEEB',
                      borderBottom: index === order.productos.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.2)'
                    }}>
                      {formatCurrency(item.precio)}
                    </td>
                    <td style={{ 
                      color: '#000000', 
                      fontWeight: '500',
                      padding: '1rem',
                      backgroundColor: '#87CEEB',
                      borderBottom: index === order.productos.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.2)'
                    }}>
                      {formatCurrency((item.precio || 0) * (item.cantidad || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            <div 
              className="d-flex justify-content-end align-items-center py-3 border-top border-dark px-3"
              style={{
                backgroundColor: '#dedd8ff5'
              }}
            >
              <div>
                <strong style={{ 
                  color: '#000000', 
                  fontSize: '1.3rem',
                  textAlign: 'right'
                }}>
                  Total: {formatCurrency(order.total)}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="text-center py-4 px-3" style={{ backgroundColor: '#87CEEB' }}>
              <div 
                className="mb-2"
                style={{ fontSize: '2rem', color: '#000000' }}
              >
                ⚠️
              </div>
              <p 
                className="mb-0"
                style={{ color: '#000000', fontWeight: '500' }}
              >
                No se pudieron cargar los detalles de los productos
              </p>
              <small style={{ color: '#000000' }}>
                Número de orden: {order.numeroOrden}
              </small>
            </div>
            <div 
              className="d-flex justify-content-end align-items-center py-3 border-top border-dark px-3"
              style={{
                backgroundColor: '#dedd8ff5'
              }}
            >
              <div>
                <strong style={{ color: '#000000' }}>
                  Total: {formatCurrency(order.total || 0)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrderCard;