import './index.css';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './routes/AppRouter.tsx';
import { Provider } from 'react-redux';
import { Toaster } from "sonner";
import { persistor, store } from './store';
import { PersistGate } from 'redux-persist/integration/react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with ID "root" not found. Please check your HTML.');
}

ReactDOM.createRoot(rootElement).render(
   <Provider store={store}>
         <PersistGate loading={null} persistor={persistor}>
            <AppRouter />
         <Toaster position="top-right" richColors />  
        </PersistGate>
   </Provider>

);