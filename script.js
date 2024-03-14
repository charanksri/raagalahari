// Array of track URLs for each button
const trackUrls = [
  "https://github.com/charanksri/raagalahari/raw/main/hint1.mp3",
  "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint2.mp3",
  "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint3.mp3",
  "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint4.mp3",
  "https://raw.githubusercontent.com/charanksri/raagalahari/main/hint5.mp3",
];

// Initialize variables
let currentTrackIndex = 1;
const correctTrackName = "Gappu Chippu"; // Replace with the correct track name

// Function to reveal all buttons and tracks
function revealAllButtons() {
  for (let i = 0; i < trackUrls.length; i++) {
    const buttonId = "button" + (i + 1);
    const trackUrl = trackUrls[i];
    showButton(buttonId, trackUrl);
  }
}

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

// Function to display track information
async function displayTrackInfo(trackName, accessToken) {
  const query = encodeURIComponent(trackName);
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch track information");
    }

    const data = await response.json();
    const track = data.tracks.items[0];
    const trackDetails = await fetchTrackDetails(track.id, accessToken);

    // Extract country code from ISRC
    const countryCode = trackDetails.external_ids.isrc.substring(0, 2);

    // Display track information
    const trackInfoContainer = document.getElementById("trackInfo");
    trackInfoContainer.innerHTML = `
      <h2>${trackDetails.name}</h2>
      <p>Artist: ${trackDetails.artists
        .map((artist) => artist.name)
        .join(", ")}</p>
      <p>Album: ${trackDetails.album.name}</p>
      <p>Country Code: ${countryCode}</p>
      <img src="${
        trackDetails.album.images[0].url
      }" alt="Album Art" style="max-width: 100%; height: auto;">
    `;
  } catch (error) {
    console.error("Error displaying track information:", error);
    // Handle error accordingly
  }
}

// Initialize variables to track guesses and skips
let incorrectGuessesCount = 0;
let skipsCount = 0;

// Function to handle track submission
async function handleTrackSubmission(trackName) {
  const displayedTrackName = document
    .getElementById("trackInfo")
    .querySelector("h2").textContent;
  const guessesContainer = document.getElementById("guesses");

  // Create a new guess element
  const guessElement = document.createElement("div");

  // Determine if the guess is correct or skipped
  const isCorrectGuess =
    trackName.toLowerCase() === correctTrackName.toLowerCase();
  const isSkipped = trackName.trim() === "";
}

// Attach event listener to the skip button
document.getElementById("skipButton").addEventListener("click", async () => {
  // Increment skips count
  skipsCount++;

  // Reveal the next hidden button
  const hiddenButton = document.querySelector(".buttons button.hidden");
  if (hiddenButton) {
    hiddenButton.classList.remove("hidden");
  }

  // Handle the skip button click
  handleTrackSubmission("");

  // Display the skipped message
  const skipMessage = document.createElement("div");
  skipMessage.classList.add("guess", "skipped");
  skipMessage.innerHTML = `<i class="fas fa-exclamation"></i> Skipped`;
  const guessesContainer = document.getElementById("guesses");
  guessesContainer.appendChild(skipMessage);

  // Disable both submit and skip buttons if the sum of incorrect guesses and skips is 5
  if (incorrectGuessesCount + skipsCount === 5) {
    document.getElementById("searchInput").disabled = true;
    document.getElementById("submitButton").disabled = true;
    document.getElementById("skipButton").disabled = true;

    // Display out of guesses message and reveal correct answer
    const outOfGuessesMessage = document.createElement("div");
    outOfGuessesMessage.classList.add("guess", "out-of-guesses");
    outOfGuessesMessage.textContent = "Out of guesses";
    const guessesContainer = document.getElementById("guesses");
    guessesContainer.appendChild(outOfGuessesMessage);

    // Reveal the correct answer
    const correctAnswerElement = document.createElement("div");
    correctAnswerElement.classList.add("guess", "correct-answer");
    correctAnswerElement.textContent = `Correct answer: ${correctTrackName} from Tagore`;
    guessesContainer.appendChild(correctAnswerElement);
  }
});

