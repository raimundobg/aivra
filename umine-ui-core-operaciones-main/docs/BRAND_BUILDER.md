# Brand Theme Builder - Technical Documentation

El Brand Theme Builder permite a los usuarios e ingenieros de preventa generar visualizaciones personalizadas del Design System UMINE basadas en activos de marca del cliente (imágenes, PDFs, etc.).

## Flujo de Trabajo
1. El usuario carga un activo (multimodal).
2. Se envía una petición al backend (API Gateway).
3. Se recibe un `Theme JSON` con tokens semánticos y paleta.
4. El frontend aplica un `ScopedThemeProvider` que pisa los estilos de UMINE solo en la ventana de previsualización.

## Contrato de API
### POST `/v1/brand/theme`
**Request (Multipart/Form-Data):**
- `inputType`: `image | pdf | audio | text`
- `file`: Binario (opcional si es texto)
- `text`: String (opcional si hay archivo)
- `mode`: `light | dark | both`
- `target`: `chakra_v3`
- `brandHint`: String descriptivo (opcional)

**Response (JSON):**
```json
{
  "brandId": "string",
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "neutrals": ["#hex"]
  },
  "semanticTokens": {
    "colors": {
      "bg.canvas": { "value": "{colors.brand.primary}" },
      "bg.surface": { "value": "{colors.brand.secondary}" }
    }
  },
  "preview": {
    "contrastScore": 0.95,
    "warnings": []
  }
}
```

## Implementación de Overlay
El `ScopedThemeProvider` utiliza `defineConfig` de Chakra UI v3 para crear un sistema de diseño "merged" en tiempo de ejecución. 

```tsx
<ScopedThemeProvider overlay={customTheme}>
  <UMINEComponents />
</ScopedThemeProvider>
```

## Exportación
- **Copiar JSON**: Permite pegar el tema en la configuración del agente generador de código.
- **Descargar JSON**: Genera un archivo `.json` para persistencia en repositorios.
