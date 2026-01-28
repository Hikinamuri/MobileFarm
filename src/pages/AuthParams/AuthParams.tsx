import { useLocation, useNavigate } from "react-router-dom";
import AuthAPI from "../../api/AuthAPI";
import { useCallback, useEffect } from "react";

export const AuthParams = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const sendParams = useCallback(async () => {
        try {
            // Извлекаем параметры из URL
            const params = new URLSearchParams(location.search);
            const code = params.get("code");
            const state = params.get("state");
            const device_id = params.get("device_id");
            
            if (!code || !state) {
                console.error("Отсутствуют необходимые параметры авторизации");
                navigate("/auth");
                return;
            }
            
            const code_verifier = 'aboba'
            
            // Формируем payload
            const payload = {
                code,
                state,
                device_id: device_id || ""
            };
            console.log('payload', payload)
            await AuthAPI.sendAuthParams(code_verifier, payload);
            console.log("Параметры успешно отправлены!");
            
            // Очищаем storage после использования
            sessionStorage.removeItem("vk_code_verifier");
            
            // Перенаправляем на главную страницу
            navigate("/main");
        } catch (err) {
            console.error("Ошибка при отправке параметров:", err);
            navigate("/auth");
        }
    }, [location.search, navigate]);

    useEffect(() => {
        sendParams();
    }, [sendParams]);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Обработка авторизации...</h2>
        </div>
    );
};