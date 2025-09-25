@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.example.ambulancedesign.pediatrics

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.widget.ImageButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.edit
import com.example.ambulancedesign.MainActivity
import com.example.ambulancedesign.R
import com.example.ambulancedesign.calculations.Calculator
import com.example.ambulancedesign.calculations.PediatricsInfusionActivity
import java.math.RoundingMode
import java.text.DecimalFormat
import java.util.Locale

/* ---------- Global constants ---------- */

// Single consistent accent for Dose text
private val DOSE_ACCENT: ComposeColor = ComposeColor(0xFF0068FA)

// Hardcoded title color for the drug name in the sheet/dialog
private val SHEET_TITLE_COLOR = androidx.compose.ui.graphics.Color(0xFF0368FF)

// Indication value color (red)
private val INDICATION_VALUE_COLOR = androidx.compose.ui.graphics.Color(0xFFD32F2F)



private data class DrugRes(val name: String, @androidx.annotation.ColorRes val resId: Int)

private val DRUGS_RES: List<DrugRes> = listOf(
    DrugRes("Adenosine",           R.color.adenosine),
    DrugRes("Adrenaline",          R.color.adrenaline),
    DrugRes("Amiodarone",          R.color.amiodarone),
    DrugRes("Atropine",            R.color.atropin),
    DrugRes("Dexamethasone",       R.color.dexa),
    DrugRes("Dextrose 10%",        R.color.dextrose),
    DrugRes("Diphenhydramine",     R.color.diphen),
    DrugRes("Droperidol",          R.color.droperidol),
    DrugRes("Fentanyl",            R.color.fentanyl),
    DrugRes("Glucagon",            R.color.glucagone),
    DrugRes("Hydrocortison",       R.color.hydro),
    DrugRes("Ipratropium Bromide", R.color.atrovent),
    DrugRes("Ketamine",            R.color.ketamine),
    DrugRes("Magnesium Sulphate",  R.color.mag),
    DrugRes("Midazolam",           R.color.midaz),
    DrugRes("Naloxone",            R.color.naloxone),
    DrugRes("Ondansetron",         R.color.ondansetron),
    DrugRes("Paracetamol",         R.color.paracetamol),
    DrugRes("Rocuronium",          R.color.roc),
    DrugRes("Salbutamol",          R.color.salbutamol),
    DrugRes("TXA",                 R.color.txa)
).sortedBy { it.name }



class CcpYears : AppCompatActivity() {

    // Force English
    override fun attachBaseContext(newBase: Context) {
        val locale = Locale("en")
        Locale.setDefault(locale)
        val config = Configuration().apply { setLocale(locale) }
        super.attachBaseContext(newBase.createConfigurationContext(config))
    }

    @Immutable
    data class DrugUiPainted(val name: String, val bg: ComposeColor, val content: ComposeColor)

    @Immutable
    data class DrugSection(
        val indication: String,
        val dose: String,
        val route: String,
        val notes: String? = null
    )

    @Immutable
    data class DrugSheetContent(
        val header: String? = null,
        val sections: List<DrugSection> = emptyList()
    )

    @SuppressLint("SourceLockedOrientationActivity")
    override fun onCreate(savedInstanceState: Bundle?) {
        val t0 = SystemClock.uptimeMillis()

        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        window.statusBarColor = 0xC3A8ABBA.toInt()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ccp_years_compose)
        Log.d("CcpYearsPerf", "XML inflated in ${SystemClock.uptimeMillis() - t0} ms")

