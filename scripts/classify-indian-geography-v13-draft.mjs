import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [registry, sourceLedger] = await Promise.all([
  readFile(resolve(root, "content/taxonomy/indian-geography-v1.3-draft.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "content/taxonomy/indian-geography-v1.3-source-candidates.json"), "utf8").then(JSON.parse),
]);

const slug = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const targets = new Map(registry.chapters.flatMap((chapter) => chapter.subtopics.map((subtopic) => [
  `${chapter.name}/${subtopic.name}`,
  { chapter: chapter.name, subtopic: subtopic.name, taxonomyId: `indian-geography/${slug(chapter.name)}/${slug(subtopic.name)}` },
])));
const target = (chapter, subtopic) => {
  const value = targets.get(`${chapter}/${subtopic}`);
  if (!value) throw new Error(`Unknown target ${chapter}/${subtopic}`);
  return value;
};
const textFor = (candidate) => [candidate.sourceText, ...Object.values(candidate.options)].join(" ").toLowerCase();
const has = (text, pattern) => pattern.test(text);
const choose = (chapter, subtopic, rule, confidence = "high") => ({ scopeDecision: "include", ...target(chapter, subtopic), rule, confidence });
const moveOut = (head, chapter, subtopic, rule) => ({ scopeDecision: "move-out", destination: { head, chapter, subtopic }, rule, confidence: "reviewed" });

const manualOverrides = {
  "NDA 2017 II Q143": choose("Coasts and Islands", "Coastal Extent and Important Locations", "manual/coastline-length", "reviewed"),
  "NDA 2019 I Q144": choose("Coasts and Islands", "Andaman and Nicobar Islands", "manual/island-renaming", "reviewed"),
  "CDS 2021 I Q19": choose("India: Location and Political Geography", "Strategic Location and Maritime Boundaries", "manual/territorial-sea", "reviewed"),
  "CDS 2022 II Q48": choose("Coasts and Islands", "Comparison of Western and Eastern Coasts", "manual/coast-comparison", "reviewed"),
  "CDS 2023 I Q105": choose("Coasts and Islands", "Coastal Extent and Important Locations", "manual/coastline-length", "reviewed"),
  "NDA 2018 II Q143": choose("Water Resources and River Projects", "Water Disputes and Water Governance", "manual/water-management-index", "reviewed"),
  "CAPF 2022 Q84": choose("Water Resources and River Projects", "Water Disputes and Water Governance", "manual/international-water-sharing", "reviewed"),
  "CDS 2014 II Q43": moveOut("Environment & Ecology", "Biodiversity, Protected Areas & Conservation", "Protected Areas, Wetlands & Biosphere Reserves", "manual/tiger-reserve-location"),
  "NDA 2014 II Q104": choose("Industries and Industrial Regions", "Petrochemical and Chemical Industries", "manual/refinery-chronology", "reviewed"),
  "CSE 2014 Q23": choose("Natural Vegetation and Forests", "Montane Forests", "manual/himalayan-vegetation", "reviewed"),
  "CDS 2016 I Q50": choose("Regional and Map-Based Geography of India", "Important Cities and Places", "manual/hill-station-elevation", "reviewed"),
  "NDA 2016 I Q61": choose("Regional and Map-Based Geography of India", "Important Cities and Places", "manual/city-longitude-order", "reviewed"),
  "NDA 2016 I Q67": choose("Geological Structure and Physiography", "Notable Indian Landforms", "manual/karewa-landform", "reviewed"),
  "NDA 2016 I Q83": choose("Regional and Map-Based Geography of India", "Mapping Institutions and Geospatial Frameworks", "manual/mapping-institution", "reviewed"),
  "NDA 2016 I Q113": choose("Geological Structure and Physiography", "Indian Desert", "manual/thar-dune", "reviewed"),
  "NDA 2016 II Q67": moveOut("General Science", "Biology", "Plant Adaptations", "manual/cactus-physiology"),
  "CSE 2017 Q19": choose("Coasts and Islands", "Coastal Extent and Important Locations", "manual/chandipur-tides", "reviewed"),
  "CSE 2017 Q98": choose("Coasts and Islands", "Andaman and Nicobar Islands", "manual/great-nicobar-location", "reviewed"),
  "NDA 2018 II Q73": choose("India: Location and Political Geography", "Latitudes, Longitudes and Standard Time", "manual/sunrise-longitude", "reviewed"),
  "NDA 2018 II Q74": choose("Coasts and Islands", "Deltas, Estuaries, Lagoons and Beaches", "manual/delta-upland", "reviewed"),
  "NDA 2019 I Q122": choose("India: Location and Political Geography", "States, Union Territories and Capitals", "manual/union-territory-area", "reviewed"),
  "CSE 2019 Q18": choose("Natural Vegetation and Forests", "Montane Forests", "manual/alpine-zone", "reviewed"),
  "CDS 2020 I Q50": choose("Population and Settlements", "Migration", "manual/female-migration", "reviewed"),
  "CDS 2020 I Q110": choose("Regional and Map-Based Geography of India", "Mapping Institutions and Geospatial Frameworks", "manual/water-academy-location", "reviewed"),
  "CDS 2020 II Q32": moveOut("Human & Economic Geography", "Population & Human Development", "Human Development Index", "manual/global-hdi-order"),
  "CDS 2020 II Q39": choose("India: Location and Political Geography", "States, Union Territories and Capitals", "manual/union-territory-area", "reviewed"),
  "NDA 2020 I/II Q81": choose("Population and Settlements", "Languages and Cultural Regions", "manual/language-families", "reviewed"),
  "CSE 2020 Q96": choose("Geological Structure and Physiography", "Himalayan Ranges, Peaks, Passes and Valleys", "manual/siachen-location", "reviewed"),
  "NDA 2021 II Q76": choose("Minerals and Energy Resources", "Coal", "manual/coalfield-location", "reviewed"),
  "NDA 2021 II Q87": choose("Agriculture and Land Use", "Livestock, Dairy and Fisheries", "manual/livestock-mission", "reviewed"),
  "CAPF 2022 Q62": choose("Regional and Map-Based Geography of India", "Regional Development and Planning", "manual/sdg-index", "reviewed"),
  "NDA 2022 I Q136": choose("Geological Structure and Physiography", "Peninsular Plateau and Central Highlands", "manual/peninsular-plateau", "reviewed"),
  "NDA 2022 II Q56": choose("Agriculture and Land Use", "Land-Use and Cropping Patterns", "manual/fallow-land", "reviewed"),
  "NDA 2022 II Q58": choose("Water Resources and River Projects", "Inland Waterways", "manual/national-waterways", "reviewed"),
  "NDA 2023 II Q125": choose("Transport, Infrastructure and Trade", "Freight and Transport Corridors", "manual/road-corridor", "reviewed"),
  "NDA 2024 I Q139": moveOut("Human & Economic Geography", "Industry, Transport, Services & Trade", "Historical Trade Routes", "manual/silk-routes"),
  "NDA 2024 II Q150": choose("Transport, Infrastructure and Trade", "Domestic and International Trade", "manual/logistics-maritime-policy", "reviewed"),
  "CSE 2024 Q98": choose("Agriculture and Land Use", "Land-Use and Cropping Patterns", "manual/land-records", "reviewed"),
  "NDA 2025 I Q97": choose("Minerals and Energy Resources", "Petroleum and Natural Gas", "manual/oilfield-location", "reviewed"),
  "CDS 2025 II Q100": choose("Regional and Map-Based Geography of India", "Central India", "manual/indore-region", "reviewed"),
  "CAPF 2026 Q22": choose("Regional and Map-Based Geography of India", "Regional Development and Planning", "manual/sdg-state-score", "reviewed"),
};

function classify(candidate) {
  const manual = manualOverrides[candidate.sourceIdentity.label];
  if (manual) return manual;
  const text = textFor(candidate);
  const old = candidate.previousPath.subtopic;

  if (old === "Location, States & Regional Setting") {
    if (has(text, /standard meridian|standard time|time zone|longitude|latitude|tropic of cancer/)) return choose("India: Location and Political Geography", "Latitudes, Longitudes and Standard Time", "location/time-grid");
    if (has(text, /border|boundary|neighbou?r|line of control|radcliffe|mcmahon/)) return choose("India: Location and Political Geography", "Neighbouring Countries and International Boundaries", "location/boundaries");
    if (has(text, /exclusive economic zone|territorial water|maritime|continental shelf/)) return choose("India: Location and Political Geography", "Strategic Location and Maritime Boundaries", "location/maritime");
    if (has(text, /capital|union territor|statehood|state and|states and|district/)) return choose("India: Location and Political Geography", "States, Union Territories and Capitals", "location/administrative-units");
    if (has(text, /region|division|zone|council/)) return choose("India: Location and Political Geography", "Administrative and Regional Divisions", "location/regional-division", "medium");
    return choose("India: Location and Political Geography", "Location, Extent and Hemispheric Position", "location/default", "medium");
  }

  if (old === "Physiographic Divisions, Mountains, Plateaus & Passes") {
    if (has(text, /himal|karakoram|zaskar|ladakh range|shiwalik|pass\b|peak\b|valley\b|dun\b/)) return choose("Geological Structure and Physiography", "Himalayan Ranges, Peaks, Passes and Valleys", "physiography/himalaya");
    if (has(text, /northern plain|indo-gangetic|bhabar|terai|bhangar|khadar/)) return choose("Geological Structure and Physiography", "Northern Plains", "physiography/northern-plains");
    if (has(text, /deccan|peninsular plateau|central highland|malwa|chota nagpur|bundelkhand|baghelkhand/)) return choose("Geological Structure and Physiography", "Peninsular Plateau and Central Highlands", "physiography/plateau");
    if (has(text, /western ghats|eastern ghats|nilgiri|anaimalai|cardamom|aravalli|vindhya|satpura/)) return choose("Geological Structure and Physiography", "Western Ghats, Eastern Ghats and Hill Systems", "physiography/hill-systems");
    if (has(text, /thar|indian desert|great indian desert/)) return choose("Geological Structure and Physiography", "Indian Desert", "physiography/desert");
    if (has(text, /geolog|gondwana|dharwar|cuddapah|vindhyan system|rock system/)) return choose("Geological Structure and Physiography", "Geological Evolution of India", "physiography/geology");
    return choose("Geological Structure and Physiography", "Physiographic Divisions of India", "physiography/default", "medium");
  }

  if (old === "Coasts, Islands & Coastal Features") {
    if (has(text, /andaman|nicobar|barren island|narcondam/)) return choose("Coasts and Islands", "Andaman and Nicobar Islands", "coasts/andaman-nicobar");
    if (has(text, /lakshadweep|minicoy|amindivi/)) return choose("Coasts and Islands", "Lakshadweep Islands", "coasts/lakshadweep");
    if (has(text, /coral|reef|atoll/)) return choose("Coasts and Islands", "Coral Islands and Reefs", "coasts/coral");
    if (has(text, /gulf|bay\b|strait|channel/)) return choose("Coasts and Islands", "Gulfs, Bays and Straits", "coasts/marine-feature");
    if (has(text, /delta|estuar|lagoon|beach|backwater/)) return choose("Coasts and Islands", "Deltas, Estuaries, Lagoons and Beaches", "coasts/landform");
    if (has(text, /konkan|kanara|malabar|western coast/)) return choose("Coasts and Islands", "Western Coastal Plain", "coasts/western");
    if (has(text, /coromandel|northern circars|eastern coast/)) return choose("Coasts and Islands", "Eastern Coastal Plain", "coasts/eastern");
    return choose("Coasts and Islands", "Coastal Extent and Important Locations", "coasts/fallback", "low");
  }

  if (old === "River Systems, Lakes, Dams & River-Valley Projects") {
    if (has(text, /dam\b|barrage|reservoir|river valley project|multipurpose|hydel project/)) return choose("Water Resources and River Projects", "Dams, Reservoirs and Multipurpose Projects", "drainage/project");
    if (has(text, /water dispute|tribunal|water sharing|river board/)) return choose("Water Resources and River Projects", "Water Disputes and Water Governance", "drainage/dispute");
    if (has(text, /interlink|linking of rivers|river linking/)) return choose("Water Resources and River Projects", "River Interlinking and Basin Management", "drainage/interlinking");
    if (has(text, /lake\b|lakes\b|loktak|wular|sambhar|chilika|pulicat|kolleru|vembanad/)) return choose("Drainage Systems", "Lakes and Inland Drainage", "drainage/lakes");
    if (has(text, /indus|jhelum|chenab|ravi\b|beas\b|sutlej|satluj/)) return choose("Drainage Systems", "Indus River System", "drainage/indus");
    if (has(text, /ganga|ganges|yamuna|ghaghara|gandak|kosi|son river|gomti|damodar|hooghly|hugli/)) return choose("Drainage Systems", "Ganga River System", "drainage/ganga");
    if (has(text, /brahmaputra|tsangpo|dihang|dibang|lohit|subansiri|manas river|teesta/)) return choose("Drainage Systems", "Brahmaputra River System", "drainage/brahmaputra");
    if (has(text, /narmada|tapi|tapti|mahi\b|sabarmati|luni\b/)) return choose("Drainage Systems", "West-Flowing Peninsular Rivers", "drainage/west-flowing");
    if (has(text, /godavari|krishna river|kaveri|cauvery|mahanadi|pennar|subarnarekha|brahmani|baitarani/)) return choose("Drainage Systems", "East-Flowing Peninsular Rivers", "drainage/east-flowing");
    if (has(text, /drainage pattern|antecedent|consequent|trellis|dendritic|river landform|meander|oxbow/)) return choose("Drainage Systems", "Drainage Patterns and River Landforms", "drainage/pattern-landform");
    return choose("Drainage Systems", "Tributaries, Confluences and River Basins", "drainage/default", "medium");
  }

  if (old === "Groundwater, Irrigation, Floods & Water Management") {
    if (has(text, /groundwater|ground water|aquifer|water table|tube well/)) return choose("Water Resources and River Projects", "Groundwater", "water/groundwater");
    if (has(text, /irrigat|canal|tank irrigation|command area/)) return choose("Water Resources and River Projects", "Irrigation Systems", "water/irrigation");
    if (has(text, /flood|drought|watershed|rainwater harvest|water conservation/)) return choose("Water Resources and River Projects", "Floods, Droughts and Watershed Management", "water/hazards-management");
    if (has(text, /dispute|tribunal|governance|water policy/)) return choose("Water Resources and River Projects", "Water Disputes and Water Governance", "water/governance");
    return choose("Water Resources and River Projects", "River Interlinking and Basin Management", "water/fallback", "low");
  }

  if (old === "Monsoon, Seasons & Rainfall") {
    if (has(text, /el ni[nñ]o|la ni[nñ]a|enso|indian ocean dipole|southern oscillation/)) return choose("Climate of India", "Monsoon Variability, ENSO and Indian Ocean Dipole", "climate/variability");
    if (has(text, /cyclone|storm surge|landfall/)) return choose("Climate of India", "Tropical Cyclones Affecting India", "climate/cyclone");
    if (has(text, /western disturbance|loo\b|mango shower|kalbaisakhi|nor.?wester/)) return choose("Climate of India", "Western Disturbances and Local Weather", "climate/local-weather");
    if (has(text, /retreating|north.?east monsoon|northeast monsoon/)) return choose("Climate of India", "Northeast and Retreating Monsoon", "climate/retreating");
    if (has(text, /south.?west monsoon|arabian sea branch|bay of bengal branch|burst of monsoon/)) return choose("Climate of India", "Southwest Monsoon", "climate/southwest");
    if (has(text, /rainfall|isohyet|rain shadow/)) return choose("Climate of India", "Rainfall Distribution", "climate/rainfall");
    if (has(text, /season|temperature|cold weather|hot weather/)) return choose("Climate of India", "Indian Seasons and Temperature Patterns", "climate/seasons");
    if (has(text, /climatic region|koppen|climate type/)) return choose("Climate of India", "Climatic Regions of India", "climate/regions");
    return choose("Climate of India", "Indian Monsoon Mechanism", "climate/default", "medium");
  }

  if (old === "Soils & Soil Conservation") {
    if (has(text, /alluvial|khadar|bhangar/)) return choose("Soils of India", "Alluvial Soils", "soil/alluvial");
    if (has(text, /black soil|regur|black cotton/)) return choose("Soils of India", "Black Soils", "soil/black");
    if (has(text, /red soil|yellow soil/)) return choose("Soils of India", "Red and Yellow Soils", "soil/red-yellow");
    if (has(text, /laterite/)) return choose("Soils of India", "Laterite Soils", "soil/laterite");
    if (has(text, /arid soil|desert soil/)) return choose("Soils of India", "Arid and Desert Soils", "soil/arid");
    if (has(text, /forest soil|mountain soil|saline soil|alkaline soil|peaty|marshy/)) return choose("Soils of India", "Forest, Mountain, Saline and Peaty Soils", "soil/other-types");
    if (has(text, /erosion|conservation|land degradation|desertification/)) return choose("Soils of India", "Soil Erosion, Conservation and Land Degradation", "soil/conservation");
    if (has(text, /distribution|region|state/)) return choose("Soils of India", "Soil Distribution", "soil/distribution", "medium");
    return choose("Soils of India", "Soil Formation and Classification", "soil/default", "medium");
  }

  if (old === "Natural Vegetation & Forests") {
    if (has(text, /mangrove|sundarb|littoral|swamp forest/)) return choose("Natural Vegetation and Forests", "Littoral, Swamp and Mangrove Forests", "vegetation/mangrove");
    if (has(text, /evergreen|semi-evergreen|rain forest/)) return choose("Natural Vegetation and Forests", "Tropical Evergreen and Semi-Evergreen Forests", "vegetation/evergreen");
    if (has(text, /deciduous|monsoon forest|sal\b|teak/)) return choose("Natural Vegetation and Forests", "Tropical Deciduous Forests", "vegetation/deciduous");
    if (has(text, /thorn|scrub|xerophytic/)) return choose("Natural Vegetation and Forests", "Thorn and Scrub Vegetation", "vegetation/thorn");
    if (has(text, /montane|alpine|conifer|temperate forest/)) return choose("Natural Vegetation and Forests", "Montane Forests", "vegetation/montane");
    if (has(text, /grassland|savanna|shola/)) return choose("Natural Vegetation and Forests", "Grasslands", "vegetation/grassland");
    if (has(text, /social forestry|agroforestry|forest management|forest resource|forest cover/)) return choose("Natural Vegetation and Forests", "Forest Resources, Social Forestry and Management", "vegetation/management");
    return choose("Natural Vegetation and Forests", "Controls and Distribution of Natural Vegetation", "vegetation/default", "medium");
  }

  if (old === "Agriculture, Crops & Land Use") {
    if (has(text, /kharif|rabi|zaid|crop season/)) return choose("Agriculture and Land Use", "Agricultural Seasons", "agriculture/seasons");
    if (has(text, /rice|wheat|millet|jowar|bajra|maize|pulse|food crop/)) return choose("Agriculture and Land Use", "Food Crops", "agriculture/food-crops");
    if (has(text, /cotton|jute|sugarcane|oilseed|tobacco|cash crop|commercial crop/)) return choose("Agriculture and Land Use", "Commercial and Cash Crops", "agriculture/cash-crops");
    if (has(text, /tea\b|coffee|rubber|plantation|horticulture|fruit|spice/)) return choose("Agriculture and Land Use", "Plantation Crops and Horticulture", "agriculture/plantation");
    if (has(text, /dryland|rainfed|irrigated agriculture/)) return choose("Agriculture and Land Use", "Irrigated and Dryland Agriculture", "agriculture/water-regime");
    if (has(text, /green revolution|agricultural region/)) return choose("Agriculture and Land Use", "Green Revolution and Agricultural Regions", "agriculture/green-revolution");
    if (has(text, /agro.?climatic|speciali[sz]ation/)) return choose("Agriculture and Land Use", "Agro-Climatic Zones and Regional Specialisation", "agriculture/agro-climatic");
    if (has(text, /livestock|cattle|dairy|milk|fishery|fisheries|aquaculture/)) return choose("Agriculture and Land Use", "Livestock, Dairy and Fisheries", "agriculture/allied");
    return choose("Agriculture and Land Use", "Land-Use and Cropping Patterns", "agriculture/default", "medium");
  }

  if (old === "Minerals, Energy & Power") {
    if (has(text, /iron ore|manganese|chromite|ferro/)) return choose("Minerals and Energy Resources", "Iron Ore and Ferro-Alloy Minerals", "mineral/ferro");
    if (has(text, /bauxite|copper|lead|zinc|tin\b|non-ferrous/)) return choose("Minerals and Energy Resources", "Non-Ferrous Minerals", "mineral/non-ferrous");
    if (has(text, /mica|limestone|gypsum|diamond|non-metallic/)) return choose("Minerals and Energy Resources", "Non-Metallic Minerals", "mineral/non-metallic");
    if (has(text, /coal|lignite|anthracite|bituminous/)) return choose("Minerals and Energy Resources", "Coal", "energy/coal");
    if (has(text, /petroleum|natural gas|oil field|refiner/)) return choose("Minerals and Energy Resources", "Petroleum and Natural Gas", "energy/hydrocarbon");
    if (has(text, /uranium|thorium|atomic mineral/)) return choose("Minerals and Energy Resources", "Atomic Minerals", "energy/atomic-minerals");
    if (has(text, /nuclear power|atomic power/)) return choose("Minerals and Energy Resources", "Nuclear Power", "energy/nuclear");
    if (has(text, /solar|wind power|renewable|geothermal|tidal energy|biomass/)) return choose("Minerals and Energy Resources", "Renewable Energy", "energy/renewable");
    if (has(text, /hydroelectric|hydel|thermal power|power plant/)) return choose("Minerals and Energy Resources", "Hydroelectric and Thermal Power", "energy/conventional-power");
    return choose("Minerals and Energy Resources", "Mineral Distribution and Mineral Belts", "mineral/default", "medium");
  }

  if (old === "Industries & Industrial Regions") {
    if (has(text, /iron and steel|steel plant|steel industr/)) return choose("Industries and Industrial Regions", "Iron and Steel Industry", "industry/steel");
    if (has(text, /textile|cotton mill|jute mill|silk industr/)) return choose("Industries and Industrial Regions", "Textile Industries", "industry/textile");
    if (has(text, /sugar industr|food process/)) return choose("Industries and Industrial Regions", "Sugar and Food-Processing Industries", "industry/food");
    if (has(text, /cement industr/)) return choose("Industries and Industrial Regions", "Cement Industry", "industry/cement");
    if (has(text, /petrochemical|chemical industr|fertili[sz]er industr/)) return choose("Industries and Industrial Regions", "Petrochemical and Chemical Industries", "industry/chemical");
    if (has(text, /automobile|engineering industr|information technology|software|electronic/)) return choose("Industries and Industrial Regions", "Engineering, Automobile and Technology Industries", "industry/engineering-tech");
    if (has(text, /industrial region|industrial corridor|special economic zone|\bsez\b/)) return choose("Industries and Industrial Regions", "Industrial Regions, Corridors and Special Economic Zones", "industry/region-corridor");
    return choose("Industries and Industrial Regions", "Factors Affecting Industrial Location", "industry/default", "medium");
  }

  if (old === "Roads, Railways & Inland Transport") {
    if (has(text, /railway|rail route|rail network|rail gauge/)) return choose("Transport, Infrastructure and Trade", "Railways", "transport/rail");
    if (has(text, /inland waterway|national waterway|water transport/)) return choose("Water Resources and River Projects", "Inland Waterways", "transport/inland-waterway");
    if (has(text, /freight corridor|transport corridor|dedicated freight/)) return choose("Transport, Infrastructure and Trade", "Freight and Transport Corridors", "transport/corridor");
    return choose("Transport, Infrastructure and Trade", "Road Transport", "transport/road", "medium");
  }

  if (old === "Ports, Sea/Air Routes, Trade & Infrastructure") {
    if (has(text, /airport|air route|aviation|aerodrome/)) return choose("Transport, Infrastructure and Trade", "Airports and Air Routes", "infrastructure/air");
    if (has(text, /pipeline|communication|telecom|optical fibre/)) return choose("Transport, Infrastructure and Trade", "Pipelines and Communication Networks", "infrastructure/pipeline-communication");
    if (has(text, /export|import|foreign trade|international trade|domestic trade/)) return choose("Transport, Infrastructure and Trade", "Domestic and International Trade", "infrastructure/trade");
    if (has(text, /strategic|border road|tunnel|bridge/)) return choose("Transport, Infrastructure and Trade", "Strategic Infrastructure", "infrastructure/strategic", "medium");
    return choose("Transport, Infrastructure and Trade", "Major Seaports", "infrastructure/port", "medium");
  }

  if (old === "Population, Census, Settlements & Tribes") {
    if (has(text, /census|sex ratio|literacy|decadal growth|demographic/)) return choose("Population and Settlements", "Census Concepts", "population/census");
    if (has(text, /migration|migrant/)) return choose("Population and Settlements", "Migration", "population/migration");
    if (has(text, /tribe|tribal|scheduled tribe/)) return choose("Population and Settlements", "Tribal Distribution", "population/tribal");
    if (has(text, /language|linguistic|culture region/)) return choose("Population and Settlements", "Languages and Cultural Regions", "population/cultural");
    if (has(text, /metropolitan|million.?plus|megacity/)) return choose("Population and Settlements", "Metropolitan Regions", "population/metro");
    if (has(text, /urbani[sz]|urban settlement|city|town/)) return choose("Population and Settlements", "Urban Settlements and Urbanisation", "population/urban");
    if (has(text, /rural settlement|village|hamlet/)) return choose("Population and Settlements", "Rural Settlements", "population/rural");
    if (has(text, /growth|age composition|working population/)) return choose("Population and Settlements", "Population Growth and Demographic Composition", "population/growth-composition");
    return choose("Population and Settlements", "Population Distribution and Density", "population/default", "medium");
  }

  if (old === "Regional Development, Places & Institutions") {
    if (has(text, /north.?east|assam|arunachal|nagaland|manipur|mizoram|tripura|meghalaya|sikkim/)) return choose("Regional and Map-Based Geography of India", "Northeast India", "regional/northeast");
    if (has(text, /himalayan state|himachal|uttarakhand|jammu|kashmir|ladakh/)) return choose("Regional and Map-Based Geography of India", "Himalayan States", "regional/himalayan");
    if (has(text, /coastal state|coastal district/)) return choose("Regional and Map-Based Geography of India", "Coastal States", "regional/coastal");
    if (has(text, /river basin|basin region/)) return choose("Regional and Map-Based Geography of India", "River-Basin Regions", "regional/river-basin");
    if (has(text, /resource|industr|crop|speciali[sz]ation/)) return choose("Regional and Map-Based Geography of India", "Regional Resources and Economic Specialisation", "regional/economic");
    if (has(text, /match|matched|pair|state.*river|state.*resource|state.*industr/)) return choose("Regional and Map-Based Geography of India", "State-Resource, State-River and State-Industry Matching", "regional/matching", "medium");
    return choose("Regional and Map-Based Geography of India", "Important Cities and Places", "regional/default", "low");
  }

  throw new Error(`Unhandled previous subtopic: ${old}`);
}

const records = sourceLedger.candidates.map((candidate) => {
  const result = classify(candidate);
  return {
    sourceIdentity: candidate.sourceIdentity,
    existingQuestionIds: candidate.existingQuestionIds,
    importAction: candidate.importAction,
    oldPath: candidate.previousPath,
    scopeDecision: result.scopeDecision,
    proposedPath: result.scopeDecision === "include" ? { head: "Indian Geography", chapter: result.chapter, subtopic: result.subtopic, taxonomyId: result.taxonomyId } : null,
    moveOutDestination: result.scopeDecision === "move-out" ? result.destination : null,
    classificationRule: result.rule,
    classificationConfidence: result.confidence,
    reviewStatus: result.confidence === "reviewed" ? "manually-reviewed" : result.confidence === "high" ? "rule-proposed-needs-confirmation" : "needs-manual-review",
  };
});

const countsByConfidence = Object.fromEntries(["reviewed", "high", "medium", "low"].map((confidence) => [confidence, records.filter((record) => record.classificationConfidence === confidence).length]));
const countsByScopeDecision = Object.fromEntries(["include", "move-out"].map((decision) => [decision, records.filter((record) => record.scopeDecision === decision).length]));
const countsByChapter = Object.fromEntries(registry.chapters.map((chapter) => [chapter.name, records.filter((record) => record.proposedPath?.chapter === chapter.name).length]));
const output = {
  version: registry.version,
  status: "classification-draft-do-not-publish",
  generatedAt: new Date().toISOString(),
  recordCount: records.length,
  countsByConfidence,
  countsByScopeDecision,
  countsByChapter,
  records,
};

await writeFile(resolve(root, "content/taxonomy/indian-geography-v1.3-classification-draft.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ recordCount: records.length, countsByConfidence, countsByScopeDecision, countsByChapter }, null, 2));
