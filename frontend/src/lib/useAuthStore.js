import { create } from "zustand";

const useAuthStore = create((set) => ({
  // Menyimpan data user yang sedang login
  // Struktur user = {
  //   id: integer,
  //   name: string,
  //   role: string
  // }
  user: null,
  // Function menyimpan data user ke dalam store
  setUser: (user) => set({ user }),
  // Function untuk menghapus data user dari store (logout)
  logout: () => set({ user: null }),
}));

export default useAuthStore;