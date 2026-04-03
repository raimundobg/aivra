import { type BrandThemeOverlay } from "../../contexts/ThemeContext";

export type InputType = "image" | "pdf" | "audio" | "text";

export interface BrandThemeRequest {
    inputType: InputType;
    text?: string;
    file?: File;
    mode?: "light" | "dark" | "both";
    target: "chakra_v3";
    brandHint?: string;
}

export class BrandService {
    private static baseUrl = import.meta.env.VITE_BRAND_API_BASE_URL || "/v1/brand/theme";
    private static timeout = Number(import.meta.env.VITE_BRAND_API_TIMEOUT_MS) || 30000;

    static async generateTheme(request: BrandThemeRequest): Promise<BrandThemeOverlay> {
        const formData = new FormData();
        formData.append("inputType", request.inputType);
        formData.append("mode", request.mode || "both");
        formData.append("target", "chakra_v3");

        if (request.brandHint) {
            formData.append("brandHint", request.brandHint);
        }

        if (request.file) {
            formData.append("file", request.file);
        } else if (request.text) {
            formData.append("text", request.text);
        }

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                body: request.inputType === "text" && !request.file ? JSON.stringify(request) : formData,
                headers: request.inputType === "text" && !request.file ? { "Content-Type": "application/json" } : {},
                signal: controller.signal,
            });

            clearTimeout(id);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: any) {
            if (error.name === "AbortError") {
                throw new Error("Timeout: La respuesta del servidor tardó demasiado.");
            }
            throw error;
        }
    }
}
