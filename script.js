
const API_BASE = "https://valorant-api.com/v1";


const agentsPage = document.getElementById("agentsPage");
const mapsPage = document.getElementById("mapsPage");

const navLinks = document.querySelectorAll(".nav-link");

const agentList = document.getElementById("agentList");
const agentCount = document.getElementById("agentCount");
const searchInput = document.getElementById("searchInput");
const roleFilters = document.getElementById("roleFilters");

const agentModal = document.getElementById("agentModal");
const agentDetail = document.getElementById("agentDetail");
const closeAgent = document.getElementById("closeAgent");

const mapList = document.getElementById("mapList");
const mapCount = document.getElementById("mapCount");
const mapSearch = document.getElementById("mapSearch");

const mapModal = document.getElementById("mapModal");
const mapDetail = document.getElementById("mapDetail");
const closeMap = document.getElementById("closeMap");



let agents = [];
let maps = [];

let selectedRole = "all";
let currentPage = "agents";

let agentsLoaded = false;
let mapsLoaded = false;



function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showMessage(container, message) {
  container.innerHTML = `
    <p class="message">${escapeHTML(message)}</p>
  `;
}

function closeAllDetails() {
  agentModal.hidden = true;
  mapModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function openDetail(modal) {
  closeAllDetails();
  modal.hidden = false;
  document.body.classList.add("modal-open");

  const closeButton = modal.querySelector("button");
  closeButton?.focus();
}



navLinks.forEach(button => {
  button.addEventListener("click", () => {
    currentPage = button.dataset.page;

    navLinks.forEach(link => {
      const active = link === button;

      link.classList.toggle("active", active);
      link.setAttribute("aria-current", active ? "page" : "false");
    });

    agentsPage.hidden = currentPage !== "agents";
    mapsPage.hidden = currentPage !== "maps";

    closeAllDetails();

    if (currentPage === "agents" && !agentsLoaded) {
      fetchAgents();
    }

    if (currentPage === "maps" && !mapsLoaded) {
      fetchMaps();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});


async function fetchAgents() {
  showMessage(agentList, "Loading agents...");
  agentCount.textContent = "Memuat agents...";

  try {
    const response = await fetch(
      `${API_BASE}/agents?isPlayableCharacter=true&language=en-US`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    agents = result.data.filter(agent =>
      agent.isPlayableCharacter &&
      agent.displayName &&
      agent.displayIcon
    );

    agentsLoaded = true;
    renderAgents();

  } catch (error) {
    console.error("Agent API error:", error);

    agentCount.textContent = "Gagal memuat";

    agentList.innerHTML = `
      <p class="message">
        Data Agent gagal dimuat. Periksa koneksi internet.
      </p>
      <button class="filter-btn" id="retryAgents">
        Coba Lagi
      </button>
    `;

    document.getElementById("retryAgents")
      .addEventListener("click", fetchAgents);
  }
}


function renderAgents() {
  const keyword = searchInput.value.toLowerCase().trim();

  const filteredAgents = agents.filter(agent => {
    const matchesName = agent.displayName
      .toLowerCase()
      .includes(keyword);

    const matchesRole =
      selectedRole === "all" ||
      agent.role?.displayName === selectedRole;

    return matchesName && matchesRole;
  });

  agentCount.textContent = `${filteredAgents.length} agents`;

  if (!filteredAgents.length) {
    showMessage(agentList, "Agent tidak ditemukan.");
    return;
  }

  agentList.innerHTML = filteredAgents.map(agent => `
    <article
      class="agent-card"
      data-agent-id="${escapeHTML(agent.uuid)}"
      tabindex="0"
      role="button"
      aria-label="Lihat detail ${escapeHTML(agent.displayName)}"
    >
      <img
        src="${escapeHTML(agent.displayIcon)}"
        alt="${escapeHTML(agent.displayName)}"
        loading="lazy"
      >

      <div class="agent-info">
        <h3>${escapeHTML(agent.displayName)}</h3>
        <p class="agent-role">
          ${escapeHTML(agent.role?.displayName || "Unknown Role")}
        </p>
      </div>
    </article>
  `).join("");
}


roleFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-role]");
  if (!button) return;

  selectedRole = button.dataset.role;

  roleFilters.querySelectorAll("[data-role]").forEach(item => {
    const active = item === button;

    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });

  renderAgents();
});

searchInput.addEventListener("input", renderAgents);


function handleAgentCard(event) {
  const card = event.target.closest(".agent-card");
  if (!card) return;

  const agent = agents.find(item =>
    item.uuid === card.dataset.agentId
  );

  if (agent) openAgentDetail(agent);
}

agentList.addEventListener("click", handleAgentCard);

agentList.addEventListener("keydown", event => {
  if (
    !event.target.matches(".agent-card") ||
    !["Enter", " "].includes(event.key)
  ) {
    return;
  }

  event.preventDefault();
  handleAgentCard(event);
});



function openAgentDetail(agent) {
  const abilities = (agent.abilities || []).filter(ability =>
    ability.displayName
  );

  const portrait =
    agent.fullPortraitV2 ||
    agent.fullPortrait ||
    agent.displayIcon;

  const abilityHTML = abilities.length
    ? abilities.map(ability => `
        <article class="ability-item">
          <div class="ability-heading">
            ${
              ability.displayIcon
                ? `
                  <img
                    class="ability-icon"
                    src="${escapeHTML(ability.displayIcon)}"
                    alt=""
                    loading="lazy"
                  >
                `
                : ""
            }

            <div>
              <h4>${escapeHTML(ability.displayName)}</h4>
              <span class="ability-slot">
                ${escapeHTML(ability.slot || "Ability")}
              </span>
            </div>
          </div>

          <p>
            ${escapeHTML(
              ability.description ||
              "Deskripsi skill belum tersedia."
            )}
          </p>
        </article>
      `).join("")
    : '<p class="message">Informasi skill belum tersedia.</p>';

  agentDetail.innerHTML = `
    <div class="agent-detail-layout">

      <section class="agent-detail-left">
        <img
          class="agent-detail-portrait"
          src="${escapeHTML(portrait)}"
          alt="${escapeHTML(agent.displayName)}"
        >

        <div>
          <p class="detail-kicker">AGENT PROFILE</p>

          <h2 class="agent-detail-name">
            ${escapeHTML(agent.displayName)}
          </h2>

          <p class="agent-detail-role">
            ${escapeHTML(agent.role?.displayName || "Unknown Role")}
          </p>
        </div>
      </section>

      <div class="agent-detail-right">

        <section class="agent-detail-section">
          <p class="detail-kicker">01 / CHARACTER LORE</p>
          <h3>Background</h3>

          <p>
            ${escapeHTML(
              agent.description ||
              "Background Agent belum tersedia."
            )}
          </p>
        </section>

        <section class="agent-detail-section">
          <p class="detail-kicker">02 / COMBAT KIT</p>
          <h3>Abilities</h3>

          <div class="ability-list">
            ${abilityHTML}
          </div>
        </section>

      </div>
    </div>
  `;

  openDetail(agentModal);
}



async function fetchMaps() {
  showMessage(mapList, "Loading maps...");
  mapCount.textContent = "Memuat maps...";

  try {
    const response = await fetch(
      `${API_BASE}/maps?language=en-US`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    maps = result.data.filter(map =>
      map.displayName &&
      (
        map.listViewIcon ||
        map.displayIcon ||
        map.splash ||
        map.stylizedBackgroundImage
      )
    );

    mapsLoaded = true;
    renderMaps();

  } catch (error) {
    console.error("Maps API error:", error);

    mapCount.textContent = "Gagal memuat";

    mapList.innerHTML = `
      <p class="message">
        Data Maps gagal dimuat. Periksa koneksi internet.
      </p>
      <button class="filter-btn" id="retryMaps">
        Coba Lagi
      </button>
    `;

    document.getElementById("retryMaps")
      .addEventListener("click", fetchMaps);
  }
}



function getMapImage(map) {
  return (
    map.listViewIcon ||
    map.displayIcon ||
    map.splash ||
    map.stylizedBackgroundImage ||
    ""
  );
}

function getMapDescription(map) {
  return (
    map.tacticalDescription ||
    map.narrativeDescription ||
    "Informasi map belum tersedia."
  );
}



function renderMaps() {
  const keyword = mapSearch.value.toLowerCase().trim();

  const filteredMaps = maps.filter(map =>
    map.displayName.toLowerCase().includes(keyword)
  );

  mapCount.textContent = `${filteredMaps.length} maps`;

  if (!filteredMaps.length) {
    showMessage(mapList, "Map tidak ditemukan.");
    return;
  }

  mapList.innerHTML = filteredMaps.map(map => `
    <article
      class="map-card"
      data-map-id="${escapeHTML(map.uuid)}"
      tabindex="0"
      role="button"
      aria-label="Lihat detail map ${escapeHTML(map.displayName)}"
    >
      <img
        src="${escapeHTML(getMapImage(map))}"
        alt="${escapeHTML(map.displayName)}"
        loading="lazy"
      >

      <div class="map-info">
        <h3>${escapeHTML(map.displayName)}</h3>
        <p>${escapeHTML(getMapDescription(map))}</p>
      </div>
    </article>
  `).join("");
}

mapSearch.addEventListener("input", renderMaps);



function handleMapCard(event) {
  const card = event.target.closest(".map-card");
  if (!card) return;

  const map = maps.find(item =>
    item.uuid === card.dataset.mapId
  );

  if (map) openMapDetail(map);
}

mapList.addEventListener("click", handleMapCard);

mapList.addEventListener("keydown", event => {
  if (
    !event.target.matches(".map-card") ||
    !["Enter", " "].includes(event.key)
  ) {
    return;
  }

  event.preventDefault();
  handleMapCard(event);
});



function openMapDetail(map) {
  const image = getMapImage(map);

  mapDetail.innerHTML = `
    <p class="eyebrow">BATTLEFIELD INTEL</p>

    <h2 class="map-detail-title">
      ${escapeHTML(map.displayName)}
      <span>MAP.</span>
    </h2>

    ${
      image
        ? `
          <img
            class="map-detail-image"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(map.displayName)}"
          >
        `
        : ""
    }

    <p class="map-detail-description">
      ${escapeHTML(getMapDescription(map))}
    </p>

    ${
      map.coordinates
        ? `
          <p class="map-detail-meta">
            COORDINATES: ${escapeHTML(map.coordinates)}
          </p>
        `
        : ""
    }
  `;

  openDetail(mapModal);
}



closeAgent.addEventListener("click", closeAllDetails);
closeMap.addEventListener("click", closeAllDetails);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAllDetails();
  }
});


fetchAgents();
