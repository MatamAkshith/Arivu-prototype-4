const params = new URLSearchParams(window.location.search);
const subject = params.get("subject") || "";
const grade = params.get("grade") || "";
const keywords = params.get("keywords") || "";

// YouTube API settings
const API_KEY = "YOUTUBE_API_KEY"; // 🔑 Replace with your actual YouTube API key
const MAX_RESULTS = 12;

const resultsGrid = document.querySelector(".grid");
const loadMoreBtn = document.querySelector(".load-more-btn");

let nextPageToken = null;

// --- Gemini API Setup ---
// IMPORTANT: For prototyping only (not secure for production)
// 🔑 Replace with your Gemini API key
const genAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // simple version, tools disabled for stability
});

// --- Main Functions ---

// Build search query
function buildQuery() {
  return `${keywords} ${subject} ${grade} education`.trim();
}

// Fetch search results from YouTube
function fetchVideos(pageToken = "") {
  const query = buildQuery();
  let url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&type=video&maxResults=${MAX_RESULTS}&q=${encodeURIComponent(
    query
  )}`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data.items || data.items.length === 0) {
        resultsGrid.innerHTML = `<p class="col-span-full text-center text-gray-600">No videos found.</p>`;
        return;
      }

      nextPageToken = data.nextPageToken || null;
      const videoIds = data.items.map((item) => item.id.videoId).join(",");

      fetchVideoDetails(videoIds);
    })
    .catch((err) => {
      console.error("Error fetching search:", err);
      resultsGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to fetch videos.</p>`;
    });
}

// Fetch video details and enrich with Gemini
function fetchVideoDetails(videoIds) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      data.items.forEach(async (video) => {
        const { title, channelTitle, thumbnails } = video.snippet;
        const { viewCount, likeCount } = video.statistics;
        const duration = parseDuration(video.contentDetails.duration);

        // Get grounded summary from Gemini
        const groundedSummary = await getGroundedSummary(
          title,
          channelTitle,
          keywords
        );

        const videoCard = document.createElement("div");
        videoCard.className =
          "video-card bg-white rounded-lg overflow-hidden shadow-md";
        videoCard.innerHTML = `
          <div class="relative pb-[56.25%]">
            <img src="${
              thumbnails.high.url
            }" alt="Video thumbnail" class="absolute h-full w-full object-cover">
            <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              ${duration}
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium text-gray-900 mb-1 line-clamp-2">${title}</h3>
            <p class="text-sm text-gray-600 mb-2">${channelTitle} • ${Number(
          viewCount
        ).toLocaleString()} views</p>
            <div class="flex items-center text-sm text-gray-500">
              <i data-feather="thumbs-up" class="w-4 h-4 mr-1"></i>
              <span>${Number(likeCount || 0).toLocaleString()}</span>
            </div>
            <p class="text-sm text-gray-700 mt-2">${groundedSummary}</p>
            <a href="https://www.youtube.com/watch?v=${
              video.id
            }" target="_blank" class="text-blue-600 text-sm mt-2 inline-block">Watch Video</a>
          </div>
        `;
        resultsGrid.appendChild(videoCard);
      });

      feather.replace(); // refresh icons
    })
    .catch((err) => {
      console.error("Error fetching video details:", err);
    });
}

// Gemini summary function
async function getGroundedSummary(videoTitle, channelName, userQuery) {
  const prompt = `Provide a short summary of the YouTube video titled "${videoTitle}" 
  from the channel "${channelName}". The search keywords were "${userQuery}".`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || "No detailed summary available.";
  } catch (error) {
    console.error("Gemini error:", error);
    return "Summary not available.";
  }
}

// Parse ISO 8601 duration
function parseDuration(iso) {
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || "").replace("H", "") || 0;
  const minutes = (match[2] || "").replace("M", "") || 0;
  const seconds = (match[3] || "").replace("S", "") || 0;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Load initial videos
fetchVideos();

// Handle "Load More"
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    if (nextPageToken) {
      fetchVideos(nextPageToken);
    } else {
      loadMoreBtn.innerHTML = `<i data-feather="plus" class="mr-2 w-4 h-4"></i>No more videos`;
      loadMoreBtn.disabled = true;
      feather.replace();
    }
  });
}
