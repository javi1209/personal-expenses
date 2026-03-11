import { create } from 'zustand';

interface LayoutState {
    mobileSidebarOpen: boolean;
    toggleMobileSidebar: () => void;
    setMobileSidebarOpen: (isOpen: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    mobileSidebarOpen: false,
    toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
    setMobileSidebarOpen: (isOpen: boolean) => set({ mobileSidebarOpen: isOpen }),
}));
