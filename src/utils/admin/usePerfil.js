import { useState, useEffect } from 'react';
import { authService } from '../tienda/authService';
import { dataService } from '../dataService';
import { usuarioService } from './usuarioService';

export const usePerfil = () => {
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const usuarioActual = authService.getCurrentUser();

      if (usuarioActual) {
        const usuarioCompleto = await usuarioService.getUsuarioByRun(usuarioActual.id);

        if (usuarioCompleto) {
          setUsuario(usuarioCompleto);
          setFormData({
            nombre: usuarioCompleto.nombre || '',
            apellidos: usuarioCompleto.apellidos || '',
            correo: usuarioCompleto.correo || '',
            telefono: usuarioCompleto.telefono || '',
            direccion: usuarioCompleto.direccion || '',
            comuna: usuarioCompleto.comuna || '',
            region: usuarioCompleto.region || '',
            fecha_nacimiento: usuarioCompleto.fecha_nacimiento || '',
            password: '',
            confirmarPassword: ''
          });
        } else {
          setMensaje({ tipo: 'error', texto: 'Usuario no encontrado en la base de datos' });
        }
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al cargar el perfil desde la base de datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan si se está cambiando
    if (formData.password && formData.password !== formData.confirmarPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
      return;
    }

    setGuardando(true);
    try {
      const usuarioActual = authService.getCurrentUser();
      if (!usuarioActual || !usuario) {
        throw new Error('Usuario no autenticado');
      }

      if (formData.correo && formData.correo !== usuario.correo) {
        const emailExistente = await usuarioService.verificarEmailExistente(formData.correo);
        if (emailExistente) {
          throw new Error('Ya existe un usuario con este email');
        }
      }

      // Crear objeto con los datos básicos (sin contraseña por defecto)
      const datosActualizados = {
        run: usuario.run,
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono ? parseInt(formData.telefono.replace(/\s/g, '')) : null,
        direccion: formData.direccion.trim(),
        comuna: formData.comuna || '',
        region: formData.region || '',
        fecha_nacimiento: formData.fecha_nacimiento || '',
        tipo: usuario.tipo
        // NO incluir contrasenha aquí por defecto
      };

      // SOLUCIÓN: Solo enviar contraseña si se está cambiando
      if (formData.password && formData.password.trim()) {
        datosActualizados.contrasenha = await usuarioService.hashPasswordSHA256(formData.password);
      }
      // Si no hay contraseña nueva, NO se envía el campo contrasenha

      console.log('Datos a enviar:', datosActualizados);

      await usuarioService.updateUsuario(usuario.run, datosActualizados);

      const usuarioActualizado = await usuarioService.getUsuarioByRun(usuario.run);
      setUsuario(usuarioActualizado);

      const userData = {
        id: usuarioActualizado.run,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.correo,
        type: usuarioActualizado.tipo,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('auth_user', JSON.stringify(userData));

      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmarPassword: ''
      }));

      setShowModal(false);
      setMensaje({ 
        tipo: 'success', 
        texto: formData.password && formData.password.trim() 
          ? 'Perfil y contraseña actualizados correctamente' 
          : 'Perfil actualizado correctamente' 
      });

      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al actualizar el perfil' 
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async () => {
    if (!usuario) return;

    try {
      const usuarios = await usuarioService.getUsuarios();
      const otrosAdmins = usuarios.filter(u =>
        u.tipo === 'Admin' && u.run !== usuario.run
      );

      if (otrosAdmins.length === 0) {
        setMensaje({
          tipo: 'error',
          texto: 'No se puede eliminar el perfil. Debe haber al menos otro usuario administrador en el sistema.'
        });
        return;
      }

      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar tu perfil?\n\n` +
        `• Nombre: ${usuario.nombre} ${usuario.apellidos}\n` +
        `• RUN: ${usuario.run}\n` +
        `• Email: ${usuario.correo}\n\n` +
        `Esta acción no se puede deshacer.`
      );

      if (!confirmacion) return;

      await usuarioService.deleteUsuario(usuario.run);

      setMensaje({
        tipo: 'success',
        texto: 'Perfil eliminado correctamente. Serás redirigido al login.'
      });

      setTimeout(() => {
        authService.logout();
      }, 2000);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al eliminar el perfil' });
    }
  };

  return {
    usuario,
    formData,
    loading,
    guardando,
    mensaje,
    showModal,
    handleChange,
    handleSubmit,
    handleDelete,
    setMensaje,
    cargarPerfil,
    setShowModal
  };
};