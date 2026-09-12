// ============================================================
// HUSKYDADDY DIGITAL SAT
// STUDENT TEST ENGINE
// ============================================================

// Combine the two question files.
// module1.js and module2.js MUST load before test.js.
const QUESTIONS = {
    1: MODULE_1,
    2: MODULE_2
  };
  
  
  // ============================================================
  // TEST STATE
  // ============================================================
  
  const state = {
    module: 1,
    index: 0,
    name: "",
  
    answers: {
      1: {},
      2: {}
    },
  
    marked: {
      1: {},
      2: {}
    },
  
    crossed: {
      1: {},
      2: {}
    },
  
    seconds: {
      1: 1920,
      2: 1920
    },
  
    timerId: null
  };
  
  
  // ============================================================
  // SHORTCUT
  // ============================================================
  
  const $ = id => document.getElementById(id);
  
  
  // ============================================================
  // SCREEN CONTROL
  // ============================================================
  
  function show(id) {
  
    const screens = [
      "startScreen",
      "testScreen",
      "navigatorScreen",
      "reviewScreen",
      "resultScreen",
      "teacherScreen"
    ];
  
    screens.forEach(screen => {
      $(screen).classList.add("hidden");
    });
  
    $(id).classList.remove("hidden");
  }
  
  
  // ============================================================
  // CURRENT QUESTION
  // ============================================================
  
  function q() {
    return QUESTIONS[state.module][state.index];
  }
  
  
  // ============================================================
  // TIMER
  // ============================================================
  
  function startTimer() {
  
    clearInterval(state.timerId);
  
    state.timerId = setInterval(() => {
  
      state.seconds[state.module]--;
  
      if (state.seconds[state.module] <= 0) {
  
        state.seconds[state.module] = 0;
  
        clearInterval(state.timerId);
  
        openReview();
      }
  
      renderTimer();
  
    }, 1000);
  }
  
  
  function renderTimer() {
  
    const seconds = state.seconds[state.module];
  
    const minutes = Math.floor(seconds / 60);
  
    const remaining = seconds % 60;
  
    $("timer").textContent =
      `${minutes}:${String(remaining).padStart(2, "0")}`;
  }
  
  
  // ============================================================
  // DISPLAY QUESTION
  // ============================================================
  
  function renderQuestion() {
  
    show("testScreen");
  
    const item = q();
  
    $("moduleLabel").textContent =
      `Reading and Writing · Module ${state.module}`;
  
    $("studentLabel").textContent =
      `Student: ${state.name}`;
  
    $("questionNumber").textContent =
      `Question ${item.n} of 27`;
  
    $("centerCounter").textContent =
      `${item.n} / 27`;
  
    $("progressBar").style.width =
      `${(item.n / 27) * 100}%`;
  
    $("passage").textContent = item.passage;
  
    $("prompt").textContent = item.prompt;
  
    $("options").innerHTML = "";
  
  
    // ----------------------------------------------------------
    // ANSWER CHOICES
    // ----------------------------------------------------------
  
    item.choices.forEach((choice, index) => {
  
      const letter = "ABCD"[index];
  
      const option = document.createElement("div");
  
      option.className = "option";
  
  
      // Selected answer
      if (
        state.answers[state.module][item.n] === letter
      ) {
        option.classList.add("selected");
      }
  
  
      // Crossed-out answer
      const crossed =
        state.crossed[state.module][item.n] || [];
  
      if (crossed.includes(letter)) {
        option.classList.add("crossed");
      }
  
  
      option.innerHTML = `
        <div class="letter">${letter}</div>
  
        <div class="option-text">
          ${choice}
        </div>
  
        <button
          class="cross-btn"
          title="Cross out"
        >
          ✕
        </button>
      `;
  
  
      // Choose answer by clicking text
      option
        .querySelector(".option-text")
        .addEventListener("click", () => {
  
          state.answers[state.module][item.n] =
            letter;
  
          renderQuestion();
        });
  
  
      // Choose answer by clicking letter
      option
        .querySelector(".letter")
        .addEventListener("click", () => {
  
          state.answers[state.module][item.n] =
            letter;
  
          renderQuestion();
        });
  
  
      // Cross out answer
      option
        .querySelector(".cross-btn")
        .addEventListener("click", event => {
  
          event.stopPropagation();
  
          let list =
            state.crossed[state.module][item.n] || [];
  
          if (list.includes(letter)) {
  
            list =
              list.filter(x => x !== letter);
  
          } else {
  
            list = [...list, letter];
          }
  
          state.crossed[state.module][item.n] =
            list;
  
          renderQuestion();
        });
  
  
      $("options").appendChild(option);
    });
  
  
    // ----------------------------------------------------------
    // MARK FOR REVIEW
    // ----------------------------------------------------------
  
    if (state.marked[state.module][item.n]) {
  
      $("markBtn").textContent =
        "★ Marked for Review";
  
    } else {
  
      $("markBtn").textContent =
        "☆ Mark for Review";
    }
  
  
    // ----------------------------------------------------------
    // BACK / NEXT BUTTONS
    // ----------------------------------------------------------
  
    $("backBtn").disabled =
      state.index === 0;
  
    if (state.index === 26) {
  
      $("nextBtn").textContent =
        "Review Module";
  
    } else {
  
      $("nextBtn").textContent =
        "Next →";
    }
  
  
    renderTimer();
  }
  
  
  // ============================================================
  // QUESTION NAVIGATOR
  // ============================================================
  
  function openNavigator() {
  
    show("navigatorScreen");
  
    $("navigatorTitle").textContent =
      `Reading and Writing · Module ${state.module} Navigator`;
  
    $("navigatorGrid").innerHTML = "";
  
  
    QUESTIONS[state.module].forEach(
      (item, index) => {
  
        const button =
          document.createElement("button");
  
        button.className = "navnum";
  
  
        if (
          state.answers[state.module][item.n]
        ) {
          button.classList.add("answered");
        }
  
  
        if (index === state.index) {
          button.classList.add("current");
        }
  
  
        if (
          state.marked[state.module][item.n]
        ) {
          button.classList.add("marked");
        }
  
  
        button.textContent = item.n;
  
  
        button.onclick = () => {
  
          state.index = index;
  
          renderQuestion();
        };
  
  
        $("navigatorGrid")
          .appendChild(button);
      }
    );
  }
  
  
  // ============================================================
  // MODULE REVIEW
  // ============================================================
  
  function openReview() {
  
    show("reviewScreen");
  
    clearInterval(state.timerId);
  
  
    $("reviewTitle").textContent =
      `Reading and Writing · Module ${state.module} Review`;
  
  
    const answered =
      Object.keys(
        state.answers[state.module]
      ).length;
  
  
    const marked =
      Object.keys(
        state.marked[state.module]
      ).filter(
        key =>
          state.marked[state.module][key]
      ).length;
  
  
    $("reviewStats").innerHTML = `
      Answered:
      <strong>${answered}</strong>
  
      &nbsp;
  
      Unanswered:
      <strong>${27 - answered}</strong>
  
      &nbsp;
  
      Marked:
      <strong>${marked}</strong>
    `;
  
  
    $("reviewGrid").innerHTML = "";
  
  
    QUESTIONS[state.module].forEach(
      (item, index) => {
  
        const button =
          document.createElement("button");
  
        button.textContent = item.n;
  
  
        if (
          state.answers[state.module][item.n]
        ) {
          button.classList.add("answered");
        }
  
  
        if (
          state.marked[state.module][item.n]
        ) {
          button.classList.add("marked");
        }
  
  
        button.onclick = () => {
  
          state.index = index;
  
          renderQuestion();
  
          startTimer();
        };
  
  
        $("reviewGrid")
          .appendChild(button);
      }
    );
  
  
    if (state.module === 1) {
  
      $("submitModuleBtn").textContent =
        "Submit Module 1 and Continue";
  
    } else {
  
      $("submitModuleBtn").textContent =
        "Submit Test";
    }
  }
  
  
  // ============================================================
  // ANSWER KEY
  // ============================================================
  
  function getKey() {
  
    return JSON.parse(
      localStorage.getItem("hd_sat_key") ||
      "{}"
    );
  }
  
  
  // ============================================================
  // FINISH TEST + CALCULATE SCORE
  // ============================================================
  
  function finishTest() {
  
    clearInterval(state.timerId);
  
    const key = getKey();
  
    let correct = 0;
    let incorrect = 0;
    let totalKnown = 0;
  
  
    [1, 2].forEach(moduleNumber => {
  
      QUESTIONS[moduleNumber].forEach(item => {
  
        const correctAnswer =
          key[
            `m${moduleNumber}q${item.n}`
          ];
  
  
        if (!correctAnswer) {
          return;
        }
  
  
        totalKnown++;
  
  
        const studentAnswer =
          state.answers[moduleNumber][item.n];
  
  
        if (
          studentAnswer === correctAnswer
        ) {
  
          correct++;
  
        } else {
  
          incorrect++;
        }
      });
    });
  
  
    let accuracy = "—";
  
  
    if (totalKnown) {
  
      accuracy =
        (
          (correct / totalKnown) * 100
        ).toFixed(1);
    }
  
  
    // ----------------------------------------------------------
    // SAVE STUDENT ATTEMPT
    // ----------------------------------------------------------
  
    const attempt = {
  
      id: Date.now(),
  
      name: state.name,
  
      date:
        new Date().toLocaleString(),
  
      answers:
        JSON.parse(
          JSON.stringify(state.answers)
        ),
  
      correct: correct,
  
      incorrect: incorrect,
  
      totalKnown: totalKnown,
  
      accuracy: accuracy,
  
      secondsUsed: {
  
        1:
          1920 -
          state.seconds[1],
  
        2:
          1920 -
          state.seconds[2]
      }
    };
  
  
    const attempts =
      JSON.parse(
        localStorage.getItem(
          "hd_sat_attempts"
        ) || "[]"
      );
  
  
    attempts.unshift(attempt);
  
  
    localStorage.setItem(
      "hd_sat_attempts",
      JSON.stringify(attempts)
    );
  
  
    // ----------------------------------------------------------
    // RESULT SCREEN
    // ----------------------------------------------------------
  
    show("resultScreen");
  
  
    if (totalKnown) {
  
      $("scoreBox").innerHTML = `
  
        <div class="score">
          ${correct} / ${totalKnown}
        </div>
  
        <div class="result-row">
          <span>Correct</span>
          <strong>${correct}</strong>
        </div>
  
        <div class="result-row">
          <span>Incorrect</span>
          <strong>${incorrect}</strong>
        </div>
  
        <div class="result-row">
          <span>Accuracy</span>
          <strong>${accuracy}%</strong>
        </div>
      `;
  
    } else {
  
      $("scoreBox").innerHTML = `
  
        <div class="notice">
  
          Your responses have been saved.
  
          The teacher has not entered an
          answer key yet, so a score cannot
          be calculated.
  
        </div>
      `;
    }
  }
  
  
  // ============================================================
  // START TEST
  // ============================================================
  
  $("startBtn").onclick = () => {
  
    const studentName =
      $("studentName").value.trim();
  
  
    if (!studentName) {
  
      alert(
        "Please enter the student name."
      );
  
      return;
    }
  
  
    state.name = studentName;
  
    state.module = 1;
  
    state.index = 0;
  
  
    state.seconds = {
      1: 1920,
      2: 1920
    };
  
  
    state.answers = {
      1: {},
      2: {}
    };
  
  
    state.marked = {
      1: {},
      2: {}
    };
  
  
    state.crossed = {
      1: {},
      2: {}
    };
  
  
    renderQuestion();
  
    startTimer();
  };
  
  
  // ============================================================
  // NEXT BUTTON
  // ============================================================
  
  $("nextBtn").onclick = () => {
  
    if (state.index === 26) {
  
      openReview();
  
    } else {
  
      state.index++;
  
      renderQuestion();
    }
  };
  
  
  // ============================================================
  // BACK BUTTON
  // ============================================================
  
  $("backBtn").onclick = () => {
  
    if (state.index > 0) {
  
      state.index--;
  
      renderQuestion();
    }
  };
  
  
  // ============================================================
  // NAVIGATOR BUTTON
  // ============================================================
  
  $("navigatorBtn").onclick =
    openNavigator;
  
  
  // ============================================================
  // CLOSE NAVIGATOR
  // ============================================================
  
  $("closeNavigator").onclick =
    renderQuestion;
  
  
  // ============================================================
  // MARK FOR REVIEW
  // ============================================================
  
  $("markBtn").onclick = () => {
  
    const number = q().n;
  
    state.marked[state.module][number] =
      !state.marked[state.module][number];
  
    renderQuestion();
  };
  
  
  // ============================================================
  // SUBMIT MODULE
  // ============================================================
  
  $("submitModuleBtn").onclick = () => {
  
    if (state.module === 1) {
  
      state.module = 2;
  
      state.index = 0;
  
      renderQuestion();
  
      startTimer();
  
    } else {
  
      finishTest();
    }
  };
  
  
  // ============================================================
  // RESTART
  // ============================================================
  
  $("restartBtn").onclick = () => {
  
    location.reload();
  };