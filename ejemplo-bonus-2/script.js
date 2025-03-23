fetch('data/horror-movies.csv') // Adjust the path as needed
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        // Parse CSV data
        const movies = Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
        }).data;

        // Filter out movies with missing values and votes less than or equal to 57618
        const filteredMovies = movies.filter(movie => 
            movie.movie_name && 
            movie.rating != null && 
            movie.votes != null && 
            movie.votes > 57618
        );

        // Create a new array with only movie_name, rating, and votes
        const NameRatingVotes = filteredMovies.map(movie => ({
            movie_name: movie.movie_name,
            rating: movie.rating,
            votes: movie.votes // Assuming votes is a numeric value
        }));

        // Sort the array by rating in descending order
        NameRatingVotes.sort((a, b) => b.rating - a.rating);

        // Get the top 10 movies
        const topMovies = NameRatingVotes.slice(0, 10);

        // Prepare data for the plot
        const names = topMovies.map(movie => movie.movie_name).reverse();
        const ratings = topMovies.map(movie => movie.rating).reverse();

        

        let plotData = [
            {
                x: ratings,
                y: names,
                type: 'bar',
                orientation: 'h',
                text: names, // Add this line to display movie names inside the bars
                textposition: 'inside', // Position text inside the bars
                marker: {
                    color: ratings.map((d, i) => i >= 7 && i <= 10 ? 'rgb(141, 18, 18)' : 'rgb(19, 8, 8)'),
                    hovertemplate: '( %{x:.2f}, %{y} )',
                },
                
            }
        ];

        let layout = {
            yaxis: {
                showticklabels: false, // Show movie names on the y-axis
                zeroline: false,
                showgrid: false, // Hide grid lines on the y-axis
                automargin: false, // Automatically adjust margins
                textposition: 'inside',


            },
            xaxis: {
                title: 'Rating', 
                showticklabels: false,
                showgrid: false
            },
            margin: {
                l: 50, // Left margin
                r: 50, // Right margin
                t: 150, // Top margin
                b: 50  // Bottom margin
            },
            paper_bgcolor: 'rgba(0, 0, 0, 0)', // Transparent background for the entire plot
            plot_bgcolor: 'rgba(0, 0, 0, 0)'
        };

        Plotly.newPlot('myPlot', plotData, layout);

        let currentAudio = null; // Variable to hold the currently playing audio

document.getElementById('myPlot').on('plotly_click', function(data) {
    // Get the title of the clicked bar
    let title = data.points[0].y;

    // Stop the currently playing audio if it exists
    if (currentAudio) {
        currentAudio.pause(); // Pause the current audio
        currentAudio.currentTime = 0; // Reset the current time to the beginning
    }

    // Create a new audio object based on the clicked title
    if (title == "Alien") {
        console.log("Alien");
        currentAudio = new Audio("audios/alien.mp3");
        currentAudio.play();
    } else if (title == "Psycho") {
        console.log("Psycho");
        currentAudio = new Audio("audios/psycho.mp3");
        currentAudio.play();
    } else if (title == "The Shining") {
        console.log("The Shining");
        currentAudio = new Audio("audios/heres-johnny.mp3");
        currentAudio.play();
    }
});
    })
    .catch(error => {
        console.error('No se pudo leer el archivo:', error);
    });