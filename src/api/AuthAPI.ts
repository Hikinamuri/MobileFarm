// api/AuthAPI.ts
import axios, { AxiosError } from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

class AuthAPI {
    public static sendAuthParams = async (
        code_verifier: string,
        authParams: { code: string; device_id: string; state: string }
    ) => {
        try {
            // Исправляем формирование query параметров
            const queryParams = new URLSearchParams({
                ...authParams,
                code_verifier: code_verifier,
            }).toString();

            console.log('withCredentials default:', axios.defaults.withCredentials);
            
            const response = await axios.post(
                `${baseUrl}/users/callback?${queryParams}`,
                null,
                {
                    withCredentials: false,
                }
            );

            console.log('response', response.data)

            if (response && response.status === 200) {
                if (response.data.access) {
                    localStorage.setItem(
                        "access_token",
                        response.data.message || response.data.access
                    );
                    window.location.href = "/main";
                } else {
                    alert("Аккаунт успешно добавлен.");
                    window.location.href = "/auth";
                }
                return response.data;
            }
        } catch (err) {
            const error = err as AxiosError;
            console.error("Auth error:", error.response?.data || error.message);
            alert(
                `Ошибка авторизации: ${
                    error.response?.data || error.message
                }`
            );
            throw error;
        }
    };

    public static getUsers = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            throw new Error("Токен не найден");
        }

        try {
            const response = await axios.get(`${baseUrl}/vk/get_users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                return response.data;
            }
        } catch (err) {
            const error = err as AxiosError;
            console.error(
                "Get users error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                localStorage.removeItem("access_token");
                window.location.href = "/auth";
            }

            throw error;
        }
    };

    public static validateToken = async (): Promise<boolean> => {
        const token = localStorage.getItem("access_token");
        if (!token) return false;

        try {
            await this.getUsers(); // Любой запрос для проверки
            return true;
        } catch {
            return false;
        }
    };
}

export default AuthAPI;
