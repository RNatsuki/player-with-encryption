# Video Player con Encriptación

Una aplicación web para subir, encriptar y reproducir videos usando HLS con encriptación AES-128.

## Características

- Subida de videos MP4
- Encriptación automática con AES-128
- Reproducción HLS en streaming
- Interfaz moderna con Video.js
- Controles personalizados de reproducción
- Soporte para atajos de teclado

## Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Video Processing**: FFmpeg
- **Player**: Video.js con plugin HLS
- **Styling**: Tailwind CSS

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repo>
cd encryption-player
```

2. Instala las dependencias:
```bash
npm install
```

3. Instala FFmpeg en tu sistema (requerido para el procesamiento de video):
   - Windows: Descarga de https://ffmpeg.org/download.html
   - Asegúrate de que `ffmpeg` esté en el PATH

## Uso

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre http://localhost:3000 en tu navegador

3. Sube un video MP4 usando el formulario

4. El video se procesará y encriptará automáticamente

5. Reproduce el video en el player integrado

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/videos/
│   │   ├── [id]/
│   │   │   ├── key/route.ts          # Servir clave de encriptación
│   │   │   ├── playlist/route.ts     # Servir playlist HLS
│   │   │   └── [segment]/route.ts    # Servir segmentos de video
│   │   └── upload/route.ts           # Endpoint de subida
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                      # Página principal
│   └── components/
│       └── VideoPlayer.tsx           # Componente del reproductor
└── lib/
    └── videoService.ts               # Lógica de procesamiento de video
```

## API Endpoints

- `POST /api/videos/upload` - Subir video
- `GET /api/videos/{id}/playlist` - Obtener playlist HLS
- `GET /api/videos/{id}/key` - Obtener clave de encriptación
- `GET /api/videos/{id}/{segment}` - Obtener segmento de video

## Controles del Player

- **Reproducción/Pausa**: Espacio
- **Saltar ±10s**: ← →
- **Volumen ±**: ↑ ↓
- **Silenciar**: M
- **Pantalla completa**: F
- **Modo teatro**: T

## Desarrollo

### Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar linter

### Procesamiento de Video

El procesamiento se realiza con FFmpeg usando los siguientes parámetros:
- Codec de video: H.264
- Codec de audio: AAC
- Resolución: 720p
- Segmentos: 10 segundos
- Encriptación: AES-128

## Notas

- Los videos se almacenan temporalmente en `temp/`
- Los videos procesados se guardan en `videos/`
- La encriptación usa una clave de 16 bytes generada aleatoriamente
- Los archivos temporales se eliminan después del procesamiento

## Licencia

Este proyecto es de código abierto.
