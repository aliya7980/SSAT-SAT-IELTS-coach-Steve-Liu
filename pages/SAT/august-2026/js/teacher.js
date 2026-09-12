// ============================================================
// HUSKYDADDY DIGITAL SAT
// TEACHER DASHBOARD
// ============================================================


// ============================================================
// TEACHER ACCESS CODE
// ============================================================

const TEACHER_CODE = "1201";


// ============================================================
// OPEN TEACHER MODE
// ============================================================

function openTeacher() {

  clearInterval(state.timerId);

  show("teacherScreen");

  $("teacherLogin").classList.remove("hidden");

  $("teacherDash").classList.add("hidden");

  $("teacherCode").value = "";

  $("teacherError").textContent = "";
}


// ============================================================
// TEACHER LINK
// ============================================================

$("teacherLink").onclick = function(event) {

  event.preventDefault();

  openTeacher();
};


// ============================================================
// TEACHER LOGIN
// ============================================================

$("teacherLoginBtn").onclick = function() {

  const enteredCode =
    $("teacherCode").value.trim();


  if (enteredCode === TEACHER_CODE) {

    $("teacherLogin")
      .classList.add("hidden");

    $("teacherDash")
      .classList.remove("hidden");

    $("teacherError")
      .textContent = "";

    renderTeacher();

  } else {

    $("teacherError")
      .textContent =
      "Incorrect access code.";
  }
};


// ============================================================
// ALLOW ENTER KEY TO LOGIN
// ============================================================

$("teacherCode").addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      $("teacherLoginBtn").click();
    }
  }
);


// ============================================================
// EXIT TEACHER MODE
// ============================================================

$("exitTeacher").onclick = function() {

  show("startScreen");

  $("teacherCode").value = "";

  $("teacherError").textContent = "";

  $("analysisBox").innerHTML = "";
};


// ============================================================
// GET SAVED ANSWER KEY
// ============================================================

function getTeacherKey() {

  return JSON.parse(
    localStorage.getItem("hd_sat_key") || "{}"
  );
}


// ============================================================
// GET SAVED STUDENT ATTEMPTS
// ============================================================

function getAttempts() {

  return JSON.parse(
    localStorage.getItem("hd_sat_attempts") || "[]"
  );
}


// ============================================================
// RENDER COMPLETE TEACHER DASHBOARD
// ============================================================

function renderTeacher() {

  renderAnswerKey();

  renderAttempts();

  $("analysisBox").innerHTML = "";
}


// ============================================================
// RENDER ANSWER KEY EDITOR
// ============================================================

function renderAnswerKey() {

  const key = getTeacherKey();

  $("answerKeyEditor").innerHTML = "";


  // ----------------------------------------------------------
  // MODULE 1 AND MODULE 2
  // ----------------------------------------------------------

  [1, 2].forEach(function(moduleNumber) {

    const heading =
      document.createElement("h4");

    heading.textContent =
      "Module " + moduleNumber;

    heading.style.marginTop = "18px";

    heading.style.marginBottom = "8px";


    $("answerKeyEditor")
      .appendChild(heading);


    // --------------------------------------------------------
    // QUESTIONS
    // --------------------------------------------------------

    QUESTIONS[moduleNumber].forEach(
      function(item) {

        const row =
          document.createElement("div");

        row.className =
          "answer-edit";


        const storageKey =
          "m" +
          moduleNumber +
          "q" +
          item.n;


        let options = `
          <option value="">
            —
          </option>
        `;


        ["A", "B", "C", "D"].forEach(
          function(letter) {

            const selected =
              key[storageKey] === letter
                ? "selected"
                : "";


            options += `
              <option
                value="${letter}"
                ${selected}
              >
                ${letter}
              </option>
            `;
          }
        );


        row.innerHTML = `

          <strong>
            Q${item.n}
          </strong>

          <select
            data-k="${storageKey}"
          >
            ${options}
          </select>

          <input
            value="${item.skill}"
            disabled
          >
        `;


        $("answerKeyEditor")
          .appendChild(row);
      }
    );
  });
}


