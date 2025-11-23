import { saveLocalstorage, loadFromLocalstorage, deleteFromLocalstorage } from '../localstorageHelper';
import { dataService } from '../dataService';

const AUTH_KEY = 'auth_user';
const USER_TYPE_KEY = 'user_type';

export const authService = {
  // Autenticar usuario desde la base de datos Oracle Cloud
  login: async (email, password) => {
    try {
      // Buscar en la base de datos Oracle Cloud
      try {
        // Opción 1: Usar el endpoint específico por correo
        let usuarioDesdeBD;
        try {
          usuarioDesdeBD = await dataService.getUsuarioByCorreo(email);
        } catch (endpointError) {
          // Opción 2: Obtener todos los usuarios y filtrar
          const todosUsuarios = await dataService.getUsuarios();

          usuarioDesdeBD = todosUsuarios.find(user => {
            const emailMatch = user.correo && user.correo.toLowerCase() === email.toLowerCase();
            return emailMatch;
          });
        }

        if (usuarioDesdeBD) {
          // Verificar contraseña (comparar hash SHA256)
          const passwordHash = await authService.hashPasswordSHA256(password);

          if (usuarioDesdeBD.contrasenha === passwordHash) {
            // Normalizar el tipo de usuario
            const tipoUsuario = authService.normalizeUserType(usuarioDesdeBD.tipo);

            // Determinar la redirección según el tipo de usuario
            let redirectTo = '/index';
            if (tipoUsuario === 'Administrador') {
              redirectTo = '/admin/dashboard';
            } else if (tipoUsuario === 'Vendedor') {
              redirectTo = '/vendedor';
            }

            const userData = {
              id: usuarioDesdeBD.run || usuarioDesdeBD.id,
              nombre: usuarioDesdeBD.nombre || '',
              apellido: usuarioDesdeBD.apellidos || usuarioDesdeBD.apellido || '',
              email: usuarioDesdeBD.correo,
              type: tipoUsuario,
              loginTime: new Date().toISOString(),
              run: usuarioDesdeBD.run,
              direccion: usuarioDesdeBD.direccion,
              comuna: usuarioDesdeBD.comuna,
              region: usuarioDesdeBD.region,
              telefono: usuarioDesdeBD.telefono,
              fechaNac: usuarioDesdeBD.fechaNac,
              source: 'oracle_cloud'
            };

            // Guardar en sesión
            authService.saveUserSession(userData, tipoUsuario);

            return {
              success: true,
              user: userData,
              redirectTo: redirectTo
            };
          } else {
            return {
              success: false,
              error: 'Contraseña incorrecta'
            };
          }
        } else {
          return {
            success: false,
            error: 'Usuario no encontrado en el sistema'
          };
        }

      } catch (bdError) {
        return {
          success: false,
          error: 'Error de conexión con la base de datos. Intente más tarde.'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: 'Error del servidor. Por favor, intente nuevamente.'
      };
    }
  },

  // Función para hashear contraseña con SHA256 (igual que Oracle)
  hashPasswordSHA256: async (password) => {
    try {
      // Convertir el string a un ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(password);

      // Hashear con SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Convertir el ArrayBuffer a string hexadecimal
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex.toUpperCase();
    } catch (error) {
      // Fallback: si crypto.subtle no está disponible
      return authService.simpleSHA256(password);
    }
  },

  // Fallback para navegadores que no soportan crypto.subtle
  simpleSHA256: (password) => {
    // Esta es una implementación básica - crypto.subtle es preferible
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase();
  },

  // Normalizar tipos de usuario
  normalizeUserType: (tipo) => {
    if (!tipo) return 'Cliente';

    const tipoLower = tipo.toLowerCase().trim();

    if (tipoLower === 'admin' || tipoLower === 'administrador') return 'Administrador';
    if (tipoLower === 'cliente' || tipoLower === 'client') return 'Cliente';
    if (tipoLower === 'vendedor') return 'Vendedor';

    return tipo;
  },

  // Guardar sesión de usuario
  saveUserSession: (userData, userType) => {
    saveLocalstorage(AUTH_KEY, userData);
    saveLocalstorage(USER_TYPE_KEY, userType);

    // Disparar evento para notificar cambios de autenticación
    window.dispatchEvent(new Event('authStateChanged'));
  },

  logout: () => {
    deleteFromLocalstorage(AUTH_KEY);
    deleteFromLocalstorage(USER_TYPE_KEY);

    window.dispatchEvent(new Event('authStateChanged'));

    // Redirigir al inicio
    window.location.href = '/index';
  },

  isAuthenticated: () => {
    const user = loadFromLocalstorage(AUTH_KEY);
    return user !== null && user !== undefined;
  },

  getCurrentUser: () => {
    return loadFromLocalstorage(AUTH_KEY);
  },

  getUserType: () => {
    return loadFromLocalstorage(USER_TYPE_KEY);
  },

  isAdmin: () => {
    const userType = authService.getUserType();
    return userType === 'Administrador';
  },

  isVendedor: () => {
    const userType = authService.getUserType();
    return userType === 'Vendedor';
  },

  isClient: () => {
    const userType = authService.getUserType();
    return userType === 'Cliente';
  },

  // Obtener ruta de redirección según tipo de usuario
  getRedirectPath: (userType) => {
    switch (userType) {
      case 'Administrador':
        return '/admin/dashboard';
      case 'Vendedor':
        return '/vendedor';
      default:
        return '/index';
    }
  },

  // Verificar si un email existe en la BD
  emailExiste: async (email) => {
    try {
      try {
        const usuarioBD = await dataService.getUsuarioByCorreo(email);
        return !!usuarioBD;
      } catch (endpointError) {
        const todosUsuarios = await dataService.getUsuarios();
        const emailExiste = todosUsuarios.some(user => {
          const correoUsuario = user.correo ? user.correo.toLowerCase().trim() : '';
          const emailBuscado = email.toLowerCase().trim();
          return correoUsuario === emailBuscado;
        });
        return emailExiste;
      }
    } catch (error) {
      return false;
    }
  },

  // Verificar estado de la conexión con BD
  checkDatabaseConnection: async () => {
    try {
      const usuarios = await dataService.getUsuarios();
      return {
        connected: true,
        userCount: usuarios.length,
        message: `Conexión exitosa con ${usuarios.length} usuarios en BD`
      };
    } catch (error) {
      return {
        connected: false,
        userCount: 0,
        message: 'Error de conexión con la base de datos'
      };
    }
  },

  notifyAuthChange: () => {
    window.dispatchEvent(new Event('authStateChanged'));
  }
};