import { useState, useEffect } from 'react';
import { dataService } from '../dataService';

const guardarCategoria = (nuevaCategoria) => {
  const categoriasGuardadas = localStorage.getItem('admin_categorias');
  let categoriasPersonalizadas = [];

  if (categoriasGuardadas) {
    categoriasPersonalizadas = JSON.parse(categoriasGuardadas);
  }

  if (!categoriasPersonalizadas.includes(nuevaCategoria)) {
    categoriasPersonalizadas.push(nuevaCategoria);
    localStorage.setItem('admin_categorias', JSON.stringify(categoriasPersonalizadas));
    return true;
  }

  return false;
};

const normalizarProductos = (productosBD) => {
  if (!Array.isArray(productosBD)) return [];

  return productosBD.map(producto => {
    const stockActual = producto.stockActual || producto.stock || producto.stock_actual || 0;
    const stockCritico = producto.stockCritico || producto.stock_critico || 5;

    let categoriaNombre = 'Sin categoría';
    if (producto.categoria) {
      if (typeof producto.categoria === 'object') {
        categoriaNombre = producto.categoria.nombre || 'Sin categoría';
      } else {
        categoriaNombre = producto.categoria;
      }
    }

    return {
      codigo: producto.codigo || producto.codigo_producto || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      categoria: categoriaNombre,
      precio: producto.precio || 0,
      stockActual: stockActual,
      stockCritico: stockCritico,
      imagen: producto.imagen || '',
      stock: stockActual,
      stock_critico: stockCritico,
      categoriaObj: producto.categoria
    };
  });
};

const codigoExiste = (codigo, productos) => {
  return productos.some(producto => producto.codigo === codigo);
};

const generarPrefijoUnico = (categoria, productos) => {
  let prefijoBase = categoria.substring(0, 2).toUpperCase();
  let prefijo = prefijoBase;

  const prefijoExiste = productos.some(producto =>
    producto.codigo.startsWith(prefijoBase)
  );

  if (!prefijoExiste) {
    return prefijoBase;
  }

  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  if (categoria.length >= 3) {
    prefijo = (categoria.substring(0, 1) + categoria.substring(2, 3)).toUpperCase();
    const prefijoAlternativoExiste = productos.some(producto =>
      producto.codigo.startsWith(prefijo)
    );
    if (!prefijoAlternativoExiste) {
      return prefijo;
    }
  }

  for (let i = 0; i < letras.length; i++) {
    for (let j = 0; j < letras.length; j++) {
      const prefijoTest = prefijoBase[0] + letras[j];
      const prefijoTestExiste = productos.some(producto =>
        producto.codigo.startsWith(prefijoTest)
      );
      if (!prefijoTestExiste) {
        return prefijoTest;
      }
    }

    const prefijoTest2 = prefijoBase[1] + letras[i];
    const prefijoTest2Existe = productos.some(producto =>
      producto.codigo.startsWith(prefijoTest2)
    );
    if (!prefijoTest2Existe) {
      return prefijoTest2;
    }
  }

  return prefijoBase + 'X';
};

const generarCodigo = (categoria, productos) => {
  const prefijos = {
    'Accesorios': 'AC',
    'Decoración': 'DE',
    'Guías': 'GU',
    'Juego De Mesa': 'JM',
    'Mods Digitales': 'MD',
    'Peluches': 'PE',
    'Polera Personalizada': 'PP'
  };

  let prefijo;

  if (prefijos[categoria]) {
    prefijo = prefijos[categoria];
  } else {
    prefijo = generarPrefijoUnico(categoria, productos);
  }

  const productosCategoria = productos.filter(p => p.codigo.startsWith(prefijo));

  if (productosCategoria.length === 0) {
    const codigoPropuesto = `${prefijo}001`;

    if (!codigoExiste(codigoPropuesto, productos)) {
      return codigoPropuesto;
    }
  }

  let ultimoNumero = 0;
  productosCategoria.forEach(p => {
    const numeroStr = p.codigo.replace(prefijo, '');
    const numero = parseInt(numeroStr);
    if (!isNaN(numero) && numero > ultimoNumero) {
      ultimoNumero = numero;
    }
  });

  let nuevoNumero = ultimoNumero + 1;
  let codigoPropuesto = `${prefijo}${nuevoNumero.toString().padStart(3, '0')}`;

  let intentos = 0;
  while (codigoExiste(codigoPropuesto, productos) && intentos < 100) {
    nuevoNumero++;
    codigoPropuesto = `${prefijo}${nuevoNumero.toString().padStart(3, '0')}`;
    intentos++;
  }

  if (codigoExiste(codigoPropuesto, productos)) {
    const timestamp = Date.now().toString().slice(-6);
    codigoPropuesto = `${prefijo}${timestamp}`;
  }

  return codigoPropuesto;
};

