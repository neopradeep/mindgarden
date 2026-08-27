(function () {
  const STORAGE_KEY = "mindgarden:v1";
  const LEGACY_STORAGE_KEYS = ["learning-priority-app:v1"];
  const COLUMN_ORDER = ["inbox", "focus", "soon", "later"];
  const COLUMN_TITLES = {
    inbox: "Inbox",
    focus: "Focus Now",
    soon: "Explore Soon",
    later: "Later",
  };
  const TYPE_LABELS = {
    learning: "Learning topic",
    term: "Term / jargon",
    idea: "Idea",
  };
  const REVIEW_DAYS = {
    learning: 7,
    term: 2,
    idea: 5,
  };

  function toDateInput(dateLike) {
    return new Date(dateLike).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function addDays(dateLike, days) {
    const next = new Date(dateLike);
    next.setHours(12, 0, 0, 0);
    next.setDate(next.getDate() + days);
    return next.toISOString();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function createItem({ title, notes, type }) {
    const createdAt = nowIso();
    return {
      id: crypto.randomUUID(),
      title: title.trim(),
      notes: notes.trim(),
      type,
      column: "inbox",
      createdAt,
      updatedAt: createdAt,
      lastReviewedAt: createdAt,
      nextReviewAt: addDays(createdAt, REVIEW_DAYS[type]),
    };
  }

  function normalizeItem(raw) {
    const type = TYPE_LABELS[raw.type] ? raw.type : "learning";
    const createdAt = raw.createdAt || nowIso();
    return {
      id: raw.id || crypto.randomUUID(),
      title: (raw.title || "").trim(),
      notes: raw.notes || "",
      type,
      column: COLUMN_ORDER.includes(raw.column) ? raw.column : "inbox",
      createdAt,
      updatedAt: raw.updatedAt || createdAt,
      lastReviewedAt: raw.lastReviewedAt || createdAt,
      nextReviewAt: raw.nextReviewAt || addDays(createdAt, REVIEW_DAYS[type]),
    };
  }

  function normalizeState(rawState) {
    const items = Array.isArray(rawState?.items)
      ? rawState.items.map(normalizeItem).filter((item) => item.title)
      : [];

    return {
      items,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return normalizeState(JSON.parse(raw));
      }

      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyValue = localStorage.getItem(legacyKey);
        if (legacyValue) {
          return normalizeState(JSON.parse(legacyValue));
        }
      }

      return normalizeState({ items: [] });
    } catch (error) {
      console.error("Failed to load saved items.", error);
      return { items: [] };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function sortItems(items) {
    return [...items].sort((left, right) => {
      const leftColumnIndex = COLUMN_ORDER.indexOf(left.column);
      const rightColumnIndex = COLUMN_ORDER.indexOf(right.column);
      if (leftColumnIndex !== rightColumnIndex) {
        return leftColumnIndex - rightColumnIndex;
      }
      return new Date(right.updatedAt) - new Date(left.updatedAt);
    });
  }

  function moveItem(state, itemId, nextColumn) {
    state.items = sortItems(
      state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              column: nextColumn,
              updatedAt: nowIso(),
            }
          : item
      )
    );
    saveState(state);
  }

  function markReviewed(state, itemId, offsetDays = null) {
    state.items = sortItems(
      state.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const reviewedAt = nowIso();
        const nextReviewDays = offsetDays ?? REVIEW_DAYS[item.type];
        return {
          ...item,
          lastReviewedAt: reviewedAt,
          nextReviewAt: addDays(reviewedAt, nextReviewDays),
          updatedAt: reviewedAt,
        };
      })
    );
    saveState(state);
  }

  function getDueItems(items) {
    const now = new Date();
    return items.filter((item) => new Date(item.nextReviewAt) <= now);
  }

  function truncateNotes(notes) {
    if (!notes) {
      return "No notes yet. Add a quick reminder when it helps.";
    }

    return notes.length > 160 ? `${notes.slice(0, 157)}...` : notes;
  }

  function renderReviewList(state) {
    const reviewList = document.getElementById("reviewList");
    const reviewSummary = document.getElementById("reviewSummary");
    const dueItems = getDueItems(state.items);

    if (!dueItems.length) {
      reviewList.className = "review-list empty-state";
      reviewList.textContent = "Review items will appear here when they are due.";
      reviewSummary.textContent = "Nothing due yet.";
      return;
    }

    reviewList.className = "review-list";
    reviewList.replaceChildren();
    reviewSummary.textContent = `${dueItems.length} item${
      dueItems.length === 1 ? "" : "s"
    } ready for a quick revisit.`;

    dueItems
      .sort((left, right) => new Date(left.nextReviewAt) - new Date(right.nextReviewAt))
      .forEach((item) => {
        const wrapper = document.createElement("article");
        wrapper.className = "review-item";

        const header = document.createElement("div");
        header.className = "review-item-header";

        const title = document.createElement("strong");
        title.textContent = item.title;

        const context = document.createElement("span");
        context.textContent = `${TYPE_LABELS[item.type]} · ${COLUMN_TITLES[item.column]}`;

        header.append(title, context);

        const notes = document.createElement("p");
        notes.className = "review-notes";
        notes.textContent = truncateNotes(item.notes);

        const actions = document.createElement("div");
        actions.className = "review-actions";

        const dueLabel = document.createElement("span");
        dueLabel.className = "section-caption";
        dueLabel.textContent = `Due ${toDateInput(item.nextReviewAt)}`;

        const buttonRow = document.createElement("div");

        const reviewButton = document.createElement("button");
        reviewButton.type = "button";
        reviewButton.className = "secondary-button";
        reviewButton.textContent = "Reviewed";
        reviewButton.addEventListener("click", () => {
          markReviewed(state, item.id);
          render(state);
        });

        const tomorrowButton = document.createElement("button");
        tomorrowButton.type = "button";
        tomorrowButton.className = "ghost-button";
        tomorrowButton.textContent = "Tomorrow";
        tomorrowButton.addEventListener("click", () => {
          markReviewed(state, item.id, 1);
          render(state);
        });

        buttonRow.append(reviewButton, tomorrowButton);
        actions.append(dueLabel, buttonRow);
        wrapper.append(header, notes, actions);
        reviewList.append(wrapper);
      });
  }

  function buildEmptyColumnMessage() {
    const empty = document.createElement("div");
    empty.className = "empty-column";
    empty.textContent = "Drag something here when it belongs in this season.";
    return empty;
  }

  function renderBoard(state) {
    const template = document.getElementById("cardTemplate");
    const focusCount = state.items.filter((item) => item.column === "focus").length;
    document.getElementById("focusCount").textContent = String(focusCount);

    COLUMN_ORDER.forEach((column) => {
      const dropZone = document.getElementById(`column-${column}`);
      const items = state.items.filter((item) => item.column === column);
      document.getElementById(`count-${column}`).textContent = String(items.length);
      dropZone.replaceChildren();

      if (!items.length) {
        dropZone.append(buildEmptyColumnMessage());
        return;
      }

      items.forEach((item) => {
        const card = template.content.firstElementChild.cloneNode(true);
        card.dataset.itemId = item.id;
        card.querySelector(".type-pill").textContent = TYPE_LABELS[item.type];
        card.querySelector(".item-title").textContent = item.title;
        card.querySelector(".item-notes").textContent = truncateNotes(item.notes);
        card.querySelector(".next-review").textContent = `Next review ${toDateInput(
          item.nextReviewAt
        )}`;
        card.querySelector(".last-reviewed").textContent = `Last seen ${toDateInput(
          item.lastReviewedAt
        )}`;

        card.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text/plain", item.id);
          event.dataTransfer.effectAllowed = "move";
          card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
        });

        card.querySelector(".review-button").addEventListener("click", () => {
          markReviewed(state, item.id);
          render(state);
        });

        dropZone.append(card);
      });
    });
  }

  function render(state) {
    renderReviewList(state);
    renderBoard(state);
  }

  function setupDragAndDrop(state) {
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        zone.classList.add("is-over");
      });

      zone.addEventListener("dragleave", () => {
        zone.classList.remove("is-over");
      });

      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("is-over");
        const itemId = event.dataTransfer.getData("text/plain");
        const nextColumn = zone.id.replace("column-", "");
        if (!itemId || !COLUMN_ORDER.includes(nextColumn)) {
          return;
        }
        moveItem(state, itemId, nextColumn);
        render(state);
      });
    });
  }

  function setupForm(state) {
    const form = document.getElementById("itemForm");
    const titleInput = document.getElementById("titleInput");
    const typeInput = document.getElementById("typeInput");
    const notesInput = document.getElementById("notesInput");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        return;
      }

      state.items = sortItems([
        createItem({
          title,
          notes: notesInput.value,
          type: typeInput.value,
        }),
        ...state.items,
      ]);
      saveState(state);
      form.reset();
      typeInput.value = "learning";
      titleInput.focus();
      render(state);
    });
  }

  function init() {
    const state = loadState();
    state.items = sortItems(state.items);
    saveState(state);
    setupForm(state);
    setupDragAndDrop(state);
    render(state);
  }

  window.PriorityLearningApp = {
    createItem,
    normalizeState,
    moveItem,
    markReviewed,
    getDueItems,
  };

  init();
})();
