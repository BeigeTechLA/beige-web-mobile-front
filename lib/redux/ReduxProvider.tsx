'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Cookies from 'js-cookie';
import { store, persistor } from './store';
import { hydratePermissions } from './features/auth/authSlice';
import { normalizePermissionsPayload } from '@/lib/permissions';

const PERMISSIONS_SYNC_KEY = "revure_permissions_sync";

function PermissionsSyncListener() {
  useEffect(() => {
    const syncPermissions = () => {
      const permissionsStr = Cookies.get("revure_permissions");
      if (!permissionsStr) return;

      try {
        store.dispatch(hydratePermissions(normalizePermissionsPayload(JSON.parse(permissionsStr))));
      } catch (error) {
        console.error("Failed to sync permissions from cookie:", error);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === PERMISSIONS_SYNC_KEY) {
        syncPermissions();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(PERMISSIONS_SYNC_KEY, syncPermissions as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PERMISSIONS_SYNC_KEY, syncPermissions as EventListener);
    };
  }, []);

  return null;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PermissionsSyncListener />
        {children}
      </PersistGate>
    </Provider>
  );
}
