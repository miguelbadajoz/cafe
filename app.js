const { useState, useEffect } = React;

function parseTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours + minutes / 60;
}

function estimateCaffeine(entries, map, atHour) {
  const halfLife = 8; // horas
  const decay = Math.log(2) / halfLife;
  return entries.reduce((sum, entry) => {
    const entryTime = parseTime(entry.time);
    if (atHour < entryTime) return sum;
    const amount = map[entry.size] ?? 0;
    return sum + amount * Math.exp(-decay * (atHour - entryTime));
  }, 0);
}

function formatTimeLabel(value) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildChartPoints(entries, map) {
  const halfLife = 8; // horas
  const decay = Math.log(2) / halfLife;
  const data = Array.from({ length: 49 }, (_, i) => {
    const x = i * 0.5;
    const y = entries.reduce((sum, entry) => {
      const entryTime = parseTime(entry.time);
      if (x < entryTime) return sum;
      const amount = map[entry.size] ?? 0;
      return sum + amount * Math.exp(-decay * (x - entryTime));
    }, 0);
    return { x, y };
  });
  return data;
}

function App() {
  const [entries, setEntries] = useState([]);
  const [time, setTime] = useState('08:30');
  const [size, setSize] = useState('mediano');
  const [editingId, setEditingId] = useState(null);
  const [caffeineMap, setCaffeineMap] = useState({ pequeno: 80, mediano: 120, grande: 160 });

  useEffect(() => {
    fetch('./datos.json')
      .then((response) => response.json())
      .then(setCaffeineMap)
      .catch(() => {
        setCaffeineMap({ pequeno: 80, mediano: 120, grande: 160 });
      });
  }, []);

  const resetForm = () => {
    setTime('08:30');
    setSize('mediano');
    setEditingId(null);
  };

  const addCoffee = (event) => {
    event.preventDefault();
    if (!time) return;
    const amount = caffeineMap[size] ?? 0;
    if (editingId) {
      setEntries((current) => current.map((entry) =>
        entry.id === editingId ? { ...entry, time, size, caffeine: amount } : entry
      ));
      resetForm();
      return;
    }

    setEntries((current) => [
      ...current,
      { time, size, caffeine: amount, id: Date.now() }
    ]);
    resetForm();
  };

  const editCoffee = (entry) => {
    setEditingId(entry.id);
    setTime(entry.time);
    setSize(entry.size);
  };

  const deleteCoffee = (id) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  const points = buildChartPoints(entries, caffeineMap);
  const currentDate = new Date();
  const currentHour = currentDate.getHours() + currentDate.getMinutes() / 60;
  const currentCaffeine = estimateCaffeine(entries, caffeineMap, currentHour);
  const maxCaffeine = Math.max(...points.map((p) => p.y));
  const maxY = Math.max(100, maxCaffeine);
  const roundedMaxY = Math.ceil(maxY / 10) * 10;
  const width = 660;
  const height = 340;
  const padding = 50;
  let yInterval = 10;
  let labelCount = Math.floor(roundedMaxY / yInterval) + 1;
  if (labelCount > 6) {
    yInterval = 20;
    labelCount = Math.floor(roundedMaxY / yInterval) + 1;
  }
  if (labelCount > 6) {
    yInterval = 50;
    labelCount = Math.floor(roundedMaxY / yInterval) + 1;
  }
  if (labelCount > 6) {
    yInterval = 100;
  }
  const yLabels = Array.from({ length: Math.floor(roundedMaxY / yInterval) + 1 }, (_, i) => i * yInterval).reverse();
  const grade = currentCaffeine <= 5 ? 'Limpio' : currentCaffeine <= 30 ? 'Bajo' : currentCaffeine <= 80 ? 'Medio' : 'Alto';
  const phrasesByGrade = {
    Limpio: [
      'Nivel limpio: casi como si no hubieras tomado café.',
      'Tan ligero que tu almohada no notará diferencia.',
      'Casi aire, casi descanso; perfecto para la noche.',
      'Limpio y tranquilo: el sueño está en calma.',
      'Tu café hoy ha dejado un rastro muy suave.'
    ],
    Bajo: [
      'Casi pareces agua con cafeína: el descanso está tranquilo.',
      'Tu cuerpo puede dormir casi sin protestar.',
      'Nivel suave: el sillón gana la partida.',
      'Café amable hoy: no debería liar mucho tu noche.',
      'Un paso ligero por la cafetería, no por la cama.'
    ],
    Medio: [
      'Moderado, así que el sueño puede costar un poco más de lo habitual.',
      'Cuidado: la cama te llama, pero el café aún susurra.',
      'Estás en zona productiva, pero el descanso puede resentirse.',
      'Un punto medio: lo mismo te deja soñar con trabajo.',
      'Nivel medio: la noche puede pedir un poco más de calma.'
    ],
    Alto: [
      '¡Alerta! Esa dosis puede convertir la noche en una maratón mental.',
      'Nivel alto: el sueño puede tardar en aparecer.',
      'Tu almohada está a punto de ponerse celosa.',
      'Café potente: la cama puede quedarse esperando.',
      'Más vale que no tengas reunión temprano mañana.'
    ]
  };
  const phrase = phrasesByGrade[grade][Math.floor(Math.random() * phrasesByGrade[grade].length)];
  const coords = points
    .map((point) => {
      const px = padding + (point.x / 24) * (width - padding * 2);
      const py = height - padding - (point.y / roundedMaxY) * (height - padding * 2);
      return `${px},${py}`;
    })
    .join(' ');

  return (
    React.createElement('div', { style: { maxWidth: 740, margin: '0 auto', padding: '1rem' } },
      React.createElement('header', null,
        React.createElement('h1', null, 'Registro diario de cafés'),
        React.createElement('p', { style: { color: '#555' } }, 'Sigue tu ingestión de café y observa la curva estimada de cafeína en sangre.')
      ),
      React.createElement('form', { onSubmit: addCoffee, style: { display: 'grid', gap: '0.75rem', marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' } },
        React.createElement('div', { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' } },
          React.createElement('label', { style: { flex: '1 1 220px', minWidth: 220, display: 'flex', flexDirection: 'column' } },
            'Hora',
            React.createElement('input', {
              type: 'time',
              value: time,
              required: true,
              onChange: (evt) => setTime(evt.target.value),
              style: { width: '100%', padding: '0.65rem', marginTop: '0.35rem', borderRadius: 8, border: '1px solid #ccc', height: '40px', boxSizing: 'border-box' }
            })
          ),
          React.createElement('label', { style: { flex: '1 1 220px', minWidth: 220, display: 'flex', flexDirection: 'column' } },
            'Tamaño',
            React.createElement('select', {
              value: size,
              onChange: (evt) => setSize(evt.target.value),
              style: { width: '100%', padding: '0.65rem', marginTop: '0.35rem', borderRadius: 8, border: '1px solid #ccc', height: '40px', boxSizing: 'border-box' }
            },
              React.createElement('option', { value: 'pequeno' }, 'Pequeño'),
              React.createElement('option', { value: 'mediano' }, 'Mediano'),
              React.createElement('option', { value: 'grande' }, 'Grande')
            )
          )
        ),
        React.createElement('div', { style: { display: 'flex', gap: '0.75rem', alignItems: 'center' } },
          React.createElement('button', {
            type: 'submit',
            style: { width: 150, padding: '0.75rem', border: 'none', borderRadius: 8, background: '#1f8efa', color: '#fff', cursor: 'pointer' }
          }, editingId ? 'Guardar cambio' : 'Añadir café'),
          editingId && React.createElement('button', {
            type: 'button',
            onClick: cancelEdit,
            style: { width: 120, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }
          }, 'Cancelar')
        )
      ),
      React.createElement('section', { style: { marginTop: '1.5rem' } },
        React.createElement('h2', null, 'Gráfico estimado de cafeína'),
        React.createElement('div', { style: { marginTop: '0.75rem', padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' } },
          React.createElement('svg', { viewBox: `0 0 ${width} ${height}`, style: { width: '100%', height: 'auto' } },
            React.createElement('rect', { x: 0, y: 0, width, height, fill: 'transparent' }),
            React.createElement('line', { x1: padding, y1: padding, x2: padding, y2: height - padding, stroke: '#94a3b8', strokeWidth: 1 }),
            React.createElement('line', { x1: padding, y1: height - padding, x2: width - padding, y2: height - padding, stroke: '#94a3b8', strokeWidth: 1 }),
            React.createElement('polyline', {
              points: coords,
              fill: 'none',
              stroke: '#1f8efa',
              strokeWidth: 3,
              strokeLinejoin: 'round',
              strokeLinecap: 'round'
            }),
            Array.from({ length: yLabels.length }, (_, i) => {
              const y = padding + ((roundedMaxY - yLabels[i]) / roundedMaxY) * (height - 2 * padding);
              return React.createElement(React.Fragment, { key: `grid-${i}` },
                React.createElement('line', { x1: padding, y1: y, x2: width - padding, y2: y, stroke: '#e2e8f0', strokeWidth: 1 }),
                React.createElement('text', { x: padding - 8, y: y + 4, fill: '#475569', fontSize: 11, textAnchor: 'end' }, `${yLabels[i]} mg`)
              );
            }),
            Array.from({ length: 5 }, (_, i) => {
              const x = padding + i * ((width - 2 * padding) / 4);
              const hour = i * 6;
              return React.createElement(React.Fragment, { key: `x-${i}` },
                React.createElement('line', { x1: x, y1: height - padding, x2: x, y2: height - padding + 6, stroke: '#94a3b8', strokeWidth: 1 }),
                React.createElement('text', { x, y: height - padding + 20, fill: '#475569', fontSize: 11, textAnchor: 'middle' }, `${hour}h`)
              );
            }),
            React.createElement('text', { x: width / 2, y: height - 8, fill: '#475569', fontSize: 12, textAnchor: 'middle' }, 'Tiempo (h)'),
            React.createElement('text', { x: 10, y: padding - 8, fill: '#475569', fontSize: 12 }, 'Cafeína (mg)'),
            React.createElement('line', {
              x1: padding + (currentHour / 24) * (width - padding * 2),
              y1: padding,
              x2: padding + (currentHour / 24) * (width - padding * 2),
              y2: height - padding,
              stroke: '#f97316',
              strokeWidth: 2,
              strokeDasharray: '4 4'
            }),
            React.createElement('text', {
              x: padding + (currentHour / 24) * (width - padding * 2),
              y: padding - 10,
              fill: '#f97316',
              fontSize: 12,
              textAnchor: 'middle'
            }, 'Ahora')
          ),
          React.createElement('div', { style: { marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' } },
            React.createElement('div', { style: { padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' } },
              React.createElement('strong', null, 'Contenido actual'),
              React.createElement('p', { style: { margin: '0.5rem 0 0', color: '#0f172a' } }, `${Math.round(currentCaffeine)} mg`)
            ),
            React.createElement('div', { style: { padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' } },
              React.createElement('strong', null, 'Contenido máximo'),
              React.createElement('p', { style: { margin: '0.5rem 0 0', color: '#0f172a' } }, `${Math.round(maxCaffeine)} mg`)
            ),
            React.createElement('div', { style: { padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' } },
              React.createElement('strong', null, 'Grado de cafeína'),
              React.createElement('p', { style: { margin: '0.5rem 0 0', color: '#0f172a' } }, grade),
              React.createElement('p', { style: { margin: '0.75rem 0 0', color: '#334155', fontStyle: 'italic' } }, phrase)
            )
          )
        )
      ),
      React.createElement('section', { style: { marginTop: '1.5rem' } },
        React.createElement('h2', null, 'Cafés añadidos'),
        entries.length === 0
          ? React.createElement('p', { style: { color: '#555' } }, 'No hay cafés registrados todavía.')
          : React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' } },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  ['Hora', 'Tamaño', 'Cafeína (mg)', 'Acciones'].map((label) =>
                    React.createElement('th', { key: label, style: { textAlign: 'left', padding: '0.9rem', borderBottom: '1px solid #e5e7eb' } }, label)
                  )
                )
              ),
              React.createElement('tbody', null,
                entries.map((entry) =>
                  React.createElement('tr', { key: entry.id },
                    React.createElement('td', { style: { padding: '0.9rem', borderBottom: '1px solid #f3f4f6', width: '90px' } }, entry.time),
                    React.createElement('td', { style: { padding: '0.9rem', borderBottom: '1px solid #f3f4f6' } }, entry.size),
                    React.createElement('td', { style: { padding: '0.9rem', borderBottom: '1px solid #f3f4f6' } }, entry.caffeine),
                    React.createElement('td', { style: { padding: '0.9rem', borderBottom: '1px solid #f3f4f6' } },
                      React.createElement('button', {
                        type: 'button',
                        onClick: () => editCoffee(entry),
                        style: { marginRight: 8, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #1f8efa', background: '#eff6ff', color: '#1f4db3', cursor: 'pointer' }
                      }, 'Editar'),
                      React.createElement('button', {
                        type: 'button',
                        onClick: () => deleteCoffee(entry.id),
                        style: { padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b', cursor: 'pointer' }
                      }, 'Borrar')
                    )
                  )
                )
              )
            )
      ),
      React.createElement('section', { style: { marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1' } },
        React.createElement('h2', { style: { marginBottom: '0.75rem' } }, 'Información sobre consumo moderado y descanso'),
        React.createElement('ul', { style: { paddingLeft: '1.2rem', margin: 0, color: '#0f172a' } },
          React.createElement('li', null,
            React.createElement('a', { href: 'https://www.sanidad.gob.es/', target: '_blank', rel: 'noreferrer noopener', style: { color: '#1d4ed8' } }, 'Ministerio de Sanidad: recomendaciones generales de salud y nutrición')
          ),
          React.createElement('li', { style: { marginTop: '0.5rem' } },
            React.createElement('a', { href: 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subdetalle/consumo_cafeina.htm', target: '_blank', rel: 'noreferrer noopener', style: { color: '#1d4ed8' } }, 'AESAN: consumo seguro de cafeína y recomendaciones alimentarias')
          ),
          React.createElement('li', { style: { marginTop: '0.5rem' } },
            React.createElement('a', { href: 'https://www.efsa.europa.eu/es/topics/topic/caffeine', target: '_blank', rel: 'noreferrer noopener', style: { color: '#1d4ed8' } }, 'EFSA: opinión científica sobre cafeína y salud')
          )
        )
      )
    )
  );
}

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(React.createElement(App));