// ============================================================
// SAVE ANSWER KEY
// ============================================================

$("saveKeyBtn").onclick = function() {

  const key = {};


  document
    .querySelectorAll("[data-k]")
    .forEach(function(select) {

      if (select.value) {

        key[select.dataset.k] =
          select.value;
      }
    });


  localStorage.setItem(
    "hd_sat_key",
    JSON.stringify(key)
  );


  alert(
    "Answer key saved on this browser."
  );


  renderTeacher();
};


// ============================================================
// RENDER STUDENT ATTEMPTS
// ============================================================

function renderAttempts() {

  const attempts =
    getAttempts();


  // ----------------------------------------------------------
  // ATTEMPT TABLE
  // ----------------------------------------------------------

  if (attempts.length === 0) {

    $("attemptRows").innerHTML = `

      <tr>

        <td colspan="4">
          No student attempts saved yet.
        </td>

      </tr>
    `;

  } else {

    $("attemptRows").innerHTML =
      attempts
        .map(function(attempt) {

          let score =
            "Pending key";

          let accuracy =
            "—";


          if (attempt.totalKnown) {

            score =
              attempt.correct +
              "/" +
              attempt.totalKnown;

            accuracy =
              attempt.accuracy +
              "%";
          }


          return `

            <tr>

              <td>
                ${escapeHtml(attempt.name)}
              </td>

              <td>
                ${escapeHtml(attempt.date)}
              </td>

              <td>
                ${score}
              </td>

              <td>
                ${accuracy}
              </td>

            </tr>
          `;
        })
        .join("");
  }


  // ----------------------------------------------------------
  // ATTEMPT SELECT MENU
  // ----------------------------------------------------------

  let dropdown = `

    <option value="">
      Select attempt
    </option>
  `;


  attempts.forEach(function(attempt) {

    dropdown += `

      <option value="${attempt.id}">

        ${escapeHtml(attempt.name)}
        —
        ${escapeHtml(attempt.date)}

      </option>
    `;
  });


  $("attemptSelect").innerHTML =
    dropdown;
}


// ============================================================
// SELECT STUDENT FOR ANALYSIS
// ============================================================

$("attemptSelect").onchange = function() {

  const id =
    Number(
      $("attemptSelect").value
    );


  const attempts =
    getAttempts();


  const attempt =
    attempts.find(function(item) {

      return item.id === id;
    });


  if (!attempt) {

    $("analysisBox").innerHTML = "";

    return;
  }


  renderAnalysis(attempt);
};


// ============================================================
// ANALYZE STUDENT
// ============================================================

