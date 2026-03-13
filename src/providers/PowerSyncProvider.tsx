import { PowerSyncContext } from '@powersync/react-native';
import React, { useEffect } from 'react';

import { PowerSyncConnector } from '@/src/lib/powersync/connector';
import { powerSyncDb } from '@/src/lib/powersync/database';

type Props = {
  children: React.ReactNode;
};

export function PowerSyncProvider({ children }: Props) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        console.log('Initializing PowerSync');
        await powerSyncDb._initialize();
        if (cancelled) return;
        console.log('PowerSync initialized');

        const connector = new PowerSyncConnector();
        console.log('Connecting PowerSync to endpoint: ', process.env.EXPO_PUBLIC_POWERSYNC_URL);
        await powerSyncDb.connect(connector);
        if (!cancelled) console.log('PowerSync connected');
      } catch (e) {
        if (!cancelled) console.log('PowerSync connection error: ', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PowerSyncContext.Provider value={powerSyncDb}>
      {children}
    </PowerSyncContext.Provider>
  );
}