        // Toolbar buttons
        findViewById<ImageButton>(R.id.homeImgBtn)?.setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java))
        }
        val composeHost = findViewById<ComposeView>(R.id.drugGridCompose)
        requireNotNull(composeHost) { "drugGridCompose not found in activity_ccp_years_compose.xml" }

        composeHost.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)

        val tSetContentStart = SystemClock.uptimeMillis()
        composeHost.setContent {
            LaunchedEffect(Unit) {
                Log.d("CcpYearsPerf", "First composition reached in ${SystemClock.uptimeMillis() - tSetContentStart} ms")
            }
            MaterialTheme {
                val ctx = LocalContext.current

                var ageText by remember { mutableStateOf("") }
                var weightText by remember { mutableStateOf("") }

                var selected by remember { mutableStateOf<DrugUiPainted?>(null) }
                var showSheet by remember { mutableStateOf(false) }
                var sheetContent by remember { mutableStateOf<DrugSheetContent?>(null) }
                var titleColor by remember { mutableStateOf(ComposeColor.Unspecified) }

                val drugs = remember {
                    DRUGS_RES.map { (name, resId) ->
                        val bg = androidx.compose.ui.graphics.Color(
                            androidx.core.content.ContextCompat.getColor(ctx, resId)
                        )
                        val content = if (bg.luminance() < 0.5f) androidx.compose.ui.graphics.Color.White
                        else androidx.compose.ui.graphics.Color.Black
                        CcpYears.DrugUiPainted(name = name, bg = bg, content = content)
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp)
                ) {
                    // Inputs
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = ageText,
                            onValueChange = {
                                ageText = it.filter { ch -> ch.isDigit() }
                                if (ageText.isNotEmpty()) weightText = ""
                            },
                            label = { Text("Age (years)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier
                                .weight(1f)
                                .onFocusChanged { f -> if (f.isFocused) weightText = "" }
                        )
                        Text("OR", fontSize = 16.sp)
                        OutlinedTextField(
                            value = weightText,
                            onValueChange = {
                                weightText = it.filter { ch -> ch.isDigit() }
                                if (weightText.isNotEmpty()) ageText = ""
                            },
                            label = { Text("Weight (kg)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier
                                .weight(1f)
                                .onFocusChanged { f -> if (f.isFocused) ageText = "" }
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    var laidOutOnce by remember { mutableStateOf(false) }
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        contentPadding = PaddingValues(4.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxSize()
                            .onGloballyPositioned {
                                if (!laidOutOnce) {
                                    laidOutOnce = true
                                    Log.d("CcpYearsPerf", "Grid first laid out on screen")
                                }
                            }
                    ) {
                        items(items = drugs, key = { it.name }) { drug ->
                            Button(
                                onClick = {
                                    val ageFilled = ageText.isNotEmpty()
                                    val weightFilled = weightText.isNotEmpty()
                                    if (ageFilled && weightFilled) {
                                        Toast.makeText(ctx, "Please fill only one field: Age or Weight.", Toast.LENGTH_SHORT).show(); return@Button
                                    }
                                    if (!ageFilled && !weightFilled) {
                                        Toast.makeText(ctx, "Please enter Age or Weight.", Toast.LENGTH_SHORT).show(); return@Button
                                    }

                                    selected = drug
                                    titleColor = drug.bg
                                    sheetContent = when (drug.name) {
                                        "Adenosine"           -> buildAdenosineContent(ageText, weightText)
                                        "Adrenaline"          -> buildAdrenalineContent(ageText, weightText)
                                        "Amiodarone"          -> buildAmiodaroneContent(ageText, weightText)
                                        "Atropine"            -> buildAtropineContent(ageText, weightText)
                                        "Dexamethasone"       -> buildDexamethasoneContent(ageText, weightText)
                                        "Dextrose 10%"        -> buildDextrose10Content(ageText, weightText)
                                        "Diphenhydramine"     -> buildDiphenhydramineContent(ageText, weightText)
                                        "Droperidol"          -> buildDroperidolContent(ageText, weightText)
                                        "Fentanyl"            -> buildFentanylContent(ageText, weightText)
                                        "Glucagon"            -> buildGlucagonContent(ageText, weightText)
                                        "Hydrocortison"       -> buildHydrocortisonContent(ageText, weightText)
                                        "Ipratropium Bromide" -> buildIpratropiumBromideContent(ageText, weightText)
                                        "Ketamine"            -> buildKetamineContent(ageText, weightText)
                                        "Magnesium Sulphate"  -> buildMagnesiumSulphateContent(ageText, weightText)
                                        "Midazolam"           -> buildMidazolamContent(ageText, weightText)
                                        "Naloxone"            -> buildNaloxoneContent(ageText, weightText)
                                        "Ondansetron"         -> buildOndansetronContent(ageText, weightText)
                                        "Paracetamol"         -> buildParacetamolContent(ageText, weightText)
                                        "Rocuronium"          -> buildRocuroniumContent(ageText, weightText)
                                        "Salbutamol"          -> buildSalbutamolContent(ageText, weightText)
                                        "TXA"                 -> buildTXAContent(ageText, weightText)
                                        else                  -> null
                                    }
                                    showSheet = sheetContent != null
                                },
                                modifier = Modifier.height(48.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = drug.bg,
                                    contentColor = drug.content
                                ),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    drug.name,
                                    fontSize = 12.sp,
                                    lineHeight = 14.sp,
                                    maxLines = 2,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Divider across the grid
                        item(span = { GridItemSpan(maxLineSpan) }) {
                            Divider(thickness = 1.dp)
                            Spacer(Modifier.height(4.dp))
                        }

                        // WAAFELSS
                        item {
                            val bg = ComposeColor(0xFFADAEAE)
                            Button(
                                onClick = {
                                    val ageFilled = ageText.isNotEmpty()
                                    val weightFilled = weightText.isNotEmpty()

                                    if (ageFilled && weightFilled) {
                                        Toast.makeText(ctx, "Please fill only one field: Age or Weight.", Toast.LENGTH_SHORT).show()
                                        return@Button
                                    }
                                    if (!ageFilled && !weightFilled) {
                                        Toast.makeText(ctx, "Please enter Age or Weight.", Toast.LENGTH_SHORT).show()
                                        return@Button
                                    }

                                    // “Open sheet” path — no editing of fields
                                    val content = buildWAAFELSSContent(ageText, weightText)

                                    selected = CcpYears.DrugUiPainted(
                                        name = "WAAFELSS",
                                        bg = bg,
                                        content = ComposeColor.Black
                                    )
                                    titleColor = SHEET_TITLE_COLOR   // hardcoded title color
                                    sheetContent = content
                                    showSheet = true
                                },
                                modifier = Modifier.height(48.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = bg,
                                    contentColor = ComposeColor.Black
                                ),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text("WAAFELSS", fontSize = 12.sp, textAlign = TextAlign.Center)
                            }
                        }


                        // Calculate (opens Calculator activity)
                        item {
                            val bg = ComposeColor(0xFF1F53D6)
                            Button(
                                onClick = { ctx.startActivity(Intent(ctx, Calculator::class.java)) },
                                modifier = Modifier.height(48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = bg, contentColor = ComposeColor.White),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                            ) { Text("Calculate", fontSize = 12.sp, textAlign = TextAlign.Center) }
                        }

                        // Infusions
                        item {
                            val bg = ComposeColor(0xC3A8ABBA) // matches your toolbar color
                            Button(
                                onClick = { ctx.startActivity(Intent(ctx, PediatricsInfusionActivity::class.java)) },
                                modifier = Modifier.height(48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = bg, contentColor = ComposeColor.Black),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                            ) { Text("Infusions", fontSize = 12.sp, textAlign = TextAlign.Center) }
                        }
                    }

                    // Bottom sheet (use the sheet again, not the dialog)
                    if (showSheet && selected != null && sheetContent != null) {
                        DrugResultSheet(
                            title = selected!!.name,
                            titleColor = SHEET_TITLE_COLOR,
                            content = sheetContent!!,
                            onViewFormulary = {
                                val drugKey = when (selected?.name) {
                                    "Adenosine"           -> "adenosine"
                                    "Adrenaline"          -> "adrenaline"
                                    "Amiodarone"          -> "amiodarone"
                                    "Atropine"            -> "atropine"
                                    "Dexamethasone"       -> "dexamethasone"
                                    "Dextrose 10%"        -> "dextrose"
                                    "Diphenhydramine"     -> "diphenhydramine"
                                    "Droperidol"          -> "droperidol"
                                    "Fentanyl"            -> "fentanyl"
                                    "Glucagon"            -> "glucagon"
                                    "Hydrocortison"       -> "hydrocortison"
                                    "Ipratropium Bromide" -> "ipratropium"
                                    "Ketamine"            -> "ketamine"
                                    "Magnesium Sulphate"  -> "magsulph"
                                    "Midazolam"           -> "midazolam"
                                    "Naloxone"            -> "naloxone"
                                    "Ondansetron"         -> "ondansetron"
                                    "Paracetamol"         -> "paracetamol"
                                    "Rocuronium"          -> "rocuronium"
                                    "Salbutamol"          -> "salbutamol"
                                    "TXA"                 -> "txa"
                                    "WAAFELSS"            -> "waafelss"
                                    else -> null
                                }

                                ctx.getSharedPreferences("searchSavedPref", Context.MODE_PRIVATE)
                                    .edit { putString("searchedItem", drugKey) }
                                ctx.startActivity(Intent(ctx, formularyActivity::class.java))
                            },
                            onClose = { showSheet = false; selected = null; sheetContent = null }
                        )
                    }
                }
            }
        }
    }
}

/* ===================== Helpers used by your buildXContent(...) fns ===================== */

private val DoseFormat: DecimalFormat = DecimalFormat("#.##").apply {
    roundingMode = RoundingMode.CEILING
}
// show “123” if whole number, or “12.34” if not
private fun fmt(x: Double): String =
    if (kotlin.math.abs(x - x.toLong()) < 1e-9) x.toLong().toString() else DoseFormat.format(x)

/**
 * Resolves weight from age or weight input and returns Pair(weight, headerText).
 * - Age 1–5: weight = age*2 + 8
 * - Age 6–14: weight = age*3 + 7
 * - Weight path: validates <10 and >49 with your original messages
 */
private fun resolveWeightWithHeader(ageText: String, weightText: String): Pair<Int, String>? {
    return if (ageText.isNotEmpty()) {
        val age = ageText.toInt()
        when {
            age <= 5 -> {
                val w = age * 2 + 8
                w to "Patient estimated weight is $w kg."
            }
            age in 6..14 -> {
                val w = age * 3 + 7
                w to "Patient estimated weight is $w kg."
            }
            else -> null
        }
    } else if (weightText.isNotEmpty()) {
        val w = weightText.toInt()
        val minWeight = 1 * 2 + 8   // 10
        val maxWeight = 14 * 3 + 7  // 49
        when {
            w < minWeight -> w to "The weight entered ($w kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg."
            w > maxWeight -> w to "The weight entered ($w kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg."
            else -> w to "Patient weight is $w kg."
        }
    } else null
}

/* ===================== Result Sheet & Section rendering ===================== */

/* ===================== Bottom Sheet (scrollable) ===================== */

@Composable
private fun DrugResultSheet(title: String, titleColor: ComposeColor, content: CcpYears.DrugSheetContent, onViewFormulary: () -> Unit, onClose: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onClose,
        sheetState = sheetState
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // TOP ACTIONS
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onViewFormulary,
                        modifier = Modifier.weight(1f)
                    ) { Text("View Formulary") }

                    OutlinedButton(onClick = onClose) { Text("Close") }
                }
                Spacer(Modifier.height(6.dp))
                Divider()
            }

            // TITLE
            // TITLE
            item {
                Text(
                    text = title,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor
                )
            }


            // HEADER LINE (weight info / validation message)
            if (!content.header.isNullOrBlank()) {
                item {
                    Text(
                        text = content.header,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        fontStyle = FontStyle.Italic,
                        color = ComposeColor(0xFF000000)
                    )
                }
            }

            // SECTIONS
            items(content.sections.size) { idx ->
                val s = content.sections[idx]
                SectionBlock(
                    s = s,
                    kvMode = title.equals("WAAFELSS", ignoreCase = true)
                )
                if (idx != content.sections.lastIndex) {
                    Spacer(Modifier.height(4.dp))
                    Divider()
                }
            }

            // BOTTOM ACTIONS
            item {
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onViewFormulary,
                        modifier = Modifier.weight(1f)
                    ) { Text("View Formulary") }

                    OutlinedButton(onClick = onClose) { Text("Close") }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}


@Composable
private fun SectionBlock(s: CcpYears.DrugSection, kvMode: Boolean) {
    if (kvMode) {
        // WAAFELSS: show label (from s.indication) then value (from s.dose)
        if (s.indication.isNotBlank() && s.indication != "—") {
            Text(
                text = s.indication, // acts as the label e.g. "Weight", "SGA", "Energy"
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }
        if (s.dose.isNotBlank() && s.dose != "—") {
            Text(
                text = s.dose,       // the value
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                color = DOSE_ACCENT
            )
        }
        if (!s.notes.isNullOrBlank()) {
            Spacer(Modifier.height(8.dp))
            Text(s.notes!!, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(12.dp))
        return
    }

    // ===== Default (non-WAAFELSS) drug rendering =====
    if (s.indication.isNotBlank() && s.indication != "—") {
        Text(
            text = "Indication",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = s.indication,
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = INDICATION_VALUE_COLOR // RED as requested earlier
        )
        Spacer(Modifier.height(12.dp))
    }

    if (s.dose.isNotBlank() && s.dose != "—") {
        Text(
            text = "Dose",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = s.dose,
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = DOSE_ACCENT
        )
        Spacer(Modifier.height(12.dp))
    }

    if (s.route.isNotBlank() && s.route != "—") {
        Text(
            text = "Route",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
        Text(s.route, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(12.dp))
    }

    if (!s.notes.isNullOrBlank()) {
        Text(
            text = "Notes",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
        Text(s.notes!!, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(12.dp))
    }
}



@Composable
private fun LabelDose(dose: String) {
    Text("Dose", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
    Text(
        text = dose,
        fontSize = 20.sp,
        fontWeight = FontWeight.ExtraBold,
        color = DOSE_ACCENT
    )
    Spacer(Modifier.height(12.dp))
}

/* ===================== Paste your buildXContent(...) functions BELOW ===================== */


private fun buildAdenosineContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary icon for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your original pediatric-range checks for the direct weight path
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        val dose1 = w * 0.1
        val dose2 = w * 0.2

        CcpYears.DrugSheetContent(
            header = header, // "Patient estimated weight is ... kg." OR "Patient weight is ... kg."
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "SVT – First Dose",
                    dose = "${fmt(dose1)} mg",
                    route = "IV/IO",
                    notes = "MAX dose of 6mg (Undiluted 6mg per 2ml).\nRef.Dose Calculation: ${w}kg x 0.1mg"
                ),
                CcpYears.DrugSection(
                    indication = "SVT – Second Dose",
                    dose = "${fmt(dose2)} mg",
                    route = "IV/IO",
                    notes = "MAX dose of 12mg (Undiluted 6mg per 2ml).\nRef.Dose Calculation: ${w}kg x 0.2mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildAdrenalineContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your original pediatric-range checks for the direct weight path
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Calculations (match your original)
        val cardiacArrestMg   = fmt(w * 0.01)
        val bradycardiaMcg    = fmt(w * 1.0)
        val inotropeMinMcgMin = fmt(w * 0.05)
        val inotropeMaxMcgMin = fmt(w * 0.3)
        val croupNebMg        = "5"
        val anaphylaxisIMmg   = fmt(w * 0.01)
        val anaphylaxisIVmcg  = fmt(w * 1.0)

        CcpYears.DrugSheetContent(
            header = header,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Cardiac Arrest",
                    dose = "$cardiacArrestMg mg",
                    route = "IV/IO",
                    notes = "Repeat every 4 minutes\nRef.Dose Calculation: ${w}kg x 0.01mg"
                ),
                CcpYears.DrugSection(
                    indication = "Bradycardia",
                    dose = "$bradycardiaMcg mcg",
                    route = "IV/IO",
                    notes = "MAX Dose 50 mcg.\nRepeat PRN every 2-4 minutes.\nRef.Dose Calculation: ${w}kg x 1mcg"
                ),
                CcpYears.DrugSection(
                    indication = "Inotrope/Vasopressor",
                    dose = "$inotropeMinMcgMin - $inotropeMaxMcgMin mcg/min",
                    route = "IV/IO infusion",
                    notes = "Mix 1mg (1:1000) in 100ml NS. Draw 50ml into 50ml syringe\nRef.Dose Calculation: ${w}kg x 0.05mcg - ${w}kg x 0.3mcg"
                ),
                CcpYears.DrugSection(
                    indication = "Severe Bronchoconstriction (IM)",
                    dose = "$cardiacArrestMg mg (MAX 0.5 mg)",
                    route = "IM",
                    notes = "Repeat PRN every 5 minutes.\nRef.Dose Calculation: ${w}kg x 0.01mg"
                ),
                CcpYears.DrugSection(
                    indication = "Severe Bronchoconstriction (IV/IO)",
                    dose = "$bradycardiaMcg mcg",
                    route = "IV/IO",
                    notes = "MAX Single Dose 50 mcg.\nRepeat PRN every 1-10 minutes.\nRef.Dose Calculation: ${w}kg x 1mcg"
                ),
                CcpYears.DrugSection(
                    indication = "Croup & Upper Airway Swelling",
                    dose = "$croupNebMg mg",
                    route = "NEB",
                    notes = "MAX dose of 5mg\nRepeat PRN every 5 minutes\nRef.Dose Calculation: ${w}kg x 0.5mg"
                ),
                CcpYears.DrugSection(
                    indication = "Anaphylaxis (IM)",
                    dose = "$anaphylaxisIMmg mg",
                    route = "IM",
                    notes = "MAX dose is 0.5mg\nRepeat PRN every 5 minutes\nRef.Dose Calculation: ${w}kg x 0.01mg"
                ),
                CcpYears.DrugSection(
                    indication = "Anaphylaxis (IV/IO)",
                    dose = "$anaphylaxisIVmcg mcg",
                    route = "IV/IO",
                    notes = "MAX single dose is 50mcg. Repeat every 1-10 mins\nRef.Dose Calculation: ${w}kg x 1mcg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildAmiodaroneContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your original pediatric-range checks for the direct weight path
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Your original math: 5 mg/kg for both indications
        val doseMg = fmt(w * 5.0)

        CcpYears.DrugSheetContent(
            header = header, // "Patient estimated weight is ... kg." OR "Patient weight is ... kg."
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Cardiac Arrest",
                    dose = "$doseMg mg",
                    route = "IV/IO",
                    notes = "After 3rd shock. Repeat twice up to 15mg per kg\nMAX Dose is 300mg (Up to a total of 3 doses).\nRef. Dose Calculation: ${w}kg x 5mg"
                ),
                CcpYears.DrugSection(
                    indication = "VT with a pulse",
                    dose = "$doseMg mg",
                    route = "IV/IO infusion",
                    notes = "Over 20 to 60 minutes\nMAX dose of 300mg.\nRef. Dose Calculation: ${w}kg x 5mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildAtropineContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your direct-weight pediatric range checks
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Compute doses per your original rules
        val (bradyDoseStr, orgaDoseStr) = if (ageText.isNotEmpty()) {
            val age = ageText.toInt()
            when {
                age <= 5 -> {
                    val brady =fmt(w * 0.02)
                    val orga  = fmt(w * 0.05)
                    brady to orga
                }
                age in 6..11 -> {
                    val brady = "0.5"
                    val orga  = fmt(w * 0.05)
                    brady to orga
                }
                age in 12..14 -> {
                    val brady = "0.5"
                    val orga  = "2"
                    brady to orga
                }
                else -> "—" to "—"
            }
        } else {
            // weight path tiers
            when {
                w < 22 -> {
                    val brady =fmt(w * 0.02)
                    val orga  = fmt(w * 0.05)
                    brady to orga
                }
                w in 22..34 -> {
                    val brady = "0.5"
                    val orga  = fmt(w * 0.05)
                    brady to orga
                }
                else -> {
                    val brady = "0.5"
                    val orga  = "2"
                    brady to orga
                }
            }
        }

        CcpYears.DrugSheetContent(
            header = header, // “Patient estimated weight is … kg.” or “Patient weight is … kg.”
            sections = listOf(
                // BRADYCARDIA
                CcpYears.DrugSection(
                    indication = "Bradycardia",
                    dose = "$bradyDoseStr mg",
                    route = "IV/IO",
                    notes = "MIN single dose is 0.1 mg and MAX single dose 0.5 mg. Repeat once if required.\nRef. Dose Calculation: ${w}kg x 0.02mg"
                ),
                // ORGANOPHOSPHATE TOXICITY
                CcpYears.DrugSection(
                    indication = "Organophosphate Toxicity",
                    dose = "$orgaDoseStr mg",
                    route = "IV/IO or IM",
                    notes = "MAX dose is 2 mg. Repeat PRN every 5 minutes, until clinical condition improves.\nRef. Dose Calculation: ${w}kg x 0.05mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildDexamethasoneContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep direct-weight pediatric bounds exactly like your originals
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Your exact dosing rules:
        //  - Age ≤5: 0.6 mg/kg
        //  - Age 6–7: 12 mg
        //  - Age 8–14: 12 mg
        //  - Weight path: ≤28 kg -> 0.6 mg/kg, else 12 mg
        val doseStr: String = if (ageText.isNotEmpty()) {
            val age = ageText.toInt()
            when {
                age <= 5       ->  fmt(w * 0.6)
                age in 6..14   -> "12"
                else           -> "—"
            }
        } else {
            if (w <= 28)  fmt(w * 0.6) else "12"
        }

        CcpYears.DrugSheetContent(
            header = header, // “Patient estimated weight is … kg.” OR “Patient weight is … kg.”
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Croup",
                    dose = "$doseStr mg",
                    route = "PO/IM/IV",
                    notes = "Max dose 12 mg\nSingle dose\nRef. Dose Calculation: ${w} kg x 0.6mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildDextrose10Content(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Preserve your direct-weight pediatric bounds messages exactly
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Hypoglycemia dose (ml) — exactly weight * 5
        val hypoglycemiaDoseMl = w * 5

        // Cardiac arrest/ROSC hypoglycemia dose (ml)
        val roscDoseMl: String = if (ageText.isNotEmpty()) {
            val age = ageText.toInt()
            when {
                age <= 5 -> {
                    val dose = (w * 2.5)
                    fmt(if (dose > 50.0) 50.0 else dose)
                }
                age in 6..14 -> "50"
                else -> "—"
            }
        } else {
            val dose = if (w <= 21) (w * 2.5) else 50.0
            fmt(dose)
        }

        CcpYears.DrugSheetContent(
            header = header, // “Patient estimated weight is … kg.” OR “Patient weight is … kg.”
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Hypoglycemia",
                    dose = "$hypoglycemiaDoseMl ml",
                    route = "IV/IO",
                    notes = "Ref. Dose Calculation: ${w}kg x 5ml"
                ),
                CcpYears.DrugSection(
                    indication = "Hypoglycemia in cardiac arrest or ROSC",
                    dose = "$roscDoseMl ml",
                    route = "IV/IO",
                    notes = "Ref. Dose Calculation: ${w}kg x 2.5ml"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildDiphenhydramineContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your direct-weight pediatric bounds messages exactly
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        val dose = minOf(w * 1, 50) // do cap on 50; you show MAX 50 mg in notes just like your original

        CcpYears.DrugSheetContent(
            header = header, // “Patient estimated weight is … kg.” OR “Patient weight is … kg.”
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Anaphylaxis/Allergic reaction",
                    dose = "$dose mg",
                    route = "IV/IO/IM",
                    notes = "MAX dose is 50mg.\n\nRef. Dose Calculation: ${w}kg x 1mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildDroperidolContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, baseHeader) = resolved

        // Keep your direct-weight bounds messages
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Age gating: not for use < 8 years old (also enforced by weight < 30 kg path below)
        if (ageText.isNotEmpty()) {
            val age = ageText.toInt()
            if (age in 1..7) {
                return CcpYears.DrugSheetContent(
                    header = "$baseHeader\n\nNot for use in patients < 8 years old (< 30 kg)",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Weight gating when user typed weight
        if (weightText.isNotEmpty() && w in 10..30) {
            // Your original logic shows “Not for use…” for ≤30 kg (range 10..30)
            return CcpYears.DrugSheetContent(
                header = "Patient weight is $w kg.\n\nNot for use in patients < 8 years old (< 30 kg)",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )
        }

        // Doses (for 8–14 years or >30 kg)
        val doseMin = w * 0.1
        val doseMax = w * 0.2

        CcpYears.DrugSheetContent(
            header = baseHeader,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Acute Behavioural Disturbance - Sedation",
                    dose = "${fmt(doseMin)} mg – ${fmt(doseMax)} mg",
                    route = "IV/IM",
                    notes = "Single MAXIMUM dose of 10 mg\n" +
                            "Dose may be repeated once after 15 minutes if required\n\n" +
                            "Total MAXIMUM dose 20 mg\n\n" +
                            "Ref. Dose Calculation: $w kg x 0.1mg – $w kg x 0.2mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildFentanylContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Preserve your original pediatric-range checks for the direct weight path
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Doses (use fmt so 123 not 123.0; keep mcg/ml spacing)
        val doseIVIO_analgesia   = fmt(w * 1.0)
        val doseIVIO_MAX_analgesia    = fmt(w * 2.0)
        val doseIN_analgesia               = fmt(w * 2.0)
        val dosePostRSI          = fmt(w * 0.5)
        val doseRSI              = fmt(w * 1.0)

        val sections = mutableListOf<CcpYears.DrugSection>()

        // ANALGESIA – IV/IO
        sections += CcpYears.DrugSection(
            indication = "Analgesia (IV/IO)",
            dose = "$doseIVIO_analgesia mcg",
            route = "IV/IO",
            notes = "MAX Total Dose $doseIVIO_MAX_analgesia mcg\nRef. Dose Calculation: $w kg x 1mcg"
        )

        // ANALGESIA – IN
        sections += CcpYears.DrugSection(
            indication = "Analgesia (IN)",
            dose = "$doseIN_analgesia mcg",
            route = "IN",
            notes = "MAX dose per nostril is 0.3 to 0.5 ml.\nRef. Dose Calculation: $w kg x 2mcg"
        )

        // RSI presence depends on age/weight exactly like your original
        val checkRsiDose =
            if (ageText.isNotEmpty()) {
                val age = ageText.toInt()
                age in 8..14
            } else {
                w > 28 // weight-path rule from your code
            }

        when {
            checkRsiDose -> {
                sections += CcpYears.DrugSection(
                    indication = "Rapid Sequence Intubation (RSI)",
                    dose = "$doseRSI mcg",
                    route = "IV/IO",
                    notes = "Ref. Dose Calculation: $w kg x 1mcg"
                )
            }
            else -> {
                sections += CcpYears.DrugSection(
                    indication = "Rapid Sequence Intubation (RSI)",
                    dose = "—",
                    route = "—",
                    notes = "Not indicated in this age group for intubation"
                )
            }
        }

        // POST RSI
        sections += CcpYears.DrugSection(
            indication = "Post RSI",
            dose = "$dosePostRSI mcg",
            route = "IV/IO",
            notes = "Ref. Dose Calculation: $w kg x 0.5mcg"
        )

        // INFUSION (keep wording; add spaces before ml)
        sections += CcpYears.DrugSection(
            indication = "Fentanyl IV/IO Infusion",
            dose = "1–10 mcg/kg/hr",
            route = "IV/IO infusion",
            notes =
                "Titrated to maintain sedation post RSI.\n" +
                        "Dilute 200 mcg (2 amps) Fentanyl with 16 ml NS to a total of 20 ml to give a concentration of 10 mcg/1 ml.\n" +
                        "Start infusion at desired range and titrate to effect and monitor BP."
        )

        CcpYears.DrugSheetContent(
            header = header,   // “Patient estimated weight is … kg.” or “Patient weight is … kg.”
            sections = sections
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildGlucagonContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your original pediatric-range checks for the direct weight path
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        val doseMg = if (w <= 20) 0.5 else 1.0
        val refLine = if (w <= 20) {
            "Patient weight <= 20 kg (age < 6 years old) = 0.5 mg IM = 0.5 ml"
        } else {
            "Patient weight > 20 kg (age >= 6 years old) = 1 mg IM = 1 ml"
        }

        CcpYears.DrugSheetContent(
            header = header, // "Patient estimated weight is ... kg." OR "Patient weight is ... kg."
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Symptomatic Hypoglycaemia",
                    dose = "${fmt(doseMg)} mg",
                    route = "IM",
                    notes =
                        "If no IV access or Dextrose ineffective\n\n" +
                                "Reconstituted: 1 mg/1 ml\n\n" +
                                "Ref. Dose: $refLine"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildHydrocortisonContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, header) = resolved

        // Keep your original pediatric-range checks for direct weight path
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Dose: 5 mg/kg, MAX 200 mg (covers age 12–14 and weight > 40 kg cases)
        val doseMg = kotlin.math.min(w * 5.0, 200.0)
        val doseStr = "$doseMg mg"

        // Notes with unified spacing; add the parenthetical only for direct-weight path (to mirror your original)
        val refLine = buildString {
            append("MAX dose is 200 mg\nSingle dose\nRef. Dose Calculation: $w kg x 5mg")
            if (weightText.isNotEmpty()) append("MAX dose is 200 mg\n(if weight > 40 kg dose is 200 mg)\nSingle dose")
        }

        CcpYears.DrugSheetContent(
            header = header,  // "Patient estimated weight is ... kg." OR "Patient weight is ... kg."
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Asthma/Anaphylaxis/Allergic reaction",
                    dose = doseStr,
                    route = "IV/IO",
                    notes = refLine
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildIpratropiumBromideContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, headerLine) = resolved

        // Keep your direct-weight bounds messages
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Age path (your logic): ≤6 years → 0.25 mg; 7–14 → 0.25–0.5 mg
        if (ageText.isNotEmpty()) {
            val age = ageText.toInt()
            return when {
                age <= 6 -> CcpYears.DrugSheetContent(
                    header = headerLine,
                    sections = listOf(
                        CcpYears.DrugSection(
                            indication = "Bronchoconstriction - Neb :",
                            dose = "0.25 mg",
                            route = "NEB",
                            notes =
                                "Neb should be mixed to a volume of 5 ml\n\n" +
                                        "• Ipratropium Bromide must always be administered together with Salbutamol in the same nebuliser — never on its own.\n" +
                                        "• Ipratropium Bromide is a single dose. If additional doses are required, request CCP assistance. CCP is required for a second dose; maximum 2 doses may be given 20 minutes apart.\n\n" +
                                        "Ref. Dose Calculation: 0.25 mg for Age < 6 years"
                        )
                    )
                )
                age in 7..14 -> CcpYears.DrugSheetContent(
                    header = headerLine,
                    sections = listOf(
                        CcpYears.DrugSection(
                            indication = "Bronchoconstriction - Neb :",
                            dose = "0.25 mg - 0.5 mg",
                            route = "NEB",
                            notes =
                                "Neb should be mixed to a volume of 5 ml\n\n" +
                                        "• Ipratropium Bromide must always be administered together with Salbutamol in the same nebuliser — never on its own.\n" +
                                        "• Ipratropium Bromide is a single dose. If additional doses are required, request CCP assistance. CCP is required for a second dose; maximum 2 doses may be given 20 minutes apart.\n\n" +
                                        "Ref. Dose Calculation: 0.25 mg - 0.5 mg for Age > 6 years"
                        )
                    )
                )
                else -> CcpYears.DrugSheetContent(
                    header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Weight path (your logic): ≤21 kg → 0.25 mg, else 0.25–0.5 mg
        val (doseStr, refStr) =
            if (w <= 21) "0.25 mg" to "0.25 mg for Weight ≤ 21 kg"
            else "0.25 mg - 0.5 mg" to "0.25 mg - 0.5 mg for Weight > 21 kg"

        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Bronchoconstriction - Neb :",
                    dose = doseStr,
                    route = "NEB",
                    notes =
                        "Neb should be mixed to a volume of 5 ml\n\n" +
                                "• Ipratropium Bromide must always be administered together with Salbutamol in the same nebuliser — never on its own.\n" +
                                "• Ipratropium Bromide is a single dose. If additional doses are required, request CCP assistance. CCP is required for a second dose; maximum 2 doses may be given 20 minutes apart.\n\n" +
                                "Ref. Dose Calculation: $refStr"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildKetamineContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, baseHeader) = resolved

        // Keep direct-weight bounds validation consistent with other drugs
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Pre-calc (use fmt for clean numbers)
        val dose1 = fmt(w * 0.25)
        val dose2 = fmt(w * 0.5)
        val dose3 = fmt(w * 1.0)
        val dose4 = fmt(w * 2.0)

        // AGE PATH (your original branching)
        if (ageText.isNotEmpty()) {
            val age = ageText.toInt()

            if (age <= 5 || age in 6..7) {
                // No RSI for <=7 in your original
                return CcpYears.DrugSheetContent(
                    header = baseHeader,
                    sections = listOf(
                        // ANALGESIA
                        CcpYears.DrugSection(
                            indication = "Analgesia (IV/IO)",
                            dose = "$dose1 – $dose2 mg",
                            route = "IV/IO",
                            notes =
                                "Ref. IV/IO Dose Calculation:\n$w kg x 0.25mg – $w kg x 0.5mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Analgesia (IM/IN)",
                            dose = "$dose2 – $dose3 mg",
                            route = "IM/IN",
                            notes =
                                "Ref. IM/IN Dose Calculation:\n$w kg x 0.5mg – $w kg x 1mg"
                        ),

                        // CONSCIOUS/PROCEDURAL SEDATION (LIGHT)
                        CcpYears.DrugSection(
                            indication = "Conscious / Procedural sedation (Light) IV/IO",
                            dose = "$dose2 mg",
                            route = "IV/IO",
                            notes = "Ref. IV/IO Dose Calculation:\n$w kg x 0.5mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Conscious / Procedural sedation (Light) IM/IN",
                            dose = "$dose3 mg",
                            route = "IM/IN",
                            notes = "Ref. IM/IN Dose Calculation:\n$w kg x 1mg"
                        ),

                        // DEEP SEDATION
                        CcpYears.DrugSection(
                            indication = "Deep Sedation (IV/IO)",
                            dose = "$dose3 mg",
                            route = "IV/IO",
                            notes = "Ref. IV/IO Dose Calculation: $w kg x 1mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Deep Sedation (IM/IN)",
                            dose = "$dose4 mg",
                            route = "IM/IN",
                            notes = "Ref. IM/IN Dose Calculation: $w kg x 2mg"
                        ),

                        // POST RSI
                        CcpYears.DrugSection(
                            indication = "Post RSI (IV/IO)",
                            dose = "$dose2 mg",
                            route = "IV/IO",
                            notes = "Ref. Dose Calculation: $w kg x 0.5mg"
                        ),
                        // RSI
                        CcpYears.DrugSection(
                            indication = "Rapid Sequence Intubation",
                            dose = "—",
                            route = "—",
                            notes = "Not indicated in this age group for intubation"
                        ),
                        // INFUSION
                        CcpYears.DrugSection(
                            indication = "Ketamine IV/IO Infusion",
                            dose = "0.01 – 0.05 mg/kg/min",
                            route = "IV/IO infusion",
                            notes =
                                "Titrated to maintain sedation post RSI\n" +
                                        "Dilute 200 mg (4 ml) Ketamine with 16 ml NS to a total of 20 ml to give a concentration of 10 mg/ml.\n" +
                                        "Start infusion at desired range and titrate to effect."
                        )
                    )
                )
            }

            if (age in 8..14) {
                val unstable = fmt(w * 1.0)
                val stable   = fmt(w * 2.0)

                return CcpYears.DrugSheetContent(
                    header = baseHeader,
                    sections = listOf(
                        // ANALGESIA
                        CcpYears.DrugSection(
                            indication = "Analgesia (IV/IO)",
                            dose = "$dose1 – $dose2 mg",
                            route = "IV/IO",
                            notes =
                                "Ref. IV/IO Dose Calculation:\n$w kg x 0.25 – $w kg x 0.5mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Analgesia (IM/IN)",
                            dose = "$dose2 – $dose3 mg",
                            route = "IM/IN",
                            notes =
                                "Ref. IM/IN Dose Calculation:\n$w kg x 0.5 – $w kg x 1mg"
                        ),

                        // CONSCIOUS/PROCEDURAL SEDATION (LIGHT)
                        CcpYears.DrugSection(
                            indication = "Conscious / Procedural sedation (Light) IV/IO",
                            dose = "$dose2 mg",
                            route = "IV/IO",
                            notes = "Ref. IV/IO Dose Calculation:\n$w kg x 0.5mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Conscious / Procedural sedation (Light) IM/IN",
                            dose = "$dose3 mg",
                            route = "IM/IN",
                            notes = "Ref. IM/IN Dose Calculation:\n$w kg x 1mg"
                        ),

                        // DEEP SEDATION
                        CcpYears.DrugSection(
                            indication = "Deep Sedation (IV/IO)",
                            dose = "$dose3 mg",
                            route = "IV/IO",
                            notes = "Ref. IV/IO Dose Calculation: $w kg x 1mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Deep Sedation (IM/IN)",
                            dose = "$dose4 mg",
                            route = "IM/IN",
                            notes = "Ref. IM/IN Dose Calculation: $w kg x 2mg"
                        ),

                        // RSI
                        CcpYears.DrugSection(
                            indication = "Rapid Sequence Intubation – Unstable Patient",
                            dose = "$unstable mg",
                            route = "IV/IO",
                            notes = "Ref. Dose Calculation: $w kg x 1mg"
                        ),
                        CcpYears.DrugSection(
                            indication = "Rapid Sequence Intubation – Stable Patient",
                            dose = "$stable mg",
                            route = "IV/IO",
                            notes = "Ref. Dose Calculation: $w kg x 2mg"
                        ),

                        // POST RSI
                        CcpYears.DrugSection(
                            indication = "Post RSI (IV/IO)",
                            dose = "$dose2 mg",
                            route = "IV/IO",
                            notes = "Ref. Dose Calculation: $w kg x 0.5mg"
                        ),

                        // INFUSION
                        CcpYears.DrugSection(
                            indication = "Ketamine IV/IO Infusion",
                            dose = "0.01 – 0.05 mg/kg/min",
                            route = "IV/IO infusion",
                            notes =
                                "Titrated to maintain sedation post RSI\n" +
                                        "Dilute 200 mg (4 ml) Ketamine with 16 ml NS to a total of 20 ml to give a concentration of 10 mg/ml.\n" +
                                        "Start infusion at desired range and titrate to effect."
                        )
                    )
                )
            }

            // Age outside pediatric range
            return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )
        }

        // WEIGHT PATH
        val rsiUnstableSection: CcpYears.DrugSection
        val rsiStableSection: CcpYears.DrugSection
        if (w <= 28) {
            rsiUnstableSection = CcpYears.DrugSection(
                indication = "Rapid Sequence Intubation – Unstable Patient",
                dose = "—",
                route = "—",
                notes = "Not indicated in this age group for intubation"
            )
            rsiStableSection = CcpYears.DrugSection(
                indication = "Rapid Sequence Intubation – Stable Patient",
                dose = "—",
                route = "—",
                notes = "Not indicated in this age group for intubation"
            )
        } else {
            rsiUnstableSection = CcpYears.DrugSection(
                indication = "Rapid Sequence Intubation – Unstable Patient",
                dose = "${fmt(w * 1.0)} mg",
                route = "IV/IO",
                notes = "Ref. Dose Calculation: $w kg x 1mg"
            )
            rsiStableSection = CcpYears.DrugSection(
                indication = "Rapid Sequence Intubation – Stable Patient",
                dose = "${fmt(w * 2.0)} mg",
                route = "IV/IO",
                notes = "Ref. Dose Calculation: $w kg x 2mg"
            )
        }

        CcpYears.DrugSheetContent(
            header = baseHeader,
            sections = listOf(
                // ANALGESIA
                CcpYears.DrugSection(
                    indication = "Analgesia (IV/IO)",
                    dose = "$dose1 – $dose2 mg",
                    route = "IV/IO",
                    notes =
                        "Ref. IV/IO Dose Calculation:\n$w kg x 0.25mg – $w kg x 0.5mg"
                ),
                CcpYears.DrugSection(
                    indication = "Analgesia (IM/IN)",
                    dose = "$dose2 – $dose3 mg",
                    route = "IM/IN",
                    notes =
                        "Ref. IM/IN Dose Calculation:\n$w kg x 0.5mg – $w kg x 1mg"
                ),

                // CONSCIOUS/PROCEDURAL SEDATION (LIGHT)
                CcpYears.DrugSection(
                    indication = "Conscious/Procedural sedation (Light) IV/IO",
                    dose = "$dose2 mg",
                    route = "IV/IO",
                    notes = "Ref. IV/IO Dose Calculation:\n$w kg x 0.5mg"
                ),
                CcpYears.DrugSection(
                    indication = "Conscious/Procedural sedation (Light) IM/IN",
                    dose = "$dose3 mg",
                    route = "IM/IN",
                    notes = "Ref. IM/IN Dose Calculation:\n$w kg x 1mg"
                ),

                // DEEP SEDATION
                CcpYears.DrugSection(
                    indication = "Deep Sedation (IV/IO)",
                    dose = "$dose3 mg",
                    route = "IV/IO",
                    notes = "Ref. IV/IO Dose Calculation: $w kg x 1mg"
                ),
                CcpYears.DrugSection(
                    indication = "Deep Sedation (IM/IN)",
                    dose = "$dose4 mg",
                    route = "IM/IN",
                    notes = "Ref. IM/IN Dose Calculation: $w kg x 2mg"
                ),

                // RSI (weight-dependent availability)
                rsiUnstableSection,
                rsiStableSection,

                // POST RSI
                CcpYears.DrugSection(
                    indication = "Post RSI (IV/IO)",
                    dose = "$dose2 mg",
                    route = "IV/IO",
                    notes = "Ref. Dose Calculation: $w kg x 0.5mg"
                ),

                // INFUSION
                CcpYears.DrugSection(
                    indication = "Ketamine IV/IO Infusion",
                    dose = "0.01 – 0.05 mg/kg/min",
                    route = "IV/IO infusion",
                    notes =
                        "Titrated to maintain sedation post RSI\n" +
                                "Dilute 200 mg (4 ml) Ketamine with 16 ml NS to a total of 20 ml to give a concentration of 10 mg/ml.\n" +
                                "Start infusion at desired range and titrate to effect."
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildMagnesiumSulphateContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, headerLine) = resolved

        // Keep your explicit weight-path checks
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Doses (mg) — same math as your original
        val minDoseMg = w * 25.0
        val maxDoseMgRaw = w * 50.0

        // Age path: cap 2000 mg for ages 10–14
        val capByAge = ageText.isNotEmpty() && ageText.toInt() in 10..14
        // Weight path: cap 2000 mg if >34 kg
        val capByWeight = weightText.isNotEmpty() && w > 34

        val finalMaxDoseMg = if (capByAge || capByWeight) 2000.0 else maxDoseMgRaw

        val doseText = "${fmt(minDoseMg)} mg - ${fmt(finalMaxDoseMg)} mg"


        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Bronchoconstriction",
                    dose = doseText,
                    route = "IV/IO",
                    notes = "MAX dose is 2g\nInfused over 20 minutes\nRef. Dose Calculation: $w kg x 25mg - $w kg x 50mg"
                ),
                CcpYears.DrugSection(
                    indication = "Torsades de Pointes",
                    dose = doseText,
                    route = "IV/IO",
                    notes = "MAX dose is 2g\nInfused over 20 minutes\nRef. Dose Calculation: $w kg x 25mg - $w kg x 50mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildMidazolamContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, headerLine) = resolved

        // Keep your explicit weight-path checks
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        val dose1 = fmt(w * 0.1)
        val dose2 = fmt(w * 0.2)

        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Seizure (IV/IO)",
                    dose = "$dose1 mg",
                    route = "IV/IO",
                    notes = "MAX single dose 5mg to MAX total dose 10mg\nRepeat PRN after 5 minutes\nRef. Dose Calculation: $w kg x 0.1mg"
                ),
                CcpYears.DrugSection(
                    indication = "Seizure (IM)",
                    dose = "$dose2 mg",
                    route = "IM",
                    notes = "Max single dose of 10mg\nRepeat PRN after 15 minutes\nRef. Dose Calculation: $w kg x 0.2mg"
                ),
                CcpYears.DrugSection(
                    indication = "Seizure (IN/Buccal)",
                    dose = "$dose2 mg",
                    route = "IN/Buccal",
                    notes = "MAX of 1ml per nostril/dose\nRef. Dose Calculation: $w kg x 0.2mg"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildNaloxoneContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, headerLine) = resolved

        // Keep your explicit weight-path checks
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Dosing logic exactly as your original:
        // - Age path: <=9 -> w*0.01 mg; 10..14 -> 0.4 mg
        // - Weight path: <=34 kg -> w*0.01 mg; >34 kg -> 0.4 mg
        val isAgePath = ageText.isNotEmpty()
        val doseMg: Double = if (isAgePath) {
            val age = ageText.toInt()
            if (age in 10..14) 0.4 else w * 0.01
        } else {
            if (w <= 34) w * 0.01 else 0.4
        }

        val refLine = if (isAgePath) {
            // Your original shows x0.01 even when dose is capped at 0.4 mg for ages 10..14
            "Ref. Dose Calculation: $w kg x 0.01mg"
        } else {
            if (w <= 40)
                "Ref. Dose Calculation: $w kg x 0.01mg"
            else
                "Ref. Dose Calculation: $w kg x 0.01mg but MAX dose is 0.4 mg"
        }

        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Opioid Overdose",
                    dose = "${fmt(doseMg)} mg",
                    route = "IV/IO/IM",
                    notes = "MAX single dose is 0.4mg\nMAX total dose 2mg\nRepeat PRN every 2-3 minutes\n\n$refLine"
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildOndansetronContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
            )

        val (w, headerLine) = resolved

        // Keep your direct-weight path bounds check/messages
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 1 * 2 + 8   // 10
            val maxWeight = 14 * 3 + 7  // 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
                )
            }
        }

        // Dosing (exactly your rules)
        val isAgePath = ageText.isNotEmpty()
        val doseMg: Double = if (isAgePath) {
            val age = ageText.toInt()
            if (age in 12..14) 4.0 else w * 0.1
        } else {
            if (w <= 40) w * 0.1 else 4.0
        }

        val refLine: String = if (isAgePath) {
            val age = ageText.toInt()
            if (age in 12..14)
                "Ref. Dose Calculation: $w kg x 0.1mg but MAX dose is 4 mg"
            else
                "Ref. Dose Calculation: $w kg x 0.1mg"
        } else {
            if (w <= 40)
                "Ref. Dose Calculation: $w kg x 0.1mg"
            else
                "Ref. Dose Calculation: $w kg x 0.1mg but MAX dose is 4 mg"
        }

        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Nausea & Vomiting",
                    dose = "${fmt(doseMg)} mg",
                    route = "IV/IM",
                    notes =
                        "MAX dose is 4 mg. Given Slowly.\n" +
                                "Dilution: 4 mg (2 ml) + 8 ml NaCl = 4 mg/10 ml = 0.4 mg/1 ml\n\n" + refLine
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—", null))
        )
    }
}


private fun buildParacetamolContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        // Resolve weight + header (“Patient estimated weight…” / direct weight message)
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—"))
            )

        // If user typed weight explicitly and it’s out of pediatric bounds, show only the header line
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 10
            val maxWeight = 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
        }

        val (w, headerLine) = resolved
        val isAgePath = ageText.isNotEmpty()
        val age = ageText.toIntOrNull()

        // Doses (exactly your rules)
        val oralDoseMg = w * 15.0
        val ivDoseMg = when {
            isAgePath && age == 1 -> w * 7.5
            !isAgePath && w <= 11  -> w * 7.5
            else                   -> w * 15.0
        }

        val oralRef = "Ref. Dose Calculation: $w kg x 15mg"
        val ivRef   = if ((isAgePath && age == 1) || (!isAgePath && w <= 11))
            "Ref. Dose Calculation: $w kg x 7.5mg"
        else
            "Ref. Dose Calculation: $w kg x 15mg"

        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = listOf(
                CcpYears.DrugSection(
                    indication = "Pain and/or fever (Oral)",
                    dose = "${fmt(oralDoseMg)} mg",
                    route = "PO",
                    notes =
                        "Paracetamol syrup: 120 mg/5 ml\n\n" +
                                oralRef
                ),
                CcpYears.DrugSection(
                    indication = "Moderate Pain (IV)",
                    dose = "${fmt(ivDoseMg)} mg",
                    route = "IV",
                    notes =
                        "MAX dose is 20 mg/kg.\n" +
                                "Undiluted: 1000 mg/100 ml = 10 mg/1 ml\n\n" +
                                ivRef
                )
            )
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—"))
        )
    }
}


private fun buildRocuroniumContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—"))
            )

        // If user typed weight explicitly and it’s out of pediatric bounds, show only the header line
        if (weightText.isNotEmpty()) {
            val typedW = weightText.toInt()
            val minWeight = 10
            val maxWeight = 49
            if (typedW < minWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) is less than the estimated weight for a 1-year-old child, which is $minWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
            if (typedW > maxWeight) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($typedW kg) exceeds the estimated weight for a 14-year-old child, which is $maxWeight kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
        }

        val (w, headerLine) = resolved
        val age = ageText.toIntOrNull()

        val dosePost = w * 0.25
        val dosePre = w * 1.5


        // Branches match your original logic
        val sections: List<CcpYears.DrugSection> = when {
            // Age path provided
            age != null -> when {
                age <= 7 -> listOf(
                    CcpYears.DrugSection(
                        indication = "PRE Intubation Paralytic",
                        dose = "—",
                        route = "—",
                        notes = "Rocuronium not indicated in this age group for PRE intubation."
                    ),
                    // Post-intubation (0.25 mg/kg) when <8 years / ≤28 kg
                    CcpYears.DrugSection(
                        indication = "POST Intubation Paralytic",
                        dose = "${fmt(dosePost)} mg",
                        route = "IV",
                        notes = "Repeat PRN every 30–45 minutes.\n\nRef. Dose Calculation: $w kg x 0.25mg"
                    )
                )
                age in 8..14 -> listOf(
                    CcpYears.DrugSection(
                        indication = "PRE Intubation Paralytic",
                        dose = "${fmt(dosePre)} mg",
                        route = "IV",
                        notes = "NOTE: RSI PRIMARY PARALYTIC AGENT ONLY FOR: MEDICAL and TRAUMA PATIENTS ≥ 8 YEARS.\nUndiluted: 10 mg/1 ml.\nRef. Dose Calculation: $w kg x 1.5mg"
                    ),
                    CcpYears.DrugSection(
                        indication = "POST Intubation Paralytic",
                        dose = "10 mg",
                        route = "IV",
                        notes = "Repeat PRN every 30–45 minutes.\n\nRef. Dose Calculation: $w kg x 0.25"
                    )
                )
                else -> listOf(CcpYears.DrugSection("—", "—", "—"))
            }

            // Weight path provided
            else -> when {
                w <= 28 -> listOf(
                    CcpYears.DrugSection(
                        indication = "PRE Intubation Paralytic",
                        dose = "—",
                        route = "—",
                        notes = "Rocuronium not indicated in this age group for PRE intubation."
                    ),
                    // Post-intubation (0.25 mg/kg) when <8 years / ≤28 kg
                    CcpYears.DrugSection(
                        indication = "POST Intubation Paralytic",
                        dose = "${fmt(dosePost)} mg",
                        route = "IV",
                        notes = "Repeat PRN every 30–45 minutes.\n\nRef. Dose Calculation: $w kg x 0.25mg"
                    )
                )
                else -> listOf(
                    CcpYears.DrugSection(
                        indication = "PRE Intubation Paralytic",
                        dose = "${fmt(dosePre)} mg",
                        route = "IV",
                        notes = "NOTE: RSI PRIMARY PARALYTIC AGENT ONLY FOR: MEDICAL and TRAUMA PATIENTS ≥ 8 YEARS.\nUndiluted: 10 mg/1 ml.\nRef. Dose Calculation: $w kg x 1.5mg"
                    ),
                    CcpYears.DrugSection(
                        indication = "POST Intubation Paralytic",
                        dose = "10 mg",
                        route = "IV",
                        notes = "Repeat PRN every 30–45 minutes.\n\nRef. Dose Calculation: $w kg x 0.25mg"
                    )
                )
            }
        }

        CcpYears.DrugSheetContent(
            header = headerLine,
            sections = sections
        )
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—"))
        )
    }
}


private fun buildSalbutamolContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        // Guard the explicit weight path for out-of-range like your originals
        if (weightText.isNotEmpty()) {
            val wTyped = weightText.toInt()
            val minW = 10
            val maxW = 49
            if (wTyped < minW) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($wTyped kg) is less than the estimated weight for a 1-year-old child, which is $minW kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
            if (wTyped > maxW) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($wTyped kg) exceeds the estimated weight for a 14-year-old child, which is $maxW kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
        }

        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—"))
            )
        val (w, headerLine) = resolved
        val age = ageText.toIntOrNull()

        // Build sections exactly per your logic
        val sections = when {
            // Age path: ≤5 y → IV/IO INF = w*10 mcg; NEB = 2.5 mg
            age != null && age <= 5 -> {
                val nebDose = "2.5"
                val infDose = fmt(w * 10.0)
                listOf(
                    CcpYears.DrugSection(
                        indication = "Bronchoconstriction (Neb)",
                        dose = "$nebDose mg",
                        route = "NEB",
                        notes = "2.5mg/3ml nebule - Neb should be mixed to a volume of 5ml\nCan be given with Ipratropium Bromide"
                    ),
                    CcpYears.DrugSection(
                        indication = "Bronchoconstriction (IV/IO)",
                        dose = "$infDose mcg",
                        route = "IV/IO infusion",
                        notes = "MAX dose is 250mcg\nInfused over 10 minutes\n\nRef. Dose Calculation: $w kg x 10mcg"
                    )
                )
            }

            // Age path: 6..14 y → IV/IO INF = 250 mcg; NEB = 2.5–5 mg
            age != null && age in 6..14 -> {
                val nebLow = "2.5"
                val nebHigh = "5"
                val infDose = "250"
                listOf(
                    CcpYears.DrugSection(
                        indication = "Bronchoconstriction (Neb)",
                        dose = "$nebLow – $nebHigh mg",
                        route = "NEB",
                        notes = "2.5mg/3ml nebule - Neb should be mixed to a volume of 5ml\nCan be given with Ipratropium Bromide"
                    ),
                    CcpYears.DrugSection(
                        indication = "Bronchoconstriction (IV/IO)",
                        dose = "$infDose mcg",
                        route = "IV/IO infusion",
                        notes = "MAX dose is 250mcg\nInfused over 10 minutes\n\nRef. Dose Calculation: $w kg x 10mcg"
                    )
                )
            }

            // Weight path
            else -> {
                if (w <= 21) {
                    val nebDose = "2.5"
                    val infDose = fmt(w * 10.0)
                    listOf(
                        CcpYears.DrugSection(
                            indication = "Bronchoconstriction (Neb)",
                            dose = "$nebDose mg",
                            route = "NEB",
                            notes = "2.5mg/3ml nebule - Neb should be mixed to a volume of 5ml\nCan be given with Ipratropium Bromide"
                        ),
                        CcpYears.DrugSection(
                            indication = "Bronchoconstriction (IV/IO)",
                            dose = "$infDose mcg",
                            route = "IV/IO infusion",
                            notes = "MAX dose is 250mcg\nInfused over 10 minutes\n\nRef. Dose Calculation: $w kg x 10mcg"
                        )
                    )
                } else {
                    val nebLow = "2.5"
                    val nebHigh = "5"
                    val infDose = "250"
                    listOf(
                        CcpYears.DrugSection(
                            indication = "Bronchoconstriction (Neb)",
                            dose = "$nebLow – $nebHigh mg",
                            route = "NEB",
                            notes = "2.5mg/3ml nebule - Neb should be mixed to a volume of 5ml\nCan be given with Ipratropium Bromide"
                        ),
                        CcpYears.DrugSection(
                            indication = "Bronchoconstriction (IV/IO)",
                            dose = "$infDose mcg",
                            route = "IV/IO infusion",
                            notes = "MAX dose is 250mcg\nInfused over 10 minutes\n\nRef. Dose Calculation: $w kg x 10mcg"
                        )
                    )
                }
            }
        }

        CcpYears.DrugSheetContent(header = headerLine, sections = sections)
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—"))
        )
    }
}


private fun buildTXAContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    return try {
        // Guard explicit weight path for pediatric range like your originals
        if (weightText.isNotEmpty()) {
            val wTyped = weightText.toInt()
            val minW = 10
            val maxW = 49
            if (wTyped < minW) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($wTyped kg) is less than the estimated weight for a 1-year-old child, which is $minW kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
            if (wTyped > maxW) {
                return CcpYears.DrugSheetContent(
                    header = "The weight entered ($wTyped kg) exceeds the estimated weight for a 14-year-old child, which is $maxW kg.",
                    sections = listOf(CcpYears.DrugSection("—", "—", "—"))
                )
            }
        }

        val resolved = resolveWeightWithHeader(ageText, weightText)
            ?: return CcpYears.DrugSheetContent(
                header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—"))
            )

        val (w, headerLine) = resolved
        val doseMg = fmt(w * 15.0)

        val section = CcpYears.DrugSection(
            indication = "Major Haemorrhage (CCP Only)",
            dose = "$doseMg mg",
            route = "IV/IO",
            notes = "Paediatric (<14 years old) with (major trauma < 3 hours old) with suspected or confirmed (major haemorrhage)\nInfused over 10 minutes\nMAX of 1g)\n\nRef. Dose Calculation: $w kg x 15mg"
        )

        CcpYears.DrugSheetContent(header = headerLine, sections = listOf(section))
    } catch (_: NumberFormatException) {
        CcpYears.DrugSheetContent(
            header = "Invalid input. Please enter a valid number.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—"))
        )
    }
}


