import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFile(path.join(root, file), "utf8").then(JSON.parse);
const slug = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const [bank, registry, aliases, ...parts] = await Promise.all([
  read("content/question-bank.json"),
  read("content/taxonomy/upsc-geography-v1.2.json"),
  read("content/taxonomy/cds-geography-aliases.json"),
  ...Array.from({ length: 6 }, (_, index) => read(`content/taxonomy/question-map-0${index + 1}.json`)),
]);

const oldIds = parts[0].ids;
const oldByQuestion = new Map(parts.flatMap((part) => Object.entries(part.pairs)).map(([questionId, index]) => [questionId, oldIds[index]]));
const physicalOldIds = oldIds.filter((id) => id.startsWith("physical-geography/"));
const oldBySubtopicLabel = new Map(physicalOldIds.map((id) => [id.split("/").at(-1), id]));
const physical = registry.meta_heads.find((head) => head.name === "Physical Geography");
const canonical = new Map(physical.chapters.flatMap((chapter) => chapter.subtopics.map((subtopic) => [
  `${chapter.name}::${typeof subtopic === "string" ? subtopic : subtopic.name}`,
  `physical-geography/${slug(chapter.name)}/${slug(typeof subtopic === "string" ? subtopic : subtopic.name)}`,
])));
const target = (chapter, subtopic) => {
  const id = canonical.get(`${chapter}::${subtopic}`);
  if (!id) throw new Error(`Unknown Physical Geography destination: ${chapter} / ${subtopic}`);
  return id;
};

const C = {
  universe: "Universe, Solar System, Shape and Size of Earth",
  motions: "Latitudes, Longitudes, Time and Motions of the Earth",
  interior: "Interior of the Earth",
  rocks: "Rocks and Minerals",
  tectonics: "Plate Tectonics, Earthquakes, Volcanoes and Mountain Building",
  landforms: "Geomorphic Processes and Landforms",
  atmosphere: "The Atmosphere, Insolation, Heat Budget and Temperature",
  winds: "Atmospheric Pressure, Winds and Circulation",
  weather: "Condensation, Clouds, Precipitation, Air Masses, Fronts and Cyclones",
  climate: "World Climate Regions and the Köppen Classification",
  ocean: "Oceanography",
};
const choose = (chapter, subtopic, rule) => ({ newTaxonomyId: target(chapter, subtopic), rule });
const has = (text, pattern) => pattern.test(text);
const reviewedOverrides = {
  "capf-2021-i-104": [C.ocean, "Coral Reefs and Atolls", "manual-coral-conditions"],
  "capf-2022-i-6": [C.winds, "Atmospheric Pressure", "manual-pressure-trough-ridge"],
  "capf-2024-i-36": [C.motions, "Rotation and Time", "manual-date-line"],
  "capf-2024-i-42": [C.atmosphere, "Heat Budget of the Earth", "manual-net-radiation"],
  "cds-2014-2-33": [C.winds, "Forces Affecting Wind", "manual-pressure-gradient-wind"],
  "cds-2015-1-27": [C.ocean, "Ocean Currents", "manual-labrador-current"],
  "cds-2015-2-29": [C.winds, "Forces Affecting Wind", "manual-low-pressure-circulation"],
  "cds-2015-2-31": [C.atmosphere, "Structure", "manual-atmosphere-extent"],
  "cds-2015-2-33": [C.landforms, "Basics of Geomorphic Processes", "manual-diastrophism"],
  "cds-2015-2-9": [C.universe, "Universe and Origin Theories", "manual-geological-time"],
  "cds-2016-1-38": [C.ocean, "Distribution of Oceans and Seas", "manual-sea-level-change"],
  "cse-2013-gs-i-90": [C.atmosphere, "Scattering, Reflection and Albedo", "manual-rainbow-optics"],
  "cse-2018-gs-i-57": [C.atmosphere, "Composition", "manual-early-atmosphere"],
  "cse-2023-gs-i-74": [C.atmosphere, "How the Atmosphere Is Heated and Cooled", "manual-land-sea-contrast"],
  "cse-2023-gs-i-75": [C.interior, "Seismic Waves and What They Reveal", "manual-seismic-waves"],
  "cse-2025-gs-i-77": [C.motions, "Rotation and Time", "manual-date-line"],
  "cse-2026-gs-i-50": [C.ocean, "Marine Deposits and Resources", "manual-deep-ocean-mission"],
  "nda-2014-i-78": [C.landforms, "Basics of Geomorphic Processes", "manual-erosion-vegetation"],
  "nda-2014-ii-117": [C.motions, "Rotation and Time", "manual-rotation-speed"],
  "nda-2014-ii-71": [C.motions, "Rotation and Time", "manual-local-time"],
  "nda-2014-ii-79": [C.motions, "The Grid: Latitudes and Longitudes", "manual-map-scale"],
  "nda-2015-ii-120": [C.universe, "Shape and Size of Earth", "manual-earth-shape"],
  "nda-2015-ii-97": [C.atmosphere, "Temperature Distribution", "manual-temperature-latitude"],
  "nda-2016-i-98": [C.climate, "Cold Snow Forest Climates", "manual-coniferous-climate"],
  "nda-2016-ii-138": [C.landforms, "Basics of Geomorphic Processes", "manual-geomorphic-agents"],
  "nda-2017-ii-117": [C.atmosphere, "Composition", "manual-gas-abundance"],
  "nda-2017-ii-125": [C.atmosphere, "Scattering, Reflection and Albedo", "manual-rainbow-optics"],
  "nda-2019-ii-130": [C.tectonics, "Plate Tectonics", "manual-major-plate"],
  "nda-2021-i-109": [C.tectonics, "Plate Tectonics", "manual-minor-plate"],
  "nda-2021-i-110": [C.tectonics, "Plate Tectonics", "manual-tectonic-activity"],
  "nda-2021-ii-65": [C.landforms, "Weathering", "manual-soil-formation"],
  "nda-2022-ii-96": [C.landforms, "Basics of Geomorphic Processes", "manual-paleogeography"],
  "nda-2023-i-136": [C.motions, "Rotation and Time", "manual-local-time"],
  "nda-2023-i-59": [C.universe, "Universe and Origin Theories", "manual-geological-time"],
  "nda-2023-ii-124": [C.landforms, "Weathering", "manual-soil-type"],
  "nda-2025-ii-118": [C.landforms, "Weathering", "manual-soil-process"],
};

