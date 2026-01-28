import { useLocation } from "react-router-dom";
// import AuthAPI from "../../api/AuthAPI";
import { useCallback, useEffect } from "react";

export const AuthParams = () => {
    const location = useLocation();
    // const code_verifier = 'aboba'

    // const searchParams = new URLSearchParams(location.search);
    const sendParams = useCallback(async () => {
        try {
            // await AuthAPI.sendAuthParams(code_verifier, searchParams );
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
