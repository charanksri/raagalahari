// Function to authenticate and get access token
async function authenticate() {
const clientId = "<YOUR_SPOTIFY_CLIENT_ID>";
const clientSecret = "<YOUR_SPOTIFY_CLIENT_SECRET>";

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

function updateStats() {
  // Retrieve saved statistics from local storage
  const savedStats = JSON.parse(localStorage.getItem("gameStats")) || {};

  // Update HTML elements with saved statistics
  document.getElementById("timesPlayed").textContent =
    savedStats.timesPlayed || 0;
  document.getElementById("timesWon").textContent = savedStats.timesWon || 0;

  // Calculate and display win percentage
  const timesPlayed = savedStats.timesPlayed || 0;
  const timesWon = savedStats.timesWon || 0;
  const winPercentage =
    timesPlayed === 0 ? 0 : ((timesWon / timesPlayed) * 100).toFixed(1);
  document.getElementById("winPercentage").textContent = winPercentage + "%";

  // Display guess distribution
  const guessDistribution = document.getElementById("guessDistribution");
  guessDistribution.innerHTML = ""; // Clear previous contents
  const guessList = document.createElement("ul"); // Create <ul> element
  for (const [guess, count] of Object.entries(
    savedStats.guessDistribution || {}
  )) {
    const listItem = document.createElement("li"); // Create <li> element
    listItem.textContent = `Guess ${guess}: ${count}`;
    guessList.appendChild(listItem); // Append <li> to <ul>
  }
  guessDistribution.appendChild(guessList); // Append <ul> to guessDistribution container
  document.getElementById("currentStreak").textContent =
    savedStats.currentStreak || 0;
  document.getElementById("maxStreak").textContent = savedStats.maxStreak || 0;
}

// Call the updateStats function initially
updateStats();

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
  let trackButtons; // Define trackButtons variable
  let currentIndex = 0;
  // Global variables to track status messages
  let wrongAnswersCount = 0;
  let skippedCount = 0;
  let guessesLeft = 5; // Total number of guesses allowed
  let gameCondition = 0;
  loadStatusContainerState(); // Call the function to load status container state
  loadShareContainerState();
  loadButtonContainerState();

  // Function to initialize trackButtons and currentIndex
  function initialize() {
    trackButtons = document.querySelectorAll(".button-container button");
    // Retrieve currentIndex from localStorage if available
    const savedGameState = JSON.parse(localStorage.getItem("gameState"));
    if (savedGameState) {
      currentIndex = savedGameState.currentIndex || 0;
    }
  }

  initialize(); // Call initialize function when DOM content is loaded

  // Check for saved game state in localStorage
  const savedGameState = JSON.parse(localStorage.getItem("gameState"));
  if (savedGameState) {
    currentIndex = savedGameState.currentIndex;
    wrongAnswersCount = savedGameState.wrongAnswersCount;
    skippedCount = savedGameState.skippedCount;
    guessesLeft = savedGameState.guessesLeft;
    // Check game status and take action accordingly
    if (savedGameState.gameStatus === "game_completed") {
      revealAllTracks();
      disableButtons();
      // Remove "Guesses left" message
      const guessesLeftText = document.getElementById("guessesLeftText");
      guessesLeftText.textContent = "";
    } else {
      updateGuessesLeftText();
    }
  }

  function updateGameState() {
    // Save game state to localStorage
    const gameState = {
      currentIndex: currentIndex,
      wrongAnswersCount: wrongAnswersCount,
      skippedCount: skippedCount,
      guessesLeft: guessesLeft,
      gameStatus: getGameStatus(), // Update game status
      trackButtonsLength: trackButtons.length, // Include trackButtons.length
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
  }

  // Function to save the state of the button container
  function saveButtonContainerState() {
    const buttonContainer = document.querySelector(".button-container");
    const buttonContainerHTML = buttonContainer.innerHTML;
    localStorage.setItem("buttonContainerState", buttonContainerHTML);
  }

  // Function to load the state of the button container
  function loadButtonContainerState() {
    const buttonContainer = document.querySelector(".button-container");
    const savedState = localStorage.getItem("buttonContainerState");
    if (savedState) {
      buttonContainer.innerHTML = savedState;
    }
  }

  // Function to save the state of the status container to local storage
  function saveStatusContainerState() {
    // Retrieve the status container element
    const statusContainer = document.getElementById("statusContainer");
    // Serialize the state (in this case, we'll save the HTML content of the status container)
    const serializedState = statusContainer.innerHTML;
    // Save the serialized state to local storage
    localStorage.setItem("statusContainerState", serializedState);
  }

  // Function to load the status container state from local storage
  function loadStatusContainerState() {
    const savedStatusContainerState = localStorage.getItem(
      "statusContainerState"
    );
    if (savedStatusContainerState) {
      // Restore the status container state from the saved state
      const statusContainer = document.getElementById("statusContainer");
      statusContainer.innerHTML = savedStatusContainerState;
    }
  }

  // Function to save the state of the share container
  function saveShareContainerState() {
    const shareContainer = document.getElementById("shareContainer");
    const isDisplayed =
      window.getComputedStyle(shareContainer).display !== "none";
    localStorage.setItem("shareContainerState", JSON.stringify(isDisplayed));
  }

  // Function to load the state of the share container
  function loadShareContainerState() {
    const shareContainer = document.getElementById("shareContainer");
    const savedState = localStorage.getItem("shareContainerState");
    if (savedState) {
      const isDisplayed = JSON.parse(savedState);
      if (isDisplayed) {
        shareContainer.style.display = "block";
      } else {
        shareContainer.style.display = "none";
      }
    }
  }

  // Load game stats from local storage or initialize if not available
  let gameStats = JSON.parse(localStorage.getItem("gameStats")) || {
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
  // Play the first track when the page loads
  audioPlayer.src = trackURLs[currentIndex];
  audioPlayer.play(); // Start playing the first track

  // Function to handle successful game completion
  function handleGameCompletion() {
    // Calculate the guess number
    const guessNumber = calculateGuessNumber();

    // Update game statistics
    let savedStats = JSON.parse(localStorage.getItem("gameStats")) || {};
    savedStats.timesPlayed = (savedStats.timesPlayed || 0) + 1;
    savedStats.timesWon = (savedStats.timesWon || 0) + 1;
    savedStats.currentStreak = (savedStats.currentStreak || 0) + 1;
    savedStats.maxStreak = Math.max(
      savedStats.maxStreak || 0,
      savedStats.currentStreak || 0
    );

    // Update guess distribution
    savedStats.guessDistribution = savedStats.guessDistribution || {};
    savedStats.guessDistribution[guessNumber] =
      (savedStats.guessDistribution[guessNumber] || 0) + 1;

    // Store the updated statistics
    localStorage.setItem("gameStats", JSON.stringify(savedStats));

    // Update statistics dynamically
    updateStats();
  }

  // Function to handle unsuccessful game completion
  function handleUnsuccessfulGame() {
    // Update game statistics
    let savedStats = JSON.parse(localStorage.getItem("gameStats")) || {};
    savedStats.timesPlayed = (savedStats.timesPlayed || 0) + 1;
    savedStats.currentStreak = 0; // Reset current streak on unsuccessful game
    localStorage.setItem("gameStats", JSON.stringify(savedStats));

    // Update statistics dynamically
    updateStats();
  }

  function revealNextTrack() {
    if (currentIndex < trackButtons.length - 1) {
      trackButtons[currentIndex + 1].classList.remove("d-none"); // Revealing next button
      console.log("Next button revealed:", trackButtons[currentIndex + 1].id); // Log the ID of the revealed button
      audioPlayer.src = trackURLs[currentIndex + 1]; // Setting the next track
      audioPlayer.play(); // Start playing the track
      currentIndex++; // Increment index for the next track
      updateGameState(); // Save game state after track change
      console.log("Current Index:", currentIndex); // Log current index for debugging
    } else {
      console.log("All tracks revealed."); // Log if all tracks are revealed
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

  // Function to update guesses left text
  function updateGuessesLeftText() {
    const guessesLeftText = document.getElementById("guessesLeftText");
    guessesLeftText.innerHTML = `You have <strong>${guessesLeft}</strong> out of <strong>5</strong> guesses left`;
  }

  // Function to calculate guess number
  function calculateGuessNumber() {
    return 6 - guessesLeft;
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
    const guessNumber = calculateGuessNumber();
    const message = generateGuessMessage(guessNumber);
    const url =
      "https://twitter.com/intent/tweet?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  }

  // Function to share on WhatsApp
  function shareOnWhatsApp() {
    const guessNumber = calculateGuessNumber();
    const message = generateGuessMessage(guessNumber);
    const url =
      "https://api.whatsapp.com/send?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  }

  // Function to share on Facebook
  function shareOnFacebook() {
    const guessNumber = calculateGuessNumber();
    const message = generateGuessMessage(guessNumber);
    const url =
      "https://www.facebook.com/sharer/sharer.php?u=raagalahari.netlify.app&quote=" +
      encodeURIComponent(message);
    window.open(url);
  }

  // Function to generate the guess message
  function generateGuessMessage(guessNumber) {
    let message = "Raagalahari: ";
    if (guessNumber > 5 || guessNumber === 0) {
      for (let i = 0; i < 5; i++) {
        message += "🟥"; // Red square for all guesses if out of guesses or 0 guesses left
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        if (i < guessNumber) {
          message += "🟥"; // Red square for incorrect guesses before the correct one
        } else if (i === guessNumber) {
          message += "🟩"; // Green square for the correct guess
        } else {
          message += "⬛"; // Black square for guesses after the correct one
        }
      }
    }
    return message + "\nCheck out this music game: raagalahari.netlify.app";
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
    saveButtonContainerState();
    if (skippedCount + wrongAnswersCount < 4) {
      // Add status for skipped
      addStatus(
        "<span class='bi bi-ban' style='color: white;'></span> Skipped",
        "#dc3545"
      );
      skippedCount++;
      guessesLeft--;
      updateGuessesLeftText();
      updateGameState(); // Save game state after skip
      saveStatusContainerState();
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
      saveStatusContainerState();
      skippedCount++;
      guessesLeft--;
      // Display the correct answer
      const correctAnswerMessage = document.createElement("div");
      correctAnswerMessage.innerHTML = `The correct answer is <span class="text-success">${correctAnswerTrackName}</span>`;
      statusContainer.appendChild(correctAnswerMessage);
      loadTrack(0)();
      showShareButtons();
      saveShareContainerState();
      // Remove "Guesses left" message
      const guessesLeftText = document.getElementById("guessesLeftText");
      guessesLeftText.textContent = "";
      handleUnsuccessfulGame(); // Call handleUnsuccessfulGame when the user loses
      updateGameState(); // Save game state after skip
    }
  });

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
    if (!userInput) {
      // Check if the input is empty
      alert("Please enter a track name before submitting.");
      return; // Exit the function if input is empty
    }
    if (userInput === correctAnswerTrackName) {
      revealAllTracks(); // If user input matches the correct answer, reveal all tracks
      addStatus(
        `<span class='bi bi-check-circle' style='color: white;'></span> ${userInput}`,
        "#28a745"
      ); // Checkmark icon
      disableButtons(); // Disable buttons after correct answer
      showShareButtons();
      saveShareContainerState();
      handleGameCompletion();
      gameCondition++;
      // Remove "Guesses left" message
      const guessesLeftText = document.getElementById("guessesLeftText");
      guessesLeftText.textContent = "";
      updateGameState(); // Save game state after skip
      saveStatusContainerState();
    } else {
      revealNextTrack();
      saveButtonContainerState();
      if (skippedCount + wrongAnswersCount < 4) {
        // Add status for wrong answer
        addStatus(
          `<span class='bi bi-ban' style='color: white;'></span> ${userInput}`,
          "#dc3545"
        );
        // Display the user-submitted track name
        wrongAnswersCount++;
        guessesLeft--;
        updateGuessesLeftText();
        updateGameState(); // Save game state after skip
        saveStatusContainerState();
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
        wrongAnswersCount++;
        guessesLeft--;
        // Display the correct answer
        const correctAnswerMessage = document.createElement("div");
        correctAnswerMessage.innerHTML = `The correct answer is <span class="text-success">${correctAnswerTrackName}</span>`;
        statusContainer.appendChild(correctAnswerMessage);
        showShareButtons();
        saveShareContainerState();
        updateGameState(); // Save game state after skip
        loadTrack(0)();
        // Remove "Guesses left" message
        const guessesLeftText = document.getElementById("guessesLeftText");
        guessesLeftText.textContent = "";
        handleUnsuccessfulGame(); // Call handleUnsuccessfulGame when the user loses
        saveStatusContainerState();
      }
    }
    // Clear the input field after submission
    document.getElementById("searchInput").value = "";
  });
  // Function to get the game status
  function getGameStatus() {
    if (wrongAnswersCount + skippedCount > 4 || gameCondition > 0) {
      return "game_completed";
    } else {
      return "in_progress";
    }
  }
  // Play the first track when the page loads
  playTrack(0)();
});
