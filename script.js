

/* FIELD DATA */
const theoryFields = [
  { id: "attendance", label: "Attendance (7%)", max: 7 },
  { id: "quiz", label: "Quiz (15%)", max: 15 },
  { id: "assignment", label: "Assignment (5%)", max: 5 },
  { id: "presentation", label: "Presentation (8%)", max: 8 },
  { id: "midterm", label: "Midterm (25%)", max: 25 },
  { id: "final", label: "Final (40%)", max: 40 }
];

const labFields = [
  { id: "attendance", label: "Attendance (10%)", max: 10 },
  { id: "assignment", label: "Assignment (25%)", max: 25 },
  { id: "labperformance", label: "Lab Performance (25%)", max: 25 },
  { id: "midterm", label: "Midterm (20%)", max: 20 },
  { id: "final", label: "Final (20%)", max: 20 }
];

/* STATE */
let courses = [];
const LS = "SUNNY_GPA_V5";

/* ------------- Load Fields ------------- */
function loadFields() {
  const type = document.getElementById("courseType").value;
  const box = document.getElementById("fields");
  box.innerHTML = "";

  const fields = (type === "theory") ? theoryFields : labFields;

  fields.forEach(f => {
    const label = document.createElement("label");
    label.textContent = f.label;
    const input = document.createElement("input");
    input.type = "number";
    input.id = f.id;
    input.min = 0;
    input.max = f.max;
    input.placeholder = `0 / ${f.max}`;
    input.addEventListener("input", updateRequirementTable);

    box.appendChild(label);
    box.appendChild(input);

    // final slider
    if (f.id === "final") {
      const wrap = document.createElement("div");
      wrap.style.marginTop = "6px";

      const lab = document.createElement("label");
      lab.textContent = `Final Guess (0–${f.max})`;

      const range = document.createElement("input");
      range.type = "range";
      range.id = "finalGuess";
      range.min = 0;
      range.max = f.max;
      range.value = 0;
      range.style.width = "100%";
      range.addEventListener("input", () => updateFinalGuess(range.value));

      const hint = document.createElement("div");
      hint.style.fontSize = "13px";
      hint.style.marginTop = "4px";
      hint.style.color = "#8ff";
      hint.innerHTML = `Guess: <span id="finalGuessVal">0</span> / ${f.max}`;

      wrap.appendChild(lab);
      wrap.appendChild(range);
      wrap.appendChild(hint);

      box.appendChild(wrap);
    }
  });

  // update UI requirement at the end
  updateRequirementTable();
}

/* ------------- Requirement Calculator ------------- */
function calculateRequiredFinal(current, finalMax = 40) {
  const gradeNeeds = {
    "A+": 80, "A": 75, "A-": 70,
    "B+": 65, "B": 60, "B-": 55,
    "C+": 50, "C": 45, "D": 40
  };

  const out = {};
  for (let g in gradeNeeds) {
    let need = gradeNeeds[g] - current;
    if (need <= 0) need = 0;
    if (need > finalMax) need = "Impossible";
    out[g] = need;
  }
  return out;
}

/* ------------- Update Final Guess ------------- */
function updateFinalGuess(value) {
  const v = Number(value);
  const valEl = document.getElementById("finalGuessVal");
  if (valEl) valEl.innerText = v;
  const finalField = document.getElementById("final");
  if (finalField) finalField.value = v;
  updateRequirementTable();
}

/* ------------- Update Requirement Table (Left & Right UI) ------------- */
function updateRequirementTable() {
  const type = document.getElementById("courseType").value;
  const fields = (type === "theory") ? theoryFields : labFields;

  let current = 0;
  fields.forEach(f => {
    if (f.id !== "final") {
      current += Number(document.getElementById(f.id).value || 0);
    }
  });

  const finalMax = fields.find(f => f.id === "final").max;
  const req = calculateRequiredFinal(current, finalMax);

  // left box
  const leftBox = document.getElementById("requirementsBox");
  if (leftBox) {
    let html = `<b>Grade Requirements:</b><br>`;
    for (let g in req) html += `${g}: ${req[g]} needed<br>`;
    leftBox.innerHTML = html;
  }

  // right summary panel
  const rightBox = document.getElementById("gradeReqPanel");
  if (rightBox) {
    let html = `<b>Required Final Marks:</b><br>`;
    for (let g in req) html += `${g}: ${req[g]}<br>`;
    rightBox.innerHTML = html;
  }
}

/* ------------- Grade Mapping ------------- */
function getGrade(total) {
  if (total >= 80) return ["A+", 4.0];
  if (total >= 75) return ["A", 3.75];
  if (total >= 70) return ["A-", 3.5];
  if (total >= 65) return ["B+", 3.25];
  if (total >= 60) return ["B", 3.0];
  if (total >= 55) return ["B-", 2.75];
  if (total >= 50) return ["C+", 2.5];
  if (total >= 45) return ["C", 2.25];
  if (total >= 40) return ["D", 2.0];
  return ["F", 0.0];
}

/* ------------- Add Course ------------- */
function addCourse() {
  const name = document.getElementById("courseName").value.trim();
  if (!name) return alert("Enter course name");

  const type = document.getElementById("courseType").value;
  const fields = (type === "theory") ? theoryFields : labFields;

  let total = 0;
  fields.forEach(f => {
    total += Number(document.getElementById(f.id).value || 0);
  });
  total = Math.min(100, Math.max(0, total));

  const [grade, gp] = getGrade(total);
  const credit = (type === "theory") ? 3 : 1;

  courses.push({ name, total, grade, gp, credit });

  // reset inputs for next course
  document.getElementById("courseName").value = "";
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.value = "";
  });
  const range = document.getElementById("finalGuess");
  if (range) { range.value = 0; const v = document.getElementById("finalGuessVal"); if (v) v.innerText = 0; }

  render();
  calcGPA();
  autoSave();
}

