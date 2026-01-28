import cl from "./AuthPage.module.scss";

import * as VKID from "@vkid/sdk";

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AuthAPI from "../../api/AuthAPI";

export const AuthPage = () => {
    const navigate = useNavigate();

    const backLink = async () => {
        navigate("/main");
    };

    useEffect(() => {
        const floatingOneTap = new VKID.FloatingOneTap();

        floatingOneTap.render({
            appName: "VkResender",
            showAlternativeLogin: true,
            // scheme: VKID.Scheme.LIGHT,
            // lang: VKID.Languages.RUS,
        });

        floatingOneTap.on(
            VKID.FloatingOneTapInternalEvents.LOGIN_SUCCESS,
            (
                payload: { code: string; device_id: string; state: string },
            ) => {
                AuthAPI.sendAuthParams('aboba', payload);
            },
        );

        floatingOneTap.on(VKID.WidgetEvents.ERROR, (error: unknown) => {
            console.error("Error during authorization:", error);
        });

        return () => {
            const container = document.getElementById("vk_auth_container");
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [navigate]);

    return (
        <div className={cl.AuthPage}>
            <h2>Авторизация</h2>
            <div id="vk_auth_container"></div>
            <button onClick={backLink}>Страница отправки</button>
        </div>
    );
};