export const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriasCompletas, setCategoriasCompletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProducto, setEditingProducto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [filtros, setFiltros] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    estadoStock: '',
    precioMin: '',
    precioMax: '',
    stockMin: '',
    ordenarPor: 'nombre'
  });

  useEffect(() => {
    loadProductos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [productos, filtros]);

  const loadProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productosResponse, categoriasResponse] = await Promise.all([
        dataService.getProductos(),
        dataService.getCategorias()
      ]);

      const productosNormalizados = normalizarProductos(productosResponse);

      setProductos(productosNormalizados);

      if (categoriasResponse && Array.isArray(categoriasResponse)) {
        const nombresCategorias = categoriasResponse.map(cat => cat.nombre);
        setCategorias(nombresCategorias);
        setCategoriasCompletas(categoriasResponse);
      } else {
        const categoriasGuardadas = localStorage.getItem('admin_categorias');
        const categoriasBase = [
          'Accesorios',
          'Decoración',
          'Guías',
          'Juego De Mesa',
          'Mods Digitales',
          'Peluches',
          'Polera Personalizada'
        ];

        if (categoriasGuardadas) {
          const categoriasPersonalizadas = JSON.parse(categoriasGuardadas);
          setCategorias([...new Set([...categoriasBase, ...categoriasPersonalizadas])]);
        } else {
          setCategorias(categoriasBase);
        }
      }

    } catch (error) {
      setError(`Error al cargar productos: ${error.message}`);
      setProductos([]);
      setCategorias([]);
      setCategoriasCompletas([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerCategoriaPorNombre = async (nombreCategoria) => {
    try {
      const categoriaExistente = categoriasCompletas.find(cat => cat.nombre === nombreCategoria);

      if (categoriaExistente) {
        return categoriaExistente;
      }

      const nuevaCategoria = await dataService.addCategoria({
        nombre: nombreCategoria
      });

      if (nuevaCategoria) {
        setCategoriasCompletas(prev => [...prev, nuevaCategoria]);
        setCategorias(prev => [...prev, nombreCategoria]);
        return nuevaCategoria;
      }

      return { nombre: nombreCategoria };
    } catch (error) {
      return { nombre: nombreCategoria };
    }
  };

  const prepararProductoParaBackend = async (productoData, esEdicion = false, codigoOriginal = null) => {
    const categoriaObj = await obtenerCategoriaPorNombre(productoData.categoria);

    const productoParaBackend = {
      codigo: esEdicion ? codigoOriginal : productoData.codigo,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      categoria: categoriaObj,
      precio: parseFloat(productoData.precio),
      stockActual: parseInt(productoData.stock),
      stockCritico: parseInt(productoData.stock_critico),
      imagen: productoData.imagen || ''
    };

    return productoParaBackend;
  };

  const guardarCategoriaEnBD = async (nuevaCategoria) => {
    try {
      const categoriaCreada = await dataService.addCategoria({
        nombre: nuevaCategoria
      });

      if (categoriaCreada) {
        setCategorias(prev => [...new Set([...prev, nuevaCategoria])]);
        setCategoriasCompletas(prev => [...prev, categoriaCreada]);
        return true;
      }

      return guardarCategoria(nuevaCategoria);

    } catch (error) {
      return guardarCategoria(nuevaCategoria);
    }
  };

  const aplicarFiltros = () => {
    if (!Array.isArray(productos)) {
      setProductosFiltrados([]);
      return;
    }

    let productosFiltrados = [...productos];

    if (filtros.codigo) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.codigo && p.codigo.toLowerCase().includes(filtros.codigo.toLowerCase())
      );
    }

    if (filtros.nombre) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.nombre && p.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
      );
    }

    if (filtros.categoria) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.categoria === filtros.categoria
      );
    }

    if (filtros.estadoStock) {
      switch (filtros.estadoStock) {
        case 'sin-stock':
          productosFiltrados = productosFiltrados.filter(p => p.stock === 0);
          break;
        case 'critico':
          productosFiltrados = productosFiltrados.filter(p =>
            p.stock > 0 && p.stock <= p.stock_critico
          );
          break;
        case 'normal':
          productosFiltrados = productosFiltrados.filter(p =>
            p.stock > p.stock_critico
          );
          break;
      }
    }

    if (filtros.precioMin) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.precio >= parseFloat(filtros.precioMin)
      );
    }

    if (filtros.precioMax) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.precio <= parseFloat(filtros.precioMax)
      );
    }

    if (filtros.stockMin) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.stock >= parseInt(filtros.stockMin)
      );
    }

    productosFiltrados = ordenarProductos(productosFiltrados, filtros.ordenarPor);

    setProductosFiltrados(productosFiltrados);
  };

  const ordenarProductos = (productos, criterio) => {
    if (!Array.isArray(productos)) return [];

    const productosOrdenados = [...productos];

    switch (criterio) {
      case 'nombre':
        return productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'nombre-desc':
        return productosOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
      case 'precio-asc':
        return productosOrdenados.sort((a, b) => a.precio - b.precio);
      case 'precio-desc':
        return productosOrdenados.sort((a, b) => b.precio - a.precio);
      case 'stock-asc':
        return productosOrdenados.sort((a, b) => a.stock - b.stock);
      case 'stock-desc':
        return productosOrdenados.sort((a, b) => b.stock - a.stock);
      case 'codigo':
        return productosOrdenados.sort((a, b) => a.codigo.localeCompare(b.codigo));
      default:
        return productosOrdenados;
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      codigo: '',
      nombre: '',
      categoria: '',
      estadoStock: '',
      precioMin: '',
      precioMax: '',
      stockMin: '',
      ordenarPor: 'nombre'
    });
  };

  const clearSuccessMessage = () => {
    setShowSuccessMessage(false);
    setSuccessMessage('');
  };

  const handleCreate = async (productoData) => {
    try {
      if (productoData.esNuevaCategoria && productoData.nuevaCategoria) {
        await guardarCategoriaEnBD(productoData.nuevaCategoria);
        productoData.categoria = productoData.nuevaCategoria;
      }

      productoData.codigo = generarCodigo(productoData.categoria, productos);

      if (codigoExiste(productoData.codigo, productos)) {
        const timestamp = Date.now().toString().slice(-6);
        productoData.codigo = `${productoData.codigo.substring(0, 2)}${timestamp}`;
      }

      const productoParaBackend = await prepararProductoParaBackend(productoData, false);
      await dataService.addProducto(productoParaBackend);

      await loadProductos();
      setShowModal(false);

      setSuccessMessage('Producto agregado con éxito');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleUpdate = async (codigo, productoData) => {
    try {
      if (productoData.esNuevaCategoria && productoData.nuevaCategoria) {
        await guardarCategoriaEnBD(productoData.nuevaCategoria);
        productoData.categoria = productoData.nuevaCategoria;
      }

      const productoParaBackend = await prepararProductoParaBackend(productoData, true, codigo);
      await dataService.updateProducto(productoParaBackend);

      await loadProductos();
      setShowModal(false);
      setEditingProducto(null);

      setSuccessMessage('Producto actualizado con éxito');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleDelete = async (codigo) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await dataService.deleteProducto(codigo);
        await loadProductos();
        
        // Agregar mensaje de éxito
        setSuccessMessage('Producto eliminado con éxito');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
      } catch (error) {
        alert(`Error al eliminar producto: ${error.message}`);
      }
    }
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setEditingProducto(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProducto(null);
  };

  const getCodigoAutomatico = (categoria) => {
    return generarCodigo(categoria, productos);
  };

  const actualizarCategorias = () => {
    loadProductos();
  };

  return {
    productos,
    productosFiltrados,
    categorias,
    loading,
    error,
    editingProducto,
    showModal,
    filtros,
    successMessage,
    showSuccessMessage,
    clearSuccessMessage,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleEdit,
    handleCreateNew,
    handleCloseModal,
    getCodigoAutomatico,
    actualizarCategorias,
    refreshData: loadProductos,
    handleFiltroChange,
    handleLimpiarFiltros
  };
};