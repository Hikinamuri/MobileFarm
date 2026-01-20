import { useLocation } from "react-router-dom";
import AuthAPI from "../../api/AuthAPI";
import { useCallback, useEffect } from "react";

export const AuthParams = () => {
    const location = useLocation();

    const sendParams = useCallback(async () => {
        try {
            await AuthAPI.sendAuthParams(location.search);
            console.log("Параметры успешно отправлены!");
        } catch (err) {
            console.error("Ошибка при отправке параметров:", err);
        }
    }, [location.search]);

    useEffect(() => {
        sendParams();
    }, [sendParams]);

    return null;
}
