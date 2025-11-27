import { useState, useEffect, useCallback } from 'react';
import { usuarioService } from './usuarioService';
import { calcularEstadisticasUsuarios, aplicarFiltrosUsuarios } from './usuarioStats';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUsuario, setCreatingUsuario] = useState(null);
  const [filtros, setFiltros] = useState({
    run: '',
    nombre: '',
    email: '',
    tipo: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState(null);
  const [conexionInfo, setConexionInfo] = useState(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    const filtered = aplicarFiltrosUsuarios(usuarios, filtros);
    setUsuariosFiltrados(filtered);
  }, [usuarios, filtros]);

  const verificarConexion = async () => {
    try {
      const info = await usuarioService.verificarConexion();
      setConexionInfo(info);
    } catch (error) {
      setConexionInfo({
        conectado: false,
        mensaje: 'Error verificando conexión'
      });
    }
  };

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await usuarioService.getUsuarios();
      setUsuarios(data);

    } catch (error) {
      setError(error.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSuccessMessage = () => {
    setShowSuccessMessage(false);
    setSuccessMessage('');
  };

  const clearError = () => {
    setError(null);
  };

  const handleEdit = (usuario) => {
    if (usuario.tipo === 'Admin') {
      alert('No se pueden editar usuarios administradores');
      return;
    }
    
    setEditingUsuario(usuario);
    setShowModal(true);
  };

  const handleUpdateUsuario = async (run, datosActualizados) => {
    try {
      const usuarioOriginal = usuarios.find(u => u.run.toString() === run.toString());
      if (usuarioOriginal && usuarioOriginal.tipo === 'Admin') {
        throw new Error('No se pueden modificar usuarios administradores');
      }

      await usuarioService.updateUsuario(run, datosActualizados);
      await loadUsuarios();

      setSuccessMessage('Usuario actualizado con éxito');
      setShowSuccessMessage(true);
      setShowModal(false);
      setEditingUsuario(null);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (run) => {
    try {
      const usuario = usuarios.find(u => u.run.toString() === run.toString());
      if (usuario && usuario.tipo === 'Admin') {
        throw new Error('No se pueden eliminar usuarios administradores');
      }

      await usuarioService.deleteUsuario(run);
      await loadUsuarios();

      setSuccessMessage('Usuario eliminado con éxito');
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUsuario(null);
  };

  const handleCreate = () => {
    setCreatingUsuario(null);
    setShowCreateModal(true);
  };

  const handleCreateUsuario = async (usuarioData) => {
    try {
      const usuarioExistente = await usuarioService.getUsuarioByRun(usuarioData.run);
      if (usuarioExistente) {
        throw new Error('Ya existe un usuario con este RUN');
      }

      await usuarioService.createUsuario(usuarioData);
      await loadUsuarios();
      setShowCreateModal(false);

      setSuccessMessage('Usuario creado con éxito');
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

    } catch (error) {
      throw error;
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreatingUsuario(null);
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
      run: '',
      nombre: '',
      email: '',
      tipo: ''
    });
  };

  const refreshData = () => {
    loadUsuarios();
    verificarConexion();
  };

  const estadisticas = calcularEstadisticasUsuarios(usuarios);

  return {
    usuarios,
    usuariosFiltrados,
    loading,
    editingUsuario,
    showModal,
    showCreateModal,
    creatingUsuario,
    filtros,
    estadisticas,
    error,
    conexionInfo,
    successMessage,
    showSuccessMessage,
    clearSuccessMessage,
    clearError,
    handleEdit,
    handleUpdateUsuario,
    handleDelete,
    handleCloseModal,
    handleCreate,
    handleCreateUsuario,
    handleCloseCreateModal,
    handleFiltroChange,
    handleLimpiarFiltros,
    refreshData,
    onEdit: handleEdit,
    onUpdate: handleUpdateUsuario,
    onDelete: handleDelete,
    onCloseModal: handleCloseModal,
    onCreate: handleCreate,
    onSave: handleCreateUsuario,
    onCloseCreateModal: handleCloseCreateModal
  };
};