// Attach event listener to the submit button
document.getElementById("submitButton").addEventListener("click", async () => {
  const selectedTrack = document.getElementById("searchInput").value.trim(); // Trim whitespace

  // Check if the input field is empty
  if (selectedTrack === "") {
    // If the input field is empty, do nothing
    return;
  }

  // Proceed with handling the track submission
  const accessToken = await authenticate(); // Get the access token
  await displayTrackInfo(selectedTrack, accessToken);

  // Create a new guess element
  const guessElement = document.createElement("div");
  const guessesContainer = document.getElementById("guesses");

  // Determine if the guess is correct, incorrect, or skipped
  const displayedTrackName = document
    .getElementById("trackInfo")
    .querySelector("h2").textContent;
  const isCorrectGuess =
    selectedTrack.toLowerCase() === correctTrackName.toLowerCase();
  const isSkipped = selectedTrack.trim() === "";
  const isIncorrectGuess = !isCorrectGuess && !isSkipped;

  // Increment incorrect guesses count if the guess is not skipped and incorrect
  if (isIncorrectGuess) {
    incorrectGuessesCount++;
  }

  // Display the guess with appropriate styling and icon
  if (isCorrectGuess) {
    guessElement.classList.add("guess", "correct");
    guessElement.innerHTML = `<i class="fas fa-check"></i> ${selectedTrack}`;
    document.getElementById("answerMessage").style.display = "block";

    // Reveal all buttons if the guess is correct
    revealAllButtons();
  } else if (isIncorrectGuess) {
    guessElement.classList.add("guess", "incorrect");
    guessElement.innerHTML = `<i class="fas fa-times"></i> ${selectedTrack}`;
  }

  // Append the guess element to the guesses container
  guessesContainer.appendChild(guessElement);

  // If the guess is correct or skipped, display the appropriate message and disable buttons
  if (incorrectGuessesCount + skipsCount === 5) {
    document.getElementById("submitButton").disabled = true;
    document.getElementById("searchInput").disabled = true;
    document.getElementById("skipButton").disabled = true;

    // Display out of guesses message and reveal correct answer
    const outOfGuessesMessage = document.createElement("div");
    outOfGuessesMessage.classList.add("guess", "out-of-guesses");
    outOfGuessesMessage.textContent = "Out of guesses";
    const guessesContainer = document.getElementById("guesses");
    guessesContainer.appendChild(outOfGuessesMessage);

    // Reveal the correct answer
    const correctAnswerElement = document.createElement("div");
    correctAnswerElement.classList.add("guess", "correct-answer");
    correctAnswerElement.textContent = `Correct answer: ${correctTrackName} from Tagore`;
    guessesContainer.appendChild(correctAnswerElement);
  }

  // Clear the text box after submitting
  document.getElementById("searchInput").value = "";

  // Reveal the next hidden button
  const hiddenButton = document.querySelector(".buttons button.hidden");
  if (hiddenButton) {
    hiddenButton.classList.remove("hidden");
  }
});

// Function to handle track selection
function handleTrackSelection(trackUrl, buttonId) {
  // Remove the "selected" class from all buttons
  document.querySelectorAll(".buttons button").forEach((button) => {
    button.classList.remove("selected");
  });

  // Add the "selected" class to the clicked button
  document.getElementById(buttonId).classList.add("selected");

  // Play the selected track
  const audioElement = document.getElementById("audioPlayer");
  audioPlayer.src = trackUrl;
  audioPlayer.load();
  audioPlayer.play();

  // Clear previous track details
  const trackInfoContainer = document.getElementById("trackInfo");
  trackInfoContainer.innerHTML = "";
}

// Function to show a button and handle its click event
function showButton(buttonId, trackUrl) {
  const button = document.getElementById(buttonId);
  button.classList.remove("hidden");
  button.addEventListener("click", () => handleTrackSelection(trackUrl));
}

// Function to initialize the buttons
function initializeButtons() {
  // Hide buttons 2 to 5 initially
  for (let i = 2; i <= 5; i++) {
    document.getElementById("button" + i).classList.add("hidden");
  }
}

// Show button 1 initially
document.getElementById("button1").classList.remove("hidden");

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Button click event listener for each button
  document.querySelectorAll(".buttons button").forEach((button) => {
    button.addEventListener("click", () => {
      const trackUrl = trackUrls[parseInt(button.textContent) - 1]; // Get track URL based on button number
      handleTrackSelection(trackUrl, button.id);
    });
  });
});
