import { registerRootComponent } from 'expo';
import App from './App';
import { database } from './database'; // Importa para garantir que o banco inicialize

// Registra o componente App como a raiz da aplicação
registerRootComponent(App);