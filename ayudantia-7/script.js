// Creando la competencia entre Ghibli y Disney

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
// Definimos los URLs de los instrumentos
const pianoBaseURL = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/";
const ocarinaBaseURL = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/ocarina-mp3/";
const cache = {};

// Funciones para convertir MIDI a nombres de notas naturales(No hay bemoles ni sostenidos)
function midiToNaturalNoteName(midi) {
      const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];
      const naturalOffsets = [0, 2, 4, 5, 7, 9, 11];
      
      const octave = Math.floor(midi / 12) - 1;
      const closestNatural = naturalOffsets.reduce((prev, curr) =>
        Math.abs(curr - (midi % 12)) < Math.abs(prev - (midi % 12)) ? curr : prev
  );
  const note = naturalNotes[naturalOffsets.indexOf(closestNatural)];
  return note + octave;
}

// Función para reproducir una nota
    async function playNote(noteName, instrumentURL, delay = 0) {
      const url = instrumentURL + noteName + ".mp3";

      if (!cache[url]) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        cache[url] = await audioContext.decodeAudioData(arrayBuffer);
      }

      const source = audioContext.createBufferSource();
      source.buffer = cache[url];
      source.connect(audioContext.destination);
      source.start(audioContext.currentTime + delay);
    }

    let disneyData = [], ghibliData = [];

    // Load y plot data
    Promise.all([
      d3.csv('disney_revenue.csv', d => ({
        year: +d.Year,
        revenue: +d.total_gross
      })),
      d3.csv('ghibli_revenue.csv', d => ({
        year: +d.Year,
        revenue: +d.Revenue
      }))
    ]).then(([disney, ghibli]) => {
      disneyData = disney;
      ghibliData = ghibli;

      const trace1 = {
        x: disney.map(d => d.year),
        y: disney.map(d => d.revenue),
        type: 'scatter',
        name: 'Disney',
        line: { color: '#f94346' }
      };

      const trace2 = {
        x: ghibli.map(d => d.year),
        y: ghibli.map(d => d.revenue),
        type: 'scatter',
        name: 'Ghibli',
        line: { color: '#5f9b7a' }
      };

      Plotly.newPlot('Movies', [trace1, trace2]);
    });

    document.getElementById("button-64").addEventListener("click", () => {
      if (!disneyData.length || !ghibliData.length) return;

      const count = 5;
      for (let i = 0; i < count; i++) {
        const dNote = 60 + Math.floor(disneyData[i % disneyData.length].revenue / 10000000);
        const gNote = 60 + Math.floor(ghibliData[i % ghibliData.length].revenue / 10000000);
        const dName = midiToNaturalNoteName(Math.max(48, Math.min(84, dNote)));
        const gName = midiToNaturalNoteName(Math.max(48, Math.min(84, gNote)));

        playNote(dName, pianoBaseURL, i * 1);
        playNote(gName, ocarinaBaseURL, i * 1 + 0.5);
      }
    });



let personalizedVoice = null;

// Load voices and find the preferred one
window.speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();
  personalizedVoice = voices.find(voice => voice.name === 'Microsoft Alvaro Online (Natural) - Spanish (Spain)');
};

// Speak function with fallback
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);

  if (personalizedVoice) {
    utterance.voice = personalizedVoice;
  } else {
    // Optional fallback: pick first Spanish voice
    const fallback = speechSynthesis.getVoices().find(v => v.lang.startsWith("es"));
    if (fallback) utterance.voice = fallback;
  }

  speechSynthesis.cancel(); // Stop any ongoing speech
  speechSynthesis.speak(utterance);
}

// Chart and canvas setup
let chart;
const canvas = document.getElementById("consoleChart");
const ctx = canvas.getContext("2d");

function updateChart(data) {
  const selectedFirm = document.getElementById("companySelect").value;
  const filteredData = data.filter(item => item.Firm === selectedFirm);
  const sortedData = filteredData.sort((a, b) => b["Units Sold (M)"] - a["Units Sold (M)"]);

  const labels = sortedData.map(item => item.Platform);
  const unitsSold = sortedData.map(item => parseFloat(item["Units Sold (M)"]));

  if (chart) chart.destroy();

  const baseOptions = {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy'
        },
        pan: {
          enabled: true,
          mode: 'xy'
        },
        // Event to trigger when zoom is completed
        onZoomComplete: ({ chart }) => {
          const visibleIndexes = chart.scales.x._gridLineItems
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.tx >= chart.chartArea.left && item.tx <= chart.chartArea.right)
            .map(({ index }) => index);

          const visibleLabels = visibleIndexes.map(i => chart.data.labels[i]).filter(Boolean);

          if (visibleLabels.length > 0) {
            speak("Ahora estás viendo: " + visibleLabels.join(", "));
          }
        }
      }
    }
  };

  const colorMap = {
    Nintendo: { bg: '#e60012', border: '#8a0011' },
    Sony: { bg: '#003791', border: '#0055ff' },
    Microsoft: { bg: '#107c11', border: '#7eb900' }
  };

  if (colorMap[selectedFirm]) {
    const { bg, border } = colorMap[selectedFirm];
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Units Sold (Millions)',
          data: unitsSold,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1
        }]
      },
      options: baseOptions
    });

    // Adding hover event to trigger speech on hover
    chart.canvas.addEventListener('mousemove', (event) => {
      const activePoints = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true });
      if (activePoints.length > 0) {
        const index = activePoints[0].index;
        const label = labels[index];
        const sales = unitsSold[index];
        speak(`Plataforma: ${label}, Ventas: ${sales} millones`);
      }
    });

  } else {
    canvas.style.backgroundColor = "#FFFFFF";
  }
}

