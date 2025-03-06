import { create } from 'zustand'
import {User} from "@supabase/auth-js";

interface UserState {
    user: User | undefined;
}

export const useUser = create<UserState>()((set) => ({
    user: undefined,
}));
