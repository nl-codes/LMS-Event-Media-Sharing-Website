import { jwtDecode, JwtPayload } from "jwt-decode";
import { User, userJWTToken } from "@/types/User";

export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (!decoded.exp) return true;
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (err) {
        console.log("Error in Helper Function (isTokenExpired) : ", err);
        return true;
    }
};

// Helper to extract user info from token
export const getUserFromToken = (token: string): User | null => {
    try {
        const decoded = jwtDecode<userJWTToken>(token);
        if (!decoded.email || !decoded.userName || !decoded.role) return null;
        return {
            email: decoded.email,
            userName: decoded.userName,
            role: decoded.role,
        };
    } catch (err) {
        console.log("Error in Helper Function (getUserFromToken) : ", err);
        return null;
    }
};