function renderAnalysis(attempt) {

  const key =
    getTeacherKey();


  const skills = {};

  const questionResults = [];


  // ----------------------------------------------------------
  // CHECK BOTH MODULES
  // ----------------------------------------------------------

  [1, 2].forEach(
    function(moduleNumber) {

      QUESTIONS[moduleNumber]
        .forEach(function(item) {

          const keyName =
            "m" +
            moduleNumber +
            "q" +
            item.n;


          const correctAnswer =
            key[keyName];


          // Ignore questions without answer key
          if (!correctAnswer) {
            return;
          }


          const studentAnswer =
            attempt.answers &&
            attempt.answers[moduleNumber]
              ? attempt.answers[moduleNumber][item.n]
              : undefined;


          const isCorrect =
            studentAnswer === correctAnswer;


          // --------------------------------------------------
          // SKILL CATEGORY
          // --------------------------------------------------

          if (!skills[item.skill]) {

            skills[item.skill] = {
              correct: 0,
              total: 0
            };
          }


          skills[item.skill].total++;


          if (isCorrect) {

            skills[item.skill].correct++;
          }


          // --------------------------------------------------
          // SAVE QUESTION RESULT
          // --------------------------------------------------

          questionResults.push({

            module: moduleNumber,

            question: item.n,

            skill: item.skill,

            studentAnswer:
              studentAnswer || "—",

            correctAnswer:
              correctAnswer,

            correct:
              isCorrect
          });
        });
    }
  );


  // ==========================================================
  // NO ANSWER KEY YET
  // ==========================================================

  if (questionResults.length === 0) {

    $("analysisBox").innerHTML = `

      <div class="notice">

        Enter the answer key first
        to generate student analysis.

      </div>
    `;

    return;
  }


  // ==========================================================
  // SORT SKILLS FROM WEAKEST TO STRONGEST
  // ==========================================================

  const skillEntries =
    Object.entries(skills);


  skillEntries.sort(
    function(a, b) {

      const scoreA =
        a[1].correct /
        a[1].total;


      const scoreB =
        b[1].correct /
        b[1].total;


      return scoreA - scoreB;
    }
  );


  // ==========================================================
  // OVERALL SCORE
  // ==========================================================

  const totalCorrect =
    questionResults.filter(
      function(result) {

        return result.correct;
      }
    ).length;


  const totalQuestions =
    questionResults.length;


  const accuracy =
    Math.round(
      totalCorrect /
      totalQuestions *
      100
    );


  // ==========================================================
  // BUILD ANALYSIS HTML
  // ==========================================================

  let html = `

    <h3>
      ${escapeHtml(attempt.name)}
    </h3>

    <p style="
      color:#52606d;
      margin-bottom:18px;
    ">
      ${escapeHtml(attempt.date)}
    </p>


    <div class="score">

      ${totalCorrect}
      /
      ${totalQuestions}

    </div>


    <div class="result-row">

      <span>
        Overall Accuracy
      </span>

      <strong>
        ${accuracy}%
      </strong>

    </div>
  `;


  // ==========================================================
  // SKILL ANALYSIS
  // ==========================================================

  html += `

    <h3 style="margin-top:28px">
      Skill Analysis
    </h3>
  `;


  skillEntries.forEach(
    function(entry) {

      const skill =
        entry[0];

      const result =
        entry[1];


      const percent =
        Math.round(
          result.correct /
          result.total *
          100
        );


      html += `

        <div class="result-row">

          <span>
            ${escapeHtml(skill)}
          </span>

          <strong>

            ${result.correct}
            /
            ${result.total}

            (${percent}%)

          </strong>

        </div>
      `;
    }
  );


  // ==========================================================
  // PRIORITY REVIEW
  // ==========================================================

  const weakestSkills =
    skillEntries
      .slice(0, 3)
      .map(function(entry) {

        return entry[0];
      });


  if (weakestSkills.length > 0) {

    html += `

      <div
        class="notice"
        style="margin-top:20px"
      >

        <strong>
          Priority Review:
        </strong>

        ${weakestSkills
          .map(function(skill) {

            return escapeHtml(skill);
          })
          .join(", ")}

      </div>
    `;
  }


  // ==========================================================
  // QUESTION-BY-QUESTION RESULTS
  // ==========================================================

  html += `

    <h3 style="margin-top:28px">
      Question-by-Question Analysis
    </h3>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Module
            </th>

            <th>
              Question
            </th>

            <th>
              Skill
            </th>

            <th>
              Student
            </th>

            <th>
              Correct
            </th>

            <th>
              Result
            </th>

          </tr>

        </thead>

        <tbody>
  `;


  questionResults.forEach(
    function(result) {

      html += `

        <tr>

          <td>
            ${result.module}
          </td>

          <td>
            ${result.question}
          </td>

          <td>
            ${escapeHtml(result.skill)}
          </td>

          <td>
            ${result.studentAnswer}
          </td>

          <td>
            ${result.correctAnswer}
          </td>

          <td>

            ${
              result.correct
                ? "✓ Correct"
                : "✕ Incorrect"
            }

          </td>

        </tr>
      `;
    }
  );


  html += `

        </tbody>

      </table>

    </div>
  `;


  $("analysisBox").innerHTML =
    html;
}


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}