/* =========================
   Gamma v2 – SPA App
   Landing Page ↔ Clinic View
   ========================= */
"use strict";

const $ = id => document.getElementById(id);


/** ======================================================
 *  SPA State & Routing
 *  ====================================================== */
const DEPARTMENTS = [
  { key: "os", name: "Oral & Maxillofacial Surgery", active: true },
  { key: "opdx", name: "Oral Pathology & Diagnosis", active: true },
  { key: "tmd", name: "TMD / Orofacial Pain", active: true },
  { key: "gd", name: "General Dentistry", active: true },
  { key: "endo", name: "Endodontics", active: true },
  { key: "rest", name: "Operative & Aesthetic Dentistry", active: true },
  { key: "pros", name: "Prosthodontics", active: true },
  { key: "perio", name: "Periodontics", active: true },
  { key: "ortho", name: "Orthodontics", active: true },
  { key: "pedo", name: "Pediatric Dentistry", active: true },
  { key: "pedo_dc", name: "Pediatric Dentistry (Discharge)", active: true },
  { key: "implant", name: "Implantology", active: true },
  { key: "xray", name: "Dental Radiology", active: true },
];

const AppState = {
  currentView: "home",       // "home" | "clinic"
  currentDepartment: null,   // string (display name)
  currentDeptKey: null,      // string (key like "os", "dx")
  caseId: null,              // number | null
};


function renderDeptGrid() {
  const grid = $("deptGrid");
  grid.innerHTML = "";
  for (const dept of DEPARTMENTS) {
    const btn = document.createElement("button");
    btn.className = `dept-btn ${dept.active ? "active" : "disabled"}`;
    btn.innerHTML = dept.active
      ? dept.name
      : `${dept.name}<span class="dept-coming-soon">coming soon</span>`;
    if (dept.active) {
      btn.onclick = () => navigateToDept(dept);
    }
    grid.appendChild(btn);
  }
}

function navigateToDept(dept) {
  AppState.currentView = "clinic";
  AppState.currentDepartment = dept.name;
  AppState.currentDeptKey = dept.key;
  loadDeptSoapForm(dept.key);
  loadDeptSopItems(dept.key);
  renderApp();
}

function navigateHome() {
  AppState.currentView = "home";
  AppState.currentDepartment = null;
  AppState.currentDeptKey = null;
  AppState.caseId = null;
  // Reset case ID input
  $("caseIdInput").value = "";
  renderApp();
}

function renderApp() {
  $("homeView").style.display = AppState.currentView === "home" ? "" : "none";
  $("clinicView").classList.toggle("hidden", AppState.currentView !== "clinic");

  if (AppState.currentView === "clinic") {
    $("clinicTitle").textContent = `Gamma - ${AppState.currentDepartment}`;
    $("clinicSubtitle").textContent = "Dental SOAP Assistant";
  }
}

// Wire back button
$("btnBackHome").onclick = navigateHome;

// Initial render
renderDeptGrid();
renderApp();


/** ======================================================
 *  Department-specific SOAP Form / SOP switching
 *  ====================================================== */

/* ---------- active field labels / key map (swapped per dept) ---------- */
let ACTIVE_FIELD_LABELS = null;   // set by loadDeptSoapForm
let ACTIVE_KEY_MAP = null;

const FIELD_LABELS_DX = {
  cc: "CC (Chief Complaint)", pi: "PI (Present Illness)", pmh: "PMH", pdh: "PDH",
  current_medication: "Current meds", drug_allergy: "Drug allergy",
  birth_history: "Birth history", vaccination_history: "Vaccination history",
  tocc_travel: "Travel history", tocc_occupation: "Occupation",
  tocc_contact: "Contact history", tocc_cluster: "Cluster",
  risk_smoking: "Smoking", risk_alcohol: "Alcohol",
  risk_betel_nut: "Betel nut", family_history: "Family history",
  pain_score: "Pain score", pain_pattern: "Pain pattern",
  pain_location: "Pain location", o_extraoral: "Extraoral",
  o_intraoral_soft_tissue: "Intraoral", o_teeth_findings: "Dentition",
  a_location: "Location", a_diagnosis: "Diagnosis",
  p_treatment_plan: "Treatment plan",
};

const FIELD_LABELS_OS = {
  s_cc: "CC", s_pi: "PI",
  s_pmh_htn: "HTN", s_pmh_dm: "DM", s_pmh_cvd: "CVD", s_pmh_hep: "Hepatitis", s_pmh_cancer: "Cancer Hx",
  s_med_anticoag: "Anticoagulant", s_med_steroid: "Steroid", s_med_immuno: "Immunosuppressant",
  s_allergy: "Allergy",
  s_habit_smoke: "Smoking", s_habit_alcohol: "Alcohol", s_habit_betel: "Betel nut",
  o_facial_asym: "Facial asymmetry", o_eo_swelling: "Swelling", o_eo_redness: "Redness",
  o_eo_heat: "Local heat", o_eo_tenderness: "Tenderness",
  o_ln_size: "LN size", o_ln_mobility: "LN mobility", o_ln_tender: "LN tenderness",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_lesion_loc: "Lesion location", o_lesion_size: "Lesion size", o_lesion_color: "Lesion color",
  o_lesion_surface: "Lesion surface", o_lesion_induration: "Induration",
  o_mass_loc: "Mass location", o_mass_size: "Mass size",
  o_mass_consistency: "Mass consistency", o_mass_mobility: "Mass mobility",
  o_mmo: "MMO",
  o_xray_pano: "Panoramic", o_xray_pa: "Periapical", o_xray_ct: "CT/CBCT", o_xray_mri: "MRI",
  a_infection: "Infection", a_tumor: "Tumor", a_cyst: "Cyst", a_trauma: "Trauma",
  p_biopsy: "Biopsy", p_excision: "Surgical excision", p_extraction: "Extraction",
  p_id: "I&D", p_medication: "Medication", p_followup: "Follow-up",
};

const FIELD_LABELS_OP = {
  cc_main: "Main Complaint",
  pi_onset: "Onset", pi_duration: "Duration", pi_progression: "Progression",
  pi_symp_pain: "Pain", pi_symp_bleeding: "Bleeding", pi_symp_burning: "Burning", pi_symp_ulceration: "Ulceration",
  pi_trauma_biting: "Biting trauma", pi_trauma_sharp_tooth: "Sharp tooth", pi_trauma_denture: "Denture irritation",
  pi_lesion_size_change: "Size change", pi_lesion_color_change: "Color change", pi_lesion_surface_change: "Surface change",
  pi_prev_medication: "Medication", pi_prev_steroid: "Steroid", pi_prev_derm: "Derm treatment",
  pmh_autoimmune: "Autoimmune disease", pmh_systemic: "Systemic disease", pmh_cancer: "Cancer history",
  meds_immuno: "Immunosuppressants", meds_chemo: "Chemotherapy", meds_xero: "Xerostomia drugs",
  allergy: "Allergy",
  habit_smoking: "Smoking", habit_alcohol: "Alcohol", habit_betel: "Betel nut", habit_cheek_biting: "Cheek biting",
  fh_oral_cancer: "FH: Oral cancer",
  o_ext_facial_sym: "Facial symmetry", o_ext_swelling: "Swelling", o_ext_skin_lesion: "Skin lesion",
  o_ext_lymphade: "Lymphadenopathy", o_ext_salivary: "Salivary gland",
  o_intra_dentition: "Present dentition",
  o_lesion_site: "Site", o_lesion_number: "Number", o_lesion_size: "Size (cm/mm)", o_lesion_shape: "Shape",
  o_lesion_surface: "Surface", o_lesion_color: "Color", o_lesion_border: "Border", o_lesion_consistency: "Consistency",
  o_lesion_fluctuation: "Fluctuation", o_lesion_induration: "Induration", o_lesion_mobility: "Mobility",
  o_spec_plaque: "Plaque", o_spec_ulcer: "Ulcer", o_spec_vesicle: "Vesicle/bulla",
  o_salivary_dry_mouth: "Dry mouth", o_salivary_dry_eye_skin: "Dry eye/skin", o_salivary_flow: "Salivary flow",
  o_adj_sharp_cusp: "Sharp cusp", o_adj_caries: "Caries", o_adj_restoration: "Restoration irritation",
  a_working_dx: "Working Dx", a_ro: "Rule out (r/o)", a_risk_malignant: "Malignant potential", a_risk_recurrence: "Recurrence risk",
  p_obs_interval: "Follow up interval",
  p_img_pa: "PA", p_img_pano: "Pano", p_img_cbct: "CBCT",
  p_dx_biopsy: "Biopsy", p_dx_cytology: "Cytology smear",
  p_tx_excision: "Surgical excision", p_tx_steroid: "Steroid therapy", p_tx_trauma: "Elimination of trauma",
  p_refer_os: "OS Refer", p_refer_derm: "Derm Refer", p_refer_onco: "Onco Refer",
  p_fu_pathology: "Pathology review", p_fu_recurrence: "Recurrence monitoring",
};

const FIELD_LABELS_OPDX = {
  // --- Generic DX Headings ---
  pdh: "PDH", current_medication: "Current meds", drug_allergy: "Drug allergy",
  birth_history: "Birth history", vaccination_history: "Vaccination history",
  tocc_travel: "Travel history", tocc_occupation: "Occupation",
  tocc_contact: "Contact history", tocc_cluster: "Cluster",
  risk_smoking: "Smoking", risk_alcohol: "Alcohol",
  risk_betel_nut: "Betel nut", family_history: "Family history",
  pain_score: "Pain score", pain_pattern: "Pain pattern",
  pain_location: "Pain location", o_extraoral: "Extraoral",
  o_intraoral_soft_tissue: "Intraoral", o_teeth_findings: "Dentition",
  a_location: "Location", a_diagnosis: "Diagnosis",
  p_treatment_plan: "Treatment plan",

  // --- OP CC/PI ---
  cc: "CC (Chief Complaint)", pi: "PI (Present Illness)", pmh: "PMH",
  cc_main: "Main Complaint",
  pi_onset: "Onset", pi_duration: "Duration", pi_progression: "Progression",
  pi_symp_pain: "Pain", pi_symp_bleeding: "Bleeding", pi_symp_burning: "Burning", pi_symp_ulceration: "Ulceration",
  pi_trauma_biting: "Biting trauma", pi_trauma_sharp_tooth: "Sharp tooth", pi_trauma_denture: "Denture irritation",
  pi_lesion_size_change: "Size change", pi_lesion_color_change: "Color change", pi_lesion_surface_change: "Surface change",
  pi_prev_medication: "Medication", pi_prev_steroid: "Steroid", pi_prev_derm: "Derm treatment",

  // --- OP PMH/Habits ---
  pmh_autoimmune: "Autoimmune disease", pmh_systemic: "Systemic disease", pmh_cancer: "Cancer history",
  meds_immuno: "Immunosuppressants", meds_chemo: "Chemotherapy", meds_xero: "Xerostomia drugs",
  allergy: "Allergy",
  habit_smoking: "Smoking", habit_alcohol: "Alcohol", habit_betel: "Betel nut", habit_cheek_biting: "Cheek biting",
  fh_oral_cancer: "FH: Oral cancer",

  // --- OP Exams (Generic) ---
  o_ext_facial_sym: "Facial symmetry", o_ext_swelling: "Swelling", o_ext_skin_lesion: "Skin lesion",
  o_ext_lymphade: "Lymphadenopathy", o_ext_salivary: "Salivary gland",
  o_intra_dentition: "Present dentition",

  // --- OP Exams (Requested Deep Lesion Features) ---
  o_lesion_site: "Site", o_lesion_number: "Number", o_lesion_size: "Size (cm/mm)", o_lesion_shape: "Shape",
  o_lesion_surface: "Surface", o_lesion_color: "Color", o_lesion_border: "Border", o_lesion_consistency: "Consistency",
  o_lesion_fluctuation: "Fluctuation", o_lesion_induration: "Induration", o_lesion_mobility: "Mobility",
  o_spec_plaque: "Plaque", o_spec_ulcer: "Ulcer", o_spec_vesicle: "Vesicle/bulla",
  o_salivary_dry_mouth: "Dry mouth", o_salivary_dry_eye_skin: "Dry eye/skin", o_salivary_flow: "Salivary flow",
  o_adj_sharp_cusp: "Sharp cusp", o_adj_caries: "Caries", o_adj_restoration: "Restoration irritation",

  // --- OP Assessment & Plan ---
  a_working_dx: "Working Dx", a_ro: "Rule out (r/o)", a_risk_malignant: "Malignant potential", a_risk_recurrence: "Recurrence risk",
  p_obs_interval: "Follow up interval",
  p_img_pa: "PA", p_img_pano: "Pano", p_img_cbct: "CBCT",
  p_dx_biopsy: "Biopsy", p_dx_cytology: "Cytology smear",
  p_tx_excision: "Surgical excision", p_tx_steroid: "Steroid therapy", p_tx_trauma: "Elimination of trauma",
  p_refer_os: "OS Refer", p_refer_derm: "Derm Refer", p_refer_onco: "Onco Refer",
  p_fu_pathology: "Pathology review", p_fu_recurrence: "Recurrence monitoring",
};

function loadDeptSoapForm(deptKey) {
  const form = $("soapForm");
  if (deptKey === "os") {
    form.innerHTML = buildOsSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_OS;
    initToggleButtons();
  } else if (deptKey === "opdx") {
    form.innerHTML = buildOpdxSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_OPDX;
  } else if (deptKey === "tmd") {
    form.innerHTML = buildTmdSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_TMD;
    initToggleButtons();
  } else if (deptKey === "ortho") {
    form.innerHTML = buildOrthoSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_ORTHO;
    initToggleButtons();
  } else if (deptKey === "endo") {
    form.innerHTML = buildEndoSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_ENDO;
    initToggleButtons();
  } else if (deptKey === "pedo") {
    form.innerHTML = buildPedoSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_PEDO;
    initToggleButtons();
  } else if (deptKey === "perio") {
    form.innerHTML = buildPerioSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_PERIO;
    initToggleButtons();
  } else if (deptKey === "gd") {
    form.innerHTML = buildGdSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_GD;
    initToggleButtons();
  } else if (deptKey === "pedo_dc") {
    form.innerHTML = buildPedoDcForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_PEDO_DC;
    initToggleButtons();
  } else if (deptKey === "pros") {
    form.innerHTML = buildProsSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_PROS;
    initToggleButtons();
  } else if (deptKey === "implant") {
    form.innerHTML = buildImplantSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_IMPLANT;
    initToggleButtons();
  } else if (deptKey === "rest") {
    form.innerHTML = buildRestSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_REST;
    initToggleButtons();
  } else if (deptKey === "xray") {
    form.innerHTML = buildXraySoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_XRAY;
    initToggleButtons();
  } else {
    // Fallback or generic
    form.innerHTML = buildDxSoapForm();
    ACTIVE_FIELD_LABELS = FIELD_LABELS_DX;
  }
}

/* ---------- Toggle Button Handler ---------- */
function initToggleButtons() {
  document.querySelectorAll(".toggle-btn-group").forEach(group => {
    const targetName = group.dataset.target;
    const hiddenInput = document.querySelector(`input[name="${targetName}"]`);
    group.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.value;
        // deselect siblings
        group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("selected", "selected-neg"));
        // select this one
        if (val === "-") {
          btn.classList.add("selected-neg");
        } else {
          btn.classList.add("selected");
        }
        // write to hidden input
        if (hiddenInput) hiddenInput.value = val;
      });
    });
  });
}


/* ---------- OMFS SOAP form ---------- */
function buildOsSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness (PI)</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>

      <fieldset class="inner-fieldset"><legend>Past Medical History</legend>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Hypertension</label>
            <input type="hidden" name="s_pmh_htn" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_htn">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Diabetes</label>
            <input type="hidden" name="s_pmh_dm" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_dm">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Cardiovascular disease</label>
            <input type="hidden" name="s_pmh_cvd" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_cvd">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Hepatitis</label>
            <input type="hidden" name="s_pmh_hep" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_hep">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="toggle-field">
          <label>Cancer history</label>
          <input type="hidden" name="s_pmh_cancer" value="" />
          <div class="toggle-btn-group" data-target="s_pmh_cancer">
            <span class="toggle-btn" data-value="+">＋</span>
            <span class="toggle-btn" data-value="-">－</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Medications</legend>
        <div class="grid-2">
          <div class="field"><label>Anticoagulant</label><input type="text" name="s_med_anticoag" placeholder="" /></div>
          <div class="field"><label>Steroid</label><input type="text" name="s_med_steroid" placeholder="" /></div>
        </div>
        <div class="field"><label>Immunosuppressant</label><input type="text" name="s_med_immuno" placeholder="" /></div>
      </fieldset>

      <div class="field"><label>Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>

      <fieldset class="inner-fieldset"><legend>Habits</legend>
        <div class="grid-2">
          <div class="field"><label>Smoking</label><input type="text" name="s_habit_smoke" placeholder="" /></div>
          <div class="field"><label>Alcohol</label><input type="text" name="s_habit_alcohol" placeholder="" /></div>
        </div>
        <div class="field"><label>Betel nut</label><input type="text" name="s_habit_betel" placeholder="" /></div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Extra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">EO</div><div class="card-head-text"><b>Extra-oral Examination</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Facial asymmetry</label><input type="text" name="o_facial_asym" placeholder="" /></div>
            <div class="field"><label>Swelling</label><input type="text" name="o_eo_swelling" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Redness</label><input type="text" name="o_eo_redness" placeholder="" /></div>
            <div class="field"><label>Local heat</label><input type="text" name="o_eo_heat" placeholder="" /></div>
          </div>
          <div class="field"><label>Tenderness</label><input type="text" name="o_eo_tenderness" placeholder="" /></div>
          <fieldset class="inner-fieldset"><legend>Lymph Node</legend>
            <div class="grid-2">
              <div class="field"><label>Size</label><input type="text" name="o_ln_size" placeholder="cm" /></div>
              <div class="field"><label>Mobility</label><input type="text" name="o_ln_mobility" placeholder="mobile / fixed" /></div>
            </div>
            <div class="field"><label>Tenderness</label><input type="text" name="o_ln_tender" placeholder="" /></div>
          </fieldset>
        </div>
      </div>

      <!-- Intra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">IO</div><div class="card-head-text"><b>Intra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Dentition</legend>
            <div class="toggle-field">
              <label>Dentition type</label>
              <input type="hidden" name="o_dentition_type" value="" />
              <div class="toggle-btn-group" data-target="o_dentition_type">
                <span class="toggle-btn" data-value="Adult">Adult</span>
                <span class="toggle-btn" data-value="Mixed">Mixed</span>
                <span class="toggle-btn" data-value="Primary">Primary</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
            <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Mucosal Lesion</legend>
            <div class="grid-2">
              <div class="field"><label>Location</label><input type="text" name="o_lesion_loc" placeholder="" /></div>
              <div class="field"><label>Size</label><input type="text" name="o_lesion_size" placeholder="cm" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Color</label><input type="text" name="o_lesion_color" placeholder="" /></div>
              <div class="field"><label>Surface</label><input type="text" name="o_lesion_surface" placeholder="smooth / ulcerated / papillomatous" /></div>
            </div>
            <div class="field"><label>Induration</label><input type="text" name="o_lesion_induration" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Swelling / Mass</legend>
            <div class="grid-2">
              <div class="field"><label>Location</label><input type="text" name="o_mass_loc" placeholder="" /></div>
              <div class="field"><label>Size</label><input type="text" name="o_mass_size" placeholder="cm" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Consistency</label><input type="text" name="o_mass_consistency" placeholder="soft / firm / hard" /></div>
              <div class="field"><label>Mobility</label><input type="text" name="o_mass_mobility" placeholder="mobile / fixed" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Mouth Opening</legend>
            <div class="field"><label>MMO (mm)</label><input type="text" name="o_mmo" placeholder="mm" /></div>
          </fieldset>
        </div>
      </div>

      <!-- Radiographic -->
      <fieldset class="inner-fieldset"><legend>Radiographic Examination</legend>
        <div class="grid-2">
          <div class="field"><label>Panoramic</label><input type="text" name="o_xray_pano" placeholder="" /></div>
          <div class="field"><label>Periapical</label><input type="text" name="o_xray_pa" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>CT / CBCT</label><input type="text" name="o_xray_ct" placeholder="" /></div>
          <div class="field"><label>MRI (if needed)</label><input type="text" name="o_xray_mri" placeholder="" /></div>
        </div>
      </fieldset>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Infection</label><input type="text" name="a_infection" placeholder="" /></div>
        <div class="field"><label>Tumor</label><input type="text" name="a_tumor" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Cyst</label><input type="text" name="a_cyst" placeholder="" /></div>
        <div class="field"><label>Trauma</label><input type="text" name="a_trauma" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Biopsy</label><input type="text" name="p_biopsy" placeholder="" /></div>
        <div class="field"><label>Surgical excision</label><input type="text" name="p_excision" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Extraction</label><input type="text" name="p_extraction" placeholder="" /></div>
        <div class="field"><label>Incision & Drainage</label><input type="text" name="p_id" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Medication</label><input type="text" name="p_medication" placeholder="" /></div>
        <div class="field"><label>Follow-up</label><input type="text" name="p_followup" placeholder="" /></div>
      </div>
    </div>
  </div>`;
}


/* ---------- Default DX SOAP form (original generic form) ---------- */
function buildDxSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge">S</div><div class="card-head-text"><b>Subjective</b><span>Subjective Data</span></div></div>
    <div class="card-body">
      <div class="field"><label>Chief Complaint (CC)</label><textarea name="cc" rows="2" placeholder="Needs review"></textarea></div>
      <div class="field"><label>Present Illness (PI)</label><textarea name="pi" rows="3" placeholder="Needs review"></textarea></div>
      <div class="grid-2">
        <div class="field"><label>Past Medical History (PMH)</label><textarea name="pmh" rows="2" placeholder="Needs review"></textarea></div>
        <div class="field"><label>Past Dental History (PDH)</label><textarea name="pdh" rows="2" placeholder="Needs review"></textarea></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Current Medication</label><textarea name="current_medication" rows="2" placeholder="Needs review"></textarea></div>
        <div class="field"><label>Drug Allergy History</label><textarea name="drug_allergy" rows="2" placeholder="Needs review"></textarea></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Birth History</label><textarea name="birth_history" rows="2" placeholder="Needs review"></textarea></div>
        <div class="field"><label>Vaccination History</label><textarea name="vaccination_history" rows="2" placeholder="Needs review"></textarea></div>
      </div>
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">T</div><div class="card-head-text"><b>TOCC</b><span>Travel / Occupation / Contact / Cluster</span></div></div>
        <div class="card-body">
          <div class="field"><label>Travel History</label><textarea name="tocc_travel" rows="2" placeholder="Needs review"></textarea></div>
          <div class="grid-2">
            <div class="field"><label>Occupation</label><textarea name="tocc_occupation" rows="2" placeholder="Needs review"></textarea></div>
            <div class="field"><label>Contact History</label><textarea name="tocc_contact" rows="2" placeholder="Needs review"></textarea></div>
          </div>
          <div class="field"><label>Cluster</label><input type="text" name="tocc_cluster" placeholder="Needs review" /></div>
        </div>
      </div>
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">R</div><div class="card-head-text"><b>Risk Factors</b><span>Smoking / Alcohol / Betel Nut</span></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Smoking</label><input type="text" name="risk_smoking" placeholder="Needs review" /></div>
            <div class="field"><label>Alcohol</label><input type="text" name="risk_alcohol" placeholder="Needs review" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Betel Nut</label><input type="text" name="risk_betel_nut" placeholder="Needs review" /></div>
          </div>
        </div>
      </div>
      <div class="field"><label>Family History</label><textarea name="family_history" rows="2" placeholder="Needs review"></textarea></div>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Exam Findings</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Pain Score</label><input type="text" name="pain_score" placeholder="Needs review" /></div>
        <div class="field"><label>Pain Pattern</label><input type="text" name="pain_pattern" placeholder="Needs review" /></div>
      </div>
      <div class="field"><label>Pain Location</label><textarea name="pain_location" rows="2" placeholder="Needs review"></textarea></div>
      <div class="grid-2">
        <div class="field"><label>Extraoral Findings</label><textarea name="o_extraoral" rows="2" placeholder="Needs review"></textarea></div>
        <div class="field"><label>Intraoral Findings</label><textarea name="o_intraoral_soft_tissue" rows="2" placeholder="Needs review"></textarea></div>
      </div>
      <div class="field"><label>Present Dentition</label><textarea name="o_teeth_findings" rows="2" placeholder="Needs review"></textarea></div>
    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Location</label><input type="text" name="a_location" placeholder="Needs review" /></div>
      <div class="field"><label>Diagnosis</label><textarea name="a_diagnosis" rows="2" placeholder="Needs review"></textarea></div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="field"><label>Treatment Plan</label><textarea name="p_treatment_plan" rows="3" placeholder="Needs review"></textarea></div>
    </div>
  </div>`;
}


