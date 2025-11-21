import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/tienda/ProductCard';
import Filters from '../../components/tienda/Filters';
import { authService } from '../../utils/tienda/authService';
import { cartService } from '../../utils/tienda/cartService';
import { ofertasConfig } from '../../utils/tienda/ofertasData';
import { dataService } from '../../utils/dataService';

const Index = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ofertasCount, setOfertasCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState({});

  const navigate = useNavigate();

  const contarProductosEnOferta = (productos) => {
    return productos.filter(producto => producto.enOferta).length;
  };

  const calcularStockDisponible = (producto, carritoActual) => {
    const itemEnCarrito = carritoActual.find(item => item.codigo === producto.codigo);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    const stockBase = producto.stock || producto.stockActual || 0;
    
    return Math.max(0, stockBase - cantidadEnCarrito);
  };

  const adaptarProductosDesdeBD = (productosBD) => {
    const carritoActual = cartService.getCart();
    
    return productosBD.map(producto => {
      let categoriaNombre = producto.categoria;
      if (typeof producto.categoria === 'object' && producto.categoria !== null) {
        categoriaNombre = producto.categoria.nombre || producto.categoria.name || 'Sin categoría';
      }

      const stock = producto.stock || producto.stockActual || 0;
      const stockCritico = producto.stock_critico || producto.stockCritico || 5;
      const stockDisponible = calcularStockDisponible(producto, carritoActual);

      let imagen = producto.imagen || producto.img || producto.url_imagen;
      if (!imagen) {
        imagen = '/src/assets/placeholder-producto.png';
      }

      return {
        ...producto,
        imagen: imagen,
        categoria: categoriaNombre,
        stock: stock,
        stock_critico: stockCritico,
        stock_disponible: stockDisponible,
        enOferta: false,
        precioOferta: null,
        descuento: 0
      };
    });
  };

  const aplicarOfertasConfiguradas = (productos) => {
    return productos.map(producto => {
      const ofertaConfig = ofertasConfig.find(oferta => 
        oferta.codigo === producto.codigo
      );
      
      if (ofertaConfig) {
        const precioOferta = Math.round(producto.precio * (1 - ofertaConfig.descuento / 100));
        
        return {
          ...producto,
          precioOriginal: producto.precio,
          precioOferta: precioOferta,
          descuento: ofertaConfig.descuento,
          tiempoRestante: ofertaConfig.tiempoRestante,
          exclusivo: ofertaConfig.exclusivo,
          enOferta: true
        };
      }
      
      return producto;
    });
  };

  const loadProductsWithStockAndOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const productosDesdeBD = await dataService.getProductos();
      
      if (!productosDesdeBD || productosDesdeBD.length === 0) {
        const errorMsg = 'No se encontraron productos en la base de datos.';
        setError(errorMsg);
        setProducts([]);
        setFilteredProducts([]);
        return;
      }
      
      const productosAdaptados = adaptarProductosDesdeBD(productosDesdeBD);
      const productosParaMostrar = aplicarOfertasConfiguradas(productosAdaptados);
      
      const productosOferta = contarProductosEnOferta(productosParaMostrar);
      setOfertasCount(productosOferta);
      
      setProducts(productosParaMostrar);
      setFilteredProducts(productosParaMostrar);
      
      try {
        const categoriasBD = await dataService.getCategorias();
        
        const nombresCategorias = categoriasBD.map(cat => {
          if (typeof cat === 'object' && cat !== null) {
            return cat.nombre || cat.name || String(cat);
          }
          return String(cat);
        });
        
        const uniqueCategories = ['all', ...new Set(nombresCategorias)];
        setCategories(uniqueCategories);
      } catch (catError) {
        const categoriasProductos = productosAdaptados.map(product => product.categoria);
        const uniqueCategories = ['all', ...new Set(categoriasProductos)];
        setCategories(uniqueCategories);
      }
      
    } catch (err) {
      setError(`Error al cargar los productos: ${err.message}`);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const actualizarStockProducto = (productoCodigo) => {
    setProducts(prevProducts => {
      const carritoActual = cartService.getCart();
      
      return prevProducts.map(producto => {
        if (producto.codigo === productoCodigo) {
          const stockDisponible = calcularStockDisponible(producto, carritoActual);
          return {
            ...producto,
            stock_disponible: stockDisponible
          };
        }
        return producto;
      });
    });
  };

  const actualizarStockDesdeCarrito = () => {
    setProducts(prevProducts => {
      const carritoActual = cartService.getCart();
      
      return prevProducts.map(producto => {
        const stockDisponible = calcularStockDisponible(producto, carritoActual);
        return {
          ...producto,
          stock_disponible: stockDisponible
        };
      });
    });
  };

  useEffect(() => {
    loadProductsWithStockAndOffers();
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      actualizarStockDesdeCarrito();
    };

    const handleStockUpdate = () => {
      actualizarStockDesdeCarrito();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('stockUpdated', handleStockUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, []);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.categoria === selectedCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessNotification(true);
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
  };

  const handleAddToCart = async (product) => {
    const user = authService.getCurrentUser();
    if (!user) {
      alert('Debes iniciar sesión para agregar productos al carrito');
      navigate('/login');
      return;
    }

    if (isAddingToCart[product.codigo]) {
      return;
    }

    setIsAddingToCart(prev => ({ ...prev, [product.codigo]: true }));

    try {
      const carritoActual = cartService.getCart();
      const productoEnCarrito = carritoActual.find(item => item.codigo === product.codigo);
      const cantidadEnCarrito = productoEnCarrito ? productoEnCarrito.cantidad : 0;
      const stockDisponibleLocal = Math.max(0, product.stock - cantidadEnCarrito);

      if (stockDisponibleLocal <= 0) {
        alert(`No hay stock disponible de ${product.nombre}`);
        return;
      }

      const stockDisponible = await cartService.checkAvailableStock(product.codigo, 1);
      
      if (!stockDisponible) {
        const stockActual = await cartService.getCurrentStock(product.codigo);
        alert(`No hay stock disponible de ${product.nombre}. Stock actual: ${stockActual}`);
        return;
      }

      await cartService.addToCart(product, 1);
      actualizarStockProducto(product.codigo);
      showSuccessMessage(`${product.nombre} agregado al carrito`);

    } catch (error) {
      alert('Error al agregar producto al carrito: ' + error.message);
    } finally {
      setTimeout(() => {
        setIsAddingToCart(prev => ({ ...prev, [product.codigo]: false }));
      }, 1000);
    }
  };

  const handleDetailsClick = (productCode) => {
    navigate(`/producto/${productCode}`);
  };

  const handleGoToOfertas = () => {
    navigate('/ofertas');
  };

  const handleRetry = () => {
    loadProductsWithStockAndOffers();
  };

  const handleEmergencyReset = () => {
    if (confirm('¿Estás seguro de que quieres resetear todos los datos? Esto cargará los datos iniciales.')) {
      try {
        dataService.resetData();
        alert('Datos reseteados. La página se recargará.');
        window.location.reload();
      } catch (error) {
        alert('Error reseteando datos: ' + error.message);
      }
    }
  };

  return (
    <div
      className="min-vh-100 w-100"
      style={{
        backgroundImage: 'url("src/assets/tienda/fondostardew.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        fontFamily: "'Lato', sans-serif"
      }}
    >
      <div style={{ height: '80px' }}></div>

      {showSuccessNotification && (
        <div 
          className="position-fixed top-0 end-0 m-3 p-3 rounded-3 border-3 border-success shadow-lg"
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            zIndex: 9999,
            maxWidth: '300px',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="d-flex align-items-center">
            <span className="me-2">✅</span>
            <strong>{successMessage}</strong>
          </div>
        </div>
      )}

      {loading && (
        <Container className="py-5 text-center">
          <div 
            className="d-flex justify-content-center align-items-center py-5 rounded-4 mx-auto"
            style={{ 
              maxWidth: '500px', 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Spinner animation="border" variant="warning" style={{ width: '3rem', height: '3rem' }} />
            <span className="ms-3 text-dark fs-5 fw-bold">Cargando productos...</span>
          </div>
        </Container>
      )}

      {error && !loading && (
        <Container className="py-4">
          <Alert variant="danger" className="text-center rounded-4">
            <Alert.Heading>
              Error al Cargar Productos
            </Alert.Heading>
            <p className="mb-3">{error}</p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Button variant="outline-danger" onClick={handleRetry}>
                Reintentar Carga
              </Button>
              <Button variant="warning" onClick={handleEmergencyReset}>
                Resetear Datos
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Recargar Página
              </Button>
            </div>
          </Alert>
        </Container>
      )}

      {!loading && !error && (
        <>
          {/* SECCIÓN LOGO JUNIMO SHOP */}
          <section className="py-4 text-center">
            <Container>
              <Row className="justify-content-center">
                <Col lg={8}>
                  <img
                    src="src/assets/tienda/junimoshop.png"
                    alt="Junimo Shop"
                    className="img-fluid"
                    style={{ maxWidth: '800px', width: '100%', marginTop: '2rem' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x300/2E8B57/FFFFFF?text=Junimo+Shop';
                    }}
                  />
                </Col>
              </Row>
            </Container>
          </section>

          {/* SECCIÓN OFERTAS ACTIVAS */}
          {ofertasCount > 0 && (
            <section className="py-3">
              <Container>
                <Row className="justify-content-center">
                  <Col lg={10}>
                    <div 
                      className="rounded-4 p-4 text-center shadow-lg border-3 border-warning"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 193, 7, 0.9))',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <h3 
                        className="fw-bold mb-3 text-white"
                        style={{ 
                          fontFamily: "'Indie Flower', cursive",
                          fontSize: '2.5rem',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        Ofertas Activas
                      </h3>
                      <p className="fs-5 text-white mb-3 fw-semibold">
                        Tenemos <Badge bg="danger" className="fs-4">{ofertasCount}</Badge> productos en oferta con descuentos increíbles
                      </p>
                      <Button 
                        variant="light" 
                        size="lg"
                        className="fw-bold border-3 border-dark rounded-3 px-4"
                        onClick={handleGoToOfertas}
                      >
                        Ver Todas las Ofertas
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Container>
            </section>
          )}

          {/* SECCIÓN TÍTULO PRODUCTOS */}
          <section className="py-3 text-center">
            <Container>
              <Row className="justify-content-center">
                <Col lg={8}>
                  <h1
                    className="fw-bold mb-3"
                    style={{
                      color: 'white',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      fontSize: '2.5rem',
                      fontFamily: "'Indie Flower', cursive"
                    }}
                  >
                    Nuestros Productos
                  </h1>
                  <p className="fs-5" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }} >
                    Descubre la magia de Stardew Valley en nuestra colección exclusiva
                  </p>
                  <Badge 
                    bg="success" 
                    className="fs-6 px-3 py-2 mt-2"
                  >
                    {filteredProducts.length} productos encontrados
                  </Badge>
                  {ofertasCount > 0 && (
                    <Badge bg="danger" className="fs-6 px-3 py-2 mt-2 ms-2">
                      {ofertasCount} en oferta
                    </Badge>
                  )}
                </Col>
              </Row>
            </Container>
          </section>

          {/* SECCIÓN FILTROS Y PRODUCTOS */}
          <section className="py-4">
            <Container>
              <Filters
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredProducts={filteredProducts}
              />

              <Row className="g-4">
                {filteredProducts.map((product) => (
                  <Col key={product.codigo} xl={3} lg={4} md={6}>
                    <ProductCard
                      product={product}
                      handleAddToCart={handleAddToCart}
                      handleDetailsClick={handleDetailsClick}
                      isAddingToCart={isAddingToCart[product.codigo] || false}
                    />
                  </Col>
                ))}

                {filteredProducts.length === 0 && (
                  <Col>
                    <div className="text-center py-5">
                      <div
                        className="rounded-4 p-5 mx-auto"
                        style={{
                          backgroundColor: '#dedd8ff5',
                          border: '3px solid #000000',
                          maxWidth: '500px'
                        }}
                      >
                        <span className="display-1" style={{ opacity: 0.8 }}>
                          🌾
                        </span>
                        <h4
                          className="text-dark mt-3 fw-bold"
                          style={{ fontFamily: "'Indie Flower', cursive" }}
                        >
                          No se encontraron productos
                        </h4>
                        <p className="text-muted mb-4">
                          {searchTerm || selectedCategory !== 'all' 
                            ? 'Prueba con otros términos de búsqueda o categorías' 
                            : 'No hay productos disponibles en este momento'}
                        </p>
                        <Button
                          className="mt-2 fw-bold me-2"
                          onClick={() => {
                            setSelectedCategory('all');
                            setSearchTerm('');
                          }}
                          style={{
                            backgroundColor: '#000000',
                            borderColor: '#000000',
                            color: '#ffffff'
                          }}
                        >
                          Ver Todos los Productos
                        </Button>
                        <Button
                          variant="outline-warning"
                          className="mt-2 fw-bold"
                          onClick={handleRetry}
                        >
                          Reintentar Carga
                        </Button>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Container>
          </section>
        </>
      )}
    </div>
  );
};

export default Index;