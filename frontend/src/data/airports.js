// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

export const AIRPORTS = [
  {
    id: "LFPG",
    iata: "CDG",
    icao: "LFPG",
    name: "Paris-Charles de Gaulle",
    city: "Paris",
    country: "France",
    latitude: 49.0097,
    longitude: 2.5479,
    isSite: true
  },
  {
    id: "LFPO",
    iata: "ORY",
    icao: "LFPO",
    name: "Paris-Orly",
    city: "Paris",
    country: "France",
    latitude: 48.7233,
    longitude: 2.3794,
    isSite: true
  },
  {
    id: "LFLL",
    iata: "LYS",
    icao: "LFLL",
    name: "Lyon-Saint-Exupéry",
    city: "Lyon",
    country: "France",
    latitude: 45.7201,
    longitude: 5.0906,
    isSite: true
  },
  {
    id: "LFBO",
    iata: "TLS",
    icao: "LFBO",
    name: "Toulouse-Blagnac",
    city: "Toulouse",
    country: "France",
    latitude: 43.6291,
    longitude: 1.3644,
    isSite: true
  },
  {
    id: "EGLL",
    iata: "LHR",
    icao: "EGLL",
    name: "Londres Heathrow",
    city: "Londres",
    country: "Royaume-Uni",
    latitude: 51.4706,
    longitude: -0.4619,
    isSite: false
  },
  {
    id: "EDDF",
    iata: "FRA",
    icao: "EDDF",
    name: "Francfort",
    city: "Francfort",
    country: "Allemagne",
    latitude: 50.0333,
    longitude: 8.5706,
    isSite: false
  },
  {
    id: "KJFK",
    iata: "JFK",
    icao: "KJFK",
    name: "New York JFK",
    city: "New York",
    country: "États-Unis",
    latitude: 40.6413,
    longitude: -73.7781,
    isSite: false
  },
  {
    id: "KLAX",
    iata: "LAX",
    icao: "KLAX",
    name: "Los Angeles LAX",
    city: "Los Angeles",
    country: "États-Unis",
    latitude: 33.9416,
    longitude: -118.4085,
    isSite: false
  },
  {
    id: "OMDB",
    iata: "DXB",
    icao: "OMDB",
    name: "Dubai International",
    city: "Dubai",
    country: "Émirats arabes unis",
    latitude: 25.2532,
    longitude: 55.3657,
    isSite: false
  },
  {
    id: "VHHH",
    iata: "HKG",
    icao: "VHHH",
    name: "Hong Kong",
    city: "Hong Kong",
    country: "R.A.S. de Hong Kong",
    latitude: 22.308,
    longitude: 113.9185,
    isSite: false
  },
  {
    id: "RJTT",
    iata: "HND",
    icao: "RJTT",
    name: "Tokyo Haneda",
    city: "Tokyo",
    country: "Japon",
    latitude: 35.5494,
    longitude: 139.7798,
    isSite: false
  },
  {
    id: "ZBAA",
    iata: "PEK",
    icao: "ZBAA",
    name: "Pékin-Capitale",
    city: "Pékin",
    country: "Chine",
    latitude: 40.08,
    longitude: 116.5846,
    isSite: false
  },
  {
    id: "WSSS",
    iata: "SIN",
    icao: "WSSS",
    name: "Singapour Changi",
    city: "Singapour",
    country: "Singapour",
    latitude: 1.3644,
    longitude: 103.9915,
    isSite: false
  },
  {
    id: "YSSY",
    iata: "SYD",
    icao: "YSSY",
    name: "Sydney Kingsford Smith",
    city: "Sydney",
    country: "Australie",
    latitude: -33.9399,
    longitude: 151.1753,
    isSite: false
  },
  {
    id: "CYYZ",
    iata: "YYZ",
    icao: "CYYZ",
    name: "Toronto Pearson",
    city: "Toronto",
    country: "Canada",
    latitude: 43.6777,
    longitude: -79.6248,
    isSite: false
  },
  {
    id: "SAEZ",
    iata: "EZE",
    icao: "SAEZ",
    name: "Buenos Aires Ezeiza",
    city: "Buenos Aires",
    country: "Argentine",
    latitude: -34.8222,
    longitude: -58.5358,
    isSite: false
  },
  {
    id: "FAOR",
    iata: "JNB",
    icao: "FAOR",
    name: "Johannesburg OR Tambo",
    city: "Johannesburg",
    country: "Afrique du Sud",
    latitude: -26.1337,
    longitude: 28.242,
    isSite: false
  },
  {
    id: "OMAA",
    iata: "AUH",
    icao: "OMAA",
    name: "Abu Dhabi International",
    city: "Abu Dhabi",
    country: "Émirats arabes unis",
    latitude: 24.4539,
    longitude: 54.3773,
    isSite: false
  },
  {
    id: "VIDP",
    iata: "DEL",
    icao: "VIDP",
    name: "New Delhi Indira Gandhi",
    city: "New Delhi",
    country: "Inde",
    latitude: 28.5562,
    longitude: 77.100,
    isSite: false
  }
];
