/// <reference types="vite/client" />

    declare global {
        interface Window {
            electronAPI?: {
                minimizeWindow: () => void;
                maximizeWindow: () => void;
                closeWindow: () => void;
                getWindowState?: () => Promise<string>;
                getWindowMaximizeState?: () => Promise<boolean>;
                onWindowStateChange?: (callback: (state: string) => void) => void;
                onWindowMaximizeStateChange?: (callback: (isMaximized: boolean) => void) => void;
            };
        }
    }

export { };