function fetchCSVFile() {
  fetch('most_sold_game.csv')
    .then(response => response.text())
    .then(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
          updateChart(results.data);
        }
      });
    })
    .catch(error => console.error("Error fetching CSV file:", error));
}

document.getElementById("companySelect")
  .addEventListener("change", fetchCSVFile);

fetchCSVFile();

// Creando el mapa de Japón
var svg = d3.select("svg");
var width = +svg.attr("width");
var height = +svg.attr("height");

var projection = d3.geoMercator()
    .center([137.5, 40])  // Centro de Japón
    .scale(1500)  // Ajustamos la escala para que el mapa se vea
    .translate([width / 2, height / 2]);  // Centramos el mapa en el SVG

var path = d3.geoPath().projection(projection);

// Cargar el archivo GeoJSON de Japón
d3.json("japan.geojson").then(function(japan) {
    // Dibujar las prefecturas de Japón
    svg.selectAll("path")
        .data(japan.features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "#aaa")
        .attr("stroke-width", 0.5)
        .attr("fill", "none");

    // Cargar datos de volcanes
    // Agregar el div del tooltip al cuerpo
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("padding", "10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 0 5px rgba(0,0,0,0.3)");

    // Audio files for volcanoes based on elevation
    const tallVolcanoAudio = new Audio("https://lit2talks.com/tool/uploads/681d09ae90cb7_fuerte-volcan.mp3");
    const mediumVolcanoAudio = new Audio("https://lit2talks.com/tool/uploads/681d0a011a81e_mid-volcan.mp3");
    const smallVolcanoAudio = new Audio("https://lit2talks.com/tool/uploads/681d0a2053763_suave-volcan.mp3");

    d3.csv("japan_volcano.csv").then(volcanoes => {
        volcanoes.forEach(d => {
            d.Latitude = +d.Latitude;
            d.Longitude = +d.Longitude;
            d.Elevation_meters = +d.Elevation_meters;
        });

        const validVolcanoes = volcanoes.filter(d => {
            const coords = [d.Longitude, d.Latitude];
            return !isNaN(d.Latitude) && !isNaN(d.Longitude) && d3.geoContains(japan, coords);
        });

        const maxElevation = d3.max(validVolcanoes, d => d.Elevation_meters || 0);

        svg.selectAll("circle.volcano")
            .data(validVolcanoes)
            .enter()
            .append("circle")
            .attr("class", "volcano")
            .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
            .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
            .attr("r", 3)
            .attr("fill", "red")
            .attr("stroke", "black")
            .on("mouseover", (event, d) => {
                const heightPercent = d.Elevation_meters / maxElevation;
                const svgWidth = 100;
                const svgHeight = 60;
                const peakY = svgHeight * (1 - heightPercent);

                // Categorizing the volcano based on its elevation
                let audioToPlay;
                if (d.Elevation_meters > 3000) {
                    audioToPlay = tallVolcanoAudio;
                } else if (d.Elevation_meters > 1000) {
                    audioToPlay = mediumVolcanoAudio;
                } else {
                    audioToPlay = smallVolcanoAudio;
                }

                // Play the appropriate audio
                audioToPlay.play();

                // Generar el gráfico con los dos triángulos (uno gris y uno naranja) uno al lado del otro
                const svgChart = `
                    <svg width="${svgWidth * 2}" height="${svgHeight}">
                        <!-- Triángulo gris para el volcán más alto (Mount Fuji) -->
                        <polygon points="0,${svgHeight} ${svgWidth/2},0 ${svgWidth},${svgHeight}" fill="#f2faef"/>
                        <!-- Etiqueta para Mount Fuji -->
                        <text x="${svgWidth/2}" y="20" text-anchor="middle" font-size="12" fill="black">Mount Fuji</text>
                        <!-- Triángulo naranja para el volcán actual -->
                        <polygon points="${svgWidth+20},${svgHeight} ${svgWidth*1.5},${peakY} ${svgWidth*2-20},${svgHeight}" fill="#e63746"/>
                        <text x="${svgWidth * 1.5}" y="${peakY - 5}" text-anchor="middle" font-size="10" fill="black">
                            ${d.Elevation_meters} m
                        </text>
                    </svg>`;

                tooltip
                    .style("visibility", "visible")
                    .html(`
                        <strong>${d.Name}</strong><br/>
                        Elevation: ${d.Elevation_meters} m<br/>
                        Latitude: ${d.Latitude}<br/>
                        Longitude: ${d.Longitude}<br/><br/>
                        ${svgChart}  <!-- Mostrar los dos triángulos uno al lado del otro -->
                    `);
            })
            .on("mousemove", event => {
                tooltip
                    .style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

    }).catch(function(error) {
        console.error("Error al cargar el archivo CSV de volcanes", error);
    });
});