function classify(question, oldTaxonomyId) {
  const override = reviewedOverrides[question.id];
  if (override) return choose(override[0], override[1], override[2]);
  const text = [question.promptLines?.join(" "), Object.values(question.options || {}).join(" "), question.sourceText].filter(Boolean).join(" ").toLowerCase();
  const oldLeaf = oldTaxonomyId.split("/").at(-1);

  // Cross-category corrections take precedence over the former broad leaf.
  if (has(text, /köppen|koppen|climatic type|letter code.*(?:af|am|aw|bw|cs|df)|tropical wet|mediterranean climate|humid continental/)) return choose(C.climate, "Köppen's Scheme: Letters and Codes", "climate-code");
  if (has(text, /el ni[nñ]o|la ni[nñ]a|southern oscillation|enso/)) return choose(C.winds, "El Niño, La Niña and the Southern Oscillation", "enso");
  if (has(text, /indian ocean dipole|dipole mode index|\biod\b/)) return choose(C.ocean, "Indian Ocean Dipole", "iod");
  if (has(text, /coral reef|atoll|fringing reef|barrier reef|coral bleaching/)) return choose(C.ocean, "Coral Reefs and Atolls", "coral");
  if (has(text, /ocean current|equatorial counter-current|equatorial counter current|gulf stream|kuroshio|oyashio|canary current|benguela|upwelling|thermohaline/)) return choose(C.ocean, "Ocean Currents", "ocean-current");
  if (has(text, /\btide|tidal|spring tide|neap tide|bay of fundy/)) return choose(C.ocean, "Tides", "tides");
  if (has(text, /salinity|saline water|salt(?:s)? in (?:sea|ocean)/)) return choose(C.ocean, "Salinity", "salinity");
  if (has(text, /sea surface temperature|temperature of ocean|ocean water.*temperature|thermocline/)) return choose(C.ocean, "Temperature of Ocean Water", "ocean-temperature");
  if (has(text, /continental shelf|continental slope|abyssal|ocean floor|mid-oceanic ridge|oceanic ridge|trench|seamount|guyot|submarine canyon/)) return choose(C.ocean, "Ocean Floor Relief", "ocean-floor");
  if (has(text, /manganese nodule|marine deposit|red clay|terrigenous|biogenous/)) return choose(C.ocean, "Marine Deposits and Resources", "marine-deposit");
  if (has(text, /exclusive economic zone|\beez\b|unclos|plankton|nekton|benthos|marine pollution|maritime zone/)) return choose(C.ocean, "Marine Zones, Life and Law", "marine-zone");
  if (has(text, /wave length|wavelength.*wave|wave height|ocean wave|sea wave|swell|tsunami/) && !has(text, /seismic wave/)) return choose(C.ocean, "Waves", "ocean-wave");
  if (has(text, /freshwater.*(?:ice cap|glacier|groundwater)|water on (?:the )?planet earth|distribution of (?:water|oceans)|five oceans|ocean and sea/)) return choose(C.ocean, "Distribution of Oceans and Seas", "ocean-distribution");

  if (has(text, /tropical cyclone|hurricane|typhoon|cyclone.*eye|storm surge|saffir|cyclonic storm/)) return choose(C.weather, "Tropical Cyclones", "tropical-cyclone");
  if (has(text, /temperate cyclone|extra[- ]tropical|mid[- ]latitude cyclone|western disturbance/)) return choose(C.weather, "Temperate Cyclones", "temperate-cyclone");
  if (has(text, /anticyclone|siberian high/)) return choose(C.weather, "Anticyclones", "anticyclone");
  if (has(text, /thunderstorm|lightning|tornado|waterspout|cumulonimbus/)) return choose(C.weather, "Thunderstorms, Lightning and Tornadoes", "thunderstorm");
  if (has(text, /air mass|\bc[pmt][pt]\b/)) return choose(C.weather, "Air Masses", "air-mass");
  if (has(text, /cold front|warm front|occluded front|stationary front|\bfronts?\b/)) return choose(C.weather, "Fronts", "front");
  if (has(text, /\bcloud|cirrus|stratus|cumulus|nimbus|okta/)) return choose(C.weather, "Clouds", "cloud");
  if (has(text, /fog|mist|dew|frost/) && !has(text, /frost weathering/)) return choose(C.weather, "Forms of Condensation Near the Ground", "near-ground-condensation");
  if (has(text, /evaporation|condensation nuclei|condensation.*latent heat/)) return choose(C.weather, "Evaporation and Condensation", "evaporation-condensation");
  if (has(text, /rainfall|precipitation|rain shadow|orographic rain|convectional rain|cyclonic rain|drizzle|sleet|hail/)) return choose(C.weather, "Precipitation", "precipitation");

  if (has(text, /jet stream|rossby wave|subtropical jet|tropical easterly jet|somali jet/)) return choose(C.winds, "Jet Streams", "jet-stream");
  if (has(text, /inter[- ]tropical convergence|\bitcz\b|monsoon trough/)) return choose(C.winds, "ITCZ", "itcz");
  if (has(text, /hadley|ferrel|three[- ]cell|walker circulation|general circulation/)) return choose(C.winds, "General Circulation: Three-Cell Model", "general-circulation");
  if (has(text, /trade wind|westerlies|polar easterlies|planetary wind|roaring forties|polar front/)) return choose(C.winds, "Planetary Winds", "planetary-wind");
  if (has(text, /land breeze|sea breeze|mountain breeze|valley breeze|katabatic|monsoon wind|periodic wind/)) return choose(C.winds, "Secondary Winds", "secondary-wind");
  if (has(text, /\bloo\b|foehn|föhn|chinook|mistral|sirocco|harmattan|local wind/)) return choose(C.winds, "Local Winds", "local-wind");
  if (has(text, /anemometer|wind vane|beaufort/)) return choose(C.winds, "Wind Measurement", "wind-measurement");
  if (has(text, /coriolis|geostrophic|ferrel'?s law|buys ballot|pressure gradient.*wind|force.*wind/)) return choose(C.winds, "Forces Affecting Wind", "wind-force");
  if (has(text, /pressure belt|equatorial low|subtropical high|subpolar low|polar high|horse latitude/)) return choose(C.winds, "Pressure Belts", "pressure-belt");
  if (has(text, /atmospheric pressure|air pressure|barometer|isobar/)) return choose(C.winds, "Atmospheric Pressure", "atmospheric-pressure");

  if (has(text, /tundra|ice cap climate|polar climate/)) return choose(C.climate, "Polar Climates", "polar-climate");
  if (has(text, /taiga|cold snow forest|humid continental|podzol/)) return choose(C.climate, "Cold Snow Forest Climates", "cold-snow-climate");
  if (has(text, /mediterranean|marine west coast|humid subtropical|warm temperate/)) return choose(C.climate, "Warm Temperate Climates", "warm-temperate-climate");
  if (has(text, /desert climate|steppe climate|\bbwh\b|\bbwk\b|arid climate|semi[- ]arid climate/)) return choose(C.climate, "Dry Climates", "dry-climate");
  if (has(text, /equatorial climate|tropical rainforest climate|tropical monsoon climate|savanna climate|\baf\b|\bam\b|\baw\b/)) return choose(C.climate, "Tropical Humid Climates", "tropical-climate");
  if (has(text, /highland climate|altitudinal zonation/)) return choose(C.climate, "Highland Climates", "highland-climate");
  if (has(text, /classification of climate|climatic classification|climate region|climatic region/)) return choose(C.climate, "Classification of Climates", "climate-classification");

  if (has(text, /ozone|montreal protocol|kigali amendment|uv-a|uv-b|uv-c/)) return choose(C.atmosphere, "Ozone Layer", "ozone");
  if (has(text, /greenhouse|global warming|kyoto protocol|paris agreement|unfccc/)) return choose(C.atmosphere, "Greenhouse Effect and Global Warming", "greenhouse");
  if (has(text, /air pollution|pollutant|acid rain|\bsmog\b|pm2\.5|air quality index|\baqi\b/)) return choose(C.atmosphere, "Air Pollution", "air-pollution");
  if (has(text, /ionosphere|radio wave|d layer|e layer|f layer|aurora/)) return choose(C.atmosphere, "Ionosphere", "ionosphere");
  if (has(text, /troposphere|stratosphere|mesosphere|thermosphere|exosphere|tropopause|karman|kármán|layers? of (?:the )?atmosphere/)) return choose(C.atmosphere, "Structure", "atmosphere-structure");
  if (has(text, /composition of (?:the )?atmosphere|percentage.*(?:nitrogen|oxygen)|water vapour|aerosol/)) return choose(C.atmosphere, "Composition", "atmosphere-composition");
  if (has(text, /lapse rate|adiabatic|temperature inversion/)) return choose(C.atmosphere, "Lapse Rate, Adiabatic Processes and Inversion", "lapse-rate");
  if (has(text, /heat budget|terrestrial radiation|outgoing radiation/)) return choose(C.atmosphere, "Heat Budget of the Earth", "heat-budget");
  if (has(text, /conduction|convection|advection|latent heat|land[- ]sea contrast/) && oldLeaf === "atmosphere-insolation-temperature") return choose(C.atmosphere, "How the Atmosphere Is Heated and Cooled", "atmosphere-heating");
  if (has(text, /insolation|solar radiation|solar constant|sun'?s rays|angle of the sun|length of (?:the )?day.*insolation/)) return choose(C.atmosphere, "Solar Radiation and Insolation", "insolation");
  if (has(text, /albedo|rayleigh scattering|scattering.*sky|reflection.*radiation/)) return choose(C.atmosphere, "Scattering, Reflection and Albedo", "albedo-scattering");
  if (has(text, /isotherm|temperature distribution|annual range of temperature|diurnal range|thermal equator|record temperature/)) return choose(C.atmosphere, "Temperature Distribution", "temperature-distribution");
  if (has(text, /thermometer|psychrometer|rain gauge|stevenson screen|weather instrument/)) return choose(C.atmosphere, "Weather Instruments", "weather-instrument");
  if (has(text, /humidity|dew point|dry bulb|wet bulb|weather (?:and|vs) climate/)) return choose(C.atmosphere, "Weather, Climate and Humidity", "weather-humidity");

  if (has(text, /continental drift|wegener|pangaea|laurasia|gondwana|gondwanaland/)) return choose(C.tectonics, "Continental Drift", "continental-drift");
  if (has(text, /seafloor spreading|sea[- ]floor spreading|magnetic stripe/)) return choose(C.tectonics, "Seafloor Spreading", "seafloor-spreading");
  if (has(text, /plate tectonic|tectonic plate|convergent boundary|divergent boundary|transform boundary|ring of fire|hotspot/)) return choose(C.tectonics, "Plate Tectonics", "plate-tectonics");
  if (has(text, /earthquake|epicentre|epicenter|richter|mercalli|seismic zone|focus of.*quake/)) return choose(C.tectonics, "Earthquakes", "earthquake");
  if (has(text, /volcano|volcanic|caldera|magma|lava|geyser|barren island/)) return choose(C.tectonics, "Volcanoes", "volcano");
  if (has(text, /fold(?:ing|ed)?|fault(?:ing)?|horst|graben|rift valley|mountain building|orogen|anticline|syncline/)) return choose(C.tectonics, "Folding, Faulting and Mountain Building", "folding-faulting");

  if (has(text, /seismic wave|p-wave|s-wave|shadow zone|liquid outer core/)) return choose(C.interior, "Seismic Waves and What They Reveal", "seismic-wave");
  if (has(text, /moho|mohorovicic|conrad discontinuity|repetti|gutenberg|lehmann|discontinuit/)) return choose(C.interior, "Discontinuities", "discontinuity");
  if (has(text, /lithosphere|asthenosphere|isostasy|mechanical layer/)) return choose(C.interior, "Layers by Mechanical Behaviour", "mechanical-layer");
  if (has(text, /crust|mantle|core|sial|sima|composition.*earth/)) return choose(C.interior, "Layers by Composition", "composition-layer");
  if (has(text, /geothermal gradient|internal heat|pressure and density.*depth/)) return choose(C.interior, "Temperature, Pressure and Density", "interior-temperature");
  if (has(text, /kola borehole|borehole|source.*information.*interior|meteorite.*interior/)) return choose(C.interior, "Sources of Information", "interior-source");

  if (has(text, /metamorphic|foliated|non[- ]foliated|metamorphism/)) return choose(C.rocks, "Metamorphic Rocks", "metamorphic-rock");
  if (has(text, /sedimentary|clastic|limestone|coal.*rock|fossil.*rock/)) return choose(C.rocks, "Sedimentary Rocks", "sedimentary-rock");
  if (has(text, /igneous|granite|basalt|obsidian|pumice|batholith|laccolith|dyke|dike|intrusive|extrusive/)) return choose(C.rocks, "Igneous Rocks", "igneous-rock");
  if (has(text, /rock cycle/)) return choose(C.rocks, "The Rock Cycle", "rock-cycle");
  if (has(text, /mineral|mohs|quartz|feldspar|lustre|luster|streak|cleavage|\bore\b/)) return choose(C.rocks, "Minerals", "mineral");
  if (has(text, /\brocks?\b/)) return choose(C.rocks, "Rocks: Overview", "rock-overview");

  if (has(text, /karst|sinkhole|uvala|polje|stalactite|stalagmite|cavern|groundwater landform/)) return choose(C.landforms, "Groundwater and Karst Landforms", "karst");
  if (has(text, /glacial landform|cirque|arête|arete|moraine|drumlin|esker|fjord|u-shaped valley|glacier.*landform/)) return choose(C.landforms, "Glacial Landforms", "glacial-landform");
  if (has(text, /aeolian|wind erosion|mushroom rock|yardang|barchan|seif dune|sand dune|loess|hamada/)) return choose(C.landforms, "Aeolian Landforms", "aeolian-landform");
  if (has(text, /coastal landform|sea cliff|sea arch|sea stack|beach|spit|tombolo|lagoon|emergent coast|submergent coast/)) return choose(C.landforms, "Coastal Landforms", "coastal-landform");
  if (has(text, /river landform|fluvial|v-shaped valley|gorge|waterfall|meander|ox-bow|oxbow|levee|delta|alluvial fan|drainage pattern/)) return choose(C.landforms, "Fluvial Landforms", "fluvial-landform");
  if (has(text, /landslide|mass movement|mass wasting|soil creep|solifluction|earthflow|mudflow|lahar|rockfall|avalanche/)) return choose(C.landforms, "Mass Movements", "mass-movement");
  if (has(text, /weathering|exfoliation|frost wedging|carbonation|hydrolysis/)) return choose(C.landforms, "Weathering", "weathering");
  if (has(text, /endogenic|exogenic|gradation|base level|geomorphic process|erosion.*deposition/)) return choose(C.landforms, "Basics of Geomorphic Processes", "geomorphic-process");
  if (has(text, /mountain|plateau|plain|landform/)) return choose(C.landforms, "Major Landform Types", "major-landform");

  if (has(text, /eclipse|solar eclipse|lunar eclipse|moon|chandrayaan/)) return choose(C.universe, "The Moon and Eclipses", "moon-eclipse");
  if (has(text, /asteroid|meteor|comet|dwarf planet|pluto|kuiper|oort cloud/)) return choose(C.universe, "Dwarf Planets, Asteroids, Meteors, Comets", "minor-body");
  if (has(text, /\bplanet|jovian|terrestrial planet|mercury|venus|mars|jupiter|saturn|uranus|neptune/)) return choose(C.universe, "Planets", "planet");
  if (has(text, /\bsun\b|solar flare|sunspot|solar wind|aditya[- ]?l1|nuclear fusion/)) return choose(C.universe, "The Sun", "sun");
  if (has(text, /origin of (?:the )?universe|big bang|galaxy|milky way|light[- ]year|star|supernova|neutron star|black hole|nebular hypothesis|origin of (?:the )?solar system/)) return choose(C.universe, "Universe and Origin Theories", "universe-origin");
  if (has(text, /shape and size|oblate spheroid|geoid|polar diameter|equatorial diameter|roundness of earth|gravity.*latitude/)) return choose(C.universe, "Shape and Size of Earth", "earth-shape");
  if (has(text, /latitude|longitude|prime meridian|great circle|geographical grid|geographic grid|absolute location|\bgis\b|global positioning|\bgps\b|raster data|map projection|conformal map/)) return choose(C.motions, "The Grid: Latitudes and Longitudes", "grid");
  if (has(text, /international date line|time zone|local time|standard meridian|greenwich|\bgmt\b|\butc\b|rotation.*time|daylight saving/)) return choose(C.motions, "Rotation and Time", "rotation-time");
  if (has(text, /season|solstice|equinox|perihelion|aphelion|revolution of (?:the )?earth|axial tilt|longest day|shortest day|midnight sun/)) return choose(C.motions, "Revolution and Seasons", "revolution-season");
  if (has(text, /rotation of (?:the )?earth|rotational|coriolis effect|day and night|earth'?s axis|precession|nutation/)) return choose(C.motions, "All Motions of the Earth", "earth-motion");

  const fallbacks = {
    "solar-system-earth-motions-time": [C.motions, "All Motions of the Earth"],
    "latitude-longitude-maps-geospatial-tools": [C.motions, "The Grid: Latitudes and Longitudes"],
    "earth-interior-rocks-tectonics": [C.interior, "Layers by Composition"],
    "earthquakes-volcanoes-geological-hazards": [C.tectonics, "Earthquakes"],
    "weathering-erosion-landforms": [C.landforms, "Major Landform Types"],
    "atmosphere-insolation-temperature": [C.atmosphere, "Temperature Distribution"],
    "pressure-winds-weather-systems": [C.winds, "Planetary Winds"],
    "humidity-precipitation-climate-types": [C.weather, "Precipitation"],
    "ocean-relief-properties-marine-resources": [C.ocean, "Ocean Floor Relief"],
    "ocean-currents-tides-ocean-hazards": [C.ocean, "Ocean Currents"],
  };
  const fallback = fallbacks[oldLeaf];
  if (!fallback) throw new Error(`No fallback for ${question.id}: ${oldTaxonomyId}`);
  return choose(fallback[0], fallback[1], "fallback-needs-review");
}

const questionById = new Map(bank.questions.map((question) => [question.id, question]));
const records = [];
for (const question of bank.questions) {
  let oldTaxonomyId = oldByQuestion.get(question.id);
  if (!oldTaxonomyId && question.exam === "CDS" && question.subject === "Geography") {
    const label = aliases.questions[question.id] || aliases.subtopics[question.subtopic];
    oldTaxonomyId = oldBySubtopicLabel.get(slug(label || ""));
  }
  if (!oldTaxonomyId?.startsWith("physical-geography/")) continue;
  const classified = classify(question, oldTaxonomyId);
  records.push({
    questionId: question.id,
    oldTaxonomyId,
    newTaxonomyId: classified.newTaxonomyId,
    reviewStatus: classified.rule === "fallback-needs-review" ? "needs-review" : "rule-reviewed",
    reviewReason: classified.rule,
  });
}
records.sort((a, b) => a.questionId.localeCompare(b.questionId));
if (records.length !== 363) throw new Error(`Expected 363 Physical Geography questions, found ${records.length}`);
for (const record of records) {
  if (!questionById.has(record.questionId) || !canonical.has([...canonical.entries()].find(([, id]) => id === record.newTaxonomyId)?.[0])) {
    throw new Error(`Invalid review record: ${record.questionId}`);
  }
}
process.stdout.write(JSON.stringify({
  version: "upsc-geography-v1.2",
  sourceTaxonomyVersion: "upsc-geography-v1.1",
  reviewPolicy: "One primary subpart chosen from the answer-determining concept, otherwise the stem's central concept.",
  records,
}, null, 2) + "\n");
