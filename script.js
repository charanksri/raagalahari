// Function to authenticate and get access token
async function authenticate() {
  const clientId = "737cd1dc8e6a4dee9c73becd0e05eb47";
  const clientSecret = "ea1fb28132544f7fae62b4fc13368eb7";

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate");
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error; // Rethrow error to handle it outside
  }
}

// Function to search tracks from Spotify API and populate autofill suggestions
async function populateAutofill(query) {
  const accessToken = await authenticate(); // Get the access token

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=5`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tracks");
    }

    const data = await response.json();

    // Filter tracks based on country code "IN"
    const filteredTracks = data.tracks.items.filter((item) => {
      const countryCode = item.external_ids.isrc.substring(0, 2);
      return countryCode === "IN";
    });

    const trackNames = filteredTracks.map((track) => track.name);

    // Clear previous suggestions
    const autofillSuggestions = document.getElementById("autofillSuggestions");
    autofillSuggestions.innerHTML = "";

    // Populate with new suggestions
    trackNames.forEach((track) => {
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item"); // Add Bootstrap class
      listItem.textContent = track;
      listItem.addEventListener("click", () => {
        document.getElementById("searchInput").value = track;
        autofillSuggestions.innerHTML = ""; // Clear suggestions after selecting
      });
      autofillSuggestions.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error searching tracks:", error);
    // Handle error accordingly
  }
}

// Attach event listener for input field
document.getElementById("searchInput").addEventListener("input", (event) => {
  const query = event.target.value.trim(); // Trim whitespace
  if (query.length > 0) {
    // Check if query is not empty
    populateAutofill(query);
  } else {
    // Clear autofill suggestions if query is empty
    const autofillSuggestions = document.getElementById("autofillSuggestions");
    autofillSuggestions.innerHTML = "";
  }
});

// Function to fetch track details by track ID
async function fetchTrackDetails(trackId, accessToken) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch track details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching track details:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const audioPlayer = document.getElementById("audioPlayer");
  const trackButtons = document.querySelectorAll(".button-container button");
  let currentIndex = 0;
  // Global variables to track status messages
  let wrongAnswersCount = 0;
  let skippedCount = 0;

  // Array of track URLs
  const trackURLs = [
    "https://github.com/charanksri/raagalahari/raw/main/hint1.mp3",
    "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint2.mp3",
    "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint3.mp3",
    "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint4.mp3",
    "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint5.mp3",
  ];

  // Define the correct answer track name
  const correctAnswerTrackName = "Gappu Chippu";

  // Function to reveal next button and track
  function revealNextTrack() {
    if (currentIndex < trackButtons.length) {
      trackButtons[currentIndex].classList.remove("d-none"); // Revealing next button
      audioPlayer.src = trackURLs[currentIndex]; // Setting the next track
      audioPlayer.play(); // Start playing the track
      currentIndex++; // Increment index for the next track
    }
  }

  // Function to reveal all tracks
  function revealAllTracks() {
    for (let i = 0; i < trackButtons.length; i++) {
      trackButtons[i].classList.remove("d-none"); // Revealing all buttons
    }
  }

  // Function to disable submit and skip buttons
  function disableButtons() {
    document.getElementById("submitButton").disabled = true;
    document.getElementById("skipTrack").disabled = true;
  }

  // Initialize game stats
  let gameStats = {
    timesPlayed: 0,
    timesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };

  // Update game stats function
  function updateGameStats() {
    document.getElementById("timesPlayed").textContent = gameStats.timesPlayed;
    document.getElementById("timesWon").textContent = gameStats.timesWon;
    document.getElementById("winPercentage").textContent =
      gameStats.timesPlayed === 0
        ? "0%"
        : ((gameStats.timesWon / gameStats.timesPlayed) * 100).toFixed(2) + "%";
    document.getElementById("currentStreak").textContent =
      gameStats.currentStreak;
    document.getElementById("maxStreak").textContent = gameStats.maxStreak;

    // Clear previous distribution
    const guessDistribution = document.getElementById("guessDistribution");
    guessDistribution.innerHTML = "";

    // Populate new distribution
    for (let guess in gameStats.guessDistribution) {
      const listItem = document.createElement("li");
      listItem.textContent = `Guess ${guess}: ${gameStats.guessDistribution[guess]}`;
      guessDistribution.appendChild(listItem);
    }
  }

  // Function to update guess distribution
  function updateGuessDistribution(guess) {
    gameStats.guessDistribution[guess]++;
    updateGameStats();
  }

  // Function to update streak
  function updateStreak() {
    gameStats.currentStreak++;
    gameStats.maxStreak = Math.max(
      gameStats.maxStreak,
      gameStats.currentStreak
    );
    updateGameStats();
  }

  // Function to reset streak
  function resetStreak() {
    gameStats.currentStreak = 0;
    updateGameStats();
  }

  // Attach click event listeners to each track button
  for (let i = 1; i <= trackURLs.length; i++) {
    const buttonId = "track" + i;
    document.getElementById(buttonId).addEventListener("click", function () {
      updateGuessDistribution(i);
    });
  }

  // Function to add status message
  function addStatus(message, color) {
    const statusContainer = document.getElementById("statusContainer");
    const statusElement = document.createElement("div");
    statusElement.classList.add("status");
    statusElement.style.backgroundColor = color;
    statusElement.innerHTML = message; // Set the HTML content with Unicode character
    statusContainer.appendChild(statusElement);
  }

  // Function to show share buttons
  function showShareButtons() {
    const shareContainer = document.getElementById("shareContainer");
    shareContainer.style.display = "block";
  }

  // Function to share on Twitter
  function shareOnTwitter() {
    const url =
      "https://twitter.com/intent/tweet?text=Your%20message%20here&url=YourURLHere";
    window.open(url, "_blank");
  }

  // Function to share on WhatsApp
  function shareOnWhatsApp() {
    const url = "https://api.whatsapp.com/send?text=Your%20message%20here";
    window.open(url, "_blank");
  }

  // Function to share on Facebook
  function shareOnFacebook() {
    const url = "https://www.facebook.com/sharer/sharer.php?u=YourURLHere";
    window.open;
  }

  // Attach click event listeners to share buttons
  document
    .getElementById("twitterShareBtn")
    .addEventListener("click", shareOnTwitter);
  document
    .getElementById("whatsappShareBtn")
    .addEventListener("click", shareOnWhatsApp);
  document
    .getElementById("facebookShareBtn")
    .addEventListener("click", shareOnFacebook);

  // Attach click event listener to skip button
  document.getElementById("skipTrack").addEventListener("click", () => {
    revealNextTrack();
    if (skippedCount + wrongAnswersCount < 4) {
      // Add status for skipped
      addStatus(
        "<span class='bi bi-ban' style='color: white;'></span> Skipped",
        "#dc3545"
      );
      skippedCount++;
    } else {
      addStatus(
        "<span class='bi bi-ban' style='color: white;'></span> Skipped",
        "#dc3545"
      );
      addStatus(
        "<span class='bi bi-dash-circle' style='color: white;'></span> Out of guesses",
        "#2330AE"
      ); // Add status for out of guesses
      disableButtons(); // Disable buttons after out of guesses
      resetStreak();
      // Display the correct answer
      const correctAnswerMessage = document.createElement("div");
      correctAnswerMessage.innerHTML = `The correct answer is <span class="text-success">${correctAnswerTrackName}</span>`;
      statusContainer.appendChild(correctAnswerMessage);
      loadTrack(0)();
      showShareButtons();
    }
  });

  // Play the first track when the page loads
  audioPlayer.src = trackURLs[currentIndex];
  audioPlayer.play(); // Start playing the first track
  currentIndex++; // Move to the next track

  // Function to play a specific track
  function playTrack(index) {
    return function () {
      audioPlayer.src = trackURLs[index];
      audioPlayer.play();
    };
  }

  // Function to play a specific track
  function loadTrack(index) {
    return function () {
      audioPlayer.src = trackURLs[index];
      audioPlayer.load();
    };
  }

  // Attach click event listeners to each track button
  for (let i = 1; i <= trackURLs.length; i++) {
    const buttonId = "track" + i;
    document
      .getElementById(buttonId)
      .addEventListener("click", playTrack(i - 1));
  }

  // Function to handle submit button click
  document.getElementById("submitButton").addEventListener("click", () => {
    const userInput = document.getElementById("searchInput").value.trim();
    if (userInput === correctAnswerTrackName) {
      revealAllTracks(); // If user input matches the correct answer, reveal all tracks
      addStatus(
        `<span class='bi bi-check-circle' style='color: white;'></span> ${userInput}`,
        "#28a745"
      ); // Checkmark icon
      disableButtons(); // Disable buttons after correct answer
      gameStats.timesWon++;
      updateStreak();
      showShareButtons();
    } else {
      revealNextTrack();
      if (skippedCount + wrongAnswersCount < 4) {
        // Add status for wrong answer
        addStatus(
          `<span class='bi bi-ban' style='color: white;'></span> ${userInput}`,
          "#dc3545"
        );
        // Display the user-submitted track name
        wrongAnswersCount++;
      } else {
        addStatus(
          "<span class='bi bi-ban' style='color: white;'></span> Skipped",
          "#dc3545"
        );
        addStatus(
          "<span class='bi bi-dash-circle' style='color: white;'></span> Out of guesses",
          "#2330AE"
        ); // Add status for out of guesses
        disableButtons(); // Disable buttons after out of guesses
        // Display the correct answer
        const correctAnswerMessage = document.createElement("div");
        correctAnswerMessage.innerHTML = `The correct answer is <span class="text-success">${correctAnswerTrackName}</span>`;
        statusContainer.appendChild(correctAnswerMessage);
        showShareButtons();
        loadTrack(0)();
        resetStreak();
      }
    }
    gameStats.timesPlayed++;
    updateGameStats();
    // Clear the input field after submission
    document.getElementById("searchInput").value = "";
  });
  // Initialize game stats
  updateGameStats();
  // Play the first track when the page loads
  playTrack(0)();
});
