import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.js";

import * as VKID from "@vkid/sdk";

VKID.Config.init({
    app: 52916450,
    redirectUrl: "https://vk.miwory.dev/redirect",
    responseMode: VKID.ConfigResponseMode.Callback,
    source: VKID.ConfigSource.LOWCODE,
    scope: "wall groups photos",
    codeVerifier: 'aboba'
    // responseMode: VKID.ConfigResponseMode.Callback
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
