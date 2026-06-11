# Registro de cafés del día

Este proyecto es un front end sencillo en React para registrar los cafés consumidos durante el día.

## Qué hace

- Permite anotar cafés con:
  - hora de consumo
  - tamaño de café (pequeño, mediano, grande)
- Permite editar y borrar los cafés añadidos.
- Carga los valores de cafeína desde `datos.json`
- Calcula una curva estimada de cafeína en sangre desde las 0 horas hasta las 24 horas
    - Esta curva decrece de forma que la cantidad se reduce a la mitad cada 8 horas.
    - La curva suma la cafeína en la hora de cada café añadido.
- Muestra un gráfico con ejes etiquetados (Tiempo en horas, Cafeína en mg), con el día completo en el eje X y una línea vertical que marca la hora actual.
- Incluye una zona verde sombreada que indica niveles de cafeína seguros para dormir (< 5 mg).
- Muestra un resumen bajo el gráfico con:
    - Contenido actual
    - Contenido máximo
    - Hora adecuada para irse a dormir

## Archivos

- `index.html` - punto de entrada del frontend
- `app.js` - lógica de React y generación del gráfico
- `datos.json` - valores de cafeína por tamaño de café
- `readme.md` - documentación y uso

## Formato de `datos.json`

El archivo `datos.json` contiene la cantidad de cafeína en miligramos para cada tamaño:

```json
{
  "pequeno": 80,
  "mediano": 120,
  "grande": 160
}
```

## Uso

1. Abrir `cafe/index.html` en un servidor local o con un servidor estático.
2. Introducir la hora y el tamaño del café.
3. Pulsar `Añadir café`.
4. Ver el gráfico que estima la cafeína en sangre a lo largo del día.

## Ejecución local rápida

Desde el directorio `cafe` puedes usar un servidor web simple:

```bash
cd /Users/mblanco/Library/CloudStorage/Dropbox/sideprojects/cafe
python3 -m http.server 8000
```

Luego abre en el navegador:

```text
http://localhost:8000
```

## Notas

- La curva usa un modelo de eliminación de cafeína con semivida de 8 horas.
- El eje X cubre el día completo de 0h a 24h y el gráfico marca la hora actual con una línea vertical.
- El gráfico es un cálculo estimado para visualizar el impacto acumulado de los cafés anotados.