/* ------------- Render Course Table ------------- */
function render() {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  courses.forEach((c, i) => {
    const pill = (c.total >= 40) ? "pill green" : "pill red";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${c.total}</td>
      <td><span class="${pill}">${c.grade}</span></td>
      <td>${c.gp.toFixed(2)}</td>
      <td>${c.credit}</td>
      <td><button class="icon-btn" onclick="del(${i})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ------------- Delete Course ------------- */
function del(index) {
  if (!confirm("Remove this course?")) return;
  courses.splice(index, 1);
  render();
  calcGPA();
  autoSave();
}

/* ------------- GPA Calculation ------------- */
function calcGPA() {
  if (courses.length === 0) {
    const el = document.getElementById("finalGPA");
    if (el) el.innerText = "0.00";
    return;
  }
  let sum = 0, credits = 0;
  courses.forEach(c => {
    sum += c.gp * c.credit;
    credits += c.credit;
  });
  const gpa = (sum / credits) || 0;
  const el = document.getElementById("finalGPA");
  if (el) el.innerText = gpa.toFixed(2);
}

/* ------------- Local Storage ------------- */
function autoSave() {
  const payload = {
    student: {
      name: document.getElementById("stuName").value || "",
      id: document.getElementById("stuId").value || ""
    },
    courses
  };
  localStorage.setItem(LS, JSON.stringify(payload));
}

function saveData() { autoSave(); alert("Saved ✔"); }

function clearData() {
  if (!confirm("Clear all data?")) return;
  courses = [];
  localStorage.removeItem(LS);
  render();
  calcGPA();
}

/* ------------- Load on Start ------------- */
window.addEventListener("load", () => {
  const raw = localStorage.getItem(LS);
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj.student) {
        document.getElementById("stuName").value = obj.student.name || "";
        document.getElementById("stuId").value = obj.student.id || "";
      }
      courses = obj.courses || [];
      render();
      calcGPA();
    } catch (e) {
      console.warn("Load error", e);
    }
  }
  loadFields();

  // auto-save student info on change
  const sn = document.getElementById("stuName");
  const si = document.getElementById("stuId");
  if (sn) sn.addEventListener("input", autoSave);
  if (si) si.addEventListener("input", autoSave);
});

/* ===========================================
   PROFESSIONAL PDF EXPORT (requirements removed)
   — This PDF includes: header, student info,
     course table, final GPA, footer branding.
=========================================== */
async function downloadPDF() {
  const { jsPDF } = window.jspdf;

  // create off-screen wrapper
  const wrapper = document.createElement("div");
  wrapper.style.width = "820px";
  wrapper.style.padding = "30px 40px";
  wrapper.style.background = "#ffffff";
  wrapper.style.color = "#000000";
  wrapper.style.fontFamily = "Poppins, sans-serif";
  wrapper.style.lineHeight = "1.6";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";

  const name = document.getElementById("stuName").value || "Not Provided";
  const id = document.getElementById("stuId").value || "Not Provided";
  const gpa = document.getElementById("finalGPA").innerText || "0.00";

  wrapper.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="margin:0;color:#003366;font-size:22px;">DIU GPA Report</h1>
        <div style="font-size:12px;color:#333;margin-top:6px;">Generated by Sunny's GPA Calculator</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#333;">
        <div><strong>Student:</strong> ${escapeHtml(name)}</div>
        <div><strong>ID:</strong> ${escapeHtml(id)}</div>
        <div>${new Date().toLocaleString()}</div>
      </div>
    </div>

    <hr style="border:1px solid #ddd;margin:14px 0">

    <h2 style="margin:0 0 8px 0;color:#004488;font-size:16px;">Course Summary</h2>

    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f6f9ff;">
          <th style="border:1px solid #ccc;padding:8px;text-align:left;">Course Name</th>
          <th style="border:1px solid #ccc;padding:8px;text-align:right;">Total</th>
          <th style="border:1px solid #ccc;padding:8px;text-align:center;">Grade</th>
          <th style="border:1px solid #ccc;padding:8px;text-align:right;">GP</th>
          <th style="border:1px solid #ccc;padding:8px;text-align:right;">Credit</th>
        </tr>
      </thead>
      <tbody id="pdfTableBody"></tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:18px;">
      <div style="text-align:right;">
        <div style="font-size:12px;color:#333">Final GPA</div>
        <div style="font-size:22px;font-weight:700;color:#0077aa">${escapeHtml(gpa)}</div>
      </div>
    </div>

    <div style="
      margin-top:30px;
      text-align:center;
      font-size:12px;
      color:#555;
      padding-top:10px;
      border-top:1px solid #ccc;
    ">
      Report generated by <b>fahm.codes</b> · Instagram: @fahm.codes
    </div>
  `;

  // populate courses table
  const pdfBody = wrapper.querySelector("#pdfTableBody");
  courses.forEach(c => {
    pdfBody.innerHTML += `
      <tr>
        <td style="border:1px solid #ccc;padding:8px">${escapeHtml(c.name)}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:right">${c.total}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:center">${c.grade}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:right">${c.gp.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:8px;text-align:right">${c.credit}</td>
      </tr>
    `;
  });

  // append to DOM off-screen
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, pageWidth, imgHeight);
    pdf.save(`DIU_GPA_${name.replace(/\s+/g, "_")}.pdf`);
  } catch (err) {
    console.error("PDF error:", err);
    alert("PDF generation failed. Try on desktop or another browser.");
  } finally {
    document.body.removeChild(wrapper);
  }
}

/* ------------- Utility ------------- */
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
      "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
    })[s];
  });
}
