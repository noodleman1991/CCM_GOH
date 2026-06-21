import { create } from "zustand";

/**
 * Global open-state for the universal search modal. There is exactly ONE modal
 * (rendered once in the app shell); every trigger (sidebar pill, topbar icon)
 * and the global ⌘K / "/" shortcut just call open(). This fixes the previous
 * bug where two SearchDialog instances each opened their own modal on a keyboard
 * shortcut, stacking and getting stuck.
 */
interface SearchStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