/* ---------- Oral Pathology & Diagnosis (OPDX) SOAP form ---------- */
function buildOpdxSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge">S</div><div class="card-head-text"><b>Subjective</b><span>Subjective Data</span></div></div>
    <div class="card-body">
      <!-- CC -->
      <fieldset class="inner-fieldset"><legend>Chief Complaint (CC)</legend>
        <div class="field"><label>Main Complaint / CC</label><textarea name="cc_main" rows="2" placeholder="Needs review"></textarea></div>
      </fieldset>

      <!-- PI -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">PI</div><div class="card-head-text"><b>Present Illness</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Onset (when first noticed)</label><input type="text" name="pi_onset" placeholder="" /></div>
            <div class="field"><label>Duration</label><input type="text" name="pi_duration" placeholder="" /></div>
          </div>
          <div class="field"><label>Progression</label><input type="text" name="pi_progression" placeholder="stable / enlarging / recurrent" /></div>

          <fieldset class="inner-fieldset"><legend>Symptoms (General)</legend>
            <div class="grid-2">
              <div class="field"><label>Pain Location</label><input type="text" name="pain_location" placeholder="" /></div>
              <div class="field"><label>Pain Score / Pattern</label><input type="text" name="pain_score" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Bleeding</label><input type="text" name="pi_symp_bleeding" placeholder="" /></div>
              <div class="field"><label>Burning sensation</label><input type="text" name="pi_symp_burning" placeholder="" /></div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Trauma / Lesion Changes</legend>
            <div class="grid-2">
              <div class="field"><label>Biting / Sharp tooth</label><input type="text" name="pi_trauma_biting" placeholder="" /></div>
              <div class="field"><label>Denture / Appliance irritation</label><input type="text" name="pi_trauma_denture" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Size/Shape change</label><input type="text" name="pi_lesion_size_change" placeholder="" /></div>
              <div class="field"><label>Color/Surface change</label><input type="text" name="pi_lesion_color_change" placeholder="" /></div>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- History (DX + OP) -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">Hx</div><div class="card-head-text"><b>Medical & Dental History</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Past Medical History (PMH)</label><textarea name="pmh" rows="2" placeholder=""></textarea></div>
            <div class="field"><label>Past Dental History (PDH)</label><textarea name="pdh" rows="2" placeholder=""></textarea></div>
          </div>
          <fieldset class="inner-fieldset"><legend>Specific Systemic Conditions</legend>
            <div class="field"><label>Autoimmune (Sjogren/Lupus/Pemphigus)</label><input type="text" name="pmh_autoimmune" placeholder="" /></div>
            <div class="field"><label>Cancer history</label><input type="text" name="pmh_cancer" placeholder="" /></div>
          </fieldset>
          <div class="grid-2">
            <div class="field"><label>Current Meds / Chemo / Immuno</label><textarea name="current_medication" rows="2" placeholder=""></textarea></div>
            <div class="field"><label>Drug Allergy/Allergy</label><textarea name="drug_allergy" rows="2" placeholder=""></textarea></div>
          </div>
        </div>
      </div>
      
      <!-- TOCC & Habits -->
      <div class="grid-2">
        <div class="soap-card inner">
          <div class="card-head inner-head"><div class="badge t">TOCC</div><div class="card-head-text"><b>TOCC / Vax</b></div></div>
          <div class="card-body">
            <div class="field"><label>Travel</label><input type="text" name="tocc_travel" placeholder="" /></div>
            <div class="field"><label>Occupation/Contact</label><input type="text" name="tocc_occupation" placeholder="" /></div>
            <div class="grid-2">
              <div class="field"><label>Birth Hx</label><input type="text" name="birth_history" placeholder="" /></div>
              <div class="field"><label>Vax Hx</label><input type="text" name="vaccination_history" placeholder="" /></div>
            </div>
          </div>
        </div>
        
        <div class="soap-card inner">
          <div class="card-head inner-head"><div class="badge rf">RF</div><div class="card-head-text"><b>Habits & FH</b></div></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="field"><label>Smoking</label><input type="text" name="risk_smoking" placeholder="" /></div>
              <div class="field"><label>Alcohol</label><input type="text" name="risk_alcohol" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Betel nut</label><input type="text" name="risk_betel_nut" placeholder="" /></div>
              <div class="field"><label>Cheek biting</label><input type="text" name="habit_cheek_biting" placeholder="" /></div>
            </div>
            <div class="field"><label>FH (Oral cancer, etc.)</label><input type="text" name="family_history" placeholder="" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Exam Findings</span></div></div>
    <div class="card-body">
      
      <fieldset class="inner-fieldset"><legend>General Extra/Intra-oral</legend>
        <div class="grid-2">
          <div class="field"><label>Extraoral (LN, Swelling, Asymmetry)</label><textarea name="o_extraoral" rows="2" placeholder=""></textarea></div>
          <div class="field"><label>Present Dentition</label><textarea name="o_teeth_findings" rows="2" placeholder=""></textarea></div>
        </div>
        <div class="field"><label>General Intraoral Soft Tissue</label><textarea name="o_intraoral_soft_tissue" rows="2" placeholder=""></textarea></div>
      </fieldset>

      <!-- Soft tissue tumor / swelling -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">LF</div><div class="card-head-text"><b>Lesion Features (Soft tissue tumor/swelling)</b></div></div>
        <div class="card-body">
          <div class="field"><label>Site / Location</label><input type="text" name="o_lesion_site" placeholder="" /></div>
          <div class="grid-2">
            <div class="field"><label>Surface (smooth/rough/papillary)</label><input type="text" name="o_lesion_surface" placeholder="" /></div>
            <div class="field"><label>Size (cm/mm)</label><input type="text" name="o_lesion_size" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Color</label><input type="text" name="o_lesion_color" placeholder="" /></div>
            <div class="field"><label>Consistency (soft/firm/hard)</label><input type="text" name="o_lesion_consistency" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Fluctuation (±)</label><input type="text" name="o_lesion_fluctuation" placeholder="" /></div>
            <div class="field"><label>Induration (±)</label><input type="text" name="o_lesion_induration" placeholder="" /></div>
          </div>
          <div class="field"><label>Mobility (movable/fixed)</label><input type="text" name="o_lesion_mobility" placeholder="" /></div>
        </div>
      </div>

      <!-- Plaque & Dry Mouth -->
      <fieldset class="inner-fieldset"><legend>White/Red Plaque & Dry Mouth</legend>
        <div class="grid-2">
          <div class="field"><label>Plaque Surface / Texture</label><input type="text" name="o_spec_plaque" placeholder="" /></div>
          <div class="field"><label>Plaque Color / Size / Induration</label><input type="text" name="o_lesion_border" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Dry eye or skin (+ / -)</label><input type="text" name="o_salivary_dry_eye_skin" placeholder="" /></div>
          <div class="field"><label>Salivary flow (major/minor glands)</label><input type="text" name="o_salivary_flow" placeholder="" /></div>
        </div>
      </fieldset>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis & Risk</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Location</label><input type="text" name="a_location" placeholder="" /></div>
        <div class="field"><label>Working Diagnosis</label><input type="text" name="a_working_dx" placeholder="fibroma/mucocele/LP/leukoplakia" /></div>
      </div>
      <div class="field"><label>Rule out (r/o) / DDx</label><input type="text" name="a_ro" placeholder="" /></div>
      <div class="grid-2">
        <div class="field"><label>Malignant potential</label><input type="text" name="a_risk_malignant" placeholder="" /></div>
        <div class="field"><label>Recurrence risk</label><input type="text" name="a_risk_recurrence" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="field"><label>General Treatment Plan</label><textarea name="p_treatment_plan" rows="2" placeholder=""></textarea></div>
      <fieldset class="inner-fieldset"><legend>Diagnostic & Surgeries</legend>
        <div class="grid-2">
          <div class="field"><label>Biopsy (inc/exc) / Smear</label><input type="text" name="p_dx_biopsy" placeholder="" /></div>
          <div class="field"><label>Imaging (PA/Pano/CBCT)</label><input type="text" name="p_img_pano" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Surgical excision / Steroid</label><input type="text" name="p_tx_excision" placeholder="" /></div>
          <div class="field"><label>Elimination of trauma</label><input type="text" name="p_tx_trauma" placeholder="" /></div>
        </div>
      </fieldset>
      
      <fieldset class="inner-fieldset"><legend>Referral & Follow up</legend>
        <div class="grid-2">
          <div class="field"><label>Observation / Follow up interval</label><input type="text" name="p_obs_interval" placeholder="" /></div>
          <div class="field"><label>Pathology report review</label><input type="text" name="p_fu_pathology" placeholder="" /></div>
        </div>
        <div class="field"><label>Referral (OS/Derm/Onco/Endo)</label><input type="text" name="p_refer_os" placeholder="" /></div>
      </fieldset>
    </div>
  </div>`;
}


/* ---------- TMD Field Labels ---------- */
const FIELD_LABELS_TMD = {
  s_cc: "CC", s_pi: "PI", s_onset: "Onset", s_duration: "Duration",
  s_pain_location: "Pain location", s_pain_character: "Character",
  s_pain_severity: "Severity", s_pain_trigger: "Triggers",
  s_jaw_noise: "Jaw noise", s_jaw_locking: "Jaw locking",
  s_headache: "Headache", s_earache: "Ear pain/tinnitus",
  s_pmh: "PMH", s_pdh: "PDH", s_meds: "Meds", s_allergy: "Allergy",
  s_habits_bruxism: "Habits – bruxism", s_habits_clenching: "Habits – clenching",
  s_stress: "Stress level", s_sleep_hx: "Sleep history",
  // Objective
  o_extraoral: "Extraoral", o_intraoral: "Intraoral soft tissue",
  o_tmd_mmo: "MMO (mm)", o_tmd_mmo_pain: "MMO pain",
  o_tmd_click_r: "Clicking R", o_tmd_click_l: "Clicking L",
  o_tmd_crep_r: "Crepitus R", o_tmd_crep_l: "Crepitus L",
  o_tmd_comp_r: "Compression pain R", o_tmd_comp_l: "Compression pain L",
  o_tmd_masseter_r: "Masseter pain R", o_tmd_masseter_l: "Masseter pain L",
  o_tmd_bruxism: "Bruxism", o_tmd_clenching: "Clenching", o_tmd_tongue_thrust: "Tongue thrust",
  o_tmd_sleep: "Sleep quality",
  o_occlusion: "Occlusion", o_teeth: "Teeth findings",
  // Assessment
  a_dx: "Diagnosis", a_ddx: "DDx", a_dc_tmd: "DC/TMD classification",
  // Plan
  p_treatment: "Treatment plan", p_splint: "Splint therapy",
  p_pt: "Physical therapy", p_meds: "Medications",
  p_imaging: "Imaging", p_referral: "Referral", p_followup: "Follow-up",
};


/* ---------- TMD SOAP form ---------- */
function buildTmdSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <fieldset class="inner-fieldset"><legend>Pain / Jaw Symptoms</legend>
        <div class="grid-2">
          <div class="field"><label>Pain location</label><input type="text" name="s_pain_location" placeholder="TMJ / masseter / temporal" /></div>
          <div class="field"><label>Character (dull/sharp/aching)</label><input type="text" name="s_pain_character" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Severity (0-10)</label><input type="text" name="s_pain_severity" placeholder="" /></div>
          <div class="field"><label>Triggers (chewing/yawning/stress)</label><input type="text" name="s_pain_trigger" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Jaw noise (clicking/popping)</label><input type="text" name="s_jaw_noise" placeholder="" /></div>
          <div class="field"><label>Jaw locking (open/closed)</label><input type="text" name="s_jaw_locking" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Headache</label><input type="text" name="s_headache" placeholder="" /></div>
          <div class="field"><label>Ear pain / Tinnitus</label><input type="text" name="s_earache" placeholder="" /></div>
        </div>
      </fieldset>
      <fieldset class="inner-fieldset"><legend>Medical / Dental History</legend>
        <div class="grid-2">
          <div class="field"><label>PMH</label><input type="text" name="s_pmh" placeholder="" /></div>
          <div class="field"><label>PDH</label><input type="text" name="s_pdh" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Current Medications</label><input type="text" name="s_meds" placeholder="" /></div>
          <div class="field"><label>Drug Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
        </div>
      </fieldset>
      <fieldset class="inner-fieldset"><legend>Habits & Stress</legend>
        <div class="grid-2">
          <div class="field"><label>Bruxism history</label><input type="text" name="s_habits_bruxism" placeholder="" /></div>
          <div class="field"><label>Clenching history</label><input type="text" name="s_habits_clenching" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Stress level</label><input type="text" name="s_stress" placeholder="" /></div>
          <div class="field"><label>Sleep quality history</label><input type="text" name="s_sleep_hx" placeholder="" /></div>
        </div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>TMJ Examination</span></div></div>
    <div class="card-body">

      <fieldset class="inner-fieldset"><legend>General</legend>
        <div class="grid-2">
          <div class="field"><label>Extraoral (asymmetry, swelling)</label><textarea name="o_extraoral" rows="2" placeholder=""></textarea></div>
          <div class="field"><label>Intraoral soft tissue</label><textarea name="o_intraoral" rows="2" placeholder=""></textarea></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Occlusion</label><input type="text" name="o_occlusion" placeholder="" /></div>
          <div class="field"><label>Teeth findings</label><input type="text" name="o_teeth" placeholder="" /></div>
        </div>
      </fieldset>

      <!-- TMJ Examination -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">TMD</div><div class="card-head-text"><b>TMJ Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>MMO</legend>
            <div class="grid-2">
              <div class="field"><label>Measurement (mm)</label><input type="text" name="o_tmd_mmo" placeholder="e.g. 35" /></div>
              <div class="toggle-field">
                <label>Pain</label>
                <input type="hidden" name="o_tmd_mmo_pain" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_mmo_pain">
                  <span class="toggle-btn" data-value="with pain">With pain</span>
                  <span class="toggle-btn" data-value="without pain">Without pain</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Clicking Sound</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Right</label>
                <input type="hidden" name="o_tmd_click_r" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_click_r">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Left</label>
                <input type="hidden" name="o_tmd_click_l" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_click_l">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Crepitus</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Right</label>
                <input type="hidden" name="o_tmd_crep_r" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_crep_r">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Left</label>
                <input type="hidden" name="o_tmd_crep_l" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_crep_l">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>TMJ Compression Pain</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Right</label>
                <input type="hidden" name="o_tmd_comp_r" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_comp_r">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Left</label>
                <input type="hidden" name="o_tmd_comp_l" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_comp_l">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Muscle Palpation Pain (Masseter)</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Right</label>
                <input type="hidden" name="o_tmd_masseter_r" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_masseter_r">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Left</label>
                <input type="hidden" name="o_tmd_masseter_l" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_masseter_l">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Parafunction</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Bruxism</label>
                <input type="hidden" name="o_tmd_bruxism" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_bruxism">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Clenching</label>
                <input type="hidden" name="o_tmd_clenching" value="" />
                <div class="toggle-btn-group" data-target="o_tmd_clenching">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
            <div class="toggle-field" style="margin-top:8px">
              <label>Tongue Thrust</label>
              <input type="hidden" name="o_tmd_tongue_thrust" value="" />
              <div class="toggle-btn-group" data-target="o_tmd_tongue_thrust">
                <span class="toggle-btn" data-value="+">＋</span>
                <span class="toggle-btn" data-value="-">－</span>
              </div>
            </div>
          </fieldset>
          <div class="toggle-field" style="margin-top:4px">
            <label>Sleep Quality</label>
            <input type="hidden" name="o_tmd_sleep" value="" />
            <div class="toggle-btn-group" data-target="o_tmd_sleep">
              <span class="toggle-btn" data-value="good">Good</span>
              <span class="toggle-btn" data-value="fair">Fair</span>
              <span class="toggle-btn" data-value="poor">Poor</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Diagnosis (DC/TMD classification)</label><input type="text" name="a_dc_tmd" placeholder="e.g. Disc displacement with/without reduction" /></div>
      <div class="grid-2">
        <div class="field"><label>Working Dx</label><input type="text" name="a_dx" placeholder="" /></div>
        <div class="field"><label>DDx / Rule out</label><input type="text" name="a_ddx" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Management</span></div></div>
    <div class="card-body">
      <div class="field"><label>Treatment Plan</label><textarea name="p_treatment" rows="2" placeholder=""></textarea></div>
      <fieldset class="inner-fieldset"><legend>Interventions</legend>
        <div class="grid-2">
          <div class="field"><label>Splint therapy (type)</label><input type="text" name="p_splint" placeholder="" /></div>
          <div class="field"><label>Physical therapy / exercises</label><input type="text" name="p_pt" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Medications (NSAID/muscle relaxant)</label><input type="text" name="p_meds" placeholder="" /></div>
          <div class="field"><label>Imaging (Pano/MRI/CBCT)</label><input type="text" name="p_imaging" placeholder="" /></div>
        </div>
      </fieldset>
      <fieldset class="inner-fieldset"><legend>Follow-up</legend>
        <div class="grid-2">
          <div class="field"><label>Referral (ENT/Ortho/PT)</label><input type="text" name="p_referral" placeholder="" /></div>
          <div class="field"><label>Follow-up interval</label><input type="text" name="p_followup" placeholder="" /></div>
        </div>
      </fieldset>
    </div>
  </div>`;
}


