/* ==========================================================================
   data.js — static reference data + seed tourist spots
   --------------------------------------------------------------------------
   Nothing here talks to the DOM or localStorage. The seed is copied into
   localStorage the first time the site loads (see storage.js).
   Coordinates are approximate; verify/adjust them in Admin > Map Management.
   ========================================================================== */
(function () {
  const EB = (window.EB = window.EB || {});

  EB.APP = {
    name: "Explore Bangladesh",
    tagline: "Discover the Beauty of Bangladesh",
    footerLine:
      "Discover the beauty, culture and natural wonders of Bangladesh.",
    heroLine:
      "Discover breathtaking destinations, hidden treasures and unforgettable journeys.",
  };

  /* ---------- Geography: 8 divisions, 64 districts ---------- */
  EB.DIVISIONS = [
    {
      id: "dhaka",
      name: "Dhaka",
      scene: "heritage",
      blurb:
        "The capital region: Mughal forts, river ports and the old capital of Sonargaon.",
      districts: [
        "Dhaka",
        "Faridpur",
        "Gazipur",
        "Gopalganj",
        "Kishoreganj",
        "Madaripur",
        "Manikganj",
        "Munshiganj",
        "Narayanganj",
        "Narsingdi",
        "Rajbari",
        "Shariatpur",
        "Tangail",
      ],
    },
    {
      id: "chattogram",
      name: "Chattogram",
      scene: "mountain",
      blurb: "Hills, lakes and the longest natural sea beach in the world.",
      districts: [
        "Bandarban",
        "Brahmanbaria",
        "Chandpur",
        "Chattogram",
        "Cox's Bazar",
        "Cumilla",
        "Feni",
        "Khagrachhari",
        "Lakshmipur",
        "Noakhali",
        "Rangamati",
      ],
    },
    {
      id: "rajshahi",
      name: "Rajshahi",
      scene: "heritage",
      blurb: "Ancient Buddhist monasteries, terracotta art and mango country.",
      districts: [
        "Bogura",
        "Chapainawabganj",
        "Joypurhat",
        "Naogaon",
        "Natore",
        "Pabna",
        "Rajshahi",
        "Sirajganj",
      ],
    },
    {
      id: "khulna",
      name: "Khulna",
      scene: "forest",
      blurb:
        "Home of the Sundarbans mangroves and the mosque city of Bagerhat.",
      districts: [
        "Bagerhat",
        "Chuadanga",
        "Jashore",
        "Jhenaidah",
        "Khulna",
        "Kushtia",
        "Magura",
        "Meherpur",
        "Narail",
        "Satkhira",
      ],
    },
    {
      id: "barishal",
      name: "Barishal",
      scene: "water",
      blurb:
        "A delta of rivers, canals and a sea beach that faces both sunrise and sunset.",
      districts: [
        "Barguna",
        "Barishal",
        "Bhola",
        "Jhalokati",
        "Patuakhali",
        "Pirojpur",
      ],
    },
    {
      id: "sylhet",
      name: "Sylhet",
      scene: "tea",
      blurb:
        "Tea gardens, swamp forests, waterfalls and the border hills of Jaflong.",
      districts: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
    },
    {
      id: "rangpur",
      name: "Rangpur",
      scene: "nature",
      blurb:
        "The far north: rice plains, old temples and the foothills of the Himalayas.",
      districts: [
        "Dinajpur",
        "Gaibandha",
        "Kurigram",
        "Lalmonirhat",
        "Nilphamari",
        "Panchagarh",
        "Rangpur",
        "Thakurgaon",
      ],
    },
    {
      id: "mymensingh",
      name: "Mymensingh",
      scene: "water",
      blurb:
        "River towns, folk-ballad country and the Garo hills near the Meghalaya border.",
      districts: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
    },
  ];

  /* ---------- Categories (scene = which generated artwork to use) ---------- */
  EB.CATEGORIES = [
    { name: "Sea Beach", icon: "🏖️", scene: "sea" },
    { name: "Mountain", icon: "⛰️", scene: "mountain" },
    { name: "Waterfall", icon: "💧", scene: "waterfall" },
    { name: "Forest", icon: "🌳", scene: "forest" },
    { name: "Island", icon: "🏝️", scene: "island" },
    { name: "River", icon: "🛶", scene: "water" },
    { name: "Lake", icon: "🏞️", scene: "water" },
    { name: "Historical Place", icon: "🏛️", scene: "heritage" },
    { name: "Archaeological Site", icon: "🏺", scene: "heritage" },
    { name: "Eco Park", icon: "🌿", scene: "forest" },
    { name: "Haor", icon: "🌾", scene: "water" },
    { name: "Temple", icon: "🛕", scene: "heritage" },
    { name: "Mosque", icon: "🕌", scene: "heritage" },
    { name: "Museum", icon: "🖼️", scene: "heritage" },
    { name: "Adventure", icon: "🧗", scene: "mountain" },
    { name: "Nature", icon: "🍃", scene: "tea" },
  ];

  EB.BEST_TIMES = ["Winter", "Summer", "Monsoon", "Year-round"];

  EB.QUICK_FILTERS = [
    { id: "beach", label: "Sea Beach", categories: ["Sea Beach"] },
    {
      id: "mountains",
      label: "Mountains",
      categories: ["Mountain", "Adventure"],
    },
    { id: "waterfalls", label: "Waterfalls", categories: ["Waterfall"] },
    { id: "forest", label: "Forest", categories: ["Forest", "Eco Park"] },
    {
      id: "historical",
      label: "Historical",
      categories: [
        "Historical Place",
        "Archaeological Site",
        "Temple",
        "Mosque",
        "Museum",
      ],
    },
    { id: "island", label: "Island", categories: ["Island"] },
  ];

  EB.TRAVEL_MODES = ["Bus", "Train", "Air", "Local transport"];

  EB.EMERGENCY = [
    { label: "Police", number: "999", note: "National Emergency Service" },
    { label: "Ambulance", number: "999", note: "National Emergency Service" },
    {
      label: "Fire Service",
      number: "999",
      note: "or Fire Service helpline 16163",
    },
    {
      label: "Tourist Police",
      number: "999",
      note: "Ask for the tourist police or visit the nearest tourist police booth",
    },
  ];

  /* ---------- Creator profile (EDIT THESE — placeholders) ---------- */
  EB.CREATOR = {
    name: "Ushoinu Marma",
    profession: "Web Developer and Travel Enthusiast",
    bio: "I am Ushoinu Marma, a passionate web developer and travel enthusiast from Bangladesh. I enjoy building modern, responsive and user-friendly web applications. Explore Bangladesh is a project created to help people discover beautiful destinations across Bangladesh, learn where they are, see what they look like, and find useful information for visiting them.",
    skills: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "Responsive Web Design",
      "Maps and Geodata",
      "Accessibility",
      "UI/UX Design",
      "Git and GitHub",
      "Java",
      "Jakarta EE",
      "JSF",
      "MySQL",
      "Postgresql",
    ],
    education:
      "BSc in Computer Science and Engineering, International University of Scholars (IUS)",
    github: "https://github.com/ushoinu",
    facebook: "https://m.me/ushoinu.marma.9",
    email: "ushoinumarma@gmail.com",
  };

  /* ---------- Seed tourist spots ---------- */
  const sceneFor = (cat) =>
    (EB.CATEGORIES.find((c) => c.name === cat) || {}).scene || "nature";

  // helper: expand a compact record into the full storage shape
  const make = (o) => {
    const scene = o.scene || sceneFor(o.category);
    const v = o.v || 0;
    return {
      id: o.id,
      name: o.name,
      division: o.division,
      district: o.district,
      category: o.category,
      featured: !!o.featured,
      description: o.desc,
      history: o.history,
      whyVisit: o.why,
      bestTime: o.best,
      bestTimeNote: o.bestNote,
      hours: o.hours,
      entryFee: o.fee,
      mainImage: "art:" + scene + ":" + v,
      images: [1, 2].map((i) => "art:" + scene + ":" + ((v + i) % 4)),
      video: "",
      latitude: o.lat,
      longitude: o.lng,
      travelGuide: {
        bus: o.bus,
        train: o.train,
        air: o.air,
        localTransport: o.local,
        distance: o.dist,
        travelTime: o.time,
        route: o.route,
        instructions: o.instr || "",
      },
      nearbyAttractions: o.nearby || [],
      safetyTips: o.tips,
      createdAt: o.created || "2026-01-10T09:00:00.000Z",
      updatedAt: o.created || "2026-01-10T09:00:00.000Z",
    };
  };

  const CHECK =
    "Schedules, fares and access rules change, so confirm before you travel.";

  const RAW = [
    {
      id: "spot_001",
      name: "Cox's Bazar",
      division: "Chattogram",
      district: "Cox's Bazar",
      category: "Sea Beach",
      featured: true,
      v: 1,
      desc: "Cox's Bazar is the beach capital of Bangladesh, with an almost unbroken sandy shoreline of roughly 120 km along the Bay of Bengal. Long walks at low tide, surf lessons, fresh seafood and huge sunsets make it the most popular seaside getaway in the country.",
      history:
        "The town is named after Captain Hiram Cox, a British East India Company officer who worked to resettle refugees in this area in the late 1790s. It grew from a small fishing and trading settlement into the country's main tourism hub.",
      why: "- Walk one of the longest natural sea beaches in the world\n- Watch the sun go down from Laboni or Kolatoli beach\n- Day trips to Inani, Himchori and Maheshkhali island\n- Fresh seafood and dried-fish markets",
      best: "Winter",
      bestNote:
        "November to February is dry and sunny with calm seas. In the monsoon (June to September) the surf is rough and swimming is often restricted.",
      hours: "Beach open all day; lifeguards on duty in daylight",
      fee: "Free beach access (parking and activities are charged separately)",
      lat: 21.4272,
      lng: 92.0058,
      bus: "AC and non-AC buses leave Dhaka from the Kamalapur, Sayedabad and Fakirapool areas, mostly in the evening and at night. Operators such as Green Line, S. Alam and Hanif run this route. Get off at the Cox's Bazar bus terminal or at your hotel's drop-off point; most hotels are on the Kolatoli-Laboni-Sugandha beach strip.",
      train:
        "Intercity trains run from Dhaka to Cox's Bazar railway station (the line opened in 2022). Book through the Bangladesh Railway e-ticket site and check the current train names and timetable. From the station take a CNG or auto-rickshaw to the beach. " +
        CHECK,
      air: "Biman Bangladesh, US-Bangla and other airlines fly Dhaka to Cox's Bazar Airport (CXB) in about one hour. The airport is a few kilometres from the main beach; take a CNG or arrange a hotel pickup.",
      local:
        "- CNG auto-rickshaws and tuk-tuks around town\n- Rickshaws for short hops\n- Jeeps and microbuses for the Marine Drive to Inani and Himchori\n- Boats from the town ghat to Maheshkhali",
      dist: "About 400 km by road from Dhaka",
      time: "Around 9 to 11 hours by bus; about 1 hour by air",
      route:
        "Dhaka, Cumilla, Feni, Chattogram, then the Chattogram-Cox's Bazar highway.",
      tips: [
        "Swim only in lifeguard-marked zones and stay out of the sea when red flags are flying.",
        "Book hotels well ahead for winter weekends and public holidays.",
        "Agree the fare before hiring a CNG, jeep or boat.",
        "Carry sunscreen and take your plastic waste with you.",
        "Check tide times before visiting sea caves or driving on the sand.",
      ],
      nearby: ["spot_002"],
    },
    {
      id: "spot_002",
      name: "Saint Martin's Island",
      division: "Chattogram",
      district: "Cox's Bazar",
      category: "Island",
      featured: true,
      v: 0,
      desc: "Saint Martin's is the only coral island in Bangladesh, a small, palm-fringed island at the northeastern tip of the Bay of Bengal. Clear turquoise water, rocky coral shores and a quiet village life set it apart from the mainland beaches.",
      history:
        "Locally called Narikel Jinjira, or Coconut Island, it was settled by Arab traders and later by fishing families from Teknaf. The southern tip, Chhera Dwip, becomes a separate islet at high tide.",
      why: "- Rare coral reefs and clear water\n- Sunrise and sunset from the same shore\n- Slow, car-free village life\n- Fresh seafood and coconuts",
      best: "Winter",
      bestNote:
        "The sea is calm from November to February, which is also when passenger ships operate most reliably. Ships often stop in the monsoon.",
      hours: "Open all day",
      fee: "Ship ticket and local fees apply; amounts vary by operator and season",
      lat: 20.6273,
      lng: 92.3227,
      bus: "Take a bus from Dhaka to Teknaf (about 10 to 12 hours). Overnight services run from the Kamalapur and Sayedabad areas. Get off at Teknaf bus stand, then go to the jetty by CNG or rickshaw.",
      train:
        "Take a train from Dhaka to Cox's Bazar, then a bus or microbus along the Marine Drive to Teknaf (about 2 to 3 hours). " +
        CHECK,
      air: "Fly Dhaka to Cox's Bazar, then continue by road to Teknaf. There is no airport on the island.",
      local:
        "- Passenger ships and trawlers from Teknaf jetty (about 2 to 3 hours)\n- On the island, everything is on foot or by cycle-rickshaw and van",
      dist: "About 480 km from Dhaka to Teknaf, then about 40 km by sea",
      time: "Around 12 to 15 hours in total including the sea crossing",
      route: "Dhaka, Cox's Bazar, Teknaf jetty, then ship to Saint Martin's.",
      instr:
        "Access rules for the island, including visitor numbers and overnight stays, have changed in recent years. Check the current rules with the local administration before booking.",
      tips: [
        "Confirm ship schedules and current visitor rules before you leave.",
        "Do not pick up or buy coral, shells or sea turtle products.",
        "Carry cash: there are few ATMs and signal can be weak.",
        "Bring back all your rubbish; the island has limited waste handling.",
        "Keep noise and lights down at night to protect nesting turtles.",
      ],
      nearby: ["spot_001"],
    },
    {
      id: "spot_003",
      name: "Sajek Valley",
      division: "Chattogram",
      district: "Rangamati",
      category: "Mountain",
      featured: true,
      v: 2,
      desc: "Sajek Valley sits on a hill ridge at roughly 1,800 ft in the Chittagong Hill Tracts. In the monsoon and early autumn, clouds roll below the ridge and tribal cottages appear to float above them.",
      history:
        "Sajek is home to the Chakma, Tripura, Lushai and Pangkhua communities. The valley was opened to visitors in the 2010s after a road was built, and it has since become one of the most photographed places in the country.",
      why: "- Sea of clouds at sunrise\n- Traditional hill-people villages\n- Konglak Para and Ruilui Para viewpoints\n- Cool air and quiet nights",
      best: "Monsoon",
      bestNote:
        "July to October is best for clouds and green hills. Winter mornings are cold and clear, with good sunrise views.",
      hours: "Open all day; travel in daylight",
      fee: "No general entry fee; local security registration may apply",
      lat: 23.382,
      lng: 92.2941,
      bus: "Take a bus from Dhaka to Khagrachhari (about 7 to 8 hours), then a jeep (Chander Gari) via Dighinala to Sajek. Get off at Khagrachhari town and walk to the Chander Gari stand.",
      train:
        "Take a train from Dhaka to Chattogram or Cumilla, then a bus to Khagrachhari. " +
        CHECK,
      air: "The nearest commercial airport is Chattogram (CGP); from there travel by road to Khagrachhari.",
      local:
        "- Chander Gari (open jeep) from Khagrachhari, about 2 to 3 hours\n- Vehicles travel from Dighinala in escorted convoys at fixed times; confirm the times locally\n- Motorbike or walking inside the valley",
      dist: "About 300 km from Dhaka to Khagrachhari, then about 65 km to Sajek",
      time: "Around 10 to 12 hours in total",
      route: "Dhaka, Cumilla, Chattogram, Khagrachhari, Dighinala, Sajek.",
      tips: [
        "Start early: convoy timings can leave you stranded if you miss them.",
        "Carry your NID or passport for checkpoint registration.",
        "Respect local customs and ask before photographing people.",
        "Roads are steep and slippery in heavy rain; avoid night travel.",
        "Bring warm clothes and a rain jacket.",
      ],
      nearby: ["spot_004", "spot_005"],
    },
    {
      id: "spot_004",
      name: "Nilachal and the Bandarban Hills",
      division: "Chattogram",
      district: "Bandarban",
      category: "Mountain",
      featured: true,
      v: 3,
      desc: "Bandarban is the highest and wildest of the three hill districts, with cloud-level viewpoints such as Nilachal and Nilgiri, tall waterfalls and Bangladesh's highest peaks. It is the country's centre for trekking and hill-people culture.",
      history:
        "The district is home to Marma, Bawm, Tripura, Mro and other communities, and the Bohmong Chief's royal seat is at Bandarban town. The Golden Temple (Buddha Dhatu Jadi) sits on a hill just outside the town.",
      why: "- Views over the Sangu river valley\n- Boga Lake, Nafakhum and Shoilo Propat waterfalls\n- Trekking towards Keokradong and Tajingdong\n- Hill-people markets and food",
      best: "Winter",
      bestNote:
        "November to February is dry and ideal for trekking. Monsoon roads can be slippery, but waterfalls are at their fullest.",
      hours: "Viewpoints open in daylight",
      fee: "Small entry fees at some viewpoints; guides and permits cost extra for treks",
      lat: 22.135,
      lng: 92.22,
      bus: "Buses run from Dhaka to Bandarban town (about 9 to 10 hours) from the Sayedabad and Kamalapur areas. Get off at Bandarban bus stand and take a CNG to your hotel or jeep stand.",
      train:
        "Take a train from Dhaka to Chattogram, then a bus to Bandarban (about 3 hours). " +
        CHECK,
      air: "Fly to Chattogram (CGP) or Cox's Bazar (CXB), then continue by road.",
      local:
        "- Chander Gari (open jeep) to Nilgiri, Nilachal and other viewpoints\n- CNG in town\n- Local guides are needed for trekking routes",
      dist: "About 330 km by road from Dhaka",
      time: "Around 9 to 10 hours by road",
      route: "Dhaka, Cumilla, Chattogram, Bandarban.",
      instr:
        "Many trekking routes require a local guide and a permit from the district administration. Arrange these in Bandarban town before you set off.",
      tips: [
        "Hire licensed local guides for treks; do not go alone.",
        "Carry water, snacks and a torch.",
        "Check the local security situation before travelling.",
        "Buy tickets for jeeps and rooms in advance in peak season.",
        "Do not litter in villages or on the trails.",
      ],
      nearby: ["spot_003", "spot_005"],
    },
    {
      id: "spot_005",
      name: "Kaptai Lake, Rangamati",
      division: "Chattogram",
      district: "Rangamati",
      category: "Lake",
      featured: true,
      v: 0,
      desc: "Kaptai Lake is the largest man-made lake in Bangladesh, and Rangamati town sits on its shores among forested islands. Boat trips reach the Hanging Bridge, Shuvolong waterfall, tribal villages and quiet coves.",
      history:
        "The lake was created in the early 1960s when the Kaptai Dam was built across the Karnaphuli river, submerging a large area of the valley. Rangamati was the seat of the Chakma Raja, and the Rajbari stands in the town.",
      why: "- Boat rides across the lake\n- Hanging Bridge over the water\n- Tribal Cultural Institute and Rajbari\n- Traditional weaving and handicrafts",
      best: "Winter",
      bestNote:
        "October to February is pleasant and clear. The monsoon is green but often wet and misty.",
      hours: "Boats run from about 8am to sunset",
      fee: "Boat hire is per boat; fees vary and are negotiable",
      lat: 22.6533,
      lng: 92.1733,
      bus: "Buses run from Dhaka to Rangamati (about 7 to 8 hours) from the Kamalapur and Sayedabad areas. Get off at Rangamati bus stand and take a CNG to the boat ghat.",
      train:
        "Take a train from Dhaka to Chattogram, then a bus to Rangamati (about 2.5 hours). " +
        CHECK,
      air: "Fly to Chattogram (CGP) then continue by road (about 75 km).",
      local:
        "- Speedboats and engine boats on the lake\n- CNG auto-rickshaws in town",
      dist: "About 300 km from Dhaka",
      time: "Around 7 to 9 hours by road",
      route: "Dhaka, Cumilla, Chattogram, Kaptai road, Rangamati.",
      tips: [
        "Wear a life jacket on boats.",
        "Agree on the route and price before boarding.",
        "Carry a rain jacket in the monsoon.",
        "Buy local textiles from cooperatives where possible.",
        "Do not litter in the lake.",
      ],
      nearby: ["spot_003", "spot_004"],
    },
    {
      id: "spot_006",
      name: "Ratargul Swamp Forest",
      division: "Sylhet",
      district: "Sylhet",
      category: "Forest",
      featured: true,
      v: 1,
      desc: "Ratargul is one of the few freshwater swamp forests in the world. In the rainy season the water rises and you glide by boat between the trunks of submerged trees.",
      history:
        "The forest lies in Gowainghat upazila beside the Goain river and was declared a reserved forest. It has grown up over a flooded plain that is dry for part of the year.",
      why: "- Paddle boats through flooded trees\n- Birdwatching and quiet water\n- A rare freshwater swamp habitat\n- Easy day trip from Sylhet city",
      best: "Monsoon",
      bestNote:
        "Boat trips are best from June to October when the forest is flooded. In the dry season, the water is low and boats often cannot enter.",
      hours: "Daylight hours",
      fee: "Small forest entry fee; boat hire is charged separately",
      lat: 25.012,
      lng: 91.927,
      bus: "Take a bus from Dhaka to Sylhet (about 5 to 6 hours) and get off at Kadamtali or Sylhet city. From there, take a CNG to Fatehpur/Gowainghat.",
      train:
        "Take an intercity train from Dhaka to Sylhet (about 7 hours), then a CNG or local bus towards Gowainghat. " +
        CHECK,
      air: "Fly Dhaka to Sylhet Osmani International Airport (ZYL) in about 45 minutes, then continue by CNG.",
      local:
        "- CNG or bus from Sylhet to Fatehpur/Gowainghat (about 1 hour)\n- Local boat from the forest edge (hire per boat)",
      dist: "About 260 km from Dhaka to Sylhet, then about 26 km to Ratargul",
      time: "Around 7 to 8 hours in total by road",
      route: "Dhaka, Sylhet, Gowainghat, then the Ratargul boat point.",
      tips: [
        "Wear a life jacket on boats.",
        "Do not litter; the swamp is sensitive.",
        "Avoid visiting after heavy storms.",
        "Carry insect repellent and light rain gear.",
        "Hire boats through official boatmen at the ghat.",
      ],
      nearby: ["spot_007"],
    },
    {
      id: "spot_007",
      name: "Jaflong",
      division: "Sylhet",
      district: "Sylhet",
      category: "Nature",
      featured: true,
      v: 3,
      desc: "Jaflong is a border area where the Piyain river spills out of the Meghalaya hills. Rocky riverbeds, tea gardens, stone-collecting boats and views of the Khasi hills make it a favourite day trip from Sylhet.",
      history:
        "The area is home to Khasi communities and has long been known for its stone and boulders, gathered from the river and carried by boat. Nearby Tamabil is one of the main land border crossings with India.",
      why: "- Hills of Meghalaya across the river\n- Boat rides on the Piyain\n- Khasi village life\n- Tea gardens and viewpoints nearby",
      best: "Winter",
      bestNote:
        "November to February has clear skies. In the monsoon the river is high and waterfalls appear on the hills.",
      hours: "Daylight hours",
      fee: "Entry is free; boat hire is extra",
      lat: 25.17,
      lng: 92.018,
      bus: "Take a bus from Dhaka to Sylhet, then a CNG or local bus to Jaflong (about 2 hours). Get off at Jaflong bazaar.",
      train:
        "Take a train from Dhaka to Sylhet, then continue by CNG or bus. " +
        CHECK,
      air: "Fly Dhaka to Sylhet Osmani International Airport (ZYL) and continue by road.",
      local:
        "- CNG or microbus from Sylhet town (about 1.5 to 2 hours)\n- Local boats on the river",
      dist: "About 320 km from Dhaka, about 60 km from Sylhet",
      time: "Around 8 to 9 hours by road, 2 hours from Sylhet",
      route: "Dhaka, Sylhet, Gowainghat, Jaflong.",
      instr:
        "Jaflong is at an international border. Stay on the Bangladesh side, do not cross without proper documents, and follow the guidance of local police and border guards.",
      tips: [
        "Do not cross into India without valid documents.",
        "Avoid walking near river edges after rain.",
        "Buy local snacks and betel-leaf specialities from village stalls.",
        "Carry cash; card acceptance is limited.",
        "Leave no rubbish on the riverbed.",
      ],
      nearby: ["spot_006"],
    },
    {
      id: "spot_008",
      name: "The Sundarbans",
      division: "Khulna",
      district: "Khulna",
      category: "Forest",
      featured: true,
      v: 2,
      desc: "The Sundarbans is the largest mangrove forest on Earth, a maze of tidal rivers and creeks shared with India. It is home to the Royal Bengal tiger, spotted deer, saltwater crocodiles and hundreds of bird species.",
      history:
        "The Bangladesh Sundarbans was declared a UNESCO World Heritage Site in 1997. The forest is named for the sundari tree, and local honey collectors and fishers have worked its waters for generations.",
      why: "- Mangrove creeks by boat\n- Chances to see deer, monkeys, crocodiles and birds\n- Sunrise over the forest\n- Traditional honey-collecting culture",
      best: "Winter",
      bestNote:
        "November to February is cooler and easier for travel and wildlife viewing. Summer is hot and humid; cyclones are possible in the monsoon and early autumn.",
      hours: "Daylight hours; entry with a licensed operator",
      fee: "Forest Department entry and permit fees apply, plus boat and guide fees",
      lat: 22.3,
      lng: 89.6,
      bus: "Take a bus from Dhaka to Khulna (about 5 to 8 hours via the Padma Bridge) and then to Mongla. Get off at Khulna Sheikh Russell bus stand, or continue to Mongla.",
      train:
        "Take a train to Khulna or Jashore via the Padma Bridge rail link, then continue by road. " +
        CHECK,
      air: "Fly Dhaka to Jashore Airport (JSR), then travel by road to Khulna (about 2 hours).",
      local:
        "- Licensed tour boats and launches from Khulna, Mongla or Harbaria\n- Small local boats for creek excursions\n- Karamjal, Katka and Hiron Point are the main tourist stops",
      dist: "About 270 km to Khulna, then 45 to 100 km to forest entry points",
      time: "Around 8 to 10 hours by road, then a 2-to-3-day boat tour",
      route:
        "Dhaka, Padma Bridge, Khulna or Mongla, then the boat route into the forest.",
      instr:
        "Entry to the Sundarbans requires permits and a licensed operator. Book through a recognised tour company and follow forest rangers' directions at all times.",
      tips: [
        "Never leave the boat or walk into the forest unescorted.",
        "Book only licensed operators and follow park rules.",
        "Bring sun protection, insect repellent and a rain jacket.",
        "Do not feed wildlife and never litter.",
        "Keep noise down to avoid disturbing animals.",
      ],
      nearby: ["spot_017"],
    },
    {
      id: "spot_009",
      name: "Kuakata",
      division: "Barishal",
      district: "Patuakhali",
      category: "Sea Beach",
      featured: true,
      v: 1,
      desc: "Kuakata is known as the Daughter of the Sea (Sagar Kannya). It is one of the few places in Bangladesh where you can watch both sunrise and sunset over the sea from the same beach.",
      history:
        "The name comes from a local word for a well (kua) dug by early Rakhine settlers. The Rakhine community still lives here and keeps a Buddhist temple and traditional crafts alive.",
      why: "- Sunrise and sunset from one beach\n- Wide beach and calm water\n- Rakhine culture and Buddhist temple\n- Nearby Gangamati forest and Fatra forest",
      best: "Winter",
      bestNote:
        "November to February is dry. Monsoon brings storms and rough seas.",
      hours: "Beach open all day",
      fee: "Free beach access",
      lat: 21.8167,
      lng: 90.1167,
      bus: "Buses run from Dhaka (Gabtoli and Sayedabad areas) to Kuakata via the Padma Bridge (about 6 to 8 hours). Get off at Kuakata Sea Beach bus stand.",
      train:
        "There is no train to Kuakata. Take a train to Khulna and continue by road, or use buses from Dhaka. " +
        CHECK,
      air: "Fly Dhaka to Barishal Airport (BZL), then travel by road to Kuakata (about 3.5 to 4 hours).",
      local:
        "- CNG auto-rickshaws and easy bikes along the beach\n- Motorbike taxis for short rides",
      dist: "About 320 km by road from Dhaka",
      time: "Around 6 to 8 hours by bus",
      route: "Dhaka, Padma Bridge, Barishal, Patuakhali, Kalapara, Kuakata.",
      tips: [
        "Book hotels early on weekends.",
        "Take care in the surf; there are few lifeguards.",
        "Visit the Buddhist temple respectfully.",
        "Carry cash; ATMs are limited.",
        "Try local seafood and dried fish.",
      ],
      nearby: [],
    },
    {
      id: "spot_010",
      name: "Paharpur Buddhist Vihara (Somapura Mahavihara)",
      division: "Rajshahi",
      district: "Naogaon",
      category: "Historical Place",
      featured: true,
      v: 0,
      desc: "Paharpur holds the ruins of Somapura Mahavihara, once one of the greatest Buddhist monasteries south of the Himalayas. A vast square courtyard surrounds a towering cruciform temple, and its walls are decorated with terracotta plaques.",
      history:
        "The monastery was built in the late 8th century by King Dharmapala of the Pala dynasty and remained active for about 400 years. It was declared a UNESCO World Heritage Site in 1985.",
      why: "- One of the largest Buddhist monastic ruins in South Asia\n- Hundreds of terracotta plaques showing daily life\n- A museum with excavated artefacts\n- Nearby Mahasthangarh and Kantajew",
      best: "Winter",
      bestNote:
        "November to February is cool and comfortable for walking around the site. Summer is very hot; monsoon paths can be muddy.",
      hours: "Roughly 9am to 5pm daily with a weekly closure; confirm locally",
      fee: "Small ticket; foreign visitors pay a higher rate. Confirm at the gate",
      lat: 25.031,
      lng: 88.9767,
      bus: "Buses run from Dhaka (Kallyanpur and Gabtoli areas) to Naogaon or Joypurhat (about 6 to 7 hours). From there take a local bus or CNG to Paharpur.",
      train:
        "Take an intercity train from Dhaka to Joypurhat or Jamalganj, then a CNG or bus to Paharpur. " +
        CHECK,
      air: "The nearest domestic airport is Saidpur (SPD) or Rajshahi (RJH); continue by road.",
      local:
        "- CNG or auto-rickshaw from Naogaon, Joypurhat or Jamalganj\n- Rickshaw vans around Badalgachhi",
      dist: "About 270 to 300 km by road from Dhaka",
      time: "Around 6 to 8 hours by road",
      route: "Dhaka, Bogura, Naogaon, Badalgachhi, Paharpur.",
      tips: [
        "Wear a hat and carry water in warm months.",
        "Do not climb on the ruins or touch the terracotta plaques.",
        "Visit the on-site museum.",
        "Start early to avoid midday heat.",
        "Hire a local guide for the history.",
      ],
      nearby: [],
    },
    {
      id: "spot_011",
      name: "Sonargaon (Panam Nagar)",
      division: "Dhaka",
      district: "Narayanganj",
      category: "Historical Place",
      featured: false,
      v: 2,
      desc: "Sonargaon was once the capital of medieval Bengal. Today its highlights are the crumbling merchant houses of Panam Nagar, the Goaldi Mosque and the Folk Art and Crafts Museum set in a tranquil garden.",
      history:
        "Sonargaon was a river port and regional capital from the 13th century. In the 19th century wealthy Hindu merchants built the row of townhouses that now stand along Panam Nagar's old street.",
      why: "- Walk along a street of 19th-century merchant houses\n- Folk Art and Crafts Museum\n- Historic mosques and tombs\n- Easy day trip from Dhaka",
      best: "Winter",
      bestNote:
        "November to February is comfortable for walking. The rainy season can flood parts of the old town.",
      hours: "Roughly 9am to 5pm; the museum has its own timetable",
      fee: "Small ticket for Panam Nagar and the museum",
      lat: 23.656,
      lng: 90.5999,
      bus: "Take a bus from Gulistan or Sayedabad to Mograpara (about 1.5 to 2 hours). Get off at Mograpara chowrasta and take a CNG or rickshaw.",
      train: "Trains are not the practical option; use a bus or a hired car.",
      air: "Not applicable; Sonargaon is a day trip by road from Dhaka.",
      local:
        "- CNG or auto-rickshaw from Mograpara\n- Rickshaw around Panam Nagar",
      dist: "About 27 km from Dhaka",
      time: "Around 1 to 2 hours depending on traffic",
      route: "Dhaka, Dhaka-Chattogram highway, Mograpara, Sonargaon.",
      tips: [
        "Wear comfortable shoes for the old street.",
        "Avoid traffic peaks on the Dhaka-Chattogram highway.",
        "Do not climb on unstable ruins.",
        "Carry water and sun protection.",
        "Ask before photographing residents.",
      ],
      nearby: ["spot_016"],
    },
    {
      id: "spot_012",
      name: "Tanguar Haor",
      division: "Sylhet",
      district: "Sunamganj",
      category: "Haor",
      featured: true,
      v: 1,
      desc: "Tanguar Haor is a huge wetland of lakes, marshes and villages in the northeast. In the rainy season it is a shimmering inland sea; in winter it hosts hundreds of thousands of migratory birds.",
      history:
        "Tanguar Haor was declared a Ramsar site in 2000 in recognition of its importance for waterbirds and fish. It supports the livelihoods of thousands of fishing families.",
      why: "- Boat houses on open water\n- Migratory birds in winter\n- Sunrise and sunset over the haor\n- Village life on stilts",
      best: "Monsoon",
      bestNote:
        "July to October is best for water-scape and boating. December to February is best for migratory birds.",
      hours: "Daylight hours",
      fee: "Entry fees and boat hire vary; confirm before booking",
      lat: 25.15,
      lng: 91.05,
      bus: "Take a bus from Dhaka to Sunamganj (about 6 to 7 hours) from the Sayedabad area. Get off in Sunamganj town and take a CNG or bus to Tahirpur.",
      train:
        "Take a train to Sylhet, then continue by road to Sunamganj (about 2 hours). " +
        CHECK,
      air: "Fly Dhaka to Sylhet (ZYL), then travel by road via Sunamganj (about 2.5 hours).",
      local:
        "- CNG or bus to Tahirpur\n- Engine boats or boat houses from Tahirpur\n- Local guides for bird watching",
      dist: "About 300 km by road from Dhaka to Sunamganj",
      time: "Around 7 to 9 hours to Sunamganj",
      route: "Dhaka, Sylhet or Sunamganj, Tahirpur, then boat.",
      tips: [
        "Wear a life jacket on boats.",
        "Book boats through trusted operators.",
        "Carry drinking water and snacks.",
        "Do not disturb birds or nests.",
        "Check weather: storms can rise quickly.",
      ],
      nearby: [],
    },
    {
      id: "spot_013",
      name: "Sreemangal Tea Gardens",
      division: "Sylhet",
      district: "Moulvibazar",
      category: "Nature",
      featured: true,
      v: 0,
      desc: "Sreemangal is the tea capital of Bangladesh, a region of rolling green estates, lemon and pineapple orchards and quiet forest trails. It is a restful base with birdwatching and village visits.",
      history:
        "Tea planting in Sylhet began in the mid-19th century under British planters. Sreemangal remains at the centre of the industry, with several large tea estates open to visitors.",
      why: "- Walks through tea estates\n- Seven-colour tea at a local tea cabin\n- Lawachara National Park nearby\n- Khasi and Manipuri villages",
      best: "Winter",
      bestNote:
        "October to March is dry and comfortable. Monsoon is green but wet; tea plucking is at its peak in the rainy months.",
      hours: "Tea estates are open in daylight; ask the manager for permission",
      fee: "Usually free; some estates ask for a small fee",
      lat: 24.3065,
      lng: 91.7296,
      bus: "Take a bus from Dhaka to Sreemangal (about 4 to 5 hours). Get off at Sreemangal bus stand and take a CNG.",
      train:
        "Take an intercity train from Dhaka to Sreemangal station (about 4 to 5 hours). " +
        CHECK,
      air: "Fly Dhaka to Sylhet (ZYL), then take a bus or car to Sreemangal (about 2 hours).",
      local:
        "- CNG and rickshaw in town\n- Rickshaw vans or hired CNG for the tea estates",
      dist: "About 190 km from Dhaka",
      time: "Around 4 to 5 hours by train or bus",
      route: "Dhaka, Bhairab, Sreemangal.",
      tips: [
        "Ask permission before entering a tea estate.",
        "Wear covered shoes; leeches are possible in the monsoon.",
        "Buy tea directly from estates for the best price.",
        "Respect workers' privacy when photographing.",
        "Carry insect repellent.",
      ],
      nearby: ["spot_014", "spot_015"],
    },
    {
      id: "spot_014",
      name: "Lawachara National Park",
      division: "Sylhet",
      district: "Moulvibazar",
      category: "Eco Park",
      featured: false,
      v: 3,
      desc: "Lawachara is a protected semi-evergreen forest that is home to the endangered western hoolock gibbon, monkeys, and many birds. Well-marked trails run through the forest close to Sreemangal.",
      history:
        "The park was established in 1996 to protect one of the last areas of mixed tropical rain forest in the country. A Khasi village (punji) lies at the edge of the park.",
      why: "- A chance to hear or see the hoolock gibbon\n- Nature trails through forest\n- Bird watching\n- Visit to a Khasi village",
      best: "Winter",
      bestNote:
        "November to February is easiest for walking; early morning is best for wildlife.",
      hours: "Around 8am to 5pm; guides recommended",
      fee: "Small entry ticket; guides are charged separately",
      lat: 24.325,
      lng: 91.783,
      bus: "Take a bus or train from Dhaka to Sreemangal and continue by CNG to the park entrance (about 15 to 25 minutes).",
      train: "Take an intercity train from Dhaka to Sreemangal. " + CHECK,
      air: "Fly Dhaka to Sylhet (ZYL) and continue by road via Sreemangal.",
      local: "- CNG from Sreemangal (about 8 km)\n- Walking on marked trails",
      dist: "About 200 km from Dhaka",
      time: "Around 4.5 to 5.5 hours",
      route: "Dhaka, Sreemangal, Lawachara.",
      tips: [
        "Hire a local guide from the ranger office.",
        "Stay on marked trails.",
        "Keep noise low to spot wildlife.",
        "Avoid strong perfumes and bright clothes.",
        "Never feed animals.",
      ],
      nearby: ["spot_013", "spot_015"],
    },
    {
      id: "spot_015",
      name: "Madhabkunda Waterfall",
      division: "Sylhet",
      district: "Moulvibazar",
      category: "Waterfall",
      featured: true,
      v: 2,
      desc: "Madhabkunda is one of the largest waterfalls in Bangladesh, plunging over a rocky cliff into a pool in the forested Barlekha hills. The spray, the forest and the crowds of bathers make it a lively weekend spot.",
      history:
        "The falls are considered sacred by local Hindus, who visit for festivals. They sit in a forested area that has been developed as a park.",
      why: "- Tall waterfall with a wide pool\n- Forest trails around the falls\n- Nearby tea gardens\n- A short day trip from Sreemangal",
      best: "Monsoon",
      bestNote:
        "June to October has the strongest flow. In the dry season, the falls can shrink to a trickle.",
      hours: "Roughly 8am to 5pm",
      fee: "Small entry ticket",
      lat: 24.5333,
      lng: 92.2167,
      bus: "Take a bus from Dhaka to Moulvibazar or Kulaura (about 5 to 6 hours), then a local bus or CNG to Madhabkunda.",
      train:
        "Take a train from Dhaka to Kulaura or Sreemangal, then continue by road. " +
        CHECK,
      air: "Fly to Sylhet (ZYL), then travel by road (about 2 hours).",
      local:
        "- CNG or hired car from Kulaura or Sreemangal\n- Stairs and short trail to the pool",
      dist: "About 240 km from Dhaka",
      time: "Around 6 to 7 hours by road",
      route: "Dhaka, Sreemangal, Kulaura, Barlekha, Madhabkunda.",
      tips: [
        "Do not swim in fast water or after heavy rain.",
        "Wear shoes with grip; rocks are slippery.",
        "Do not litter around the falls.",
        "Visit on a weekday to avoid crowds.",
        "Carry a change of clothes.",
      ],
      nearby: ["spot_013", "spot_014"],
    },
    {
      id: "spot_016",
      name: "Lalbagh Fort",
      division: "Dhaka",
      district: "Dhaka",
      category: "Historical Place",
      featured: false,
      v: 1,
      desc: "Lalbagh Fort is an unfinished Mughal-era fort in Old Dhaka, with a mosque, a tomb and a tidy garden. It is one of the calmest places in the old city.",
      history:
        "Construction began in 1678 under Prince Muhammad Azam, son of Emperor Aurangzeb, but stopped in 1684 when the governor Shaista Khan's daughter Pari Bibi died. Her tomb sits in the centre of the complex.",
      why: "- Mughal architecture and gardens\n- Pari Bibi's tomb and the fort museum\n- A calm break in busy Old Dhaka\n- Close to Ahsan Manzil and Sadarghat",
      best: "Winter",
      bestNote:
        "November to February is best for a garden visit. Monsoon rain can make old paths wet.",
      hours: "Roughly 10am to 5pm; weekly closure applies, so confirm locally",
      fee: "Small entry ticket",
      lat: 23.7186,
      lng: 90.3883,
      bus: "Local buses go through Old Dhaka; take a bus to Azimpur or Lalbagh Road. From Gulistan, a rickshaw takes 15 to 20 minutes.",
      train:
        "From Kamalapur station take a rickshaw or ride-share to Lalbagh (about 30 to 45 minutes).",
      air: "From Hazrat Shahjalal International Airport take a taxi or ride-share (about 45 to 90 minutes).",
      local:
        "- Ride-share and CNG\n- Rickshaw in Old Dhaka lanes\n- Walk from Lalbagh Road",
      dist: "Within Dhaka",
      time: "Depends on traffic; allow 45 to 90 minutes from most parts of Dhaka",
      route: "Head to Azimpur or Lalbagh Road via Nazimuddin Road.",
      tips: [
        "Avoid peak-hour traffic.",
        "Keep valuables secure in crowded lanes.",
        "Dress modestly when visiting the mosque.",
        "Combine with Ahsan Manzil and Sadarghat.",
        "Watch your step on uneven brick paths.",
      ],
      nearby: ["spot_011"],
    },
    {
      id: "spot_017",
      name: "Sixty Dome Mosque (Shat Gombuj)",
      division: "Khulna",
      district: "Bagerhat",
      category: "Mosque",
      featured: false,
      v: 3,
      desc: "Shat Gombuj Masjid is the largest medieval mosque in Bangladesh, with 77 domes and dozens of stone pillars set in a green landscape. It is the centrepiece of the historic mosque city of Bagerhat.",
      history:
        "The mosque was built in the 15th century by the Sufi saint and general Khan Jahan Ali, who founded a city here. The site was declared a UNESCO World Heritage Site in 1985.",
      why: "- Impressive brick architecture\n- Khan Jahan Ali's tomb and Ghora Dighi pond\n- Peaceful setting among lakes\n- A perfect stop on the way to the Sundarbans",
      best: "Winter",
      bestNote:
        "November to February is cool. Summers are hot; monsoon paths can be wet.",
      hours: "Roughly 9am to 5pm; prayer times apply",
      fee: "Small entry ticket",
      lat: 22.6742,
      lng: 89.7422,
      bus: "Take a bus from Dhaka to Khulna, then a bus or CNG to Bagerhat (about 1 hour). Get off at Bagerhat bus stand.",
      train:
        "Take a train to Khulna or Jashore, then continue by road. " + CHECK,
      air: "Fly Dhaka to Jashore (JSR), then travel by road (about 2 hours).",
      local:
        "- CNG or rickshaw from Bagerhat town\n- Walking or cycling around the site",
      dist: "About 275 km from Dhaka",
      time: "Around 6 to 8 hours by road",
      route: "Dhaka, Padma Bridge, Mawa, Bagerhat.",
      tips: [
        "Dress modestly and remove shoes when required.",
        "Respect worshippers and prayer times.",
        "Carry water and a hat.",
        "Visit early to avoid crowds.",
        "Do not climb on the ruins.",
      ],
      nearby: ["spot_008"],
    },
    {
      id: "spot_018",
      name: "Mainamati",
      division: "Chattogram",
      district: "Cumilla",
      category: "Archaeological Site",
      featured: false,
      v: 2,
      desc: "Mainamati is a ridge of Buddhist ruins near Cumilla, with Shalban Vihara, Kotila Mura and Charpatra Mura. It holds the remains of monasteries from the 7th to 12th centuries.",
      history:
        "The site was the centre of the Deva and Chandra dynasties. Excavations uncovered monasteries, temples and terracotta plaques, and a museum displays the finds.",
      why: "- Well-preserved monastery plans\n- Terracotta plaques and bronze artefacts\n- Museum with ancient coins\n- Easy day trip from Dhaka",
      best: "Winter",
      bestNote:
        "November to February is comfortable. The rainy months can be muddy.",
      hours: "Roughly 9am to 5pm; weekly closure applies",
      fee: "Small entry ticket",
      lat: 23.435,
      lng: 91.135,
      bus: "Take a bus from Dhaka (Sayedabad or Gulistan) to Cumilla (about 2.5 to 3 hours). From there, take a CNG to Mainamati.",
      train:
        "Take an intercity train from Dhaka to Cumilla station, then a CNG to the site. " +
        CHECK,
      air: "Not applicable; road or rail is faster.",
      local:
        "- CNG or auto-rickshaw from Cumilla town\n- Walking between the sites",
      dist: "About 100 km from Dhaka",
      time: "Around 2.5 to 3 hours",
      route: "Dhaka, Dhaka-Chattogram highway, Cumilla, Mainamati.",
      tips: [
        "Wear a hat and carry water.",
        "Do not climb or touch the plaques.",
        "Visit the museum.",
        "Start early on hot days.",
        "Ask the guide about the history.",
      ],
      nearby: [],
    },
    {
      id: "spot_019",
      name: "Kantajew Temple",
      division: "Rangpur",
      district: "Dinajpur",
      category: "Temple",
      featured: false,
      v: 1,
      desc: "Kantajew (Kantaji) Temple is a three-storeyed terracotta temple, thought to be the most ornate in Bangladesh. Its walls are covered with intricate plaques of scenes from epics and village life.",
      history:
        "The temple was built in the early 18th century by Maharaja Pran Nath Roy of Dinajpur and completed by his son Ramnath. It is on Bangladesh's tentative list for UNESCO World Heritage.",
      why: "- Remarkable terracotta relief work\n- Traditional Bengali temple architecture\n- Quiet setting near the river\n- Combine with Dinajpur's rajbari",
      best: "Winter",
      bestNote:
        "November to February is cool and dry; summer is hot and dusty.",
      hours: "Roughly 9am to 5pm daily",
      fee: "Small entry ticket",
      lat: 25.799,
      lng: 88.668,
      bus: "Take a bus from Dhaka (Kallyanpur or Mohakhali) to Dinajpur (about 8 to 9 hours). From there, take a CNG or auto-rickshaw to Kantanagar.",
      train:
        "Take Ekota or Drutajan Express from Dhaka to Dinajpur, then a CNG. " +
        CHECK,
      air: "Fly Dhaka to Saidpur (SPD), then travel by road (about 1.5 hours).",
      local: "- CNG, auto-rickshaw or easy bike\n- Rickshaw vans in Kantanagar",
      dist: "About 410 km from Dhaka to Dinajpur, then about 20 km",
      time: "Around 8 to 10 hours by road",
      route: "Dhaka, Bogura, Rangpur or Dinajpur, Kantanagar.",
      tips: [
        "Do not touch the plaques.",
        "Dress modestly and follow temple rules.",
        "Carry water in warm months.",
        "Visit in the morning for softer light.",
        "Combine with other Dinajpur landmarks.",
      ],
      nearby: [],
    },
    {
      id: "spot_020",
      name: "Birishiri",
      division: "Mymensingh",
      district: "Netrokona",
      category: "Nature",
      featured: false,
      v: 3,
      desc: "Birishiri is a border area in Durgapur with a pale white-clay hillside, the Someshwari river, and views of the Garo hills of Meghalaya. The blue-green water of the pond in the clay quarry is a highlight.",
      history:
        "The area is home to Garo, Hajong and Bengali communities and has long been known for its china clay. Nearby, the Cultural Academy shows Garo art and life.",
      why: "- White clay hills and turquoise water\n- Views of the Garo hills\n- Garo culture and handicrafts\n- Calm river scenery",
      best: "Winter",
      bestNote:
        "November to February has clear skies. In the monsoon, roads can be muddy and the clay area is slippery.",
      hours: "Daylight hours",
      fee: "Usually free; local guides may ask a fee",
      lat: 25.15,
      lng: 90.68,
      bus: "Take a bus from Dhaka (Mohakhali) to Durgapur or Netrokona (about 4 to 6 hours). From there, take a CNG or auto to Birishiri.",
      train: "Take a train to Mymensingh, then a bus to Durgapur. " + CHECK,
      air: "No commercial flights nearby; travel by road from Dhaka.",
      local:
        "- CNG or auto-rickshaw from Durgapur\n- Boat on the Someshwari river",
      dist: "About 180 km by road from Dhaka",
      time: "Around 5 to 6 hours",
      route: "Dhaka, Mymensingh, Netrokona, Durgapur, Birishiri.",
      instr:
        "Birishiri is a border area. Follow local guidance, keep to the Bangladeshi side and do not cross without valid documents.",
      tips: [
        "Do not cross the border.",
        "Avoid the slippery clay slopes after rain.",
        "Respect Garo customs.",
        "Carry water and snacks.",
        "Take your rubbish with you.",
      ],
      nearby: [],
    },
  ];

    const BASE_SPOTS = RAW.map((o, i) =>
    make(
      Object.assign(
        { created: new Date(Date.UTC(2026, 0, 10, 9, i)).toISOString() },
        o,
      ),
    ),
  );

  /* >>> ADMIN_MANAGED_START (do not edit by hand; written by the admin panel) */
  EB.ADMIN_DATA = {
  "rev": 6,
  "added": [
    {
      "id": "spot_021",
      "name": "Langlok Waterfall",
      "division": "Chattogram",
      "district": "Bandarban",
      "category": "Waterfall",
      "featured": true,
      "description": "Langlok Waterfall is a beautiful and majestic waterfall located in Bandarban, Bangladesh. It is surrounded by green hills, dense forests, and natural streams. During the monsoon, the waterfall becomes more powerful and spectacular due to the increased flow of water. The journey to Langlok involves trekking through scenic and hilly trails. Its peaceful environment and untouched natural beauty attract adventure-loving travelers. The surrounding landscape offers excellent opportunities for photography and nature exploration. Langlok is an ideal destination for those who want to experience the raw beauty of Bangladesh’s hill regions.",
      "history": "Langlok Waterfall is a natural waterfall located in the remote hill region of Bandarban, Bangladesh. The waterfall has long been known locally as a part of the surrounding hills, forests, and natural streams. In recent years, Langlok has gained attention among adventure seekers and nature-loving travelers because of its scenic beauty and challenging trekking routes. The surrounding area reflects the natural landscape and indigenous cultural heritage of the Bandarban hill region. As tourism in the area has gradually increased, Langlok has become a notable destination for travelers seeking an off-the-beaten-path experience.",
      "whyVisit": "Langlok Waterfall is an amazing destination for adventure, nature, and thrill-loving travelers. A scenic boat ride through the hill streams, surrounded by lush green hills and stunning landscapes, makes the journey even more exciting and memorable. The challenging trekking trail offers an adventurous experience and brings visitors closer to nature. Travelers can enjoy the breathtaking waterfall, capture beautiful photographs, and experience the untouched beauty of the hills. For those who love nature, adventure, and unique experiences, Langlok Waterfall is truly a destination worth exploring.",
      "bestTime": "Monsoon",
      "bestTimeNote": "Monsoon is the best season to visit Langlok Waterfall, as the water flow is strongest and the surrounding hills become lush and green. However, the trails can be slippery, so visitors should travel carefully.",
      "hours": "Open throughout the day, as Langlok Waterfall is a natural attraction without fixed opening or closing hours.",
      "entryFee": "Free, because Langlok Waterfall is a natural site without an official entrance ticket.",
      "mainImage": "https://i.ibb.co.com/C5BvVQ2X/Langlok-waterfall-8.jpg",
      "images": [
        "https://i.ibb.co.com/sJQGCSph/Langlok-waterfall-1.jpg",
        "https://i.ibb.co.com/FL74WTcL/Langlok-waterfall-4.jpg",
        "https://i.ibb.co.com/xqWW25NM/Langlok-waterfall-7.jpg"
      ],
      "video": "https://youtu.be/AoVq4wZrtzE",
      "latitude": 21.70829,
      "longitude": 92.48426,
      "travelGuide": {
        "bus": "",
        "train": "",
        "air": "",
        "localTransport": "",
        "distance": "Approximately 340 km from Dhaka to Bandarban, followed by the remote route to Langlok Waterfall.",
        "travelTime": "Around 12–15 hours or more, depending on road conditions, boat travel, and trekking time.",
        "route": "Dhaka → Bandarban → Thanchi → Tindu → Big Stone → Langlok Waterfall.",
        "instructions": "Important Instructions: Visitors should travel with a local guide, follow local authority and community guidelines, carry sufficient food and drinking water, wear suitable trekking shoes, and exercise extra caution during the monsoon because the boat journey and hilly trails can be slippery and challenging."
      },
      "nearbyAttractions": [],
      "safetyTips": [
        "Travel with an experienced local guide, wear proper trekking shoes, carry enough drinking water and essential supplies, follow local rules, avoid risky areas near the waterfall, and be especially careful on slippery trails and during boat travel in the monsoon season."
      ],
      "createdAt": "2026-09-24T10:06:30.998Z",
      "updatedAt": "2026-09-24T12:48:57.969Z"
    },
    {
      "id": "spot_022",
      "name": "Nafakhum Waterfall",
      "division": "Chattogram",
      "district": "Bandarban",
      "category": "Waterfall",
      "featured": true,
      "description": "AI Mode conversation: nafakhum waterfallnafakhum waterfallNafakhum Waterfall is widely regarded as the \"Niagara of Bangladesh\" because it is the country's largest waterfall by water volume. Tucked deep within the remote hills of Thanchi, Bandarban, this stunning cascade drops roughly 25 to 30 feet where the Remakri Canal abruptly plunges into a rugged gorge. The name originates from the Marma words \"Ngafa\" (a type of local fish) and \"Khong\" or \"Khum\" (meaning waterfall), capturing the raw, wild essence of the indigenous Hill Tracts.Due to the heavy mist and roaring water crashing over ancient boulders, visitors frequently witness vibrant rainbows forming in the sunlight. Reaching this hidden paradise is considered a high-effort, high-reward trekking milestone for adventure seekers.🗺️ Geographic Location & Travel OverviewBecause the waterfall is hidden deep in a remote, protected zone, traveling here requires a step-by-step combination of off-road driving, boat navigation, and hiking:\n[Rich media excluded from paste]\n\nTravel PhaseRoute & Mode of TransportEstimated DurationKey Highlights / DetailsPhase 1Dhaka to Bandarban via overnight highway bus.~7–8 hoursBuses depart from Dhaka terminal locations like Gulistan or Sayedabad.Phase 2Bandarban to Thanchi via local bus or 4WD Chander Gari (Jeep).~4–4.5 hoursWinding mountain passes showcasing spectacular views of Nilgiri and Chimbuk hills.Phase 3Thanchi to Remakri via traditional engine boat upstream on the Sangu River.~2–3 hoursA breathtaking river journey navigating through massive boulders like Bara Pathar.Phase 4Remakri to Nafakhum via foot trekking along the riverbed and forest.~2–3 hoursA challenging hike over slippery rocks and shallow streams.🎒 Essential Travel Requirements & TipsMandatory Guide & Permits: You must register and secure security clearances from the local police and Border Guard Bangladesh (BGB) camp in Thanchi. Hiring a certified local guide from the Thanchi market is legally required.Accommodation: There are no commercial resorts at the waterfall. Travelers usually stay overnight in traditional wooden cottages hosted by the indigenous Marma or Tripura communities in Remakri Bazar before trekking the next morning.Slippery Trails: The rocks along the Remakri canal are incredibly smooth and hazardous. Pack high-traction trekking sandals or water shoes, a dry bag for electronics, and basic medical supplies.Best Time to Visit: The peak window is from September to November. During these autumn months, the water volume remains massive and powerful, yet the trails and river currents are safe enough to navigate comfortably. (The peak monsoon season often forces temporary safety closures due to flash floods).Are you planning an upcoming trek? I can help you with:Estimating a total cost budget for a groupSharing contact details or requirements for hiring local guidesRecommending nearby trails like Amiakhum, Velakhum, or SatvaiakhumWikipediaNafakhum Waterfall - WikipediaNafakhum Waterfall - Wikipedia Nafakhum Waterfall Article Learn more This article needs more citations. Please help improve this a...ভ্রমণ গাইডনাফাখুম জলপ্রপাত, বান্দরবান - নাফাখুম ভ্রমণের সকল প্রয়োজনীয় তথ্যনাফাখুম জলপ্রপাত, বান্দরবান - নাফাখুম ভ্রমণের সকল প্রয়োজনীয় তথ্য ছবিঃ ভ্রমণগাইড নাফাখুম নাফাখুম জলপ্রপাত (Nafakhum Waterfall) বা...TripadvisorNafa-khum - All You SHOULD Know Before Going 2026 (with Reviews)Nafakhum is a natural waterfall in the Remakri region of Bandarban, Bangladesh. It's a remote area that's about a 2–3 hour trek fr...Show alltour er best time kokhon ebong keno dui line e likhoনাফাখুম ট্যুরের জন্য সবচেয়ে সেরা সময় হলো সেপ্টেম্বর থেকে নভেম্বর (বর্ষার ঠিক পর)। এ সময়ে জলপ্রপাতে পানির ভরপুর ও প্রমত্ত রূপ দেখা যায়, আবার একই সাথে নদী ও পাহাড়ি ট্রেইলগুলো বর্ষার তুলনায় অনেক নিরাপদ ও যাতায়াতের উপযোগী থাকে।আপনি কি এই ট্রিপের জন্য একটি ট্যুর প্ল্যান বা বাজেট জানতে চান, নাকি থাঞ্চিতে গাইড ও পারমিট পাওয়ার প্রক্রিয়া সম্পর্কে জানতে চান?english e daoThe best time to visit Nafakhum is from September to November (right after the monsoon). During this period, the waterfall is at its most powerful and breathtaking volume, while the river and trekking trails become safe and manageable to navigate.Would you like me to help you create a detailed tour itinerary for these months, or calculate a budget breakdown for your group?DescriptionNafakhum Waterfall is a magnificent cascade nestled deep within the Thanchi Upazila of Bandarban, Bangladesh. Renowned as the country's most powerful waterfall by water volume, it is formed where the Remakri Canal takes a sudden, dramatic drop over giant limestone boulders into a rugged stone gorge. Surrounded by dense, untouched tropical forests and majestic hills, the waterfall generates a permanent mist that frequently creates vibrant rainbows in the sunlight.\n\nThe destination is a sacred part of the local indigenous Marma and Tripura communities, with its name originating from the Marma words \"Ngafa\" (a native fish species) and \"Khum\" (meaning waterfall). Because of its remote location, reaching Nafakhum is a classic adventure milestone that requires journeying by off-road jeep, navigating the rapids of the Sangu River in a traditional engine boat, and trekking on foot through wild river trails.",
      "history": "Nafakhum Waterfall has a history deeply rooted in indigenous folklore and ecological isolation before it became Bangladesh's ultimate adventure destination. For centuries, this hidden canyon was known only to the local Marma and Tripura communities, who named it after the Marma words \"Nafa\" (a native fish species) and \"Khum\" (waterfall) Niagara of Bangladesh. According to local tribal legend, a unique flying fish called \"Nating\" would swim upstream but could not leap over the massive 30-foot drop, causing them to gather in large numbers at the bottom of the falls, which made it a historic fishing sanctuary. Geologically formed by the thousands of years of water erosion from the Remakri Canal cutting through the limestone hills of Bandarban, it remained completely cut off from the modern world until the mid-2000s. Between 2005 and 2008, early extreme-backpackers finally charted the route, and as word spread across travel blogs about its massive water volume, it was dubbed the \"Niagara of Bangladesh\" Niagara of Bangladesh. Today, it has transformed into a regulated eco-tourism zone monitored by the Border Guard Bangladesh (BGB), providing a crucial livelihood for the remote mountain communities while preserving its wild heritage.",
      "whyVisit": "You should visit Nafakhum Waterfall to experience the raw, untouched beauty of the \"Niagara of Bangladesh,\" where you can witness the country’s most powerful water volume roaring through a dramatic stone gorge. The journey itself is an unforgettable, multi-layered adventure that combines off-road jeep rides, thrilling boat navigation through the rapids of the Sangu River, and scenic trekking along wild riverbeds. It offers a rare opportunity to disconnect from modern life, immerse yourself in the rich culture and hospitality of the indigenous Marma and Tripura communities, and witness vibrant, natural rainbows forming over ancient boulders.",
      "bestTime": "Monsoon",
      "bestTimeNote": "During this period, the waterfall is at its most powerful and breathtaking volume, while the river and trekking trails become safe and manageable to navigate.",
      "hours": "Open throughout the day, as Langlok Waterfall is a natural attraction without fixed opening or closing hours.",
      "entryFee": "Free, because Langlok Waterfall is a natural site without an official entrance ticket.",
      "mainImage": "https://i.ibb.co.com/jvmjZJCN/IMG-20260530-100335-1.jpg",
      "images": [
        "https://i.ibb.co.com/6cRxnr68/unnamed-2.webp",
        "https://i.ibb.co.com/tw2MCJk1/IMG-20260530-102131.jpg",
        "https://i.ibb.co.com/SwSHLzTc/1a-1.jpg",
        "https://i.ibb.co.com/wZXs3WFJ/nafakhum-waterfall-incredible-look-morning-180481066.jpg",
        "https://i.ibb.co.com/1trqPpbz/unnamed-1.webp"
      ],
      "video": "",
      "latitude": 21.720349621161315,
      "longitude": 92.53418390941398,
      "travelGuide": {
        "bus": "",
        "train": "",
        "air": "",
        "localTransport": "",
        "distance": "",
        "travelTime": "",
        "route": "",
        "instructions": ""
      },
      "nearbyAttractions": [],
      "safetyTips": [],
      "createdAt": "2026-09-26T00:56:28.174Z",
      "updatedAt": "2026-09-26T00:56:28.174Z"
    }
  ],
  "removed": []
};
  /* <<< ADMIN_MANAGED_END */

  // merge admin changes on top of the base seed
  const removedIds = new Set(EB.ADMIN_DATA.removed || []);
  const addedById = new Map((EB.ADMIN_DATA.added || []).map((s) => [s.id, s]));
  const merged = BASE_SPOTS
    .filter((s) => !removedIds.has(s.id))
    .map((s) => addedById.get(s.id) || s);
  (EB.ADMIN_DATA.added || []).forEach((s) => {
    if (!BASE_SPOTS.some((b) => b.id === s.id)) merged.push(s);
  });
  EB.SEED_SPOTS = merged;
})();