private fun buildWAAFELSSContent(ageText: String, weightText: String): CcpYears.DrugSheetContent {
    // Pediatric bounds (from your other builders)
    val minW = 10
    val maxW = 49

    // Validate explicit weight path (like your originals)
    if (weightText.isNotEmpty()) {
        val wTyped = weightText.toInt()
        if (wTyped < minW) {
            return CcpYears.DrugSheetContent(
                header = "The weight entered ($wTyped kg) is less than the estimated weight for a 1-year-old child, which is $minW kg.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—"))
            )
        }
        if (wTyped > maxW) {
            return CcpYears.DrugSheetContent(
                header = "The weight entered ($wTyped kg) exceeds the estimated weight for a 14-year-old child, which is $maxW kg.",
                sections = listOf(CcpYears.DrugSection("—", "—", "—"))
            )
        }
    }

    // Resolve weight (and header line) from age/weight inputs
    val resolved = resolveWeightWithHeader(ageText, weightText)
        ?: return CcpYears.DrugSheetContent(
            header = "This age exceeds the pediatric range. Please refer to the CPG by pressing View Formulary button for appropriate medication guidance.",
            sections = listOf(CcpYears.DrugSection("—", "—", "—"))
        )

    val (w, headerLineRaw) = resolved
    val headerLine = "The WAAFELSS for your patient:\n"  // fix “WAAFELSS” → “WAAFELSS”

    // Core items (keep exact math)
    val adrenalineMg = fmt(w * 0.01)                  // mg
    val adrenalineMl = fmt(w / 10.0)                  // ml
    val amiodaroneMg = fmt(w * 5.0)                   // mg
    val amiodaroneMl = adrenalineMl                   // per your original (same numeric value)
    val fluidsMin = fmt(w * 10.0)                     // ml
    val fluidsMax = fmt(w * 20.0)                     // ml

    // Energy (J/kg)
    var j1 = w * 4
    var j2 = w * 6
    var j3 = w * 8
    var j4 = w * 10

    // Cap shocks exactly like your code paths
    val age = ageText.toIntOrNull()
    if (age != null) {
        if (age <= 5) {
            if (j1 > 360) j1 = 360
            if (j2 > 360) j2 = 360
            if (j3 > 360) j3 = 360
            if (j4 > 360) j4 = 360
        } else if (age in 6..14) {
            if (j3 > 360) j3 = 360
            if (j4 > 360) j4 = 360
        }
    } else {
        // weight path used uncapped j1/j2, capped j3/j4 — mirror that:
        if (j3 > 360) j3 = 360
        if (j4 > 360) j4 = 360
    }

    // D10 for ROSC (ml), cap at 50 ml
    val d10Rosc = fmt(minOf(w * 2.5, 50.0))

    // SGA text (exactly like your branches)
    val sgaText = when {
        age != null && age <= 5 -> when (w) {
            in 10..24 -> "Size 2"
            in 25..35 -> "Size 2.5"
            else      -> "" // your original left it empty if out of those ranges
        }
        age != null && age in 6..14 -> if (w in 25..35) "Size 2.5" else "Consider adult SGA sizes"
        else -> when (w) {
            in 10..24 -> "Size 2"
            in 25..35 -> "Size 2.5"
            else      -> "Consider adult SGA sizes"
        }
    }

    // Chest wall decompression text (match your exact logic)
    val cwdDose: String
    val cwdNotes: String?
    if (age != null && age <= 5) {
        if (age < 2) {
            cwdDose = "IV Catheter 22 g"
            cwdNotes = "(Color: Blue | Length: 2.5 cm)"
        } else {
            cwdDose = "IV Catheter 18 g"
            cwdNotes = "(Color: Green | Length: 3.2 cm)"
        }
    } else if (age != null && age in 6..14) {
        when (age) {
            6 -> {
                cwdDose = "IV Catheter 18 g"
                cwdNotes = "(Color: Green | Length: 3.2 cm)"
            }
            in 7..13 -> {
                cwdDose = "IV Catheter 16 g"
                cwdNotes = "(Color: Grey | Length: 4.5 cm)"
            }
            else -> {
                cwdDose = "IV Catheter 16 g"
                cwdNotes = "(Color: Grey | Length: 4.5 cm)\nConsider patient size\nLonger needle maybe required\nARS Needle 10 g or 14 g"
            }
        }
    } else {
        // weight path
        when (w) {
            in 10..11 -> {
                cwdDose = "IV Catheter 22 g"
                cwdNotes = "(Color: Blue | Length: 2.5 cm)"
            }
            in 12..27 -> {
                cwdDose = "IV Catheter 18 g"
                cwdNotes = "(Color: Green | Length: 3.2 cm)"
            }
            in 28..48 -> {
                cwdDose = "IV Catheter 16 g"
                cwdNotes = "(Color: Grey | Length: 4.5 cm)"
            }
            else -> {
                cwdDose = "IV Catheter 16 g"
                cwdNotes = "(Color: Grey | Length: 4.5 cm)\nConsider patient size\nLonger needle maybe required\nARS Needle 10 g or 14 g"
            }
        }
    }

    // Optional SBP (only shown in your age branches)
    val sbpSection = if (age != null) {
        val sbp = age * 2 + 70
        CcpYears.DrugSection(
            indication = "Systolic BP",
            dose = "$sbp mmHg",
            route = "—"
        )
    } else null

    // Build sections list
    val sections = buildList {
        add(CcpYears.DrugSection("Weight", "$w kg", "—"))
        add(CcpYears.DrugSection("Adrenaline", "$adrenalineMg mg ($adrenalineMl ml)", "IV/IO"))
        add(CcpYears.DrugSection("Amiodarone", "$amiodaroneMg mg ($amiodaroneMl ml)", "IV/IO"))
        add(CcpYears.DrugSection("Fluids", "$fluidsMin–$fluidsMax ml", "IV"))
        add(CcpYears.DrugSection("SGA", sgaText.ifBlank { "—" }, "Airway"))
        add(CcpYears.DrugSection("Energy Escalation", "$j1 J → $j2 J → $j3 J → $j4 J", "Defibrillation"))
        if (sbpSection != null) add(sbpSection)
        add(CcpYears.DrugSection("Dextrose 10%", "$d10Rosc ml", "IV/IO"))
        add(CcpYears.DrugSection("Chest Wall Decompression", cwdDose, "—", notes = cwdNotes))
    }

    return CcpYears.DrugSheetContent(
        header = headerLine,
        sections = sections
    )
}