/* ---------- TMD SOP checklist items ---------- */
const SOP_ITEMS_TMD = {
  level_0: [
    { id: "tmd_cc", label: "CC (Chief Complaint)", keywords: ["chief complaint", "what brings you", "problem", "CC"] },
    { id: "tmd_pi", label: "PI", keywords: ["started", "when", "how long", "history"] },
    { id: "tmd_pain", label: "Pain", keywords: ["pain", "ache", "sore", "TMJ pain"] },
    { id: "tmd_noise", label: "Joint Sound", keywords: ["clicking", "popping", "crepitus", "noise"] },
    { id: "tmd_locking", label: "Locking", keywords: ["lock", "stuck", "cannot open", "cannot close", "locking"] },
  ],
  level_1_modules: {
    tmd_myalgia: {
      label: "Myalgia",
      detect_keywords: ["muscle pain", "masseter", "temple", "temporal"],
      items: [
        { id: "tmd_my_location", label: "Pain Location", keywords: ["which side", "left right", "temple"] },
        { id: "tmd_my_palpation", label: "Palpation Tenderness", keywords: ["tenderness", "pressing", "palpation"] },
        { id: "tmd_my_trigger", label: "Triggering Factors", keywords: ["chewing", "opening", "yawning", "stress"] },
      ],
      red_flags: []
    },
    tmd_disc: {
      label: "Disc Disorder",
      detect_keywords: ["clicking", "stuck", "lock", "disc"],
      items: [
        { id: "tmd_disc_type", label: "With/Without Reduction", keywords: ["reduction", "recapture"] },
        { id: "tmd_disc_timing", label: "Opening/Closing", keywords: ["opening", "closing", "click"] },
      ],
      red_flags: [
        { id: "tmd_disc_lock", label: "Acute Lock", keywords: ["sudden lock", "cannot open", "acute"] }
      ]
    },
  },
  level_2: [
    { id: "tmd_pmh", label: "PMH", keywords: ["medical history", "PMH"] },
    { id: "tmd_meds", label: "Meds", keywords: ["medication", "painkiller"] },
    { id: "tmd_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "tmd_habits", label: "Habits", keywords: ["grinding", "clenching", "bruxism"] },
    { id: "tmd_stress", label: "Stress/Sleep", keywords: ["stress", "insomnia", "sleep"] },
    { id: "tmd_imaging", label: "Imaging", keywords: ["MRI", "CBCT", "Pano", "X-ray"] },
  ]
};


/* ---------- Ortho Field Labels ---------- */
const FIELD_LABELS_ORTHO = {
  s_cc: "CC", s_pi: "PI",
  s_concern: "Concern", s_duration: "Duration", s_pmh: "PMH", s_pdh: "PDH",
  s_meds: "Meds", s_allergy: "Allergy", s_habits: "Habits", s_growth: "Growth status",
  // Extraoral
  o_facial_proportion: "Facial proportion", o_facial_symmetry: "Facial symmetry",
  o_chin_deviation_dir: "Chin deviation dir", o_chin_deviation_mm: "Chin deviation mm",
  o_gummy_smile: "Gummy smile", o_upper_midline_shift: "Upper midline shift",
  o_upper_midline_ref: "Upper midline vs facial",
  o_profile: "Profile", o_nasolabial_angle: "Nasolabial angle",
  o_lip_incompetence: "Lip incompetence", o_mentalis_strain: "Mentalis strain",
  // TMJ
  o_tmj_mmo: "MMO (mm)", o_tmj_mmo_pain: "MMO pain",
  o_tmj_palpation: "TMJ palpation pain",
  o_tmj_click_r: "Clicking R", o_tmj_click_l: "Clicking L",
  o_tmj_masseter: "Masseter tenderness", o_tmj_temporalis: "Temporalis tenderness",
  // Intraoral
  o_dentition_type: "Dentition type", o_dentition_chart: "Dentition chart", o_dentition_notes: "Dentition notes",
  o_arch_upper: "Arch upper", o_arch_lower: "Arch lower",
  o_overjet: "Overjet (mm)", o_overbite: "Overbite (mm)",
  o_canine_r: "Canine R", o_canine_l: "Canine L",
  o_molar_r: "Molar R", o_molar_l: "Molar L",
  o_lower_midline_mm: "Lower midline shift mm", o_lower_midline_dir: "Lower midline direction",
  o_spacing: "Spacing", o_openbite: "Open bite", o_crossbite: "Cross bite",
  // A & P
  a_dx: "Diagnosis", a_classification: "Angle classification", a_skeletal: "Skeletal pattern",
  p_treatment: "Treatment plan", p_appliance: "Appliance", p_extraction: "Extraction plan",
  p_imaging: "Imaging", p_referral: "Referral", p_followup: "Follow-up",
};


/* ---------- Ortho SOAP form ---------- */
function buildOrthoSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint / Concern</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Duration</label><input type="text" name="s_duration" placeholder="" /></div>
        <div class="field"><label>Growth status (growing/non-growing)</label><input type="text" name="s_growth" placeholder="" /></div>
      </div>
      <fieldset class="inner-fieldset"><legend>Medical / Dental History</legend>
        <div class="grid-2">
          <div class="field"><label>PMH</label><input type="text" name="s_pmh" placeholder="" /></div>
          <div class="field"><label>PDH</label><input type="text" name="s_pdh" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Current Medications</label><input type="text" name="s_meds" placeholder="" /></div>
          <div class="field"><label>Drug Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
        </div>
        <div class="field"><label>Habits (thumb sucking, mouth breathing, tongue thrust)</label><input type="text" name="s_habits" placeholder="" /></div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Extra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">EO</div><div class="card-head-text"><b>Extra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Frontal View</legend>
            <div class="field"><label>Facial proportion</label><input type="text" name="o_facial_proportion" placeholder="" /></div>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Facial symmetry</label>
                <input type="hidden" name="o_facial_symmetry" value="" />
                <div class="toggle-btn-group" data-target="o_facial_symmetry">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="field"><label>Chin deviation (direction & mm)</label>
                <div class="grid-2">
                  <input type="text" name="o_chin_deviation_dir" placeholder="R / L" />
                  <input type="text" name="o_chin_deviation_mm" placeholder="mm" />
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Smiling View</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Gummy smile</label>
                <input type="hidden" name="o_gummy_smile" value="" />
                <div class="toggle-btn-group" data-target="o_gummy_smile">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="field"><label>Upper dental midline shift</label>
                <div class="grid-2">
                  <input type="text" name="o_upper_midline_shift" placeholder="mm" />
                  <input type="text" name="o_upper_midline_ref" placeholder="relative to facial midline" />
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Lateral View</legend>
            <div class="toggle-field">
              <label>Profile</label>
              <input type="hidden" name="o_profile" value="" />
              <div class="toggle-btn-group" data-target="o_profile">
                <span class="toggle-btn" data-value="straight">Straight</span>
                <span class="toggle-btn" data-value="convex">Convex</span>
                <span class="toggle-btn" data-value="concave">Concave</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Nasolabial angle</label><input type="text" name="o_nasolabial_angle" placeholder="" /></div>
            <div class="grid-2" style="margin-top:8px">
              <div class="toggle-field">
                <label>Lip incompetence</label>
                <input type="hidden" name="o_lip_incompetence" value="" />
                <div class="toggle-btn-group" data-target="o_lip_incompetence">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Mentalis strain</label>
                <input type="hidden" name="o_mentalis_strain" value="" />
                <div class="toggle-btn-group" data-target="o_mentalis_strain">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- TMJ Examination -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">TMJ</div><div class="card-head-text"><b>TMJ Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>MMO</legend>
            <div class="grid-2">
              <div class="field"><label>Measurement (mm)</label><input type="text" name="o_tmj_mmo" placeholder="" /></div>
              <div class="toggle-field">
                <label>Pain</label>
                <input type="hidden" name="o_tmj_mmo_pain" value="" />
                <div class="toggle-btn-group" data-target="o_tmj_mmo_pain">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <div class="grid-2">
            <div class="toggle-field">
              <label>TMJ palpation pain</label>
              <input type="hidden" name="o_tmj_palpation" value="" />
              <div class="toggle-btn-group" data-target="o_tmj_palpation">
                <span class="toggle-btn" data-value="+">＋</span>
                <span class="toggle-btn" data-value="-">－</span>
              </div>
            </div>
            <div class="field"><label>Clicking sound (R / L)</label>
              <div class="grid-2">
                <input type="text" name="o_tmj_click_r" placeholder="Right" />
                <input type="text" name="o_tmj_click_l" placeholder="Left" />
              </div>
            </div>
          </div>
          <div class="grid-2" style="margin-top:8px">
            <div class="field"><label>Masseter tenderness</label><input type="text" name="o_tmj_masseter" placeholder="" /></div>
            <div class="field"><label>Temporalis tenderness</label><input type="text" name="o_tmj_temporalis" placeholder="" /></div>
          </div>
        </div>
      </div>

      <!-- Intra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge s">IO</div><div class="card-head-text"><b>Intra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Dentition</legend>
            <div class="toggle-field">
              <label>Dentition type</label>
              <input type="hidden" name="o_dentition_type" value="" />
              <div class="toggle-btn-group" data-target="o_dentition_type">
                <span class="toggle-btn" data-value="Adult">Adult</span>
                <span class="toggle-btn" data-value="Mixed">Mixed</span>
                <span class="toggle-btn" data-value="Primary">Primary</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Dentition chart / Missing teeth</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
            <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Arch Form</legend>
            <div class="grid-2">
              <div class="field"><label>Upper</label><input type="text" name="o_arch_upper" placeholder="U-shaped / V-shaped / narrow" /></div>
              <div class="field"><label>Lower</label><input type="text" name="o_arch_lower" placeholder="" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Measurements</legend>
            <div class="grid-2">
              <div class="field"><label>Overjet (mm)</label><input type="text" name="o_overjet" placeholder="" /></div>
              <div class="field"><label>Overbite (mm)</label><input type="text" name="o_overbite" placeholder="" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Canine Relationship</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Right</label>
                <input type="hidden" name="o_canine_r" value="" />
                <div class="toggle-btn-group" data-target="o_canine_r">
                  <span class="toggle-btn" data-value="Class I">Class I</span>
                  <span class="toggle-btn" data-value="Class II">Class II</span>
                  <span class="toggle-btn" data-value="Class III">Class III</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Left</label>
                <input type="hidden" name="o_canine_l" value="" />
                <div class="toggle-btn-group" data-target="o_canine_l">
                  <span class="toggle-btn" data-value="Class I">Class I</span>
                  <span class="toggle-btn" data-value="Class II">Class II</span>
                  <span class="toggle-btn" data-value="Class III">Class III</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Molar Relationship</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Right</label>
                <input type="hidden" name="o_molar_r" value="" />
                <div class="toggle-btn-group" data-target="o_molar_r">
                  <span class="toggle-btn" data-value="Class I">Class I</span>
                  <span class="toggle-btn" data-value="Class II">Class II</span>
                  <span class="toggle-btn" data-value="Class III">Class III</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Left</label>
                <input type="hidden" name="o_molar_l" value="" />
                <div class="toggle-btn-group" data-target="o_molar_l">
                  <span class="toggle-btn" data-value="Class I">Class I</span>
                  <span class="toggle-btn" data-value="Class II">Class II</span>
                  <span class="toggle-btn" data-value="Class III">Class III</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Lower Dental Midline Shift</legend>
            <div class="grid-2">
              <div class="field"><label>mm</label><input type="text" name="o_lower_midline_mm" placeholder="" /></div>
              <div class="field"><label>Direction</label><input type="text" name="o_lower_midline_dir" placeholder="R / L" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Other Findings</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Spacing</label>
                <input type="hidden" name="o_spacing" value="" />
                <div class="toggle-btn-group" data-target="o_spacing">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Open bite</label>
                <input type="hidden" name="o_openbite" value="" />
                <div class="toggle-btn-group" data-target="o_openbite">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
            <div class="toggle-field" style="margin-top:8px">
              <label>Cross bite</label>
              <input type="hidden" name="o_crossbite" value="" />
              <div class="toggle-btn-group" data-target="o_crossbite">
                <span class="toggle-btn" data-value="+">＋</span>
                <span class="toggle-btn" data-value="-">－</span>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Angle Classification</label><input type="text" name="a_classification" placeholder="Class I / II div1 / II div2 / III" /></div>
      <div class="grid-2">
        <div class="field"><label>Skeletal pattern</label><input type="text" name="a_skeletal" placeholder="Class I / II / III" /></div>
        <div class="field"><label>Working Diagnosis</label><input type="text" name="a_dx" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="field"><label>Treatment Plan</label><textarea name="p_treatment" rows="2" placeholder=""></textarea></div>
      <fieldset class="inner-fieldset"><legend>Details</legend>
        <div class="grid-2">
          <div class="field"><label>Appliance (fixed/removable/aligner)</label><input type="text" name="p_appliance" placeholder="" /></div>
          <div class="field"><label>Extraction plan</label><input type="text" name="p_extraction" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Imaging (Ceph/Pano/CBCT)</label><input type="text" name="p_imaging" placeholder="" /></div>
          <div class="field"><label>Referral</label><input type="text" name="p_referral" placeholder="" /></div>
        </div>
        <div class="field"><label>Follow-up interval</label><input type="text" name="p_followup" placeholder="" /></div>
      </fieldset>
    </div>
  </div>`;
}


/* ---------- Ortho SOP checklist items ---------- */
const SOP_ITEMS_ORTHO = {
  level_0: [
    { id: "ortho_cc", label: "CC (Chief Complaint)", keywords: ["Chief Complaint", "orthodontic", "protruding teeth", "no整齊", "戳地swellingdays", "CC"] },
    { id: "ortho_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "ortho_concern", label: "主要訴求", keywords: ["想要", "希望", "美觀", "功能"] },
    { id: "ortho_habits", label: "Habits", keywords: ["吸finger", "口呼吸", "吐tongue", "grinding"] },
  ],
  level_1_modules: {
    ortho_crowding: {
      label: "crowding",
      detect_keywords: ["crowding", "no整齊", "歪", "spaceno夠", "crowding"],
      items: [
        { id: "ortho_cr_severity", label: "severesevere", keywords: ["輕微", "moderate", "severe"] },
        { id: "ortho_cr_location", label: "location", keywords: ["anteriortooth", "posteriortooth", "maxillary", "mandibular"] },
      ],
      red_flags: []
    },
    ortho_skeletal: {
      label: "bony問題",
      detect_keywords: ["戳地swellingdays", "lower巴anteriorsudden", "maxillaryanteriorsudden", "bony", "skeletal"],
      items: [
        { id: "ortho_sk_class", label: "Skeletal class", keywords: ["Class", "bony"] },
        { id: "ortho_sk_growth", label: "growth狀態", keywords: ["growth", "發育", "青few年"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "ortho_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "ortho_pdh", label: "PDH", keywords: ["tooth科", "PDH"] },
    { id: "ortho_tmj", label: "TMJ", keywords: ["TMJ", "joint", "clicking", "clicking"] },
    { id: "ortho_imaging", label: "Imaging", keywords: ["Ceph", "Pano", "CBCT", "XX-ray"] },
    { id: "ortho_extraction", label: "extractionplan", keywords: ["extraction", "extraction", "拔"] },
  ]
};


/* ---------- Endo Field Labels ---------- */
const FIELD_LABELS_ENDO = {
  s_cc: "CC", s_pi: "PI", s_onset: "Onset", s_duration: "Duration",
  s_pain_location: "Pain location", s_pain_character: "Character",
  s_pain_severity: "Severity", s_pain_trigger: "Triggers",
  s_pain_spontaneous: "Spontaneous pain", s_pain_thermal: "Thermal sensitivity",
  s_pmh: "PMH", s_pdh: "PDH", s_meds: "Meds", s_allergy: "Allergy",
  // Objective
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_tooth_number: "Tooth #", o_crown: "Crown",
  o_ging_inflam: "Gingiva inflammation", o_ging_swell: "Gingiva swelling",
  o_percussion: "Percussion pain", o_palpation: "Palpation pain",
  o_ept: "EPT value", o_cold_test: "Cold test",
  o_mobility: "Mobility", o_probing_b: "Probing B", o_probing_l: "Probing L", o_probing_i: "Probing interprox",
  o_sinus_tract: "Sinus tract", o_sinus_loc: "Sinus tract location",
  o_periapical: "Periapical findings", o_xray: "X-ray findings",
  // A & P
  a_dx: "Diagnosis", a_pulp_dx: "Pulp Dx", a_periapical_dx: "Periapical Dx",
  p_treatment: "Treatment plan", p_rct: "RCT", p_meds: "Medications",
  p_referral: "Referral", p_followup: "Follow-up",
};


/* ---------- Endo SOAP form ---------- */
function buildEndoSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <fieldset class="inner-fieldset"><legend>Pain History</legend>
        <div class="grid-2">
          <div class="field"><label>Pain location (tooth #)</label><input type="text" name="s_pain_location" placeholder="" /></div>
          <div class="field"><label>Character (sharp/dull/throbbing)</label><input type="text" name="s_pain_character" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Severity (0-10)</label><input type="text" name="s_pain_severity" placeholder="" /></div>
          <div class="field"><label>Triggers (hot/cold/biting/spontaneous)</label><input type="text" name="s_pain_trigger" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Spontaneous pain</label><input type="text" name="s_pain_spontaneous" placeholder="" /></div>
          <div class="field"><label>Thermal sensitivity (hot/cold/lingering)</label><input type="text" name="s_pain_thermal" placeholder="" /></div>
        </div>
      </fieldset>
      <fieldset class="inner-fieldset"><legend>Medical / Dental History</legend>
        <div class="grid-2">
          <div class="field"><label>PMH</label><input type="text" name="s_pmh" placeholder="" /></div>
          <div class="field"><label>PDH</label><input type="text" name="s_pdh" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Current Medications</label><input type="text" name="s_meds" placeholder="" /></div>
          <div class="field"><label>Drug Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
        </div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Dentition -->
      <fieldset class="inner-fieldset"><legend>Dentition</legend>
        <div class="toggle-field">
          <label>Dentition type</label>
          <input type="hidden" name="o_dentition_type" value="" />
          <div class="toggle-btn-group" data-target="o_dentition_type">
            <span class="toggle-btn" data-value="Adult">Adult</span>
            <span class="toggle-btn" data-value="Mixed">Mixed</span>
            <span class="toggle-btn" data-value="Primary">Primary</span>
          </div>
        </div>
        <div class="field" style="margin-top:8px"><label>Dentition chart / Missing teeth</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
        <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
      </fieldset>

      <!-- Tooth Evaluation Table -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">Eval</div><div class="card-head-text"><b>Tooth Evaluation Table</b></div></div>
        <div class="card-body">
          <div class="field"><label>Tooth Number</label><input type="text" name="o_tooth_number" placeholder="e.g. #14, #36" /></div>

          <fieldset class="inner-fieldset"><legend>Crown & Gingiva</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Crown</label>
                <input type="hidden" name="o_crown" value="" />
                <div class="toggle-btn-group" data-target="o_crown">
                  <span class="toggle-btn" data-value="present">Present</span>
                  <span class="toggle-btn" data-value="absent">Absent</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Gingiva inflammation</label>
                <input type="hidden" name="o_ging_inflam" value="" />
                <div class="toggle-btn-group" data-target="o_ging_inflam">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
            <div class="toggle-field" style="margin-top:4px">
              <label>Gingiva swelling</label>
              <input type="hidden" name="o_ging_swell" value="" />
              <div class="toggle-btn-group" data-target="o_ging_swell">
                <span class="toggle-btn" data-value="+">＋</span>
                <span class="toggle-btn" data-value="-">－</span>
              </div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Pain Tests</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Percussion pain</label>
                <input type="hidden" name="o_percussion" value="" />
                <div class="toggle-btn-group" data-target="o_percussion">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Palpation pain</label>
                <input type="hidden" name="o_palpation" value="" />
                <div class="toggle-btn-group" data-target="o_palpation">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Vitality Tests</legend>
            <div class="grid-2">
              <div class="field"><label>EPT (numeric value)</label><input type="text" name="o_ept" placeholder="value or NT" /></div>
              <div class="toggle-field">
                <label>Cold test</label>
                <input type="hidden" name="o_cold_test" value="" />
                <div class="toggle-btn-group" data-target="o_cold_test">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                  <span class="toggle-btn" data-value="NT">NT</span>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Mobility</legend>
            <div class="toggle-field">
              <label>Grade</label>
              <input type="hidden" name="o_mobility" value="" />
              <div class="toggle-btn-group" data-target="o_mobility">
                <span class="toggle-btn" data-value="Gr I">Gr I</span>
                <span class="toggle-btn" data-value="Gr II">Gr II</span>
                <span class="toggle-btn" data-value="Gr III">Gr III</span>
              </div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Probing Depth</legend>
            <div class="grid-2">
              <div class="field"><label>Buccal</label><input type="text" name="o_probing_b" placeholder="mm" /></div>
              <div class="field"><label>Lingual</label><input type="text" name="o_probing_l" placeholder="mm" /></div>
            </div>
            <div class="field"><label>Interproximal</label><input type="text" name="o_probing_i" placeholder="mm" /></div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Sinus Tract</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Present</label>
                <input type="hidden" name="o_sinus_tract" value="" />
                <div class="toggle-btn-group" data-target="o_sinus_tract">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="field"><label>Location (L=labial / P=palatal)</label><input type="text" name="o_sinus_loc" placeholder="L / P" /></div>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- Additional Findings -->
      <fieldset class="inner-fieldset"><legend>Radiographic Findings</legend>
        <div class="grid-2">
          <div class="field"><label>Periapical findings</label><textarea name="o_periapical" rows="2" placeholder=""></textarea></div>
          <div class="field"><label>X-ray findings</label><textarea name="o_xray" rows="2" placeholder=""></textarea></div>
        </div>
      </fieldset>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Pulp Diagnosis</label><input type="text" name="a_pulp_dx" placeholder="Normal / Reversible / Irreversible / Necrotic" /></div>
        <div class="field"><label>Periapical Diagnosis</label><input type="text" name="a_periapical_dx" placeholder="Normal / Acute / Chronic apical" /></div>
      </div>
      <div class="field"><label>Working Diagnosis</label><input type="text" name="a_dx" placeholder="" /></div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="field"><label>Treatment Plan</label><textarea name="p_treatment" rows="2" placeholder=""></textarea></div>
      <fieldset class="inner-fieldset"><legend>Details</legend>
        <div class="grid-2">
          <div class="field"><label>RCT (pulpectomy/pulpotomy/retreatment)</label><input type="text" name="p_rct" placeholder="" /></div>
          <div class="field"><label>Medications (ABx/analgesic)</label><input type="text" name="p_meds" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Referral</label><input type="text" name="p_referral" placeholder="" /></div>
          <div class="field"><label>Follow-up interval</label><input type="text" name="p_followup" placeholder="" /></div>
        </div>
      </fieldset>
    </div>
  </div>`;
}


