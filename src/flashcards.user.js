// ==UserScript==
// @name         Yabla Flashcard Creator
// @namespace    https://spencerpogo.com
// @version      0.1
// @description  Flashcard creator for Yabla Chinese Dictionary
// @author       Spencer Pogorzelski
// @match        https://chinese.yabla.com/chinese-english-pinyin-dictionary.php?*define=*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  const API_URL = "{{ API_URL }}";
  const AUTH_TOKEN = "{{ AUTH_TOKEN }}";

  async function addCard(card) {
    console.log("Adding card:", card);
    const req = await fetch(API_URL + "/cards", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify(card),
    });
    if (req.status != 200) throw new Error("status");
  }

  async function removeCard(card) {
    console.log("Removing card:", card);
    const req = await fetch(API_URL + "/cards", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify({ term: card.term }),
    });
    if (req.status != 200) throw new Error("status");
  }

  // class prefix to avoid conflicts
  const prefix = "sp-flashcard-creator";

  const removeAllByClass = (className) => {
    // must freeze with Array.from as remove mutates collection, breaking iteration
    for (const elt of Array.from(document.getElementsByClassName(className))) {
      elt.remove();
    }
  };

  const btnClass = `${prefix}-btn`;
  const styleClass = `${prefix}-style`;
  const loaderClass = `${prefix}-loader`;
  for (const cls of [btnClass, styleClass, loaderClass]) {
    removeAllByClass(cls);
  }

  const styles = `
    .${btnClass} {
      cursor: pointer;
    }
  `;

  const style = document.createElement("style");
  style.classList.add(styleClass);
  style.innerText = styles;
  (document.head || document.body || document.documentElement).appendChild(
    style
  );

  const entries = document.querySelectorAll(".entry");
  for (const entry of entries) {
    const term = entry.querySelector(".word").innerText.trim();
    const pinyin = entry.querySelector(".pinyin").innerText.trim();
    const definition = entry.querySelector(".meaning").innerText.trim();
    const card = { term, pinyin, definition };

    const STATE_NOT_ADDED = 0;
    const STATE_LOADING = 1;
    const STATE_ADDED = 2;
    const STATE_ERROR = 3;
    let btnState = STATE_NOT_ADDED;

    const btn = document.createElement("a");
    btn.classList.add(btnClass);
    btn.innerText = "Add Flashcard";

    btn.onclick = (e) => {
      e.preventDefault();

      if (btnState == STATE_NOT_ADDED || btnState == STATE_ADDED) {
        const [promise, nextState] =
          btnState == STATE_NOT_ADDED
            ? [addCard(card), STATE_ADDED]
            : [removeCard(card), STATE_NOT_ADDED];

        btnState = STATE_LOADING;
        btn.innerText = "Loading...";
        promise
          .then(() => {
            btnState = nextState;
            btn.innerText =
              nextState == STATE_ADDED ? "✔️ Flashcard Added" : "Add Flashcard";
          })
          .catch((e) => {
            console.error(e);
            action = nextState == STATE_ADDED ? "adding" : "removing";
            btnState = STATE_ERROR;
            btn.innerText = `Error ${action} flashcard`;
          });
      }
    };

    const tools = entry.querySelector(".tools");
    tools.appendChild(btn);
  }

  console.log("Flashcards initialized!");
})();