/*@Composable
private fun LabelValue(label: String, value: String) {
    Text(
        text = label,
        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
    )
    Text(
        text = value,
        style = MaterialTheme.typography.bodyMedium
    )
    Spacer(Modifier.height(12.dp))
}*/

/* ===================== Dose Highlighter (kept for future use) ===================== */

/*
private val DOSE_REGEX by lazy {
    Regex(
        pattern = """(?xi)
            (?:\b\d+(?:\.\d+)?\s*[\-–]\s*\d+(?:\.\d+)?|\b\d+(?:\.\d+)?)   # number or range
            \s*
            (mcg|µg|mg|g|ml|mL|L|IU|units|%)                              # unit
            (?:/(?:kg|min|hr|h|day|dose|mL|ml|L|mcg|mg|g|IU))?           # optional /kg etc.
        """
    )
}

private fun annotateDose(text: String, accent: ComposeColor): AnnotatedString =
    buildAnnotatedString {
        var last = 0
        for (m in DOSE_REGEX.findAll(text)) {
            append(text.substring(last, m.range.first))
            pushStyle(SpanStyle(fontWeight = FontWeight.Bold, color = accent))
            append(m.value)
            pop()
            last = m.range.last + 1
        }
        if (last < text.length) append(text.substring(last))
    }
*/
