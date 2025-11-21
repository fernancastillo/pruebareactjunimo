// utils/tienda/perfilValidaciones.js
import { dataService } from '../dataService';

export const perfilValidaciones = {
  /**
   * Verifica si un email ya existe en otro usuario (en la BD)
   */
  emailExisteEnOtroUsuario: async (email, usuarioActual) => {
    try {
      // Buscar usuario por correo en la base de datos
      const usuarioConEmail = await dataService.getUsuarioByCorreo(email);
      
      // Si encontramos un usuario y no es el usuario actual
      const emailEnUso = usuarioConEmail && usuarioConEmail.run !== usuarioActual?.run;
      
      return emailEnUso;
    } catch (error) {
      // En caso de error, asumimos que no existe para no bloquear al usuario
      return false;
    }
  },

  /**
   * Valida un email con dominios específicos y verifica duplicados en BD
   */
  validarEmail: async (email, usuarioActual = null) => {
    if (!email || email.trim().length === 0) {
      return 'El email es obligatorio';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Ingresa un email válido';
    }
    
    // Validar dominios permitidos
    const dominiosPermitidos = ['gmail.com', 'duoc.cl', 'profesor.duoc.cl'];
    const dominio = email.split('@')[1];
    
    if (!dominiosPermitidos.includes(dominio)) {
      return 'Solo se permiten emails de @gmail.com, @duoc.cl o @profesor.duoc.cl';
    }
    
    // Verificar si el email ya está en uso por otro usuario en la BD
    try {
      const emailEnUso = await perfilValidaciones.emailExisteEnOtroUsuario(email, usuarioActual);
      if (emailEnUso) {
        return 'Este email ya está registrado por otro usuario';
      }
    } catch (error) {
      return 'Error al verificar disponibilidad del email';
    }
    
    return '';
  },

  /**
   * Valida un nombre o apellido (mínimo 3 caracteres sin espacios)
   */
  validarNombre: (valor) => {
    if (!valor || valor.trim().length === 0) {
      return 'Este campo es obligatorio';
    }
    
    const caracteresSinEspacios = valor.replace(/\s/g, '');
    
    if (caracteresSinEspacios.length < 3) {
      return 'Debe tener al menos 3 caracteres (sin contar espacios)';
    }
    
    if (valor.length > 50) {
      return 'No puede tener más de 50 caracteres';
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(valor)) {
      return 'Solo se permiten letras y espacios';
    }
    
    return '';
  },

  /**
   * Valida un teléfono chileno
   */
  validarTelefono: (telefono) => {
    if (!telefono || telefono.trim().length === 0) {
      return '';
    }
    
    const telefonoLimpio = telefono.replace(/\s/g, '').replace(/[+\-()]/g, '');
    
    if (!/^\d+$/.test(telefonoLimpio)) {
      return 'Solo se permiten números';
    }
    
    if (telefonoLimpio.length !== 9) {
      return 'El teléfono debe tener 9 dígitos';
    }
    
    if (!telefonoLimpio.startsWith('9')) {
      return 'Debe comenzar con 9';
    }
    
    return '';
  },

  /**
   * Valida una dirección (mínimo 5 caracteres sin espacios)
   */
  validarDireccion: (direccion) => {
    if (!direccion || direccion.trim().length === 0) {
      return '';
    }
    
    const caracteresSinEspacios = direccion.replace(/\s/g, '');
    
    if (caracteresSinEspacios.length < 5) {
      return 'La dirección debe tener al menos 5 caracteres (sin contar espacios)';
    }
    
    if (direccion.length > 100) {
      return 'La dirección es muy larga (máximo 100 caracteres)';
    }
    
    return '';
  },

  /**
   * Valida región
   */
  validarRegion: (region) => {
    if (!region || region.trim().length === 0) {
      return 'Debes seleccionar una región';
    }
    return '';
  },

  /**
   * Valida comuna
   */
  validarComuna: (comuna, region) => {
    if (!comuna || comuna.trim().length === 0) {
      return 'Debes seleccionar una comuna';
    }
    
    if (region && !comuna) {
      return 'Debes seleccionar una comuna para la región elegida';
    }
    
    return '';
  },

  /**
   * Valida todo el formulario (versión asíncrona para BD)
   */
  validarFormularioCompleto: async (formData, usuarioActual = null) => {
    const errores = {
      nombre: perfilValidaciones.validarNombre(formData.nombre),
      apellido: perfilValidaciones.validarNombre(formData.apellido),
      email: await perfilValidaciones.validarEmail(formData.email, usuarioActual),
      telefono: perfilValidaciones.validarTelefono(formData.telefono),
      direccion: perfilValidaciones.validarDireccion(formData.direccion),
      region: perfilValidaciones.validarRegion(formData.region),
      comuna: perfilValidaciones.validarComuna(formData.comuna, formData.region)
    };

    const esValido = Object.values(errores).every(error => error === '');
    
    return {
      esValido,
      errores
    };
  }
};

export default perfilValidaciones;