import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetworkState } from '../types/types';

interface NetworkContextType {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
    isConnected: true,
    isInternetReachable: null,
    checkConnection: async () => { },
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
    children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
    const [networkState, setNetworkState] = useState<NetworkState>({
        isConnected: true,
        isInternetReachable: null,
    });

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkState({
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
            });
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    const checkConnection = async () => {
        const state = await NetInfo.fetch();
        setNetworkState({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable,
        });
    };

    return (
        <NetworkContext.Provider
            value={{
                isConnected: networkState.isConnected,
                isInternetReachable: networkState.isInternetReachable,
                checkConnection,
            }}
        >
            {children}
        </NetworkContext.Provider>
    );
}
