// src/components/admin/UsuarioModal.jsx
import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/admin/dashboardUtils';
import { usuarioService } from '../../utils/admin/usuarioService';
import regionesComunasData from '../../data/regiones_comunas.json';

const UsuarioModal = ({ show, usuario, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
    comuna: '',
    region: ''
  });

  const [errors, setErrors] = useState({});
  const [comunasFiltradas, setComunasFiltradas] = useState([]);

  // Estado para el historial de compras
  const [historialCompras, setHistorialCompras] = useState([]);
  const [cargandoCompras, setCargandoCompras] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        apellidos: usuario.apellidos || '',
        correo: usuario.correo || usuario.email || '',
        telefono: usuario.telefono || '',
        direccion: usuario.direccion || '',
        comuna: usuario.comuna || '',
        region: usuario.region || ''
      });

      // Si hay región seleccionada, cargar sus comunas
      if (usuario.region) {
        const regionEncontrada = regionesComunasData.regiones.find(
          r => r.nombre === usuario.region
        );
        if (regionEncontrada) {
          setComunasFiltradas(regionEncontrada.comunas);
        }
      }

      // Cargar historial de compras si el usuario es cliente
      if (usuario.tipo === 'Cliente' && usuario.run) {
        cargarHistorialCompras(usuario.run);
      }
    }
  }, [usuario]);

  // Función para cargar el historial de compras usando usuarioService
  const cargarHistorialCompras = async (run) => {
    try {
      setCargandoCompras(true);
      console.log('Cargando historial de compras para usuario:', run);
      
      // Usar usuarioService para obtener órdenes del usuario
      const ordenesUsuario = await usuarioService.getOrdenesPorUsuario(run);
      console.log('Órdenes obtenidas:', ordenesUsuario);

      // Formatear las órdenes para el historial
      const historialFormateado = ordenesUsuario.map(orden => ({
        id: orden.numeroOrden || `orden-${Date.now()}-${Math.random()}`,
        fecha: orden.fecha || new Date().toLocaleDateString('es-CL'),
        total: orden.total || 0,
        estado: orden.estadoEnvio || 'Pendiente',
        productos: orden.detalles ? orden.detalles.map(detalle => ({
          nombre: detalle.producto ? detalle.producto.nombre : 'Producto no disponible',
          cantidad: detalle.cantidad || 0,
          precio: detalle.producto ? detalle.producto.precio : 0
        })) : [],
        numeroOrden: orden.numeroOrden || 'N/A'
      }));

      console.log('Historial formateado:', historialFormateado);
      setHistorialCompras(historialFormateado);
    } catch (error) {
      console.error('Error cargando historial de compras:', error);
      setHistorialCompras([]);
    } finally {
      setCargandoCompras(false);
    }
  };

  // Resto del código del componente UsuarioModal se mantiene igual...
  // [El resto del código del UsuarioModal que ya tenías permanece igual]
  // Solo se modificó la función cargarHistorialCompras

  // ... [El resto del código del componente UsuarioModal] ...
};

export default UsuarioModal;