/* ---------- Endo SOP checklist items ---------- */
const SOP_ITEMS_ENDO = {
  level_0: [
    { id: "endo_cc", label: "CC (Chief Complaint)", keywords: ["Chief Complaint", "pain", "toothache", "CC"] },
    { id: "endo_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "endo_pain", label: "Pain描述", keywords: ["pain", "sharp", "sore", "spontaneous", "hotpain", "coldpain", "continuous"] },
    { id: "endo_tooth", label: "患齒location", keywords: ["#", "teeth", "which tooth", "欲"] },
  ],
  level_1_modules: {
    endo_irreversible: {
      label: "no可逆typetooth髄炎",
      detect_keywords: ["spontaneouspain", "功能pain", "hotpain", "continuouspain", "irreversible"],
      items: [
        { id: "endo_ir_spontaneous", label: "spontaneous pain", keywords: ["spontaneous", "noyesirritation也pain"] },
        { id: "endo_ir_lingering", label: "滯留pain", keywords: ["continuous", "很久才消", "lingering"] },
      ],
      red_flags: [
        { id: "endo_ir_swelling", label: "Swelling", keywords: ["swelling", "膨", "pus"] }
      ]
    },
    endo_necrosis: {
      label: "tooth髄necrotic死",
      detect_keywords: ["noyes感覺", "死tooth", "discoloration", "necrosis"],
      items: [
        { id: "endo_ne_sinus", label: "tumor管", keywords: ["tumor管", "sinus tract", "swelling"] },
        { id: "endo_ne_discolor", label: "discoloration", keywords: ["discoloration", "dark", "暗"] },
      ],
      red_flags: [
        { id: "endo_ne_cellulitis", label: "蜂窝typetissue炎", keywords: ["擴散", "口底", "嘴巴cannot open"] }
      ]
    },
  },
  level_2: [
    { id: "endo_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "endo_meds", label: "Meds", keywords: ["medication", "painkiller"] },
    { id: "endo_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "endo_vitality", label: "vitaltype測試", keywords: ["EPT", "cold", "cold test", "EPT"] },
    { id: "endo_xray", label: "X-ray", keywords: ["PA", "periapical", "XX-ray", "radiation"] },
  ]
};


/* ---------- Pedo Field Labels ---------- */
const FIELD_LABELS_PEDO = {
  s_cc: "CC", s_pi: "PI",
  s_pmh_systemic: "Systemic disease", s_pmh_allergy: "Allergy",
  s_meds: "Meds", s_travel: "Travel (3個月)", s_fh: "Family Hx",
  o_behavior: "Behavior",
  o_pain_score: "Pain score", o_pain_location: "Pain location", o_pain_duration: "Pain duration",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_ging_inflam: "Gingiva inflammation", o_ging_plaque: "Plaque deposition",
  o_eruption: "Tooth eruption", o_sealant: "Pit & fissure sealant",
  o_supernumerary: "Supernumerary tooth",
  o_lesion_location: "Oral lesion location", o_lesion_size: "Lesion size",
  o_lesion_surface: "Lesion surface", o_lesion_color: "Lesion color", o_lesion_consistency: "Lesion consistency",
  a_dx: "Diagnosis", a_icd: "ICD code",
  p_exam: "Examination", p_ohi: "OHI",
  p_xray_pa: "PA", p_xray_pano: "Pano",
  p_tx_plan: "Treatment plan", p_tx_surgery: "Surgical removal", p_tx_habit: "Habit control",
};


/* ---------- Pedo SOAP form ---------- */
function buildPedoSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>現history (PI)</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <fieldset class="inner-fieldset"><legend>過去history (PMH)</legend>
        <div class="grid-2">
          <div class="field"><label>Systemic disease</label><input type="text" name="s_pmh_systemic" placeholder="" /></div>
          <div class="field"><label>Drug Allergy</label><input type="text" name="s_pmh_allergy" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>itemanteriorusemedication</label><input type="text" name="s_meds" placeholder="" /></div>
          <div class="field"><label>最近三個月旅遊史</label><input type="text" name="s_travel" placeholder="" /></div>
        </div>
        <div class="field"><label>familyhistory</label><input type="text" name="s_fh" placeholder="" /></div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <fieldset class="inner-fieldset"><legend>Behavior</legend>
        <div class="toggle-field">
          <label>Patient behavior</label>
          <input type="hidden" name="o_behavior" value="" />
          <div class="toggle-btn-group" data-target="o_behavior">
            <span class="toggle-btn" data-value="cooperative">Cooperative</span>
            <span class="toggle-btn" data-value="non-cooperative">Non-cooperative</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Pain Evaluation</legend>
        <div class="grid-2">
          <div class="field"><label>Score (0-10)</label><input type="text" name="o_pain_score" placeholder="" /></div>
          <div class="field"><label>Location</label><input type="text" name="o_pain_location" placeholder="" /></div>
        </div>
        <div class="field"><label>Duration</label><input type="text" name="o_pain_duration" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Dentition</legend>
        <div class="toggle-field">
          <label>Dentition type</label>
          <input type="hidden" name="o_dentition_type" value="" />
          <div class="toggle-btn-group" data-target="o_dentition_type">
            <span class="toggle-btn" data-value="Primary">Primary</span>
            <span class="toggle-btn" data-value="Mixed">Mixed</span>
          </div>
        </div>
        <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. EDCBA|ABCDE"></textarea></div>
        <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
      </fieldset>

      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">LF</div><div class="card-head-text"><b>Local Findings</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Gingiva Condition</legend>
            <div class="grid-2">
              <div class="field"><label>Inflammation</label><input type="text" name="o_ging_inflam" placeholder="" /></div>
              <div class="field"><label>Plaque deposition</label><input type="text" name="o_ging_plaque" placeholder="" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Tooth Eruption</legend>
            <div class="field"><label>Partial eruption / notes</label><input type="text" name="o_eruption" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Pit & Fissure Sealant</legend>
            <div class="field"><label>Tooth number</label><input type="text" name="o_sealant" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Supernumerary Tooth</legend>
            <div class="field"><label>Tooth number / location</label><input type="text" name="o_supernumerary" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Oral Lesion</legend>
            <div class="grid-2">
              <div class="field"><label>Location</label><input type="text" name="o_lesion_location" placeholder="" /></div>
              <div class="field"><label>Size</label><input type="text" name="o_lesion_size" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Surface</label><input type="text" name="o_lesion_surface" placeholder="" /></div>
              <div class="field"><label>Color</label><input type="text" name="o_lesion_color" placeholder="" /></div>
            </div>
            <div class="field"><label>Consistency</label><input type="text" name="o_lesion_consistency" placeholder="" /></div>
          </fieldset>
        </div>
      </div>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Diagnosis</label><input type="text" name="a_dx" placeholder="" /></div>
        <div class="field"><label>ICD Code</label><input type="text" name="a_icd" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Examination</label><input type="text" name="p_exam" placeholder="" /></div>
        <div class="field"><label>OHI (Oral Hygiene Instruction)</label><input type="text" name="p_ohi" placeholder="" /></div>
      </div>
      <fieldset class="inner-fieldset"><legend>Radiograph</legend>
        <div class="grid-2">
          <div class="field"><label>Periapical</label><input type="text" name="p_xray_pa" placeholder="" /></div>
          <div class="field"><label>Panoramic</label><input type="text" name="p_xray_pano" placeholder="" /></div>
        </div>
      </fieldset>
      <fieldset class="inner-fieldset"><legend>Treatment Plan</legend>
        <div class="grid-2">
          <div class="field"><label>Surgical removal</label><input type="text" name="p_tx_surgery" placeholder="" /></div>
          <div class="field"><label>Habit control</label><input type="text" name="p_tx_habit" placeholder="" /></div>
        </div>
        <div class="field"><label>Treatment plan detail</label><textarea name="p_tx_plan" rows="2" placeholder=""></textarea></div>
      </fieldset>
    </div>
  </div>`;
}


/* ---------- Pedo SOP checklist items ---------- */
const SOP_ITEMS_PEDO = {
  level_0: [
    { id: "pedo_cc", label: "CC", keywords: ["Chief Complaint", "pain", "CC"] },
    { id: "pedo_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "pedo_behavior", label: "行為", keywords: ["配合", "哭", "no配合", "害怕"] },
    { id: "pedo_pain", label: "Pain", keywords: ["pain", "discomfort"] },
  ],
  level_1_modules: {
    pedo_caries: {
      label: "caries",
      detect_keywords: ["caries", "caries", "dark", "cavity", "caries"],
      items: [
        { id: "pedo_ca_location", label: "location", keywords: ["which tooth", "uppersurface", "lowersurface"] },
        { id: "pedo_ca_severity", label: "severesevere", keywords: ["deep", "shallow", "largecavity"] },
      ],
      red_flags: [
        { id: "pedo_ca_abscess", label: "pusswelling", keywords: ["swelling", "pus", "changepus"] }
      ]
    },
    pedo_eruption: {
      label: "萌tooth問題",
      detect_keywords: ["長tooth", "萌tooth", "換tooth", "primary teethnofallen"],
      items: [
        { id: "pedo_er_stage", label: "萌tooth階段", keywords: ["started長", "快fallen"] },
        { id: "pedo_er_space", label: "space", keywords: ["space", "crowding", "歪"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "pedo_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "pedo_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "pedo_meds", label: "Meds", keywords: ["medication"] },
    { id: "pedo_fh", label: "family史", keywords: ["family", "父母", "遺傳"] },
    { id: "pedo_ohi", label: "OHI", keywords: ["刷tooth", "潔tooth", "oral hygiene"] },
    { id: "pedo_xray", label: "X-ray", keywords: ["PA", "Pano", "XX-ray"] },
  ]
};


/* ---------- Perio Field Labels ---------- */
const FIELD_LABELS_PERIO = {
  s_cc: "CC", s_pi_tooth: "PI (tooth)", s_pi_gingiva: "PI (gingiva)",
  s_pmh_htn: "HTN", s_pmh_dm: "DM", s_pmh_osteo: "Osteoporosis", s_pmh_hep: "Hepatitis",
  s_allergy: "Allergy",
  s_alcohol: "Alcohol", s_smoking: "Smoking", s_betel: "Betel nut",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_mobility: "Mobility", o_percussion: "Percussion pain",
  o_ging_swell: "Gingival swelling", o_ging_hyperplasia: "Gingival hyperplasia",
  o_restoration: "Restoration dislodged",
  o_plaque: "Plaque", o_calculus: "Calculus", o_pd5: "PD >= 5mm",
  o_te_crown: "Crown", o_te_ging_swell: "Ging swelling", o_te_ging_inflam: "Ging inflammation",
  o_te_percussion: "Percussion", o_te_palpation: "Palpation",
  o_te_ept: "EPT", o_te_cold: "Cold test", o_te_mobility: "Mobility", o_te_probing: "Probing depth",
  a_periodontitis: "Periodontitis", a_tooth_problem: "Tooth problem", a_prognosis: "Prognosis",
  p_charting: "Full mouth charting", p_photo: "Photo record",
  p_plaque_ctrl: "Plaque control", p_ohi: "OHI",
  p_scrp: "Sc/RP", p_extraction: "Extraction",
  p_consult: "Specialist consult", p_surgery: "Surgery",
};


/* ---------- Perio SOAP form ---------- */
function buildPerioSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
      <fieldset class="inner-fieldset"><legend>Present Illness</legend>
        <div class="grid-2">
          <div class="field"><label>Tooth problem</label><input type="text" name="s_pi_tooth" placeholder="" /></div>
          <div class="field"><label>Gingiva swelling</label><input type="text" name="s_pi_gingiva" placeholder="" /></div>
        </div>
      </fieldset>
      <fieldset class="inner-fieldset"><legend>PMH</legend>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Hypertension</label>
            <input type="hidden" name="s_pmh_htn" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_htn">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Diabetes</label>
            <input type="hidden" name="s_pmh_dm" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_dm">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Osteoporosis</label>
            <input type="hidden" name="s_pmh_osteo" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_osteo">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Hepatitis</label>
            <input type="hidden" name="s_pmh_hep" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_hep">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
      </fieldset>
      <div class="field"><label>Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
      <fieldset class="inner-fieldset"><legend>Habits</legend>
        <div class="grid-2">
          <div class="field"><label>Alcohol</label><input type="text" name="s_alcohol" placeholder="" /></div>
          <div class="field"><label>Smoking</label><input type="text" name="s_smoking" placeholder="" /></div>
        </div>
        <div class="field"><label>Betel nut</label><input type="text" name="s_betel" placeholder="" /></div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <fieldset class="inner-fieldset"><legend>Dentition</legend>
        <div class="toggle-field">
          <label>Dentition type</label>
          <input type="hidden" name="o_dentition_type" value="" />
          <div class="toggle-btn-group" data-target="o_dentition_type">
            <span class="toggle-btn" data-value="Adult">Adult</span>
            <span class="toggle-btn" data-value="Mixed">Mixed</span>
            <span class="toggle-btn" data-value="Primary">Primary</span>
          </div>
        </div>
        <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
        <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
      </fieldset>

      <!-- Local Findings -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">LF</div><div class="card-head-text"><b>Local Findings</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Mobility & Pain</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Mobility</label>
                <input type="hidden" name="o_mobility" value="" />
                <div class="toggle-btn-group" data-target="o_mobility">
                  <span class="toggle-btn" data-value="Gr I">Gr I</span>
                  <span class="toggle-btn" data-value="Gr II">Gr II</span>
                  <span class="toggle-btn" data-value="Gr III">Gr III</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Percussion pain</label>
                <input type="hidden" name="o_percussion" value="" />
                <div class="toggle-btn-group" data-target="o_percussion">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Gingival Condition</legend>
            <div class="grid-2">
              <div class="field"><label>Gingival swelling</label><input type="text" name="o_ging_swell" placeholder="" /></div>
              <div class="field"><label>Gingival hyperplasia</label><input type="text" name="o_ging_hyperplasia" placeholder="" /></div>
            </div>
            <div class="field"><label>Restoration dislodged</label><input type="text" name="o_restoration" placeholder="" /></div>
          </fieldset>
        </div>
      </div>

      <!-- Periodontal Status -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">PS</div><div class="card-head-text"><b>Periodontal Status</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Plaque</label><input type="text" name="o_plaque" placeholder="" /></div>
            <div class="field"><label>Calculus</label><input type="text" name="o_calculus" placeholder="" /></div>
          </div>
          <div class="field"><label>PD >= 5mm (sites)</label><input type="text" name="o_pd5" placeholder="" /></div>
        </div>
      </div>

      <!-- Tooth Evaluation Table -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge s">Eval</div><div class="card-head-text"><b>Tooth Evaluation Table</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Crown & Gingiva</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Crown</label>
                <input type="hidden" name="o_te_crown" value="" />
                <div class="toggle-btn-group" data-target="o_te_crown">
                  <span class="toggle-btn" data-value="present">Present</span>
                  <span class="toggle-btn" data-value="absent">Absent</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Gingiva inflammation</label>
                <input type="hidden" name="o_te_ging_inflam" value="" />
                <div class="toggle-btn-group" data-target="o_te_ging_inflam">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
            <div class="toggle-field" style="margin-top:4px">
              <label>Gingiva swelling</label>
              <input type="hidden" name="o_te_ging_swell" value="" />
              <div class="toggle-btn-group" data-target="o_te_ging_swell">
                <span class="toggle-btn" data-value="+">＋</span>
                <span class="toggle-btn" data-value="-">－</span>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Pain Tests</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Percussion pain</label>
                <input type="hidden" name="o_te_percussion" value="" />
                <div class="toggle-btn-group" data-target="o_te_percussion">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
              <div class="toggle-field">
                <label>Palpation pain</label>
                <input type="hidden" name="o_te_palpation" value="" />
                <div class="toggle-btn-group" data-target="o_te_palpation">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Vitality & Mobility</legend>
            <div class="grid-2">
              <div class="field"><label>EPT</label><input type="text" name="o_te_ept" placeholder="value or NT" /></div>
              <div class="toggle-field">
                <label>Cold test</label>
                <input type="hidden" name="o_te_cold" value="" />
                <div class="toggle-btn-group" data-target="o_te_cold">
                  <span class="toggle-btn" data-value="+">＋</span>
                  <span class="toggle-btn" data-value="-">－</span>
                  <span class="toggle-btn" data-value="NT">NT</span>
                </div>
              </div>
            </div>
            <div class="toggle-field" style="margin-top:4px">
              <label>Mobility</label>
              <input type="hidden" name="o_te_mobility" value="" />
              <div class="toggle-btn-group" data-target="o_te_mobility">
                <span class="toggle-btn" data-value="Gr I">Gr I</span>
                <span class="toggle-btn" data-value="Gr II">Gr II</span>
                <span class="toggle-btn" data-value="Gr III">Gr III</span>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Probing Depth</legend>
            <div class="field"><label>Probing depth</label><input type="text" name="o_te_probing" placeholder="mm" /></div>
          </fieldset>
        </div>
      </div>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Periodontitis (stage/grade)</label><input type="text" name="a_periodontitis" placeholder="Stage I-IV / Grade A-C" /></div>
      <div class="grid-2">
        <div class="field"><label>Tooth-specific problem</label><input type="text" name="a_tooth_problem" placeholder="" /></div>
        <div class="field"><label>Prognosis</label><input type="text" name="a_prognosis" placeholder="good / fair / poor / hopeless" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Full mouth charting</label><input type="text" name="p_charting" placeholder="" /></div>
        <div class="field"><label>Photo record</label><input type="text" name="p_photo" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Plaque control</label><input type="text" name="p_plaque_ctrl" placeholder="" /></div>
        <div class="field"><label>OHI</label><input type="text" name="p_ohi" placeholder="" /></div>
      </div>
      <fieldset class="inner-fieldset"><legend>Interventions</legend>
        <div class="grid-2">
          <div class="field"><label>Sc/RP (scaling & root planing)</label><input type="text" name="p_scrp" placeholder="" /></div>
          <div class="field"><label>Extraction consideration</label><input type="text" name="p_extraction" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Specialist consult</label><input type="text" name="p_consult" placeholder="" /></div>
          <div class="field"><label>Surgery if needed</label><input type="text" name="p_surgery" placeholder="" /></div>
        </div>
      </fieldset>
    </div>
  </div>`;
}


/* ---------- Perio SOP checklist items ---------- */
const SOP_ITEMS_PERIO = {
  level_0: [
    { id: "perio_cc", label: "CC", keywords: ["Chief Complaint", "gingiva", "bleeding", "CC"] },
    { id: "perio_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "perio_bleeding", label: "bleeding", keywords: ["bleeding", "bleeding", "刷toothbleeding"] },
    { id: "perio_loose", label: "teeth動mobile", keywords: ["mobile", "動", "loose", "mobility"] },
  ],
  level_1_modules: {
    perio_periodontitis: {
      label: "periodontal炎",
      detect_keywords: ["periodontal", "gingivaswelling", "bleeding", "deepswelling", "periodontitis"],
      items: [
        { id: "perio_pd_stage", label: "Stage", keywords: ["Stage", "severesevere"] },
        { id: "perio_pd_grade", label: "Grade", keywords: ["Grade", "Progression"] },
      ],
      red_flags: [
        { id: "perio_pd_abscess", label: "periodontalpusswelling", keywords: ["pus", "swelling", "changepus"] }
      ]
    },
    perio_recession: {
      label: "gingiva萎縮",
      detect_keywords: ["萎縮", "露出", "root", "recession"],
      items: [
        { id: "perio_re_location", label: "location", keywords: ["which side", "anteriortooth", "posteriortooth"] },
        { id: "perio_re_class", label: "Miller class", keywords: ["Miller", "class"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "perio_pmh", label: "PMH", keywords: ["history", "PMH", "diabetes", "hypertension"] },
    { id: "perio_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "perio_habits", label: "smokingalcoholbetel nut", keywords: ["smoking", "alcohol", "betel nut", "smoking"] },
    { id: "perio_ohi", label: "OHI", keywords: ["刷tooth", "潔tooth", "oral hygiene"] },
    { id: "perio_xray", label: "X-ray", keywords: ["PA", "Pano", "XX-ray", "bitewing"] },
  ]
};


/* ---------- GD (General Dentistry) Field Labels ---------- */
const FIELD_LABELS_GD = {
  s_cc: "CC", s_pi: "PI", s_pmh: "PMH", s_meds: "Meds", s_allergy: "Allergy",
  s_habits: "Habits", s_fh: "Family Hx",
  o_facial_sym: "Facial symmetry", o_eo_swelling: "Swelling", o_eo_redness: "Redness",
  o_eo_heat: "Local heat", o_eo_tenderness: "Tenderness", o_eo_lymph: "Lymph node",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_ging_inflam: "Ging inflammation", o_ging_swell: "Ging swelling", o_ging_bleed: "Ging bleeding",
  o_caries: "Caries", o_restoration: "Restoration",
  o_mobility: "Mobility", o_probing: "Probing depth",
  o_xray_pa: "PA", o_xray_bw: "Bitewing", o_xray_pano: "Panoramic",
  a_dx: "Diagnosis", a_problem_list: "Problem list",
  p_preventive: "Preventive", p_restorative: "Restorative", p_periodontal: "Periodontal",
  p_endodontic: "Endodontic", p_surgical: "Surgical", p_followup: "Follow-up",
};


/* ---------- GD SOAP form ---------- */
function buildGdSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness (PI)</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>PMH</label><input type="text" name="s_pmh" placeholder="" /></div>
        <div class="field"><label>Medications</label><input type="text" name="s_meds" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
        <div class="field"><label>Habits</label><input type="text" name="s_habits" placeholder="" /></div>
      </div>
      <div class="field"><label>Family History</label><input type="text" name="s_fh" placeholder="" /></div>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Extra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">EO</div><div class="card-head-text"><b>Extra-oral Examination</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Facial symmetry</label><input type="text" name="o_facial_sym" placeholder="" /></div>
            <div class="field"><label>Swelling</label><input type="text" name="o_eo_swelling" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Redness</label><input type="text" name="o_eo_redness" placeholder="" /></div>
            <div class="field"><label>Local heat</label><input type="text" name="o_eo_heat" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Tenderness</label><input type="text" name="o_eo_tenderness" placeholder="" /></div>
            <div class="field"><label>Lymph node</label><input type="text" name="o_eo_lymph" placeholder="" /></div>
          </div>
        </div>
      </div>

      <!-- Intra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">IO</div><div class="card-head-text"><b>Intra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Dentition</legend>
            <div class="toggle-field">
              <label>Dentition type</label>
              <input type="hidden" name="o_dentition_type" value="" />
              <div class="toggle-btn-group" data-target="o_dentition_type">
                <span class="toggle-btn" data-value="Adult">Adult</span>
                <span class="toggle-btn" data-value="Mixed">Mixed</span>
                <span class="toggle-btn" data-value="Primary">Primary</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
            <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Gingiva</legend>
            <div class="grid-2">
              <div class="field"><label>Inflammation</label><input type="text" name="o_ging_inflam" placeholder="" /></div>
              <div class="field"><label>Swelling</label><input type="text" name="o_ging_swell" placeholder="" /></div>
            </div>
            <div class="field"><label>Bleeding</label><input type="text" name="o_ging_bleed" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Caries & Restoration</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Caries</label>
                <input type="hidden" name="o_caries" value="" />
                <div class="toggle-btn-group" data-target="o_caries">
                  <span class="toggle-btn" data-value="present">Present</span>
                  <span class="toggle-btn" data-value="absent">Absent</span>
                </div>
              </div>
              <div class="field"><label>Restoration</label><input type="text" name="o_restoration" placeholder="" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Mobility & Probing</legend>
            <div class="grid-2">
              <div class="toggle-field">
                <label>Mobility</label>
                <input type="hidden" name="o_mobility" value="" />
                <div class="toggle-btn-group" data-target="o_mobility">
                  <span class="toggle-btn" data-value="Gr I">Gr I</span>
                  <span class="toggle-btn" data-value="Gr II">Gr II</span>
                  <span class="toggle-btn" data-value="Gr III">Gr III</span>
                </div>
              </div>
              <div class="field"><label>Probing depth</label><input type="text" name="o_probing" placeholder="mm" /></div>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- Radiographic -->
      <fieldset class="inner-fieldset"><legend>Radiographic Examination</legend>
        <div class="grid-2">
          <div class="field"><label>PA</label><input type="text" name="o_xray_pa" placeholder="" /></div>
          <div class="field"><label>Bitewing</label><input type="text" name="o_xray_bw" placeholder="" /></div>
        </div>
        <div class="field"><label>Panoramic</label><input type="text" name="o_xray_pano" placeholder="" /></div>
      </fieldset>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Diagnosis</label><textarea name="a_dx" rows="2" placeholder=""></textarea></div>
      <div class="field"><label>Problem list</label><textarea name="a_problem_list" rows="2" placeholder=""></textarea></div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Preventive</label><input type="text" name="p_preventive" placeholder="" /></div>
        <div class="field"><label>Restorative</label><input type="text" name="p_restorative" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Periodontal</label><input type="text" name="p_periodontal" placeholder="" /></div>
        <div class="field"><label>Endodontic</label><input type="text" name="p_endodontic" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Surgical</label><input type="text" name="p_surgical" placeholder="" /></div>
        <div class="field"><label>Follow-up</label><input type="text" name="p_followup" placeholder="" /></div>
      </div>
    </div>
  </div>`;
}


/* ---------- GD SOP checklist items ---------- */
const SOP_ITEMS_GD = {
  level_0: [
    { id: "gd_cc", label: "CC", keywords: ["Chief Complaint", "pain", "CC"] },
    { id: "gd_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "gd_location", label: "location", keywords: ["which tooth", "uppersurface", "lowersurface", "left邊", "right邊"] },
  ],
  level_1_modules: {
    gd_caries: {
      label: "caries",
      detect_keywords: ["caries", "caries", "dark", "cavity", "caries"],
      items: [
        { id: "gd_ca_location", label: "location", keywords: ["which tooth"] },
        { id: "gd_ca_severity", label: "severesevere", keywords: ["deep", "shallow"] },
      ],
      red_flags: [
        { id: "gd_ca_pain", label: "spontaneouspain", keywords: ["spontaneous", "Night Pain"] }
      ]
    },
    gd_perio: {
      label: "periodontal問題",
      detect_keywords: ["bleeding", "gingivaswelling", "mobile動"],
      items: [
        { id: "gd_pe_bleeding", label: "bleeding", keywords: ["bleeding", "bleeding"] },
        { id: "gd_pe_mobility", label: "mobile動", keywords: ["mobile", "loose"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "gd_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "gd_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "gd_meds", label: "Meds", keywords: ["medication"] },
    { id: "gd_habits", label: "Habits", keywords: ["smoking", "alcohol", "betel nut"] },
    { id: "gd_xray", label: "X-ray", keywords: ["PA", "Pano", "BW", "XX-ray"] },
  ]
};


/* ---------- Pedo Discharge Note Field Labels ---------- */
const FIELD_LABELS_PEDO_DC = {
  adm_dx: "Admission Dx", dc_dx: "Discharge Dx", icu_dx: "ICU Dx",
  cc_informant: "Informant", cc_list: "Complaint list",
  pi: "PI",
  pmh_cvd: "CVD", pmh_dm: "DM", pmh_htn: "HTN", pmh_cancer: "Cancer",
  pmh_hep: "Hepatitis", pmh_osteo: "Osteoporosis", pmh_other: "Other systemic",
  allergy_food: "Food/Drug allergy", allergy_adr: "ADR", allergy_device: "Device/material",
  blood_tx: "Blood transfusion",
  habit_alcohol: "Alcohol", habit_betel: "Betel quid", habit_smoking: "Smoking",
  fh_cvd: "FH CVD", fh_dm: "FH DM", fh_htn: "FH HTN", fh_cancer: "FH Cancer",
  med_hospital: "Hospital meds", med_other: "Other meds", med_chinese: "Chinese med", med_suppl: "Supplements",
  hosp_adm: "Hosp admission", hosp_dc: "Hosp discharge", hosp_dx: "Hosp Dx",
  surg_hx: "Surgical Hx", travel_hx: "Travel Hx",
  birth_ga: "Gestational age", birth_gpa: "G/P/A", birth_delivery: "Delivery", birth_weight: "Birth weight",
  vax_hepb: "HepB", vax_dpt: "DPT", vax_bcg: "BCG", vax_mmr: "MMR",
  vax_varicella: "Varicella", vax_je: "JE", vax_h1n1: "H1N1",
  growth: "Growth & development",
  vs_temp: "Temp", vs_pulse: "Pulse", vs_rr: "RR", vs_bp: "BP",
  pe_general: "General", pe_gcs: "GCS", pe_ecog: "ECOG", pe_kps: "KPS",
  se_heent: "HEENT", se_neck: "Neck", se_chest: "Chest", se_heart: "Heart",
  se_abd: "Abdomen", se_back: "Back", se_skin: "Skin", se_ext: "Extremities", se_neuro: "Neuro",
  eo_asymmetry: "Facial asymmetry", eo_swelling: "Swelling", eo_tumor: "Tumor perforation",
  io_dentition: "Dentition", io_ging: "Ging inflammation", io_eruption: "Eruption",
  io_sealant: "Sealant", io_supernumerary: "Supernumerary",
  rx_dentition: "Rx dentition", rx_germs: "Tooth germs", rx_supernumerary: "Rx supernumerary",
  rx_impacted: "Impacted", rx_restoration: "Restoration", rx_ssc: "SSC",
  rx_caries: "Dental caries", rx_bone: "Bone level", rx_pathology: "Bony pathology",
};


/* ---------- Pedo Discharge Note Form ---------- */
function buildPedoDcForm() {
  return `
  <!-- Diagnosis -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">Dx</div><div class="card-head-text"><b>Diagnosis</b><span>Admission / Discharge</span></div></div>
    <div class="card-body">
      <div class="field"><label>Admission Diagnosis</label><textarea name="adm_dx" rows="2" placeholder=""></textarea></div>
      <div class="field"><label>Discharge Diagnosis</label><textarea name="dc_dx" rows="2" placeholder=""></textarea></div>
      <div class="field"><label>ICU Diagnosis (optional)</label><input type="text" name="icu_dx" placeholder="" /></div>
    </div>
  </div>

  <!-- CC -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">CC</div><div class="card-head-text"><b>Chief Complaint</b></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Informant</label><input type="text" name="cc_informant" placeholder="" /></div>
        <div class="field"><label>Complaint list</label><textarea name="cc_list" rows="2" placeholder=""></textarea></div>
      </div>
    </div>
  </div>

  <!-- Patient History -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">Hx</div><div class="card-head-text"><b>Patient History</b><span>Medical / Social / Family</span></div></div>
    <div class="card-body">
      <div class="field"><label>Present Illness</label><textarea name="pi" rows="3" placeholder=""></textarea></div>

      <fieldset class="inner-fieldset"><legend>Past Medical History</legend>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Cardiovascular disease</label>
            <input type="hidden" name="pmh_cvd" value="" />
            <div class="toggle-btn-group" data-target="pmh_cvd">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Diabetes mellitus</label>
            <input type="hidden" name="pmh_dm" value="" />
            <div class="toggle-btn-group" data-target="pmh_dm">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Hypertension</label>
            <input type="hidden" name="pmh_htn" value="" />
            <div class="toggle-btn-group" data-target="pmh_htn">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Cancer</label>
            <input type="hidden" name="pmh_cancer" value="" />
            <div class="toggle-btn-group" data-target="pmh_cancer">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Hepatitis</label>
            <input type="hidden" name="pmh_hep" value="" />
            <div class="toggle-btn-group" data-target="pmh_hep">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Osteoporosis</label>
            <input type="hidden" name="pmh_osteo" value="" />
            <div class="toggle-btn-group" data-target="pmh_osteo">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="field"><label>Other systemic disease</label><input type="text" name="pmh_other" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Allergy</legend>
        <div class="grid-2">
          <div class="field"><label>Food / Drug</label><input type="text" name="allergy_food" placeholder="" /></div>
          <div class="field"><label>Medication ADR</label><input type="text" name="allergy_adr" placeholder="" /></div>
        </div>
        <div class="field"><label>Medical device / Material</label><input type="text" name="allergy_device" placeholder="" /></div>
      </fieldset>

      <div class="field"><label>Blood transfusion history</label><input type="text" name="blood_tx" placeholder="" /></div>

      <fieldset class="inner-fieldset"><legend>Personal Habits</legend>
        <div class="grid-2">
          <div class="field"><label>Alcohol</label><input type="text" name="habit_alcohol" placeholder="" /></div>
          <div class="field"><label>Betel quid</label><input type="text" name="habit_betel" placeholder="" /></div>
        </div>
        <div class="field"><label>Smoking</label><input type="text" name="habit_smoking" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Family History</legend>
        <div class="grid-2">
          <div class="toggle-field">
            <label>CVD</label>
            <input type="hidden" name="fh_cvd" value="" />
            <div class="toggle-btn-group" data-target="fh_cvd">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Diabetes</label>
            <input type="hidden" name="fh_dm" value="" />
            <div class="toggle-btn-group" data-target="fh_dm">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Hypertension</label>
            <input type="hidden" name="fh_htn" value="" />
            <div class="toggle-btn-group" data-target="fh_htn">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Cancer</label>
            <input type="hidden" name="fh_cancer" value="" />
            <div class="toggle-btn-group" data-target="fh_cancer">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Current Medication</legend>
        <div class="grid-2">
          <div class="field"><label>Hospital</label><input type="text" name="med_hospital" placeholder="" /></div>
          <div class="field"><label>Other</label><input type="text" name="med_other" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Chinese medicine</label><input type="text" name="med_chinese" placeholder="" /></div>
          <div class="field"><label>Supplements</label><input type="text" name="med_suppl" placeholder="" /></div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Hospitalization History</legend>
        <div class="grid-2">
          <div class="field"><label>Admission date</label><input type="text" name="hosp_adm" placeholder="" /></div>
          <div class="field"><label>Discharge date</label><input type="text" name="hosp_dc" placeholder="" /></div>
        </div>
        <div class="field"><label>Diagnosis</label><input type="text" name="hosp_dx" placeholder="" /></div>
      </fieldset>

      <div class="field"><label>Past Surgical History</label><input type="text" name="surg_hx" placeholder="" /></div>
      <div class="field"><label>Travel History</label><input type="text" name="travel_hx" placeholder="" /></div>

      <fieldset class="inner-fieldset"><legend>Birth History</legend>
        <div class="grid-2">
          <div class="field"><label>Gestational age</label><input type="text" name="birth_ga" placeholder="weeks" /></div>
          <div class="field"><label>G / P / A</label><input type="text" name="birth_gpa" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Delivery type</label><input type="text" name="birth_delivery" placeholder="NSD / C/S" /></div>
          <div class="field"><label>Birth weight</label><input type="text" name="birth_weight" placeholder="grams" /></div>
        </div>
      </fieldset>
    </div>
  </div>

  <!-- Vaccination -->
  <div class="soap-card">
    <div class="card-head"><div class="badge t">Vax</div><div class="card-head-text"><b>Vaccination History</b></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Hepatitis B</label><input type="text" name="vax_hepb" placeholder="" /></div>
        <div class="field"><label>DPT</label><input type="text" name="vax_dpt" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>BCG</label><input type="text" name="vax_bcg" placeholder="" /></div>
        <div class="field"><label>MMR</label><input type="text" name="vax_mmr" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Varicella</label><input type="text" name="vax_varicella" placeholder="" /></div>
        <div class="field"><label>Japanese encephalitis</label><input type="text" name="vax_je" placeholder="" /></div>
      </div>
      <div class="field"><label>H1N1</label><input type="text" name="vax_h1n1" placeholder="" /></div>
    </div>
  </div>

  <!-- Growth -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">G&D</div><div class="card-head-text"><b>Growth & Development</b></div></div>
    <div class="card-body">
      <div class="field"><label>Growth & Development</label><textarea name="growth" rows="2" placeholder=""></textarea></div>
    </div>
  </div>

  <!-- Physical Examination -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">PE</div><div class="card-head-text"><b>Physical Examination</b></div></div>
    <div class="card-body">

      <fieldset class="inner-fieldset"><legend>Vital Signs</legend>
        <div class="grid-2">
          <div class="field"><label>Temperature (°C)</label><input type="text" name="vs_temp" placeholder="" /></div>
          <div class="field"><label>Pulse (bpm)</label><input type="text" name="vs_pulse" placeholder="" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Respiration (/min)</label><input type="text" name="vs_rr" placeholder="" /></div>
          <div class="field"><label>Blood pressure (mmHg)</label><input type="text" name="vs_bp" placeholder="" /></div>
        </div>
      </fieldset>

      <div class="field"><label>General condition</label><input type="text" name="pe_general" placeholder="" /></div>

      <fieldset class="inner-fieldset"><legend>Scales</legend>
        <div class="grid-2">
          <div class="field"><label>GCS (Consciousness)</label><input type="text" name="pe_gcs" placeholder="E  V  M  = " /></div>
          <div class="field"><label>ECOG</label><input type="text" name="pe_ecog" placeholder="0-4" /></div>
        </div>
        <div class="field"><label>KPS</label><input type="text" name="pe_kps" placeholder="0-100" /></div>
      </fieldset>

      <!-- System Exam -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">Sys</div><div class="card-head-text"><b>System Examination</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Head / Eye / ENT</label><input type="text" name="se_heent" placeholder="" /></div>
            <div class="field"><label>Neck</label><input type="text" name="se_neck" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Chest</label><input type="text" name="se_chest" placeholder="" /></div>
            <div class="field"><label>Heart</label><input type="text" name="se_heart" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Abdomen</label><input type="text" name="se_abd" placeholder="" /></div>
            <div class="field"><label>Back</label><input type="text" name="se_back" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Skin</label><input type="text" name="se_skin" placeholder="" /></div>
            <div class="field"><label>Extremities</label><input type="text" name="se_ext" placeholder="" /></div>
          </div>
          <div class="field"><label>Neurologic</label><input type="text" name="se_neuro" placeholder="" /></div>
        </div>
      </div>

      <!-- Oral/Maxillofacial -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">OMF</div><div class="card-head-text"><b>Oral & Maxillofacial Findings</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Extra-oral</legend>
            <div class="grid-2">
              <div class="field"><label>Facial asymmetry</label><input type="text" name="eo_asymmetry" placeholder="" /></div>
              <div class="field"><label>Swelling</label><input type="text" name="eo_swelling" placeholder="" /></div>
            </div>
            <div class="field"><label>Tumor perforation</label><input type="text" name="eo_tumor" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Intra-oral</legend>
            <div class="grid-2">
              <div class="field"><label>Dentition</label><input type="text" name="io_dentition" placeholder="" /></div>
              <div class="field"><label>Gingival inflammation</label><input type="text" name="io_ging" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Tooth eruption</label><input type="text" name="io_eruption" placeholder="" /></div>
              <div class="field"><label>Pit & fissure sealant</label><input type="text" name="io_sealant" placeholder="" /></div>
            </div>
            <div class="field"><label>Supernumerary tooth</label><input type="text" name="io_supernumerary" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Radiographic Findings</legend>
            <div class="grid-2">
              <div class="field"><label>Dentition</label><input type="text" name="rx_dentition" placeholder="" /></div>
              <div class="field"><label>Tooth germs</label><input type="text" name="rx_germs" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Supernumerary tooth</label><input type="text" name="rx_supernumerary" placeholder="" /></div>
              <div class="field"><label>Impacted tooth</label><input type="text" name="rx_impacted" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Restoration</label><input type="text" name="rx_restoration" placeholder="" /></div>
              <div class="field"><label>SSC</label><input type="text" name="rx_ssc" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Dental caries</label><input type="text" name="rx_caries" placeholder="" /></div>
              <div class="field"><label>Bone level</label><input type="text" name="rx_bone" placeholder="" /></div>
            </div>
            <div class="field"><label>Bony pathology</label><input type="text" name="rx_pathology" placeholder="" /></div>
          </fieldset>
        </div>
      </div>

    </div>
  </div>`;
}


/* ---------- Pedo DC SOP checklist items ---------- */
const SOP_ITEMS_PEDO_DC = {
  level_0: [
    { id: "pdc_adm_dx", label: "Adm Dx", keywords: ["入院", "診斷", "admission"] },
    { id: "pdc_dc_dx", label: "Dc Dx", keywords: ["discharge", "discharge"] },
    { id: "pdc_cc", label: "CC", keywords: ["Chief Complaint", "CC"] },
    { id: "pdc_pi", label: "PI", keywords: ["現history", "PI"] },
  ],
  level_1_modules: {},
  level_2: [
    { id: "pdc_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "pdc_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "pdc_birth", label: "Birth Hx", keywords: ["出生", "pregnancy", "分娩"] },
    { id: "pdc_vax", label: "Vaccination", keywords: ["疫苗", "接種"] },
    { id: "pdc_vs", label: "Vital signs", keywords: ["體溫", "脈搏", "血壓"] },
    { id: "pdc_pe", label: "PE", keywords: ["身體檢查", "PE"] },
    { id: "pdc_oral", label: "Oral findings", keywords: ["口腔", "teeth", "gingiva"] },
    { id: "pdc_xray", label: "X-ray", keywords: ["XX-ray", "radiation"] },
  ]
};


/* ---------- Prostho Field Labels ---------- */
const FIELD_LABELS_PROS = {
  s_cc: "CC", s_pi: "PI", s_pmh: "PMH", s_meds: "Meds", s_allergy: "Allergy", s_habits: "Habits",
  o_facial_sym: "Facial symmetry", o_lip_support: "Lip support",
  o_vd: "Vertical dimension", o_tmj: "TMJ status",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_missing: "Missing teeth",
  o_rem_caries: "Caries", o_rem_restoration: "Restoration", o_rem_mobility: "Mobility",
  o_ridge_h: "Ridge height", o_ridge_w: "Ridge width",
  o_muc_ulcer: "Ulcer", o_muc_inflam: "Inflammation", o_muc_hyperplasia: "Hyperplasia",
  o_occ_cr: "Centric relation", o_occ_vd: "Occlusal VD", o_occ_interf: "Interference",
  o_xray_pa: "PA", o_xray_pano: "Panoramic", o_xray_cbct: "CBCT",
  a_missing_pattern: "Missing pattern", a_ridge: "Ridge status", a_pros_dx: "Prosthetic Dx",
  p_removable: "Removable", p_fixed: "Fixed", p_implant: "Implant", p_followup: "Follow-up",
};


/* ---------- Prostho SOAP form ---------- */
function buildProsSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness (PI)</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>PMH</label><input type="text" name="s_pmh" placeholder="" /></div>
        <div class="field"><label>Medications</label><input type="text" name="s_meds" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
        <div class="field"><label>Habits</label><input type="text" name="s_habits" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Extra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">EO</div><div class="card-head-text"><b>Extra-oral Examination</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Facial symmetry</label><input type="text" name="o_facial_sym" placeholder="" /></div>
            <div class="field"><label>Lip support</label><input type="text" name="o_lip_support" placeholder="" /></div>
          </div>
          <div class="grid-2">
            <div class="field"><label>Vertical dimension</label><input type="text" name="o_vd" placeholder="" /></div>
            <div class="field"><label>TMJ status</label><input type="text" name="o_tmj" placeholder="" /></div>
          </div>
        </div>
      </div>

      <!-- Intra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">IO</div><div class="card-head-text"><b>Intra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Dentition</legend>
            <div class="toggle-field">
              <label>Dentition type</label>
              <input type="hidden" name="o_dentition_type" value="" />
              <div class="toggle-btn-group" data-target="o_dentition_type">
                <span class="toggle-btn" data-value="Adult">Adult</span>
                <span class="toggle-btn" data-value="Mixed">Mixed</span>
                <span class="toggle-btn" data-value="Primary">Primary</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
            <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
          </fieldset>
          <div class="field"><label>Missing teeth</label><textarea name="o_missing" rows="2" placeholder=""></textarea></div>
          <fieldset class="inner-fieldset"><legend>Remaining Teeth Condition</legend>
            <div class="grid-2">
              <div class="field"><label>Caries</label><input type="text" name="o_rem_caries" placeholder="" /></div>
              <div class="field"><label>Restoration</label><input type="text" name="o_rem_restoration" placeholder="" /></div>
            </div>
            <div class="toggle-field">
              <label>Mobility</label>
              <input type="hidden" name="o_rem_mobility" value="" />
              <div class="toggle-btn-group" data-target="o_rem_mobility">
                <span class="toggle-btn" data-value="Gr I">Gr I</span>
                <span class="toggle-btn" data-value="Gr II">Gr II</span>
                <span class="toggle-btn" data-value="Gr III">Gr III</span>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Ridge Condition</legend>
            <div class="grid-2">
              <div class="field"><label>Height</label><input type="text" name="o_ridge_h" placeholder="" /></div>
              <div class="field"><label>Width</label><input type="text" name="o_ridge_w" placeholder="" /></div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Mucosa Condition</legend>
            <div class="grid-2">
              <div class="field"><label>Ulcer</label><input type="text" name="o_muc_ulcer" placeholder="" /></div>
              <div class="field"><label>Inflammation</label><input type="text" name="o_muc_inflam" placeholder="" /></div>
            </div>
            <div class="field"><label>Hyperplasia</label><input type="text" name="o_muc_hyperplasia" placeholder="" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Occlusion</legend>
            <div class="grid-2">
              <div class="field"><label>Centric relation</label><input type="text" name="o_occ_cr" placeholder="" /></div>
              <div class="field"><label>Vertical dimension</label><input type="text" name="o_occ_vd" placeholder="" /></div>
            </div>
            <div class="field"><label>Occlusal interference</label><input type="text" name="o_occ_interf" placeholder="" /></div>
          </fieldset>
        </div>
      </div>

      <!-- Radiographic -->
      <fieldset class="inner-fieldset"><legend>Radiographic Examination</legend>
        <div class="grid-2">
          <div class="field"><label>PA</label><input type="text" name="o_xray_pa" placeholder="" /></div>
          <div class="field"><label>Panoramic</label><input type="text" name="o_xray_pano" placeholder="" /></div>
        </div>
        <div class="field"><label>CBCT</label><input type="text" name="o_xray_cbct" placeholder="" /></div>
      </fieldset>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Missing teeth pattern</label><input type="text" name="a_missing_pattern" placeholder="Kennedy class" /></div>
      <div class="grid-2">
        <div class="field"><label>Ridge status</label><input type="text" name="a_ridge" placeholder="" /></div>
        <div class="field"><label>Prosthetic diagnosis</label><input type="text" name="a_pros_dx" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Removable prosthesis</label><input type="text" name="p_removable" placeholder="RPD / CD" /></div>
        <div class="field"><label>Fixed prosthesis</label><input type="text" name="p_fixed" placeholder="FPD / Crown" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Implant consideration</label><input type="text" name="p_implant" placeholder="" /></div>
        <div class="field"><label>Follow-up</label><input type="text" name="p_followup" placeholder="" /></div>
      </div>
    </div>
  </div>`;
}


/* ---------- Prostho SOP checklist items ---------- */
const SOP_ITEMS_PROS = {
  level_0: [
    { id: "pros_cc", label: "CC", keywords: ["Chief Complaint", "missing tooth", "denture", "CC"] },
    { id: "pros_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "pros_missing", label: "missing tooth", keywords: ["缺", "拔", "fallen", "noyes"] },
  ],
  level_1_modules: {
    pros_rpd: {
      label: "removable denture",
      detect_keywords: ["removable denture", "RPD", "可摘", "取lower"],
      items: [
        { id: "pros_rpd_type", label: "type", keywords: ["RPD", "metal", "樹脂"] },
      ],
      red_flags: []
    },
    pros_fpd: {
      label: "fixed義齒",
      detect_keywords: ["tooth套", "tooth橋", "FPD", "crown", "fixed"],
      items: [
        { id: "pros_fpd_type", label: "type", keywords: ["crown", "bridge"] },
      ],
      red_flags: []
    },
    pros_implant: {
      label: "implant",
      detect_keywords: ["implant", "implant", "人工root"],
      items: [
        { id: "pros_imp_site", label: "location", keywords: ["which tooth"] },
        { id: "pros_imp_bone", label: "bone quality", keywords: ["bone", "bone quality", "CBCT"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "pros_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "pros_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "pros_meds", label: "Meds", keywords: ["medication"] },
    { id: "pros_xray", label: "X-ray", keywords: ["PA", "Pano", "CBCT", "XX-ray"] },
  ]
};


/* ---------- Implant Field Labels ---------- */
const FIELD_LABELS_IMPLANT = {
  s_cc: "CC", s_pi: "PI",
  s_pmh_dm: "DM", s_pmh_osteo: "Osteoporosis", s_pmh_cvd: "CVD", s_pmh_immuno: "Immunosuppression",
  s_med_anticoag: "Anticoagulant", s_med_bisphos: "Bisphosphonate", s_med_steroid: "Steroid",
  s_allergy: "Allergy", s_habit_smoke: "Smoking", s_habit_betel: "Betel nut",
  o_facial_sym: "Facial symmetry", o_tmj: "TMJ status",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_missing_site: "Missing site",
  o_ridge_w: "Ridge width", o_ridge_h: "Ridge height", o_ridge_bone: "Bone quality",
  o_kerat: "Keratinized tissue",
  o_adj_caries: "Adj caries", o_adj_rest: "Adj restoration", o_adj_perio: "Adj perio",
  o_xray_pano: "Panoramic",
  o_cbct_h: "CBCT bone height", o_cbct_w: "CBCT bone width", o_cbct_nerve: "Nerve/Sinus",
  o_xray_pa: "Periapical",
  a_indication: "Indication", a_bone: "Bone availability", a_risk: "Risk factor",
  p_placement: "Placement", p_graft: "Bone grafting", p_sinus: "Sinus lift",
  p_temp: "Temporary prosthesis", p_followup: "Follow-up",
};


/* ---------- Implant SOAP form ---------- */
function buildImplantSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness (PI)</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>

      <fieldset class="inner-fieldset"><legend>Past Medical History</legend>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Diabetes</label>
            <input type="hidden" name="s_pmh_dm" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_dm">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Osteoporosis</label>
            <input type="hidden" name="s_pmh_osteo" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_osteo">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="toggle-field">
            <label>Cardiovascular disease</label>
            <input type="hidden" name="s_pmh_cvd" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_cvd">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
          <div class="toggle-field">
            <label>Immunosuppression</label>
            <input type="hidden" name="s_pmh_immuno" value="" />
            <div class="toggle-btn-group" data-target="s_pmh_immuno">
              <span class="toggle-btn" data-value="+">＋</span>
              <span class="toggle-btn" data-value="-">－</span>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Medications</legend>
        <div class="grid-2">
          <div class="field"><label>Anticoagulant</label><input type="text" name="s_med_anticoag" placeholder="" /></div>
          <div class="field"><label>Bisphosphonate</label><input type="text" name="s_med_bisphos" placeholder="" /></div>
        </div>
        <div class="field"><label>Steroid</label><input type="text" name="s_med_steroid" placeholder="" /></div>
      </fieldset>

      <div class="grid-2">
        <div class="field"><label>Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
      </div>
      <fieldset class="inner-fieldset"><legend>Habits</legend>
        <div class="grid-2">
          <div class="field"><label>Smoking</label><input type="text" name="s_habit_smoke" placeholder="" /></div>
          <div class="field"><label>Betel nut</label><input type="text" name="s_habit_betel" placeholder="" /></div>
        </div>
      </fieldset>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Extra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">EO</div><div class="card-head-text"><b>Extra-oral Examination</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Facial symmetry</label><input type="text" name="o_facial_sym" placeholder="" /></div>
            <div class="field"><label>TMJ status</label><input type="text" name="o_tmj" placeholder="" /></div>
          </div>
        </div>
      </div>

      <!-- Intra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">IO</div><div class="card-head-text"><b>Intra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Dentition</legend>
            <div class="toggle-field">
              <label>Dentition type</label>
              <input type="hidden" name="o_dentition_type" value="" />
              <div class="toggle-btn-group" data-target="o_dentition_type">
                <span class="toggle-btn" data-value="Adult">Adult</span>
                <span class="toggle-btn" data-value="Mixed">Mixed</span>
                <span class="toggle-btn" data-value="Primary">Primary</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
            <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
          </fieldset>
          <div class="field"><label>Missing tooth site (tooth #)</label><textarea name="o_missing_site" rows="2" placeholder=""></textarea></div>
          <fieldset class="inner-fieldset"><legend>Ridge Condition</legend>
            <div class="grid-2">
              <div class="field"><label>Width</label><input type="text" name="o_ridge_w" placeholder="mm" /></div>
              <div class="field"><label>Height</label><input type="text" name="o_ridge_h" placeholder="mm" /></div>
            </div>
            <div class="field"><label>Bone quality</label><input type="text" name="o_ridge_bone" placeholder="D1–D4" /></div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Keratinized Tissue</legend>
            <div class="toggle-field">
              <label>KT width</label>
              <input type="hidden" name="o_kerat" value="" />
              <div class="toggle-btn-group" data-target="o_kerat">
                <span class="toggle-btn" data-value="adequate">Adequate</span>
                <span class="toggle-btn" data-value="inadequate">Inadequate</span>
              </div>
            </div>
          </fieldset>
          <fieldset class="inner-fieldset"><legend>Adjacent Teeth</legend>
            <div class="grid-2">
              <div class="field"><label>Caries</label><input type="text" name="o_adj_caries" placeholder="" /></div>
              <div class="field"><label>Restoration</label><input type="text" name="o_adj_rest" placeholder="" /></div>
            </div>
            <div class="field"><label>Periodontal status</label><input type="text" name="o_adj_perio" placeholder="" /></div>
          </fieldset>
        </div>
      </div>

      <!-- Radiographic -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge a">Rx</div><div class="card-head-text"><b>Radiographic Examination</b></div></div>
        <div class="card-body">
          <div class="field"><label>Panoramic</label><input type="text" name="o_xray_pano" placeholder="" /></div>
          <fieldset class="inner-fieldset"><legend>CBCT</legend>
            <div class="grid-2">
              <div class="field"><label>Bone height</label><input type="text" name="o_cbct_h" placeholder="mm" /></div>
              <div class="field"><label>Bone width</label><input type="text" name="o_cbct_w" placeholder="mm" /></div>
            </div>
            <div class="field"><label>Nerve / Sinus relation</label><input type="text" name="o_cbct_nerve" placeholder="" /></div>
          </fieldset>
          <div class="field"><label>Periapical</label><input type="text" name="o_xray_pa" placeholder="" /></div>
        </div>
      </div>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Implant indication</label><textarea name="a_indication" rows="2" placeholder=""></textarea></div>
      <div class="grid-2">
        <div class="field"><label>Bone availability</label><input type="text" name="a_bone" placeholder="" /></div>
        <div class="field"><label>Risk factor</label><input type="text" name="a_risk" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Implant placement</label><input type="text" name="p_placement" placeholder="" /></div>
        <div class="field"><label>Bone grafting</label><input type="text" name="p_graft" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Sinus lift</label><input type="text" name="p_sinus" placeholder="" /></div>
        <div class="field"><label>Temporary prosthesis</label><input type="text" name="p_temp" placeholder="" /></div>
      </div>
      <div class="field"><label>Follow-up</label><input type="text" name="p_followup" placeholder="" /></div>
    </div>
  </div>`;
}


/* ---------- Implant SOP checklist items ---------- */
const SOP_ITEMS_IMPLANT = {
  level_0: [
    { id: "imp_cc", label: "CC", keywords: ["Chief Complaint", "implant", "missing tooth", "CC"] },
    { id: "imp_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "imp_site", label: "implantlocation", keywords: ["which tooth", "location", "site"] },
  ],
  level_1_modules: {
    imp_bone: {
      label: "bone qualityassessment",
      detect_keywords: ["bone", "bone quality", "CBCT", "高度", "寬度"],
      items: [
        { id: "imp_bone_h", label: "骨高", keywords: ["高度", "height"] },
        { id: "imp_bone_w", label: "骨寬", keywords: ["寬度", "width"] },
        { id: "imp_nerve", label: "神經/竊竇", keywords: ["神經", "竊竇", "sinus", "IAN"] },
      ],
      red_flags: [
        { id: "imp_bisphos", label: "Bisphosphonate", keywords: ["bisphosphonate", "bisphosphonatesore鹽"] }
      ]
    },
    imp_graft: {
      label: "bone graft",
      detect_keywords: ["bone graft", "bone graft", "骨粉"],
      items: [
        { id: "imp_graft_type", label: "type", keywords: ["自體骨", "異體骨"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "imp_pmh", label: "PMH", keywords: ["history", "PMH", "diabetes"] },
    { id: "imp_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "imp_meds", label: "Meds", keywords: ["medication", "抗coagulation"] },
    { id: "imp_habits", label: "Habits", keywords: ["smoking", "betel nut"] },
    { id: "imp_xray", label: "X-ray", keywords: ["CBCT", "Pano", "PA", "XX-ray"] },
  ]
};

const SOP_ITEMS_OS = {
  level_0: [
    { id: "os_cc", label: "CC", keywords: ["Chief Complaint", "what's wrong", "CC"] },
    { id: "os_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "os_swelling", label: "Swelling", keywords: ["swelling", "swelling", "膊"] },
    { id: "os_pain", label: "Pain", keywords: ["pain", "pain", "discomfort"] },
  ],
  level_1_modules: {
    os_infection: {
      label: "infection",
      detect_keywords: ["infection", "pus", "fever", "蜂窩", "abscess"],
      items: [
        { id: "os_inf_fever", label: "Fever", keywords: ["fever", "fever"] },
        { id: "os_inf_drainage", label: "Drainage", keywords: ["pus", "drainage"] },
      ],
      red_flags: [
        { id: "os_rf_airway", label: "呼吸道風險", keywords: ["呼吸", "suffocation"] }
      ]
    },
    os_tumor: {
      label: "swellingtumor",
      detect_keywords: ["swellingtumor", "tumor", "填", "塞", "Mass"],
      items: [
        { id: "os_tum_biopsy", label: "Biopsy", keywords: ["biopsy", "biopsy"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "os_pmh", label: "PMH", keywords: ["history", "PMH", "diabetes", "hypertension"] },
    { id: "os_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "os_meds", label: "Meds", keywords: ["medication", "抗coagulation"] },
    { id: "os_habits", label: "Habits", keywords: ["smoking", "alcohol", "betel nut"] },
    { id: "os_xray", label: "X-ray", keywords: ["PA", "Pano", "CT", "CBCT", "MRI", "XX-ray"] },
  ]
};
/* ---------- OPDX SOP checklist items ---------- */
const SOP_ITEMS_OPDX = {
  level_0: [
    { id: "opdx_cc", label: "CC (Chief Complaint)", keywords: ["Chief Complaint", "what's wrong", "where hurts", "看什麼", "CC"] },
    { id: "opdx_pi", label: "PI", keywords: ["started", "when", "how long", "history"] },
    { id: "opdx_progression", label: "Progression", keywords: ["enlarging", "worsening", "stable", "change"] },
    { id: "opdx_lesion", label: "病灶描述", keywords: ["broken", "swelling", "white", "red", "plaque", "ulcer"] },
    { id: "opdx_trauma", label: "創傷史", keywords: ["chewing", "denture", "尖", "割到", "sharp到"] },
    { id: "opdx_pain", label: "Pain", keywords: ["pain", "nopain"] },
  ],
  level_1_modules: {
    opdx_ulcer: {
      label: "ulcer",
      detect_keywords: ["ulcer", "broken", "嘴broken", "canker sore"],
      items: [
        { id: "opdx_ul_duration", label: "Duration", keywords: ["how long", "days", "weeks"] },
        { id: "opdx_ul_pain", label: "Pain Level", keywords: ["pain", "nopain", "irritation"] },
        { id: "opdx_ul_recurrence", label: "復發與no", keywords: ["recurrent", "ofanterior也yes", "常broken"] },
        { id: "opdx_ul_base", label: "Base/Margin", keywords: ["底", "margin", "hard"] }
      ],
      red_flags: [
        { id: "opdx_ul_nonhealing", label: "逾兩週未癒", keywords: ["兩週", "一個月", "很久no好", "not healing"] },
        { id: "opdx_ul_induration", label: "Induration感(Induration)", keywords: ["hard", "nodule", "推no動"] }
      ]
    },
    opdx_white_red: {
      label: "leukoplakia/erythroplakia",
      detect_keywords: ["leukoplakia", "erythroplakia", "whitewhite", "redred", "plaque", "discoloration"],
      items: [
        { id: "opdx_wr_texture", label: "表surfaceConsistency", keywords: ["粗糙", "平滑", "凸起", "平坦"] },
        { id: "opdx_wr_wipe", label: "能no擦去", keywords: ["擦fallen", "刮nofallen", "摳"] },
        { id: "opdx_wr_habits", label: "危險因子", keywords: ["smoking", "alcohol", "betel nut"] }
      ],
      red_flags: [
        { id: "opdx_wr_speckled", label: "plaque雜狀(Speckled)", keywords: ["redwhite", "夾雜", "speckled"] },
        { id: "opdx_wr_ulcerative", label: "伴隨ulcer", keywords: ["broken爛", "潰爛", "bleeding"] }
      ]
    },
    opdx_swelling: {
      label: "Mass",
      detect_keywords: ["Mass", "swelling", "tumor", "凸起", "肉"],
      items: [
        { id: "opdx_sw_growth", label: "Growth Rate", keywords: ["enlarging", "growth", "快", "慢"] },
        { id: "opdx_sw_consistency", label: "softhard度", keywords: ["soft", "hard", "click"] },
        { id: "opdx_sw_mobility", label: "可動type", keywords: ["可動", "推動", "fixed", "連著"] }
      ],
      red_flags: [
        { id: "opdx_sw_fixed", label: "fixed於底層", keywords: ["推no動", "cementation", "fixed"] },
        { id: "opdx_sw_rapid", label: "growth快速", keywords: ["sudden變很large", "很快enlarging"] }
      ]
    }
  },
  level_2: [
    { id: "opdx_pmh", label: "PMH", keywords: ["pathology", "history", "PMH"] },
    { id: "opdx_pdh", label: "PDH", keywords: ["tooth科", "PDH"] },
    { id: "opdx_meds", label: "Current Meds", keywords: ["medication", "現行"] },
    { id: "opdx_allergy", label: "Allergy", old_id: "drug_allergy", keywords: ["allergy"] },
    { id: "opdx_tocc", label: "TOCC", keywords: ["旅遊", "職業", "接觸", "群聚"] },
    { id: "opdx_auto", label: "autoimmune", keywords: ["immune", "rheumatoid", "乾燥症", "Sjogren"] },
    { id: "opdx_fh", label: "family史/癌症", keywords: ["癌症", "swellingtumor", "family", "遺傳", "FH"] },
    { id: "opdx_habits", label: "smokingalcoholbetel nut", keywords: ["smoking", "alcohol", "betel nut"] },
    { id: "opdx_bx", label: "biopsyplan", keywords: ["biopsy", "change驗", "biopsy", "pathology"] }
  ]
};


/* ---------- SOP items swap ---------- */



/* ---------- XRAY Dental Radiology Field Labels ---------- */
const FIELD_LABELS_XRAY = {
  s_referral: "Referral source", s_clinical_q: "Clinical question", s_target: "Target region",
  img_type: "Imaging type", img_intra_pa: "Periapical", img_intra_bw: "Bitewing", img_intra_occ: "Occlusal",
  img_extra_pano: "Panoramic", img_extra_ceph: "Cephalometric", img_extra_tmj: "TMJ view",
  img_adv_cbct: "CBCT", img_adv_ct: "CT",
  param_exposure: "Exposure setting", param_fov: "Field of view", param_position: "Patient position",
  f_dent_missing: "Missing", f_dent_impacted: "Impacted", f_dent_super: "Supernumerary",
  f_hard_caries: "Caries", f_hard_rest: "Restoration", f_hard_resorption: "Root resorption",
  f_periap_status: "Periapical status",
  f_bone_level: "Bone level", f_bone_cyst: "Cyst", f_bone_tumor: "Tumor",
  f_anat_sinus: "Maxillary sinus", f_anat_canal: "Mandibular canal", f_anat_tmj: "TMJ",
  imp_status: "Impression",
  rec_additional: "Additional view", rec_cbct: "CBCT", rec_followup: "Clinical follow-up",
};

/* ---------- XRAY Dental Radiology SOAP form ---------- */
function buildXraySoapForm() {
  return `
  <!-- Subjective / Request -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Request Information</b><span>Referral & Clinical Question</span></div></div>
    <div class="card-body">
      <fieldset class="inner-fieldset"><legend>Referral Source</legend>
        <div class="toggle-field">
          <label>Department</label>
          <input type="hidden" name="s_referral" value="" />
          <div class="toggle-btn-group" data-target="s_referral">
            <span class="toggle-btn" data-value="OP">OP</span>
            <span class="toggle-btn" data-value="OS">OS</span>
            <span class="toggle-btn" data-value="Ortho">Ortho</span>
            <span class="toggle-btn" data-value="Endo">Endo</span>
            <span class="toggle-btn" data-value="Perio">Perio</span>
            <span class="toggle-btn" data-value="Others">Others</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Clinical Question</legend>
        <div class="toggle-field">
          <label>Indication</label>
          <input type="hidden" name="s_clinical_q" value="" />
          <div class="toggle-btn-group" data-target="s_clinical_q">
            <span class="toggle-btn" data-value="Caries detection">Caries</span>
            <span class="toggle-btn" data-value="Periapical lesion">Periapical</span>
            <span class="toggle-btn" data-value="Impacted tooth">Impacted</span>
            <span class="toggle-btn" data-value="Bone level">Bone level</span>
            <span class="toggle-btn" data-value="Cyst/Tumor">Cyst/Tumor</span>
            <span class="toggle-btn" data-value="Implant eval">Implant eval</span>
          </div>
        </div>
      </fieldset>

      <div class="field"><label>Target Region (tooth/site)</label><input type="text" name="s_target" placeholder="" /></div>
    </div>
  </div>

  <!-- Imaging Type -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Imaging</b><span>Type & Parameters</span></div></div>
    <div class="card-body">

      <fieldset class="inner-fieldset"><legend>Intraoral</legend>
        <div class="grid-2">
          <div class="field"><label>Periapical</label><input type="text" name="img_intra_pa" placeholder="" /></div>
          <div class="field"><label>Bitewing</label><input type="text" name="img_intra_bw" placeholder="" /></div>
        </div>
        <div class="field"><label>Occlusal</label><input type="text" name="img_intra_occ" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Extraoral</legend>
        <div class="grid-2">
          <div class="field"><label>Panoramic</label><input type="text" name="img_extra_pano" placeholder="" /></div>
          <div class="field"><label>Cephalometric</label><input type="text" name="img_extra_ceph" placeholder="" /></div>
        </div>
        <div class="field"><label>TMJ view</label><input type="text" name="img_extra_tmj" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Advanced</legend>
        <div class="grid-2">
          <div class="field"><label>CBCT</label><input type="text" name="img_adv_cbct" placeholder="" /></div>
          <div class="field"><label>CT</label><input type="text" name="img_adv_ct" placeholder="" /></div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Imaging Parameters</legend>
        <div class="grid-2">
          <div class="field"><label>Exposure setting</label><input type="text" name="param_exposure" placeholder="" /></div>
          <div class="field"><label>Field of view</label><input type="text" name="param_fov" placeholder="" /></div>
        </div>
        <div class="field"><label>Patient position</label><input type="text" name="param_position" placeholder="" /></div>
      </fieldset>
    </div>
  </div>

  <!-- Radiographic Findings -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Radiographic Findings</b><span>Interpretation</span></div></div>
    <div class="card-body">

      <fieldset class="inner-fieldset"><legend>Dentition Status</legend>
        <div class="grid-2">
          <div class="field"><label>Missing</label><input type="text" name="f_dent_missing" placeholder="" /></div>
          <div class="field"><label>Impacted</label><input type="text" name="f_dent_impacted" placeholder="" /></div>
        </div>
        <div class="field"><label>Supernumerary</label><input type="text" name="f_dent_super" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Hard Tissue</legend>
        <div class="grid-2">
          <div class="field"><label>Caries</label><input type="text" name="f_hard_caries" placeholder="" /></div>
          <div class="field"><label>Restoration</label><input type="text" name="f_hard_rest" placeholder="" /></div>
        </div>
        <div class="field"><label>Root resorption</label><input type="text" name="f_hard_resorption" placeholder="" /></div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Periapical Region</legend>
        <div class="toggle-field">
          <label>Status</label>
          <input type="hidden" name="f_periap_status" value="" />
          <div class="toggle-btn-group" data-target="f_periap_status">
            <span class="toggle-btn" data-value="Normal">Normal</span>
            <span class="toggle-btn" data-value="Radiolucency">Radiolucency</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Bone</legend>
        <div class="field"><label>Bone level</label><input type="text" name="f_bone_level" placeholder="" /></div>
        <div class="grid-2">
          <div class="field"><label>Cyst</label><input type="text" name="f_bone_cyst" placeholder="" /></div>
          <div class="field"><label>Tumor</label><input type="text" name="f_bone_tumor" placeholder="" /></div>
        </div>
      </fieldset>

      <fieldset class="inner-fieldset"><legend>Anatomic Structure</legend>
        <div class="grid-2">
          <div class="field"><label>Maxillary sinus</label><input type="text" name="f_anat_sinus" placeholder="" /></div>
          <div class="field"><label>Mandibular canal</label><input type="text" name="f_anat_canal" placeholder="" /></div>
        </div>
        <div class="field"><label>TMJ</label><input type="text" name="f_anat_tmj" placeholder="" /></div>
      </fieldset>
    </div>
  </div>

  <!-- Impression -->
  <div class="soap-card">
    <div class="card-head"><div class="badge r">I</div><div class="card-head-text"><b>Impression</b><span>Summary</span></div></div>
    <div class="card-body">
      <div class="toggle-field">
        <label>Overall impression</label>
        <input type="hidden" name="imp_status" value="" />
        <div class="toggle-btn-group" data-target="imp_status">
          <span class="toggle-btn" data-value="Normal">Normal</span>
          <span class="toggle-btn" data-value="Suspected pathology">Suspected pathology</span>
          <span class="toggle-btn" data-value="Correlation needed">Correlation needed</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Recommendation -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Recommendation</b><span>Next Steps</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Additional view</label><input type="text" name="rec_additional" placeholder="" /></div>
        <div class="field"><label>CBCT</label><input type="text" name="rec_cbct" placeholder="" /></div>
      </div>
      <div class="field"><label>Clinical follow-up</label><input type="text" name="rec_followup" placeholder="" /></div>
    </div>
  </div>`;
}

/* ---------- XRAY SOP checklist items ---------- */
const SOP_ITEMS_XRAY = {
  level_0: [
    { id: "xray_referral", label: "Referral", keywords: ["referral", "referral", "哪科"] },
    { id: "xray_clinical_q", label: "Clinical Q", keywords: ["臨床問題", "indication", "item的"] },
    { id: "xray_target", label: "Target", keywords: ["location", "which tooth", "區域", "Site"] },
    { id: "xray_modality", label: "Modality", keywords: ["PA", "pano", "CBCT", "CT", "bitewing"] },
  ],
  level_1_modules: {
    xray_findings: {
      label: "Imaging發現",
      detect_keywords: ["radiolucency", "骨", "decay", "impacted", "cyst", "tumor", "resorption"],
      items: [
        { id: "xray_f_caries", label: "Caries", keywords: ["decay", "caries", "caries"] },
        { id: "xray_f_periap", label: "Periapical", keywords: ["periapical", "radiolucency", "periapical"] },
        { id: "xray_f_bone", label: "Bone level", keywords: ["骨", "bone level", "bone"] },
        { id: "xray_f_impacted", label: "Impacted", keywords: ["impacted", "impacted", "埋伏"] },
      ],
      red_flags: [
        { id: "xray_rf_tumor", label: "Tumor/Cyst", keywords: ["swellingtumor", "囊swelling", "tumor", "cyst"] },
      ]
    },
  },
  level_2: [
    { id: "xray_impression", label: "Impression", keywords: ["印象", "impression", "結論"] },
    { id: "xray_rec", label: "Recommendation", keywords: ["建議", "recommendation", "follow-up"] },
    { id: "xray_anatomy", label: "Anatomy", keywords: ["鼻竇", "sinus", "神經管", "canal", "TMJ"] },
  ]
};

/* ---------- REST (Operative/Restorative/Esthetic) SOP checklist items ---------- */
const SOP_ITEMS_REST = {
  level_0: [
    { id: "rest_cc", label: "CC", keywords: ["Chief Complaint", "what's wrong", "CC"] },
    { id: "rest_pi", label: "PI", keywords: ["started", "when", "how long"] },
    { id: "rest_tooth", label: "Tooth #", keywords: ["teeth", "which tooth", "tooth"] },
    { id: "rest_pain", label: "Pain", keywords: ["pain", "pain", "敏感"] },
  ],
  level_1_modules: {
    rest_caries: {
      label: "caries",
      detect_keywords: ["decay", "dark", "cavity", "caries", "caries"],
      items: [
        { id: "rest_caries_depth", label: "Depth", keywords: ["deep", "shallow", "enamel", "dentin", "pulp"] },
        { id: "rest_caries_loc", label: "Location", keywords: ["近心", "遠心", "occlusionsurface"] },
      ],
      red_flags: []
    },
    rest_esthetic: {
      label: "美容",
      detect_keywords: ["whitening", "顏色", "discoloration", "黃", "no好看", "美觀"],
      items: [
        { id: "rest_shade", label: "Shade", keywords: ["顏色", "色號", "shade"] },
        { id: "rest_discol", label: "Discoloration", keywords: ["discoloration", "黃", "dark"] },
      ],
      red_flags: []
    },
  },
  level_2: [
    { id: "rest_pmh", label: "PMH", keywords: ["history", "PMH"] },
    { id: "rest_allergy", label: "Allergy", keywords: ["allergy"] },
    { id: "rest_meds", label: "Meds", keywords: ["medication", "usemedication"] },
    { id: "rest_habits", label: "Habits", keywords: ["grinding", "smoking", "alcohol"] },
    { id: "rest_xray", label: "X-ray", keywords: ["PA", "bitewing", "XX-ray"] },
  ]
};

let activeSopItems = null;  // will be set by loadDeptSopItems

function loadDeptSopItems(deptKey) {
  if (deptKey === "os") {
    activeSopItems = SOP_ITEMS_OS;
  } else if (deptKey === "opdx") {
    activeSopItems = SOP_ITEMS_OPDX;
  } else if (deptKey === "tmd") {
    activeSopItems = SOP_ITEMS_TMD;
  } else if (deptKey === "ortho") {
    activeSopItems = SOP_ITEMS_ORTHO;
  } else if (deptKey === "endo") {
    activeSopItems = SOP_ITEMS_ENDO;
  } else if (deptKey === "pedo") {
    activeSopItems = SOP_ITEMS_PEDO;
  } else if (deptKey === "perio") {
    activeSopItems = SOP_ITEMS_PERIO;
  } else if (deptKey === "gd") {
    activeSopItems = SOP_ITEMS_GD;
  } else if (deptKey === "pedo_dc") {
    activeSopItems = SOP_ITEMS_PEDO_DC;
  } else if (deptKey === "pros") {
    activeSopItems = SOP_ITEMS_PROS;
  } else if (deptKey === "implant") {
    activeSopItems = SOP_ITEMS_IMPLANT;
  } else if (deptKey === "rest") {
    activeSopItems = SOP_ITEMS_REST;
  } else if (deptKey === "xray") {
    activeSopItems = SOP_ITEMS_XRAY;
  } else {
    activeSopItems = SOP_ITEMS;
  }
  // Reset SOP state and re-init with new items
  SopState.coverage = {};
  SopState.detectedModules = [];
  SopState.redFlagsDetected = [];
  SopState.nextQuestions = [];
  SopState.allTranscript = "";
  initSopPanel();
}


/** ======================================================
 *  Debug Log
 *  ====================================================== */
function log(msg) {
  const el = $("debug");
  const ts = new Date().toLocaleTimeString();
  el.textContent += `[${ts}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
  console.log(`[Gamma] ${msg}`);
}


/** ======================================================
 *  Case ID Management
 *  ====================================================== */
function getCaseId() {
  return AppState.caseId;
}

function setCaseId(id) {
  AppState.caseId = id;
  const input = $("caseIdInput");
  input.value = id || "";
}


/** ======================================================
 *  UI State Machine
 *  ====================================================== */
const UI = {
  setState(s, detail) {
    const pill = $("globalStatus");
    pill.textContent = detail ? `${s} — ${detail}` : s;
    log("UI state → " + s + (detail ? ` (${detail})` : ""));
  },
  setSoapBusy(b) {
    $("soapStatus").textContent = b ? "AI 生成中…" : "";
  }
};


/** ======================================================
 *  Chat Thread
 *  ====================================================== */
function addMessage({ role, text }) {
  const thread = $("chatThread");
  const row = document.createElement("div");
  const side = role === "doctor" ? "right" : "left";
  row.className = `msg-row ${side}`;
  const label = role === "doctor" ? "🩺 Doctor" : "🤖 AI";
  row.innerHTML = `
    <div class="msg-content">
      <span class="meta">${label} · ${new Date().toLocaleTimeString()}</span>
      <div class="bubble">${text}</div>
    </div>`;
  thread.appendChild(row);
  thread.scrollTop = thread.scrollHeight;
}

let typingEl = null;
function showTyping(text) {
  hideTyping();
  const thread = $("chatThread");
  typingEl = document.createElement("div");
  typingEl.className = "msg-row left";
  typingEl.innerHTML = `<div class="msg-content"><span class="typing">⏳ ${text}</span></div>`;
  thread.appendChild(typingEl);
  thread.scrollTop = thread.scrollHeight;
}
function hideTyping() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}


/** ======================================================
 *  SOAP Form
 *  ====================================================== */
const FIELD_LABELS = {
  cc: "CC (Chief Complaint)", pi: "PI (Present Illness)", pmh: "PMH", pdh: "PDH",
  current_medication: "Current meds", drug_allergy: "Drug allergy",
  birth_history: "Birth history", vaccination_history: "Vaccination history",
  tocc_travel: "Travel history", tocc_occupation: "Occupation",
  tocc_contact: "Contact history", tocc_cluster: "Cluster",
  risk_smoking: "Smoking", risk_alcohol: "Alcohol",
  risk_betel_nut: "Betel nut", family_history: "Family history",
  pain_score: "Pain score", pain_pattern: "Pain pattern",
  pain_location: "Pain location", o_extraoral: "Extraoral",
  o_intraoral_soft_tissue: "Intraoral", o_teeth_findings: "Dentition",
  a_location: "Location", a_diagnosis: "Diagnosis",
  p_treatment_plan: "Treatment plan",
};

const PRIORITY_ORDER = [
  "cc", "pi", "pmh", "pdh",
  "pain_location", "o_extraoral", "o_intraoral_soft_tissue",
  "a_diagnosis", "a_location",
  "p_treatment_plan",
];


function fillSoapFields(obj, source) {
  if (!obj || typeof obj !== "object") return;
  const form = $("soapForm");

  // Explicit map: JSON leaf key → form field name
  const KEY_MAP = {
    cc: "cc", pi: "pi", pmh: "pmh", pdh: "pdh",
    current_medication: "current_medication",
    drug_allergy_history: "drug_allergy",
    birth_history: "birth_history",
    vaccination_history: "vaccination_history",
    family_history: "family_history",
    travel_history: "tocc_travel",
    occupation: "tocc_occupation",
    contact_history: "tocc_contact",
    cluster: "tocc_cluster",
    pain_score: "pain_score",
    pain_pattern: "pain_pattern",
    pain_location: "pain_location",
    extraoral_findings: "o_extraoral",
    intraoral_findings: "o_intraoral_soft_tissue",
    present_dentition: "o_teeth_findings",
    location: "a_location",
    diagnosis: "a_diagnosis",
    treatment_plan: "p_treatment_plan",
  };

  // Risk factor parent keys → form field names
  const RISK_MAP = {
    cigarettes: "risk_smoking",
    alcohol: "risk_alcohol",
    betel_nut: "risk_betel_nut",
  };

  let filled = 0;

  function walk(o, parentKey) {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        walk(v, k);
      } else {
        // Handle risk factors: cigarettes.status → risk_smoking
        if (k === "status" && RISK_MAP[parentKey]) {
          const el = form.elements[RISK_MAP[parentKey]];
          if (el) {
            const val = String(v ?? "");
            if (val && val !== "Needs review" && val !== "unknown" && val !== el.value) {
              el.value = val;
              el.classList.add("highlight");
              setTimeout(() => el.classList.remove("highlight"), 1400);
              filled++;
            }
          }
          continue;
        }

        const formKey = KEY_MAP[k] || k;
        const el = form.elements[formKey];
        if (el) {
          const val = Array.isArray(v) ? v.join("\n") : String(v ?? "");
          if (val && val !== "Needs review" && val !== "unknown" && val !== el.value) {
            el.value = val;
            el.classList.add("highlight");
            setTimeout(() => el.classList.remove("highlight"), 1400);
            filled++;
          }
        }
      }
    }
  }

  walk(obj, "");
  log(`fillSoapFields from ${source}: filled ${filled} fields`);
}


function getMissingFields(limit = 5) {
  const form = $("soapForm");
  const missing = [];
  for (const key of PRIORITY_ORDER) {
    const el = form.elements[key];
    if (!el) continue;
    const v = (el.value || "").trim();
    if (!v || v === "Needs review") missing.push(key);
    if (missing.length >= limit) break;
  }
  return missing;
}


function buildReminderMessage() {
  const missing = getMissingFields(5);
  if (missing.length === 0) return "Updated SOAP ✅ itemanterior欄位都done填齊。";
  const lines = ["Updated SOAP ✅\n還差幾個欄位建議補齊："];
  for (const key of missing) {
    lines.push(`- ${FIELD_LABELS[key] || key}`);
  }
  return lines.join("\n");
}


/** ======================================================
 *  Quick Extract (categorical shortcuts)
 *  ====================================================== */
function quickExtractFromDoctorText(text) {
  if (!text) return null;
  const t = text.replace(/\s+/g, "");
  const result = {};

  // Gender
  if (/male(type|，|。)?|先生/.test(t)) result.sex = "maletype";
  else if (/female(type|，|。)?|small姐|female/.test(t)) result.sex = "femaletype";

  // Age
  const ageM = t.match(/(\d{1,3})years old/);
  if (ageM) result.age = ageM[1] + "years old";

  // Smoking
  if (/nosmoking|no吸smoking|nosmoking|nonesmoking|noyes抽/.test(t)) result.risk_smoking = "No";
  else if (/smoking|吸smoking|smoking/.test(t)) result.risk_smoking = "Yes";

  // Alcohol
  if (/no喝alcohol|no喝alcohol|nonealcohol|no飲alcohol/.test(t)) result.risk_alcohol = "No";
  else if (/喝alcohol|飲alcohol|alcohol/.test(t)) result.risk_alcohol = "Yes";

  // Betel nut
  if (/no嚼|no嚼|none嚼|noeatingbetel nut/.test(t)) result.risk_betel_nut = "No";
  else if (/betel nut|嚼/.test(t)) result.risk_betel_nut = "Yes";

  // Drug allergy
  if (/noallergy|noyesallergy|noneallergy|no.?allerg/i.test(t)) result.drug_allergy = "No known drug allergy (NKDA)";
  else if (/allergy/.test(t)) result.drug_allergy = text;

  return Object.keys(result).length > 0 ? result : null;
}


/** ======================================================
 *  Parse rendered SOAP text → fields
 *  ====================================================== */
function parseRenderedTextToFields(txt) {
  if (!txt || typeof txt !== "string") return null;
  const result = {};

  // Labels MUST match soap_renderer.py output EXACTLY
  const fieldMap = {
    "Chief Complaint \\(CC\\)": "cc",
    "Present Illness \\(PI\\)": "pi",
    "Past Medical History \\(PMH\\)": "pmh",
    "Past Dental History \\(PDH\\)": "pdh",
    "Current Medication": "current_medication",
    "Drug Allergy History": "drug_allergy",
    "Birth History": "birth_history",
    "Vaccination History": "vaccination_history",
    "Travel History": "tocc_travel",
    "Occupation": "tocc_occupation",
    "Contact History": "tocc_contact",
    "Cluster": "tocc_cluster",
    "Alcohol": "risk_alcohol",
    "Betel Nut": "risk_betel_nut",
    "Cigarettes": "risk_smoking",
    "Family History": "family_history",
    "Pain Score": "pain_score",
    "Pain Pattern": "pain_pattern",
    "Pain Location": "pain_location",
    "Extraoral Findings": "o_extraoral",
    "Intraoral Findings": "o_intraoral_soft_tissue",
    "Present Dentition": "o_teeth_findings",
    "Location": "a_location",
    "Diagnosis": "a_diagnosis",
    "Treatment Plan": "p_treatment_plan",
  };

  for (const [labelRegex, key] of Object.entries(fieldMap)) {
    const regex = new RegExp(`^${labelRegex}[：:]\\s*(.+)$`, "m");
    const m = txt.match(regex);
    if (m && m[1]) {
      const val = m[1].trim();
      if (val && val !== "Needs review" && val !== "unknown") result[key] = val;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}


/** ======================================================
 *  onSend — main message flow
 *  ====================================================== */
async function onSend() {
  const input = $("messageInput");
  const text = (input.value || "").trim();
  if (!text) return;

  if (!AppState.caseId) {
    addMessage({ role: "ai", text: "⚠️ 請先按 Create 建立 Case 再started問診。" });
    return;
  }

  addMessage({ role: "doctor", text });

  // ✅ Immediate local SOP scan
  updateSopLocal(text);

  const quick = quickExtractFromDoctorText(text);
  if (quick) {
    fillSoapFields(quick, "quick");
    log("✅ Quick-filled fields applied.");
  }

  input.value = "";
  autosizeInput();

  UI.setState("sending");
  showTyping("AI 正在更新 SOAP…");

  try {
    const caseId = getCaseId();

    // ✅ Save accumulated transcript to DB so SOAP endpoint can read it
    await fetch(`/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript_clean: SopState.allTranscript }),
    });

    UI.setSoapBusy(true);
    UI.setState("soap_updating");

    // SOAP generation (main priority)
    const soapRes = await fetch(`/cases/${caseId}/soap_versions`, { method: "POST" }).then(r => r.json());

    log(`SOAP response:\n${JSON.stringify(soapRes, null, 2)}`);
    hideTyping();

    if (soapRes.soap_json && typeof soapRes.soap_json === "object") {
      fillSoapFields(soapRes.soap_json, "soap_json");
    } else if (soapRes.soap_struct && typeof soapRes.soap_struct === "object") {
      fillSoapFields(soapRes.soap_struct, "soap_struct");
    } else if (soapRes.rendered_text && typeof soapRes.rendered_text === "string") {
      const parsed = parseRenderedTextToFields(soapRes.rendered_text);
      if (parsed) {
        fillSoapFields(parsed, "rendered_text");
      }
    } else {
      log("SOAP: no usable data — " + JSON.stringify(soapRes));
    }

    addMessage({ role: "ai", text: buildReminderMessage() });

    UI.setSoapBusy(false);
    UI.setState("idle");

    await refreshVersionsSafe();

    // ✅ SOP check runs AFTER SOAP (non-blocking, updates panel in background)
    runSopCheckLLM(caseId).then(sopResult => {
      if (sopResult && sopResult.next_questions && sopResult.next_questions.length > 0) {
        addMessage({ role: "ai", text: "📋 SOP reminder：\n" + sopResult.next_questions.slice(0, 3).map(q => `• ${q}`).join("\n") });
      }
    });

  } catch (e) {
    log("Send/Generate error: " + e.message);
    hideTyping();
    UI.setSoapBusy(false);
    UI.setState("error", e.message || "failed");
    addMessage({ role: "ai", text: "⚠️ 系統發生錯誤，請再試一次。" });
    UI.setState("idle");
  }
}


/** ======================================================
 *  Versions
 *  ====================================================== */
async function refreshVersionsSafe() {
  const caseId = getCaseId();
  if (!caseId) return;

  try {
    const res = await fetch(`/cases/${caseId}/soap_versions`);
    const data = await res.json();
    const sel = $("versionSelect");
    sel.innerHTML = "";
    if (!Array.isArray(data) || data.length === 0) {
      sel.innerHTML = '<option value="">No versions</option>';
      return;
    }

    for (const v of data) {
      const opt = document.createElement("option");
      opt.value = v.version_id;
      opt.textContent = `v${v.version_id} — ${v.created_at}`;
      sel.appendChild(opt);
    }
    log(`Loaded ${data.length} SOAP versions.`);
  } catch (e) {
    log("refreshVersionsSafe error: " + e.message);
  }
}


/** ======================================================
 *  Audio / Recording
 *  ====================================================== */
let mediaRec = null;
let audioChunks = [];
let recStartTime = null;
let recTimerInterval = null;
let audioCtx = null;
let analyser = null;

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRec = new MediaRecorder(stream);
    audioChunks = [];

    mediaRec.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRec.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRec.start();
    recStartTime = Date.now();
    showPillMode("recording");

    recTimerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - recStartTime) / 1000);
      const mm = String(Math.floor(sec / 60)).padStart(2, "0");
      const ss = String(sec % 60).padStart(2, "0");
      $("recTimer").textContent = `${mm}:${ss}`;
    }, 500);

    // Waveform
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    drawLiveWave();

    log("Recording started.");
  }).catch(err => {
    log("Mic permission denied: " + err.message);
    addMessage({ role: "ai", text: "⚠️ none法取得麥克風權限。" });
  });
}

function stopRecording() {
  if (mediaRec && mediaRec.state === "recording") {
    mediaRec.stop();
  }
  clearInterval(recTimerInterval);
  showPillMode("review");
  log("Recording stopped, in review mode.");
}

function cancelRecording() {
  audioChunks = [];
  showPillMode("text");
  log("Recording cancelled.");
}

async function confirmRecording() {
  showPillMode("text");
  if (audioChunks.length === 0) return;

  const caseId = getCaseId();
  if (!caseId) {
    addMessage({ role: "ai", text: "⚠️ Please create first Case。" });
    return;
  }

  $("pillStatus").classList.remove("hidden");
  $("pillStatus").textContent = "upper傳 & 轉錄中…";

  const blob = new Blob(audioChunks, { type: "audio/webm" });
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");

  try {
    const uploadRes = await fetch(`/cases/${caseId}/audio`, { method: "POST", body: formData });
    const uploadData = await uploadRes.json();
    log("Audio uploaded: " + JSON.stringify(uploadData));

    $("pillStatus").textContent = "Whisper 轉錄中…";
    const tRes = await fetch(`/cases/${caseId}/transcribe`, { method: "POST" });
    const tData = await tRes.json();
    log("Transcribe result: " + JSON.stringify(tData));

    if (tData.transcript_raw) {
      $("messageInput").value = tData.transcript_raw;
      autosizeInput();
      log("Transcript placed in input box.");
    }
  } catch (e) {
    log("Audio/Transcribe error: " + e.message);
    addMessage({ role: "ai", text: "⚠️ 轉錄失敗: " + e.message });
  }

  $("pillStatus").classList.add("hidden");
}


/** ======================================================
 *  Pill mode switching
 *  ====================================================== */
function showPillMode(mode) {
  const pill = $("composerPill");
  pill.dataset.mode = mode;

  $("messageInput").classList.toggle("hidden", mode === "recording");
  $("recHud").classList.toggle("hidden", mode !== "recording");
  $("recReview").classList.toggle("hidden", mode !== "review");

  $("mainIconWave").classList.toggle("hidden", mode !== "text" || !getCaseId());
  $("mainIconStop").classList.toggle("hidden", mode !== "recording");
  $("mainIconSend").classList.toggle("hidden", mode !== "text" || !$("messageInput").value.trim());

  $("micBtn").style.display = mode === "text" ? "" : "none";
}


function autosizeInput() {
  const ta = $("messageInput");
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
  // Update icons
  const hasText = ta.value.trim().length > 0;
  $("mainIconSend").classList.toggle("hidden", !hasText);
  $("mainIconWave").classList.toggle("hidden", hasText);
}


/** ======================================================
 *  Live waveform
 *  ====================================================== */
function drawLiveWave() {
  const canvas = $("liveWave");
  const ctx = canvas.getContext("2d");
  if (!analyser) return;

  const bufLen = analyser.frequencyBinCount;
  const data = new Uint8Array(bufLen);
  const W = canvas.width;
  const H = canvas.height;

  function loop() {
    if (!mediaRec || mediaRec.state !== "recording") return;
    analyser.getByteTimeDomainData(data);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(47,107,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const slice = W / bufLen;
    let x = 0;
    for (let i = 0; i < bufLen; i++) {
      const v = data[i] / 128.0;
      const y = (v * H) / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x += slice;
    }
    ctx.stroke();
    requestAnimationFrame(loop);
  }
  loop();
}


function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}






/* ---------- REST Operative/Restorative/Esthetic Field Labels ---------- */
const FIELD_LABELS_REST = {
  s_cc: "CC", s_pi: "PI", s_pmh: "PMH", s_meds: "Medications",
  s_allergy: "Allergy", s_habits: "Habits",
  o_facial_sym: "Facial symmetry", o_smile_line: "Smile line",
  o_dentition_type: "Dentition", o_dentition_chart: "Chart", o_dentition_notes: "Notes",
  o_caries_tooth: "Caries tooth #", o_caries_depth: "Caries depth",
  o_defect_fracture: "Fracture", o_defect_abrasion: "Abrasion",
  o_defect_erosion: "Erosion", o_defect_attrition: "Attrition",
  o_rest_composite: "Composite", o_rest_amalgam: "Amalgam",
  o_rest_ceramic: "Ceramic", o_rest_crown: "Crown",
  o_margin: "Marginal integrity",
  o_shade: "Shade", o_discoloration: "Discoloration",
  o_xray_pa: "Periapical", o_xray_bw: "Bitewing",
  a_caries_dx: "Caries Dx", a_rest_failure: "Restoration failure", a_esthetic: "Esthetic problem",
  p_composite: "Composite restoration", p_inlay_onlay: "Inlay/Onlay",
  p_crown: "Crown", p_veneer: "Veneer", p_whitening: "Whitening", p_followup: "Follow-up",
};

/* ---------- REST Operative/Restorative/Esthetic SOAP form ---------- */
function buildRestSoapForm() {
  return `
  <!-- S -->
  <div class="soap-card">
    <div class="card-head"><div class="badge s">S</div><div class="card-head-text"><b>Subjective</b><span>History</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Chief Complaint (CC)</label><textarea name="s_cc" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Present Illness (PI)</label><textarea name="s_pi" rows="2" placeholder=""></textarea></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>PMH</label><textarea name="s_pmh" rows="2" placeholder=""></textarea></div>
        <div class="field"><label>Medications</label><input type="text" name="s_meds" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Allergy</label><input type="text" name="s_allergy" placeholder="" /></div>
        <div class="field"><label>Habits</label><input type="text" name="s_habits" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- O -->
  <div class="soap-card">
    <div class="card-head"><div class="badge o">O</div><div class="card-head-text"><b>Objective</b><span>Examination</span></div></div>
    <div class="card-body">

      <!-- Extra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge r">EO</div><div class="card-head-text"><b>Extra-oral Examination</b></div></div>
        <div class="card-body">
          <div class="grid-2">
            <div class="field"><label>Facial symmetry</label><input type="text" name="o_facial_sym" placeholder="" /></div>
            <div class="field"><label>Smile line</label><input type="text" name="o_smile_line" placeholder="" /></div>
          </div>
        </div>
      </div>

      <!-- Intra-oral -->
      <div class="soap-card inner">
        <div class="card-head inner-head"><div class="badge t">IO</div><div class="card-head-text"><b>Intra-oral Examination</b></div></div>
        <div class="card-body">
          <fieldset class="inner-fieldset"><legend>Dentition</legend>
            <div class="toggle-field">
              <label>Dentition type</label>
              <input type="hidden" name="o_dentition_type" value="" />
              <div class="toggle-btn-group" data-target="o_dentition_type">
                <span class="toggle-btn" data-value="Adult">Adult</span>
                <span class="toggle-btn" data-value="Mixed">Mixed</span>
                <span class="toggle-btn" data-value="Primary">Primary</span>
              </div>
            </div>
            <div class="field" style="margin-top:8px"><label>Dentition chart</label><textarea name="o_dentition_chart" rows="2" placeholder="e.g. 87654321|12345678"></textarea></div>
            <div class="field"><label>Notes</label><input type="text" name="o_dentition_notes" placeholder="" /></div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Caries</legend>
            <div class="grid-2">
              <div class="field"><label>Tooth number</label><input type="text" name="o_caries_tooth" placeholder="" /></div>
              <div class="field"><label>Depth</label>
                <input type="hidden" name="o_caries_depth" value="" />
                <div class="toggle-btn-group" data-target="o_caries_depth">
                  <span class="toggle-btn" data-value="Enamel">Enamel</span>
                  <span class="toggle-btn" data-value="Dentin">Dentin</span>
                  <span class="toggle-btn" data-value="Pulp">Pulp</span>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Tooth Defect</legend>
            <div class="grid-2">
              <div class="field"><label>Fracture</label><input type="text" name="o_defect_fracture" placeholder="" /></div>
              <div class="field"><label>Abrasion</label><input type="text" name="o_defect_abrasion" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Erosion</label><input type="text" name="o_defect_erosion" placeholder="" /></div>
              <div class="field"><label>Attrition</label><input type="text" name="o_defect_attrition" placeholder="" /></div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Existing Restoration</legend>
            <div class="grid-2">
              <div class="field"><label>Composite</label><input type="text" name="o_rest_composite" placeholder="" /></div>
              <div class="field"><label>Amalgam</label><input type="text" name="o_rest_amalgam" placeholder="" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Ceramic</label><input type="text" name="o_rest_ceramic" placeholder="" /></div>
              <div class="field"><label>Crown</label><input type="text" name="o_rest_crown" placeholder="" /></div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Marginal Integrity</legend>
            <div class="toggle-field">
              <label>Status</label>
              <input type="hidden" name="o_margin" value="" />
              <div class="toggle-btn-group" data-target="o_margin">
                <span class="toggle-btn" data-value="Intact">Intact</span>
                <span class="toggle-btn" data-value="Defective">Defective</span>
              </div>
            </div>
          </fieldset>

          <fieldset class="inner-fieldset"><legend>Tooth Color</legend>
            <div class="grid-2">
              <div class="field"><label>Shade</label><input type="text" name="o_shade" placeholder="" /></div>
              <div class="field"><label>Discoloration</label><input type="text" name="o_discoloration" placeholder="" /></div>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- Radiographic -->
      <fieldset class="inner-fieldset"><legend>Radiographic Examination</legend>
        <div class="grid-2">
          <div class="field"><label>Periapical</label><input type="text" name="o_xray_pa" placeholder="" /></div>
          <div class="field"><label>Bitewing</label><input type="text" name="o_xray_bw" placeholder="" /></div>
        </div>
      </fieldset>

    </div>
  </div>

  <!-- A -->
  <div class="soap-card">
    <div class="card-head"><div class="badge a">A</div><div class="card-head-text"><b>Assessment</b><span>Diagnosis</span></div></div>
    <div class="card-body">
      <div class="field"><label>Caries diagnosis</label><input type="text" name="a_caries_dx" placeholder="" /></div>
      <div class="grid-2">
        <div class="field"><label>Restoration failure</label><input type="text" name="a_rest_failure" placeholder="" /></div>
        <div class="field"><label>Esthetic problem</label><input type="text" name="a_esthetic" placeholder="" /></div>
      </div>
    </div>
  </div>

  <!-- P -->
  <div class="soap-card">
    <div class="card-head"><div class="badge p">P</div><div class="card-head-text"><b>Plan</b><span>Treatment</span></div></div>
    <div class="card-body">
      <div class="grid-2">
        <div class="field"><label>Composite restoration</label><input type="text" name="p_composite" placeholder="" /></div>
        <div class="field"><label>Inlay / Onlay</label><input type="text" name="p_inlay_onlay" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Crown</label><input type="text" name="p_crown" placeholder="" /></div>
        <div class="field"><label>Veneer</label><input type="text" name="p_veneer" placeholder="" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Whitening</label><input type="text" name="p_whitening" placeholder="" /></div>
        <div class="field"><label>Follow-up</label><input type="text" name="p_followup" placeholder="" /></div>
      </div>
    </div>
  </div>`;
}

/** ======================================================
 *  SOP Checklist Module
 *  ====================================================== */

const SOP_ITEMS = {
  level_0: [
    { id: "age", label: "Age", keywords: ["years old", "年紀", "幾years old", "Age"] },
    { id: "sex", label: "Sex", keywords: ["male", "female", "先生", "small姐", "female", "maletype", "femaletype"] },
    { id: "visit_type", label: "Visit Type", keywords: ["初診", "複診", "回診", "第一次", "follow"] },
    { id: "chief_complaint", label: "Chief Complaint", keywords: ["Chief Complaint", "what's wrong", "where hurts", "什麼問題", "來看什麼"] },
    { id: "pi_onset", label: "Onset", keywords: ["started", "when", "how long了", "什麼時候", "days", "weeks", "昨days", "upper週"] },
    { id: "pi_duration", label: "Duration", keywords: ["continuous", "一直", "都會", "斷斷續續", "days了", "週了", "月了"] },
    { id: "pi_progression", label: "Progression", keywords: ["progressively", "worsening", "加重", "好轉", "change", "改善"] },
    { id: "pi_site", label: "Site", keywords: ["left", "right", "upper", "lower", "anterior", "posterior", "顆", "tooth", "臼齒", "canine", "incisor", "gingiva", "tongue", "buccal", "顎"] },
    { id: "pi_associated_symptoms", label: "Associated Symptoms", keywords: ["swelling", "bleeding", "流pus", "麻", "fever", "headpain", "lymph"] },
  ],
  level_1_modules: {
    pain: {
      label: "Pain",
      detect_keywords: ["pain", "pain", "sore", "sharp", "discomfort", "toothache", "toothpain", "facialpain"],
      items: [
        { id: "l1_pain_onset", label: "Onset", keywords: ["started", "when", "how long"] },
        { id: "l1_pain_duration", label: "Duration", keywords: ["continuous", "一直", "how long"] },
        { id: "l1_pain_quality", label: "Pain Quality", keywords: ["銳", "鈍", "跳", "sharp", "灼", "悶", "抽", "鑽", "脹"] },
        { id: "l1_pain_severity", label: "Severity", keywords: ["幾分", "severe", "影響", "eatingno了", "睡no著", "分數"] },
        { id: "l1_pain_location", label: "Pain Site", keywords: ["wherepain", "which tooth", "left", "right", "upper", "lower"] },
        { id: "l1_pain_radiation", label: "Radiation", keywords: ["放射", "傳導", "延伸", "耳朵", "temple", "head"] },
        { id: "l1_pain_triggering_factors", label: "Triggering Factors", keywords: ["cold", "hot", "甜", "chewing", "eating東西", "irritation", "觸發"] },
        { id: "l1_pain_relieving_factors", label: "Relieving Factors", keywords: ["painkiller", "緩解", "eatingmedication", "好一點", "減輕"] },
        { id: "l1_pain_spontaneous_or_stimulated", label: "spontaneous/stimulated", keywords: ["自己", "spontaneous", "irritation", "碰到才", "no碰nopain", "隨時"] },
      ],
      red_flags: [
        { id: "night_pain", label: "Night Pain", keywords: ["晚upper", "半夜", "睡覺", "夜間", "pain醒"] },
        { id: "neurological_symptoms", label: "Neurological Symptoms", keywords: ["麻", "麻痺", "感覺abnormal", "嘴歪", "眼歪"] },
        { id: "rapid_worsening", label: "Rapid Worsening", keywords: ["sudden", "急", "很快", "progressivelysevere", "加劇"] },
      ]
    },
    oral_mucosal_lesion: {
      label: "口腔黏膜",
      detect_keywords: ["ulcer", "broken", "嘴broken", "canker sore", "vesicle", "leukoplakia", "erythroplakia", "黏膜"],
      items: [
        { id: "l1_oral_mucosal_lesion_duration", label: "Duration", keywords: ["how long", "days", "weeks"] },
        { id: "l1_oral_mucosal_lesion_recurrence", label: "Recurrence", keywords: ["recurrent", "復發", "常常", "ofanterior也yes"] },
        { id: "l1_oral_mucosal_lesion_number_of_lesions", label: "Number of Lesions", keywords: ["幾個", "一個", "multiple個", "很multiple"] },
        { id: "l1_oral_mucosal_lesion_site", label: "Lesion Site", keywords: ["where", "tongue", "buccal", "lip", "gingiva", "口底", "maxillary"] },
        { id: "l1_oral_mucosal_lesion_pain", label: "Pain Level", keywords: ["pain", "nopain", "會pain", "irritation"] },
        { id: "l1_oral_mucosal_lesion_healing_pattern", label: "Healing Pattern", keywords: ["好過", "自己好", "not healing", "越large"] },
        { id: "l1_oral_mucosal_lesion_systemic_symptoms", label: "Systemic Symptoms", keywords: ["fever", "倦怠", "體重", "joint"] },
        { id: "l1_oral_mucosal_lesion_drug_history", label: "Drug History", keywords: ["eatingmedication", "usemedication", "medicationmaterial", "服use"] },
        { id: "l1_oral_mucosal_lesion_immunocompromised_status", label: "Immune Status", keywords: ["immune", "HIV", "change療", "器官移植", "類固醇"] },
      ],
      red_flags: [
        { id: "non_healing_over_2_weeks", label: "超過兩週未癒", keywords: ["兩週", "2週", "not healing", "一個月", "很久no好"] },
        { id: "induration", label: "Induration", keywords: ["hard", "hard mass", "nodule"] },
        { id: "unexplained_bleeding", label: "no明bleeding", keywords: ["bleeding", "bleeding", "血"] },
      ]
    },
    swelling: {
      label: "Swelling",
      detect_keywords: ["swelling", "Swelling", "Mass", "swelling", "鼓起", "膨"],
      items: [
        { id: "l1_swelling_onset", label: "Onset", keywords: ["started", "when", "how long"] },
        { id: "l1_swelling_growth_rate", label: "Growth Rate", keywords: ["enlarging", "長large", "progressively", "快速", "慢慢"] },
        { id: "l1_swelling_pain", label: "Pain Level", keywords: ["pain", "tenderness", "nopain"] },
        { id: "l1_swelling_consistency", label: "Consistency", keywords: ["hard", "soft", "clicktype", "實心"] },
        { id: "l1_swelling_fluctuation", label: "Fluctuation", keywords: ["波動", "softsoft", "pus", "液體"] },
        { id: "l1_swelling_infection_signs", label: "Signs of Infection", keywords: ["red", "hot", "pus", "fever", "changepus"] },
        { id: "l1_swelling_trauma_history", label: "Trauma History", keywords: ["撞", "摔", "trauma", "受傷", "車禍"] },
      ],
      red_flags: [
        { id: "rapid_progression", label: "Rapid Progression", keywords: ["很快", "急速", "幾small時", "一days內"] },
        { id: "airway_symptoms", label: "Airway Symptoms", keywords: ["呼吸", "吞嚥", "喘", "suffocation"] },
        { id: "systemic_fever", label: "Systemic Fever", keywords: ["fever", "燒", "體溫"] },
      ]
    },
    xerostomia: {
      label: "dry mouth",
      detect_keywords: ["dry mouth", "乾", "唾液", "口渴", "noyes口水"],
      items: [
        { id: "l1_xerostomia_onset", label: "Onset", keywords: ["started", "when", "how long"] },
        { id: "l1_xerostomia_severity", label: "Severity", keywords: ["severe", "影響", "eating東西", "說話"] },
        { id: "l1_xerostomia_day_night_variation", label: "Day/Night Variation", keywords: ["whitedays", "晚upper", "睡覺", "早upper"] },
        { id: "l1_xerostomia_medication_history", label: "Drug History", keywords: ["eatingmedication", "medicationmaterial", "抗憂鬱", "降血壓"] },
        { id: "l1_xerostomia_autoimmune_disease_history", label: "Autoimmune Hx", keywords: ["autoimmune", "乾燥症", "SLE", "rheumatoid"] },
        { id: "l1_xerostomia_dry_eyes", label: "Dry Eyes", keywords: ["眼睛乾", "乾眼", "淚液"] },
        { id: "l1_xerostomia_salivary_gland_swelling", label: "Salivary Gland Swelling", keywords: ["腮腺", "唾液腺", "Swelling", "swelling"] },
      ],
      red_flags: [
        { id: "bilateral_gland_enlargement", label: "Bilateral Gland Enlargement", keywords: ["兩邊", "雙側", "both side"] },
        { id: "systemic_autoimmune_features", label: "autoimmune特徵", keywords: ["joint", "皮疹", "乾燥", "全身"] },
      ]
    },
    potentially_malignant_disorder: {
      label: "癌anterior病灶",
      detect_keywords: ["leukoplakia", "erythroplakia", "white色", "red色", "plaque", "懷疑", "癌", "pre-cancer"],
      items: [
        { id: "l1_potentially_malignant_disorder_duration", label: "Duration", keywords: ["how long", "days", "weeks", "幾個月"] },
        { id: "l1_potentially_malignant_disorder_change_over_time", label: "Change Over Time", keywords: ["enlarging", "discoloration", "change", "progressively"] },
        { id: "l1_potentially_malignant_disorder_pain", label: "Pain Level", keywords: ["pain", "nopain", "會pain"] },
        { id: "l1_potentially_malignant_disorder_smoking_history", label: "Smoking Hx", keywords: ["smoking", "smoking", "吸smoking", "戒smoking"] },
        { id: "l1_potentially_malignant_disorder_alcohol_use", label: "Alcohol Hx", keywords: ["alcohol", "喝alcohol", "飲alcohol"] },
        { id: "l1_potentially_malignant_disorder_local_irritation", label: "Local Irritation", keywords: ["denture", "銳邊", "磨", "irritation"] },
        { id: "l1_potentially_malignant_disorder_previous_biopsy", label: "Previous Biopsy", keywords: ["biopsy", "biopsy", "pathology"] },
      ],
      red_flags: [
        { id: "induration", label: "Induration", keywords: ["hard", "nodule", "hard mass"] },
        { id: "ulceration", label: "Ulceration", keywords: ["ulcer", "broken", "爛"] },
        { id: "rapid_change", label: "Rapid Change", keywords: ["sudden", "快速", "急"] },
      ]
    },
  },
  level_2: [
    { id: "l2_cardiovascular_disease", label: "CVD", keywords: ["心臟", "hypertension", "中風", "心血管", "血壓"] },
    { id: "l2_diabetes", label: "Diabetes", keywords: ["diabetes", "血糖", "DM", "胰島素"] },
    { id: "l2_immunological_disease", label: "Immunological Disease", keywords: ["immune", "autoimmune", "allergy", "erythroplakiatype狼瘡", "rheumatoid"] },
    { id: "l2_anticoagulant_use", label: "Anticoagulant", keywords: ["抗凝", "warfarin", "阿斯匹靈", "aspirin", "blood", "coagulation", "薄血"] },
    { id: "l2_bisphosphonate_use", label: "bisphosphonatesore鹽類", keywords: ["bisphosphonatesore", "bisphosphonate", "骨loose", "bone quality疏loose", "fosamax"] },
    { id: "l2_drug_allergy", label: "Drug Allergy", keywords: ["allergy", "Drug Allergy", "allergy", "青黴素", "盤尼西林"] },
  ]
};

const SopState = {
  collapsed: false,
  coverage: {},
  detectedModules: [],
  redFlagsDetected: [],
  nextQuestions: [],
  allTranscript: "",
};

function detectCCModules(text) {
  if (!text) return [];
  const t = text.replace(/\s+/g, "");
  const detected = [];
  const sopItems = activeSopItems || SOP_ITEMS;
  for (const [modKey, mod] of Object.entries(sopItems.level_1_modules)) {
    for (const kw of mod.detect_keywords) {
      if (t.includes(kw)) { detected.push(modKey); break; }
    }
  }
  return detected;
}

function scanSopLocal(text) {
  if (!text) return {};
  const t = text.replace(/\s+/g, "");
  const coverage = {};
  const sopItems = activeSopItems || SOP_ITEMS;
  for (const item of sopItems.level_0) {
    coverage[item.id] = item.keywords.some(kw => t.includes(kw)) ? "covered" : "missing";
  }
  const modules = detectCCModules(text);
  for (const modKey of modules) {
    const mod = sopItems.level_1_modules[modKey];
    if (!mod) continue;
    for (const item of mod.items) {
      coverage[item.id] = item.keywords.some(kw => t.includes(kw)) ? "covered" : "missing";
    }
  }
  for (const item of sopItems.level_2) {
    coverage[item.id] = item.keywords.some(kw => t.includes(kw)) ? "covered" : "missing";
  }
  return coverage;
}

function scanRedFlagsLocal(text, modules) {
  if (!text || !modules.length) return [];
  const t = text.replace(/\s+/g, "");
  const detected = [];
  for (const modKey of modules) {
    const sopItems = activeSopItems || SOP_ITEMS;
    const mod = sopItems.level_1_modules[modKey];
    if (!mod || !mod.red_flags) continue;
    for (const rf of mod.red_flags) {
      if (rf.keywords.some(kw => t.includes(kw))) detected.push(rf.id);
    }
  }
  return detected;
}

function renderSopPanel() {
  const coverage = SopState.coverage;
  const modules = SopState.detectedModules;

  const l0 = $("sopL0Items"); l0.innerHTML = "";
  const sopItems = activeSopItems || SOP_ITEMS;
  for (const item of sopItems.level_0) l0.appendChild(makeSopPill(item, coverage[item.id] || "missing"));

  const l1c = $("sopL1Items"); const l1s = $("sopL1Section"); const l1l = $("sopDetectedCC");
  l1c.innerHTML = "";
  if (modules.length > 0) {
    l1s.style.display = "";
    l1l.textContent = modules.map(m => sopItems.level_1_modules[m]?.label || m).join(" + ");
    for (const modKey of modules) {
      const mod = sopItems.level_1_modules[modKey];
      if (!mod) continue;
      for (const item of mod.items) l1c.appendChild(makeSopPill(item, coverage[item.id] || "missing"));
    }
  } else {
    l1s.style.display = "";
    l1l.textContent = "等待Chief Complaint…";
  }

  const l2c = $("sopL2Items"); l2c.innerHTML = "";
  for (const item of sopItems.level_2) l2c.appendChild(makeSopPill(item, coverage[item.id] || "missing"));

  const rfc = $("sopRedFlags"); const rfs = $("sopRFSection"); rfc.innerHTML = "";
  if (SopState.redFlagsDetected.length > 0) {
    rfs.style.display = "";
    for (const rfId of SopState.redFlagsDetected) {
      let label = rfId;
      for (const mod of Object.values(sopItems.level_1_modules)) {
        const found = (mod.red_flags || []).find(r => r.id === rfId);
        if (found) { label = found.label; break; }
      }
      const pill = document.createElement("span");
      pill.className = "sop-item red-flag";
      pill.innerHTML = `<span class="sop-item-icon">🚨</span>${label}`;
      rfc.appendChild(pill);
    }
  } else { rfs.style.display = "none"; }

  updateSopProgress();
}

function makeSopPill(item, status) {
  const pill = document.createElement("span");
  pill.className = `sop-item ${status}`;
  pill.title = item.id;
  const icon = status === "covered" ? "✅" : status === "partial" ? "🔶" : "⬜";
  pill.innerHTML = `<span class="sop-item-icon">${icon}</span>${item.label}`;
  return pill;
}

function updateSopProgress() {
  const coverage = SopState.coverage;
  const total = Object.keys(coverage).length;
  const covered = Object.values(coverage).filter(s => s === "covered").length;
  const partial = Object.values(coverage).filter(s => s === "partial").length;
  const chip = $("sopProgress");
  chip.textContent = `${covered + partial} / ${total}`;
  chip.classList.remove("good", "mid", "low");
  const ratio = total > 0 ? (covered + partial) / total : 0;
  if (ratio >= 0.7) chip.classList.add("good");
  else if (ratio >= 0.3) chip.classList.add("mid");
  else chip.classList.add("low");
}

$("sopPanelToggle").onclick = () => {
  SopState.collapsed = !SopState.collapsed;
  $("sopPanel").classList.toggle("collapsed", SopState.collapsed);
};

function buildSopAwareReminder(sopResult) {
  const lines = ["Updated SOAP ✅"];
  if (sopResult && sopResult.next_questions && sopResult.next_questions.length > 0) {
    lines.push("");
    lines.push("📋 SOP reminder — 建議接lower來確認：");
    for (const q of sopResult.next_questions.slice(0, 5)) lines.push(`• ${q}`);
  }
  const missing = getMissingFields(4);
  if (missing.length > 0) {
    lines.push("");
    lines.push("📝 SOAP 還缺：");
    for (const key of missing) lines.push(`- ${(ACTIVE_FIELD_LABELS || FIELD_LABELS)[key] || key}`);
  }
  if (!sopResult?.next_questions?.length && !missing.length) {
    lines.push("itemanterior欄位看起來都done經填齊了 ✅");
  }
  return lines.join("\n");
}

async function runSopCheckLLM(caseId) {
  try {
    log("SOP: calling /sop_check...");
    const res = await fetch(`/cases/${caseId}/sop_check`, { method: "POST" });
    const data = await res.json();
    if (data.ok && data.items) {
      for (const [itemId, info] of Object.entries(data.items)) {
        if (info && info.status) SopState.coverage[itemId] = info.status;
      }
    }
    if (data.detected_modules && data.detected_modules.length > 0) SopState.detectedModules = data.detected_modules;
    if (data.red_flags_detected) {
      const merged = new Set([...SopState.redFlagsDetected, ...data.red_flags_detected]);
      SopState.redFlagsDetected = [...merged];
    }
    if (data.next_questions) SopState.nextQuestions = data.next_questions;
    renderSopPanel();
    return data;
  } catch (e) {
    log("SOP check error: " + e.message);
    return null;
  }
}

function updateSopLocal(text) {
  SopState.allTranscript += "\n" + text;
  const modules = detectCCModules(SopState.allTranscript);
  if (modules.length > 0) SopState.detectedModules = modules;
  const localCoverage = scanSopLocal(SopState.allTranscript);
  for (const [id, status] of Object.entries(localCoverage)) {
    if (SopState.coverage[id] === "covered") continue;
    SopState.coverage[id] = status;
  }
  const localRF = scanRedFlagsLocal(SopState.allTranscript, SopState.detectedModules);
  if (localRF.length > 0) {
    const merged = new Set([...SopState.redFlagsDetected, ...localRF]);
    SopState.redFlagsDetected = [...merged];
  }
  renderSopPanel();
}

function initSopPanel() {
  const sopItems = activeSopItems || SOP_ITEMS;
  for (const item of sopItems.level_0) SopState.coverage[item.id] = "missing";
  for (const item of sopItems.level_2) SopState.coverage[item.id] = "missing";
  renderSopPanel();
}


/** ======================================================
 *  Event Wiring
 *  ====================================================== */

// Create case
$("btnCreateCase").onclick = async () => {
  try {
    const res = await fetch("/cases", { method: "POST" });
    const data = await res.json();
    setCaseId(data.id);
    log(`Case created: ${data.id}`);
    addMessage({ role: "ai", text: `Case #${data.id} done建立 ✅\n可以started問診了。` });
    UI.setState("idle");
    $("caseIdInput").disabled = false;
  } catch (e) {
    log("Create case error: " + e.message);
  }
};

// Manual case ID change
$("caseIdInput").addEventListener("change", () => {
  const v = parseInt($("caseIdInput").value);
  if (!isNaN(v) && v > 0) {
    setCaseId(v);
    log("Case ID manually set to " + v);
    refreshVersionsSafe();
  }
});

// Send message
$("mainBtn").onclick = () => {
  const mode = $("composerPill").dataset.mode;
  if (mode === "text") {
    if ($("messageInput").value.trim()) onSend();
    else startRecording();
  } else if (mode === "recording") {
    stopRecording();
  }
};

$("micBtn").onclick = () => startRecording();
$("recCancelBtn").onclick = () => cancelRecording();
$("recOkBtn").onclick = () => confirmRecording();

// Enter to send
$("messageInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
});
$("messageInput").addEventListener("input", () => autosizeInput());

// Load version
$("btnLoadVersion").onclick = async () => {
  const vid = $("versionSelect").value;
  if (!vid) return;
  try {
    const res = await fetch(`/cases/soap_versions/${vid}`);
    const data = await res.json();
    if (data.rendered_text) {
      const parsed = parseRenderedTextToFields(data.rendered_text);
      if (parsed) fillSoapFields(parsed, "load_version");
    }
    log(`Loaded version ${vid}`);
  } catch (e) {
    log("Load version error: " + e.message);
  }
};

$("btnRefreshVersions").onclick = () => refreshVersionsSafe();

// Open clean editor UI
$("btnOpenCleanUI").onclick = () => {
  const caseId = getCaseId();
  if (caseId) window.open(`/cases/${caseId}/ui`, "_blank");
  else addMessage({ role: "ai", text: "⚠️ Please create first Case。" });
};

// Open latest audio
$("btnOpenLatestAudio").onclick = () => {
  const caseId = getCaseId();
  if (caseId) window.open(`/cases/${caseId}/audio/latest`, "_blank");
  else addMessage({ role: "ai", text: "⚠️ Please create first Case。" });
};

// Demo reset — two-click safety (no confirm dialog)
{
  const resetBtn = $("btnDemoReset");
  let armed = false;
  let armTimer = null;

  resetBtn.onclick = async () => {
    if (!armed) {
      // First click: arm the button
      armed = true;
      resetBtn.textContent = "確認重置?";
      resetBtn.classList.add("armed");
      armTimer = setTimeout(() => {
        armed = false;
        resetBtn.textContent = "Demo Reset";
        resetBtn.classList.remove("armed");
      }, 3000);
      return;
    }

    // Second click: perform reset
    clearTimeout(armTimer);
    armed = false;
    resetBtn.textContent = "重置中…";
    resetBtn.disabled = true;

    try {
      const res = await fetch("/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET" }),
      });
      const data = await res.json();
      log("Demo reset: " + JSON.stringify(data));

      if (data.ok) {
        // Full page reload to guarantee a clean slate
        window.location.reload();
      } else {
        resetBtn.textContent = "Demo Reset";
        resetBtn.disabled = false;
        addMessage({ role: "ai", text: "⚠️ Demo Reset 失敗: " + (data.detail || data.message || "unknown error") });
      }
    } catch (e) {
      log("Demo reset error: " + e.message);
      resetBtn.textContent = "Demo Reset";
      resetBtn.disabled = false;
      addMessage({ role: "ai", text: "⚠️ Demo Reset 發生錯誤: " + e.message });
    }
  };
}

// Debug toggle
$("btnToggleDebug").onclick = () => {
  $("debugDrawer").classList.toggle("hidden");
};
$("btnClearDebug").onclick = () => { $("debug").textContent = ""; };
$("btnCloseDebug").onclick = () => { $("debugDrawer").classList.add("hidden"); };


/** ======================================================
 *  Live Streaming Module
 *  ====================================================== */

const LiveState = {
  ws: null,
  stream: null,
  audioCtx: null,
  processor: null,
  timerInterval: null,
  startTime: null,
  segments: [],
  interimEl: null,
  speakers: {},  // { "0": "doctor", "1": "patient" }
};

function startLiveStream() {
  const caseId = getCaseId();
  if (!caseId) {
    addMessage({ role: "ai", text: "⚠️ Please create first Case 再started Live。" });
    return;
  }

  log("Live: starting stream...");
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${location.host}/ws/stream/${caseId}`;

  const ws = new WebSocket(wsUrl);
  LiveState.ws = ws;
  LiveState.segments = [];
  LiveState.speakers = {};
  LiveState.interimEl = null;

  ws.onopen = () => {
    log("Live: WS connected");
  };

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);

    if (data.type === "status" && data.message === "connected") {
      log("Live: Deepgram connected, starting mic");
      startMicCapture();
      showLivePanel(true);
    }

    if (data.type === "transcript") {
      renderLiveSegment(data);
      // Track speakers
      if (data.speaker && !LiveState.speakers[data.speaker]) {
        LiveState.speakers[data.speaker] = data.role || "unknown";
        renderSpeakerChips();
      }
    }

    if (data.type === "role_updated") {
      LiveState.speakers[data.speaker] = data.role;
      renderSpeakerChips();
      // Update existing segments
      $("liveTranscript").querySelectorAll(`.live-seg[data-speaker="${data.speaker}"]`).forEach(el => {
        const label = el.querySelector(".live-seg-speaker");
        label.textContent = data.role === "doctor" ? "🩺" : "🗣️";
        label.className = `live-seg-speaker ${data.role}`;
      });
    }

    if (data.type === "done") {
      log(`Live: done, ${data.segment_count} segments`);
      stopLiveStream(false);

      // Put transcript into SOP and trigger SOAP
      if (data.transcript) {
        SopState.allTranscript += "\n" + data.transcript;
        updateSopLocal(data.transcript);
        addMessage({ role: "ai", text: `✅ Live 錄音完成（${data.segment_count} 段）\n正在生成 SOAP…` });
        // Auto trigger SOAP
        onSoapAfterLive(caseId);
      }
    }

    if (data.type === "error") {
      log("Live error: " + data.message);
      addMessage({ role: "ai", text: "⚠️ Live 錯誤: " + data.message });
      stopLiveStream(false);
    }
  };

  ws.onerror = (err) => {
    log("Live: WS error: " + err);
    addMessage({ role: "ai", text: "⚠️ WebSocket 連線錯誤。" });
    stopLiveStream(false);
  };

  ws.onclose = () => {
    log("Live: WS closed");
  };
}

async function startMicCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, sampleRate: 16000 }
    });
    LiveState.stream = stream;

    const audioCtx = new AudioContext({ sampleRate: 16000 });
    LiveState.audioCtx = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    // Use ScriptProcessorNode to get raw PCM data
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    LiveState.processor = processor;

    processor.onaudioprocess = (e) => {
      if (LiveState.ws && LiveState.ws.readyState === WebSocket.OPEN) {
        const float32 = e.inputBuffer.getChannelData(0);
        // Convert float32 to int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        LiveState.ws.send(int16.buffer);
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);

    // Start timer
    LiveState.startTime = Date.now();
    LiveState.timerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - LiveState.startTime) / 1000);
      const mm = String(Math.floor(sec / 60)).padStart(2, "0");
      const ss = String(sec % 60).padStart(2, "0");
      $("liveTimer").textContent = `${mm}:${ss}`;
    }, 500);

    log("Live: mic capturing PCM16 @ 16kHz");
  } catch (err) {
    log("Live: mic error: " + err.message);
    addMessage({ role: "ai", text: "⚠️ none法取得麥克風: " + err.message });
    stopLiveStream(false);
  }
}

function stopLiveStream(sendStop = true) {
  // Send STOP to server
  if (sendStop && LiveState.ws && LiveState.ws.readyState === WebSocket.OPEN) {
    LiveState.ws.send("STOP");
  }

  // Stop mic
  if (LiveState.processor) {
    LiveState.processor.disconnect();
    LiveState.processor = null;
  }
  if (LiveState.audioCtx) {
    LiveState.audioCtx.close().catch(() => { });
    LiveState.audioCtx = null;
  }
  if (LiveState.stream) {
    LiveState.stream.getTracks().forEach(t => t.stop());
    LiveState.stream = null;
  }

  clearInterval(LiveState.timerInterval);

  // Don't hide panel immediately if sendStop=true (wait for "done" message)
  if (!sendStop) {
    showLivePanel(false);
  }
}

function showLivePanel(show) {
  $("livePanel").classList.toggle("hidden", !show);
  $("btnLiveStream").disabled = show;

  if (show) {
    $("liveTranscript").innerHTML = '<div class="live-seg"><span class="live-seg-text" style="color:rgba(0,0,0,0.4)">等待語音輸入…</span></div>';
    $("liveSpeakers").innerHTML = "";
    $("liveTimer").textContent = "00:00";
  }
}

function renderLiveSegment(data) {
  const container = $("liveTranscript");
  const roleLabel = data.role === "doctor" ? "🩺" : "🗣️";
  const roleClass = data.role === "doctor" ? "doctor" : "patient";

  if (data.is_final) {
    // Remove interim element if exists
    if (LiveState.interimEl) {
      LiveState.interimEl.remove();
      LiveState.interimEl = null;
    }
    // Remove "waiting" placeholder
    const placeholder = container.querySelector('.live-seg-text[style]');
    if (placeholder) placeholder.parentElement.remove();

    const div = document.createElement("div");
    div.className = "live-seg";
    div.dataset.speaker = data.speaker;
    div.innerHTML = `<span class="live-seg-speaker ${roleClass}">${roleLabel}</span><span class="live-seg-text">${data.text}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  } else {
    // Interim result — update or create interim element
    if (!LiveState.interimEl) {
      LiveState.interimEl = document.createElement("div");
      LiveState.interimEl.className = "live-seg interim";
      container.appendChild(LiveState.interimEl);
    }
    LiveState.interimEl.innerHTML = `<span class="live-seg-speaker ${roleClass}">${roleLabel}</span><span class="live-seg-text">${data.text}</span>`;
    container.scrollTop = container.scrollHeight;
  }
}

function renderSpeakerChips() {
  const container = $("liveSpeakers");
  container.innerHTML = "";
  for (const [speaker, role] of Object.entries(LiveState.speakers)) {
    const chip = document.createElement("span");
    chip.className = `live-speaker-chip ${role}`;
    const icon = role === "doctor" ? "🩺" : "🗣️";
    chip.innerHTML = `${icon} Speaker ${speaker} = <b>${role}</b>`;
    chip.title = "Click to toggle role";
    chip.onclick = () => toggleSpeakerRole(speaker);
    container.appendChild(chip);
  }
}

function toggleSpeakerRole(speaker) {
  const current = LiveState.speakers[speaker];
  const newRole = current === "doctor" ? "patient" : "doctor";
  LiveState.speakers[speaker] = newRole;
  renderSpeakerChips();

  // Send to server
  if (LiveState.ws && LiveState.ws.readyState === WebSocket.OPEN) {
    LiveState.ws.send(JSON.stringify({
      action: "set_speaker_role",
      speaker: speaker,
      role: newRole,
    }));
  }
}

async function onSoapAfterLive(caseId) {
  UI.setSoapBusy(true);
  showTyping("AI 正在生成 SOAP…");
  try {
    const soapRes = await fetch(`/cases/${caseId}/soap_versions`, { method: "POST" }).then(r => r.json());
    hideTyping();
    if (soapRes.rendered_text) {
      const parsed = parseRenderedTextToFields(soapRes.rendered_text);
      if (parsed) fillSoapFields(parsed, "live_soap");
    }
    addMessage({ role: "ai", text: buildReminderMessage() });
    await refreshVersionsSafe();
  } catch (e) {
    log("SOAP after live error: " + e.message);
    hideTyping();
    addMessage({ role: "ai", text: "⚠️ SOAP 生成失敗: " + e.message });
  }
  UI.setSoapBusy(false);
}

// Wire buttons
$("btnLiveStream").onclick = () => startLiveStream();
$("btnStopLive").onclick = () => stopLiveStream(true);


/** ======================================================
 *  Init
 *  ====================================================== */
initSopPanel();
autosizeInput();
log("Gamma v2 loaded.");

