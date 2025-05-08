// Creando la competencia entre Ghibli y Disney

// Midi to note function
function midiToNoteName(midi) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return note + octave;
  }
  
  Promise.all([
    d3.csv('disney_revenue.csv', d => ({
      year: +d.Year,
      revenue: +d.total_gross
    })),
    d3.csv('ghibli_revenue.csv', d => ({
      year: +d.Year,
      revenue: +d.Revenue
    }))
  ]).then(([disneyData, ghibliData]) => {
    // Plotting the data with Plotly
    const trace1 = {
      x: disneyData.map(d => d.year),
      y: disneyData.map(d => d.revenue),
      type: 'scatter',
      name: 'Disney',
      line: { color: '#393E8F' }
    };
  
    const trace2 = {
      x: ghibliData.map(d => d.year),
      y: ghibliData.map(d => d.revenue),
      type: 'scatter',
      name: 'Ghibli',
      line: { color: '#537D5D' }
    };
  
    const data = [trace1, trace2];
    Plotly.newPlot('Movies', data);
  
    // Piano Synth for Disney
    const synthDisney = new Tone.PolySynth().toDestination();
    
    // Ocarina for Ghibli (using Tone.Sampler to load the ocarina sound)
    const ocarinaSampler = new Tone.Sampler({
      urls: {
        "C4": "https://cdn.jsdelivr.net/gh/Tonejs/Tone.js@next/examples/audio/ocarina/ocarina_C4.mp3", // Use your own URL for the ocarina sound file
      },
      baseUrl: "https://cdn.jsdelivr.net/gh/Tonejs/Tone.js@next/examples/audio/ocarina/",
    }).toDestination();
  
    // Normalize revenue to MIDI note (between 40 and 80)
    const getMidiFromRevenue = (revenue, minRev, maxRev) => {
      const minMidi = 40;
      const maxMidi = 80;
      return Math.round(((revenue - minRev) / (maxRev - minRev)) * (maxMidi - minMidi) + minMidi);
    };
  
    // Handle button click to play sounds
    document.getElementById("button-64").addEventListener("click", async () => {
      await Tone.start(); // Unlock audio context
  
      const allData = [...disneyData, ...ghibliData];
      const revenues = allData.map(d => d.revenue);
      const minRev = Math.min(...revenues);
      const maxRev = Math.max(...revenues);
  
      // Start the transport
      Tone.Transport.cancel();
      Tone.Transport.start();
  
      const maxLength = Math.max(disneyData.length, ghibliData.length);
  
      for (let i = 0; i < maxLength; i++) {
        const delay = i * 300; // Adjust delay between notes
  
        // Disney company note (Piano sound)
        if (i < disneyData.length) {
          const midi = getMidiFromRevenue(disneyData[i].revenue, minRev, maxRev);
          const note = midiToNoteName(midi);
          Tone.Transport.scheduleOnce(() => {
            synthDisney.triggerAttackRelease(note, "8n");
          }, delay / 1000); // Schedule for Disney (Piano)
        }
  
        // Ghibli company note (Ocarina sound)
        if (i < ghibliData.length) {
          const midi = getMidiFromRevenue(ghibliData[i].revenue, minRev, maxRev);
          const note = midiToNoteName(midi);
          Tone.Transport.scheduleOnce(() => {
            ocarinaSampler.triggerAttackRelease(note, "8n");
          }, delay / 1000); // Schedule for Ghibli (Ocarina)
        }
      }
  
      Tone.Transport.start();
    });
  });
  

// Creando el gráfico de barras de consolas

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
const ctx    = canvas.getContext("2d");

function updateChart(data) {
  const selectedFirm = document.getElementById("companySelect").value;
  const filteredData = data.filter(item => item.Firm === selectedFirm);
  const sortedData   = filteredData.sort((a, b) => b["Units Sold (M)"] - a["Units Sold (M)"]);

  const labels    = sortedData.map(item => item.Platform);
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
        }
      }
    }
  };

  const colorMap = {
    Nintendo:  { bg: '#e60012', border: '#8a0011' },
    Sony:      { bg: '#003791', border: '#0055ff' },
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
      const activePoints = chart.getElementsAtEvent(event);
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
d3.json("https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson").then(function(japan) {
    // Dibujar las prefecturas de Japón
    svg.selectAll("path")
        .data(japan.features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "#aaa")
        .attr("stroke-width", 0.5)
        .attr("fill", "none");

    // Cargar datos de volcanes
    // Add tooltip div to the body
// Add tooltip div
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

            const svgChart = `
                <svg width="${svgWidth}" height="${svgHeight}">
                    <!-- Outline triangle (tallest volcano) -->
                    <polygon points="0,${svgHeight} ${svgWidth/2},0 ${svgWidth},${svgHeight}" fill="#eee"/>
                    <!-- Volcano-specific triangle -->
                    <polygon points="20,${svgHeight} ${svgWidth/2},${peakY} ${svgWidth-20},${svgHeight}" fill="orange"/>
                    <text x="${svgWidth / 2}" y="${peakY - 5}" text-anchor="middle" font-size="10" fill="black">
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
                    ${svgChart}
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
;
});