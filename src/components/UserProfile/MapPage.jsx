import React, { useState, useEffect, useRef } from "react";

import {

  AlertTriangle,

  Layers,

  ToggleRight,

  Search,

  Download,

} from "lucide-react";

import {

  MapContainer,

  TileLayer,

  Marker,

  Popup,

  Polygon,

  useMapEvents,

} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import axios from "axios";





// Fix Leaflet default icons

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:

    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

});



export default function MapPage() {

  // Load layer states from localStorage or use defaults

  const getInitialLayerState = () => {

    try {

      const savedLayers = localStorage.getItem('mapLayers');

      if (savedLayers) {

        return JSON.parse(savedLayers);

      }

    } catch (error) {

      console.error('Error loading layer states from localStorage:', error);

    }

    return {

      flood: true,

      earthquake: true,

      evacuation: true,

      fire: true,

      roadAccident: true,

      powerOutage: true,

    };

  };



  const [activeLayer, setActiveLayer] = useState(getInitialLayerState());

  const [selectedHazard, setSelectedHazard] = useState("Flood");

  const [query, setQuery] = useState("");



  // Hazards & Evacuation markers

  const [autoHazards, setAutoHazards] = useState([]);

  const [manualHazards, setManualHazards] = useState([]);

  const [manualEvacuations, setManualEvacuations] = useState([]);





  // States for placing markers

  const [placingHazard, setPlacingHazard] = useState(false);

  const [placingEvacuation, setPlacingEvacuation] = useState(false);





  // Load map position from localStorage or use defaults

  const getInitialMapPosition = () => {

    try {

      const savedPosition = localStorage.getItem('mapPosition');

      if (savedPosition) {

        const position = JSON.parse(savedPosition);

        return {

          center: position.center || [14.6596, 120.9771],

          zoom: position.zoom || 12

        };

      }

    } catch (error) {

      console.error('Error loading map position from localStorage:', error);

    }

    return {

      center: [14.6596, 120.9771],

      zoom: 12

    };

  };



  const initialPosition = getInitialMapPosition();

  const [mapCenter, setMapCenter] = useState(initialPosition.center);

  const [mapZoom, setMapZoom] = useState(initialPosition.zoom);

  const [mapReady, setMapReady] = useState(false); 



  // Save map position to localStorage when it changes

  const saveMapPosition = (center, zoom) => {

    try {

      localStorage.setItem('mapPosition', JSON.stringify({

        center: center,
        zoom: zoom
      }));
    } catch (error) {
      console.error('Error saving map position to localStorage:', error);
    }
  };

  // Component to handle map events
  const MapEventHandler = () => {
    const map = useMapEvents({
      moveend: (event) => {
        const mapInstance = event.target;
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(zoom);
        saveMapPosition([center.lat, center.lng], zoom);
      },
      whenReady: () => {
        setMapReady(true);
      }
    });
    return null;
  };

  const [isLoading, setIsLoading] = useState(false);
  const dataLoadedRef = useRef(false);

  const [savedData, setSavedData] = useState(null);

  

  // ===== Flood polygon drawing states =====

  const [floodPolygons, setFloodPolygons] = useState([]);

  const [isDrawingFlood, setIsDrawingFlood] = useState(false);

  const [currentFloodVertices, setCurrentFloodVertices] = useState([]); // [{lat,lng}, ...]

  

  // Search marker state

  const [searchMarker, setSearchMarker] = useState(null);



  // Fetch functions

  // Fetch functions with force option to bypass locks
  const fetchManualEvacuations = async (force = false) => {

    try {

      // Skip locks if force=true
      if (!force && dataLoadedRef.current) {
        console.log('MapPage: Ref lock active, skipping fetch');
        return;
      }
      
      if (!force && window[GLOBAL_FETCH_LOCK]) {
        console.log('MapPage: Global lock active, skipping fetch');
        return;
      }
      
      const now = Date.now();
      if (!force && window.lastMapPageFetch && (now - window.lastMapPageFetch) < 1000) {
        console.log('MapPage: Timeout protection active, skipping fetch');
        return;
      }

      const response = await axios.get('http://localhost/gsm/backend/api/hes/evacuations.php');

      console.log('Evacuations API Response:', response.data);

      

      // Check if response.data is an array, if not, use empty array

      const data = Array.isArray(response.data) ? response.data : [];

      

      const formattedData = data.map(e => ({

        id: e.id,

        position: { lat: parseFloat(e.lat), lng: parseFloat(e.lng) },

        name: e.name,

        capacity: e.capacity,

        status: e.status,

        timestamp: e.created_at

      }));

      console.log('Formatted evacuations:', formattedData);
      console.log('Setting manual evacuations with', formattedData.length, 'items');
      console.log('Current manual evacuations before setting:', manualEvacuations.length);
      setManualEvacuations(formattedData);

      console.log('Current manualEvacuations state after setting:', formattedData);

      // Update lock only if not forced
      if (!force) {
        window.lastMapPageFetch = Date.now();
      }

    } catch (error) {

      console.error('Error fetching manual evacuations:', error);

      setManualEvacuations([]); // Set empty array on error

    }

  };



  const fetchManualHazards = async (force = false) => {

    try {

      // Skip locks if force=true
      if (!force && dataLoadedRef.current) {
        console.log('MapPage: Ref lock active, skipping fetch');
        return;
      }
      
      if (!force && window[GLOBAL_FETCH_LOCK]) {
        console.log('MapPage: Global lock active, skipping fetch');
        return;
      }
      
      const now = Date.now();
      if (!force && window.lastMapPageFetch && (now - window.lastMapPageFetch) < 1000) {
        console.log('MapPage: Timeout protection active, skipping fetch');
        return;
      }

      const response = await axios.get('http://localhost/gsm/backend/api/hes/hazards.php');

      console.log('Hazards API Response:', response.data);

      

      // Check if response.data is an array, if not, use empty array

      const data = Array.isArray(response.data) ? response.data : [];

      

      const formattedData = data.map(h => ({

        id: h.id,

        position: { lat: parseFloat(h.lat), lng: parseFloat(h.lng) },

        category: h.category,

        severity: h.severity,

        timestamp: h.created_at,

        notes: h.notes

      }));

      console.log('Formatted hazards:', formattedData);
      console.log('Setting manual hazards with', formattedData.length, 'items');
      console.log('Current manual hazards before setting:', manualHazards.length);
      setManualHazards(formattedData);

      console.log('Current manualHazards state after setting:', formattedData);

      // Update lock only if not forced
      if (!force) {
        window.lastMapPageFetch = Date.now();
      }

    } catch (error) {

      console.error('Error fetching manual hazards:', error);

      setManualHazards([]); // Set empty array on error

    }

  };



  


  


  // Global flag to prevent any duplicate fetches across all instances
const GLOBAL_FETCH_LOCK = 'MAP_PAGE_DATA_LOADED';

// Fetch data from API
  useEffect(() => {
    // Multiple layers of protection
    if (dataLoadedRef.current) {
      console.log('MapPage: Ref lock active, skipping fetch');
      return;
    }
    
    if (window[GLOBAL_FETCH_LOCK]) {
      console.log('MapPage: Global lock active, skipping fetch');
      return;
    }
    
    // Additional timeout-based protection
    const now = Date.now();
    if (window.lastMapPageFetch && (now - window.lastMapPageFetch) < 1000) {
      console.log('MapPage: Timeout protection active, skipping fetch');
      return;
    }
    
    const fetchData = async () => {
      try {
        // Set all locks immediately
        dataLoadedRef.current = true;
        window[GLOBAL_FETCH_LOCK] = true;
        window.lastMapPageFetch = now;
        
        console.log('MapPage: >>> STARTING INITIAL DATA FETCH <<<');
        await fetchManualEvacuations(true);
        await fetchManualHazards(true);
        console.log('MapPage: >>> INITIAL DATA FETCH COMPLETED <<<');
      } catch (error) {
        console.error('MapPage: Error during initial data fetch:', error);
        // Reset locks on error
        dataLoadedRef.current = false;
        window[GLOBAL_FETCH_LOCK] = false;
        delete window.lastMapPageFetch;
      }
    };
    
    fetchData();
    
    // Cleanup function
    return () => {
      console.log('MapPage: Cleanup called - resetting locks');
      // Reset locks so data loads when returning to MapPage
      dataLoadedRef.current = false;
      window[GLOBAL_FETCH_LOCK] = false;
      delete window.lastMapPageFetch;
    };
  }, []); // Empty dependency array - run only once



  // Real-time data sync - temporarily disabled to debug duplicate markers
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchManualEvacuations(true);
  //     fetchManualHazards(true);
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  // Window focus refresh - refresh data when returning to MapPage
  useEffect(() => {
    const handleFocus = () => {
      console.log('MapPage: Window focused - refreshing data');
      // Small delay to ensure locks are reset
      setTimeout(() => {
        fetchManualEvacuations(true);
        fetchManualHazards(true);
      }, 100);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);



  // ========== LAYER MANAGEMENT FUNCTIONS ==========

  const toggleLayer = (key) => {

    const newLayerState = { ...activeLayer, [key]: !activeLayer[key] };

    setActiveLayer(newLayerState);

    // Save to localStorage

    try {

      localStorage.setItem('mapLayers', JSON.stringify(newLayerState));

    } catch (error) {

      console.error('Error saving layer states to localStorage:', error);

    }

  };



  const toggleAllLayers = () => {

    const allEnabled = Object.values(activeLayer).every(Boolean);

    const newState = allEnabled ? 

      { flood: false, earthquake: false, evacuation: false, fire: false, roadAccident: false, powerOutage: false } :

      { flood: true, earthquake: true, evacuation: true, fire: true, roadAccident: true, powerOutage: true };

    

    setActiveLayer(newState);

    // Save to localStorage

    try {

      localStorage.setItem('mapLayers', JSON.stringify(newState));

    } catch (error) {

      console.error('Error saving layer states to localStorage:', error);

    }

  };



  const resetLayersToDefault = () => {

    const defaultState = {

      flood: true,

      earthquake: true,

      evacuation: true,

      fire: true,

      heatmap: false,

    };

    setActiveLayer(defaultState);

    // Save to localStorage

    try {

      localStorage.setItem('mapLayers', JSON.stringify(defaultState));

    } catch (error) {

      console.error('Error saving layer states to localStorage:', error);

    }

  };



  // ========== SEARCH FUNCTIONALITY ==========

  const handleSearch = async () => {

    if (!query.trim()) {

      return;

    }



    setIsLoading(true);



    try {

      // Search using Nominatim API for geocoding - try both cities

      const searchQueries = [

        `${query}, Caloocan, Philippines`,

        `${query}, Quezon City, Philippines`,

        `${query}, Metro Manila, Philippines`

      ];

      

      let results = [];

      

      // Try each search query until we get results

      for (const searchQuery of searchQueries) {

        const response = await fetch(

          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,

          {

            headers: {

              'User-Agent': 'GSM Hazard Map' // Required by Nominatim API

            }

          }

        );



        if (response.ok) {

          const searchResults = await response.json();

          if (searchResults && searchResults.length > 0) {

            results = searchResults;

            break;

          }

        }

      }



      if (results && results.length > 0) {

        const result = results[0]; // Take the first result

        const lat = parseFloat(result.lat);

        const lng = parseFloat(result.lon);

        

        setMapCenter([lat, lng]);

        setMapZoom(16);

        setSearchMarker({ lat, lng, name: result.display_name || query });

      } else {

        // Try searching for barangays specifically in both cities

        const barangayQueries = [

          `${query} barangay, Caloocan, Philippines`,

          `${query} barangay, Quezon City, Philippines`

        ];

        

        for (const barangayQuery of barangayQueries) {

          const response = await fetch(

            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(barangayQuery)}&limit=3`,

            {

              headers: {

                'User-Agent': 'GSM Hazard Map'

              }

            }

          );



          if (response.ok) {

            const barangayResults = await response.json();

            if (barangayResults && barangayResults.length > 0) {

              const result = barangayResults[0];

              const lat = parseFloat(result.lat);

              const lng = parseFloat(result.lon);

              

              setMapCenter([lat, lng]);

              setMapZoom(16);

              setSearchMarker({ lat, lng, name: result.display_name || query });

              break;

            }

          }

        }

      }

    } catch (error) {

      console.error('Search error:', error);

    } finally {

      setIsLoading(false);

    }

  };



  const clearSearch = () => {

    setQuery("");

    setMapCenter([14.6596, 120.9771]);

    setMapZoom(12);

    setSearchMarker(null);

  };



  // ========== HAZARD MANAGEMENT FUNCTIONS ==========

  const clearAllHazards = () => {

    if (window.confirm("Are you sure you want to clear all hazards?")) {

      setAutoHazards([]);

      setManualHazards([]);

    }

  };



  const clearAllEvacuations = () => {

    if (window.confirm("Are you sure you want to clear all evacuation centers?")) {

      setManualEvacuations([]);

    }

  };



  const bulkDeleteHazardsByType = (type) => {

    if (type === "auto") {

      setAutoHazards([]);

    } else if (type === "manual") {

      setManualHazards([]);

    }

  };



  // Enhanced manual marker placement functions

  const startPlacingHazard = () => {

    setPlacingHazard(true);

    setPlacingEvacuation(false);

  };



  const startPlacingEvacuation = () => {

    setPlacingEvacuation(true);

    setPlacingHazard(false);

  };



  const cancelPlacement = () => {

    setPlacingHazard(false);

    setPlacingEvacuation(false);

  };



  // Save manual hazard to database

  const saveManualHazard = async (hazardData) => {

    try {

      console.log('Saving hazard:', hazardData);

      const response = await axios.post('http://localhost/gsm/backend/api/hes/hazards.php', {

        lat: hazardData.position.lat,

        lng: hazardData.position.lng,

        category: hazardData.category,

        severity: hazardData.severity,

        notes: hazardData.notes || ''

      });



      console.log('Hazard save response:', response.data);

      if (response.data.success) {

        // Add a small delay to ensure database save completes

        setTimeout(() => {

          fetchManualHazards(true); // Force refresh the hazards list

        }, 500);

      }

    } catch (error) {

      console.error('Error saving manual hazard:', error);

    }

  };



  // Save manual evacuation center to database

  const saveManualEvacuation = async (evacuationData) => {

    try {

      console.log('Saving evacuation:', evacuationData);

      const response = await axios.post('http://localhost/gsm/backend/api/hes/evacuations.php', {

        lat: evacuationData.position.lat,

        lng: evacuationData.position.lng,

        name: evacuationData.name,

        capacity: evacuationData.capacity,

        status: evacuationData.status

      });



      console.log('Evacuation save response:', response.data);

      if (response.data.success) {

        // Add a small delay to ensure database save completes

        setTimeout(() => {

          fetchManualEvacuations(true); // Force refresh the evacuations list

        }, 500);

      }

    } catch (error) {

      console.error('Error saving manual evacuation:', error);

    }

  };



  // Enhanced Delete functions with notifications

  const deleteHazard = async (id) => {

    try {

      // Optimistic update - remove from local state immediately
      setManualHazards(prev => prev.filter(hazard => hazard.id !== id));

      // Then sync with backend
      await axios.delete(`http://localhost/gsm/backend/api/hes/hazards.php?id=${id}`);

      // Optional: Refresh to ensure consistency
      // fetchManualHazards(true);

    } catch (error) {

      console.error('Error deleting hazard:', error);
      // Revert on error by refreshing
      fetchManualHazards(true);

    }

  };

  

  const deleteEvacuation = async (id) => {

    try {

      // Optimistic update - remove from local state immediately
      setManualEvacuations(prev => prev.filter(evac => evac.id !== id));

      // Then sync with backend
      await axios.delete(`http://localhost/gsm/backend/api/hes/evacuations.php?id=${id}`);

      // Optional: Refresh to ensure consistency
      // fetchManualEvacuations(true);

    } catch (error) {

      console.error('Error deleting evacuation:', error);
      // Revert on error by refreshing
      fetchManualEvacuations(true);

    }

  };

  

  const deleteAutoHazard = (id) => {

    setAutoHazards((prev) => prev.filter((h) => h.id !== id));

  };



  // Enhanced Update hazard category

  const updateHazardCategory = async (id, category) => {

    try {

      // Optimistic update - update local state immediately
      setManualHazards(prev => prev.map(hazard => 
        hazard.id === id ? { ...hazard, category } : hazard
      ));

      // Then sync with backend
      const response = await axios.put(`http://localhost/gsm/backend/api/hes/hazards.php?id=${id}`, { category });
      console.log('Category update response:', response.data);

    } catch (error) {

      console.error('Error updating category:', error);
      // Revert on error by refreshing
      fetchManualHazards(true);

    }

  };



  const updateHazardSeverity = async (id, severity) => {

    try {

      // Optimistic update - update local state immediately
      setManualHazards(prev => prev.map(hazard => 
        hazard.id === id ? { ...hazard, severity } : hazard
      ));

      // Then sync with backend
      await axios.put(`http://localhost/gsm/backend/api/hes/hazards.php?id=${id}`, { severity });

      // Optional: Refresh to ensure consistency
      // fetchManualHazards(true);

    } catch (error) {

      console.error('Error updating severity:', error);
      // Revert on error by refreshing
      fetchManualHazards(true);

    }

  };



  const updateEvacuationCapacity = async (id, capacity) => {

    try {

      // Optimistic update - update local state immediately
      setManualEvacuations(prev => prev.map(evac => 
        evac.id === id ? { ...evac, capacity: parseInt(capacity) } : evac
      ));

      // Then sync with backend
      await axios.put(`http://localhost/gsm/backend/api/hes/evacuations.php?id=${id}`, { capacity: parseInt(capacity) });

      // Optional: Refresh to ensure consistency
      // fetchManualEvacuations(true);

    } catch (error) {

      console.error('Error updating capacity:', error);
      // Revert on error by refreshing
      fetchManualEvacuations(true);

    }

  };



  const updateEvacuationStatus = async (id, status) => {

    try {

      // Optimistic update - update local state immediately
      setManualEvacuations(prev => prev.map(evac => 
        evac.id === id ? { ...evac, status } : evac
      ));

      // Then sync with backend
      await axios.put(`http://localhost/gsm/backend/api/hes/evacuations.php?id=${id}`, { status });

      // Optional: Refresh to ensure consistency
      // fetchManualEvacuations(true);

    } catch (error) {

      console.error('Error updating status:', error);
      // Revert on error by refreshing
      fetchManualEvacuations(true);

    }

  };



  // ===== Flood polygon drawing handlers =====

  const startFloodDrawing = () => {

    setIsDrawingFlood(true);

    setPlacingHazard(false);

    setPlacingEvacuation(false);

    setCurrentFloodVertices([]);

  };



  const undoFloodVertex = () => {

    setCurrentFloodVertices(prev => prev.slice(0, -1));

  };



  const cancelFloodDrawing = () => {

    setIsDrawingFlood(false);

    setCurrentFloodVertices([]);

  };



  const finishFloodPolygon = () => {

    if (currentFloodVertices.length < 3) {

      return;

    }

    const poly = currentFloodVertices.map(v => [v.lat, v.lng]);

    setFloodPolygons(prev => [...prev, poly]);

    setIsDrawingFlood(false);

    setCurrentFloodVertices([]);

  };



  const clearFloodPolygons = () => {

    if (!window.confirm("Clear all flood polygons?")) return;

    setFloodPolygons([]);

  };



  const deleteFloodPolygon = (index) => {

    setFloodPolygons(prev => prev.filter((_, i) => i !== index));

  };



  // Handle map clicks for manual markers and flood drawing

  const MapClickHandler = () => {

    useMapEvents({

      click: async (e) => {

        console.log('Map clicked at:', e.latlng);

        console.log('Placing hazard:', placingHazard, 'Placing evacuation:', placingEvacuation);

        

        if (isDrawingFlood) {

          setCurrentFloodVertices(prev => [...prev, e.latlng]);

          return;

        }

        if (placingHazard) {

          const newHazard = {

            position: { lat: e.latlng.lat, lng: e.latlng.lng },

            category: "Flood",

            severity: "Moderate",

            notes: "",

            timestamp: new Date().toISOString()

          };

          

          console.log('Creating hazard:', newHazard);

          // Save to database

          await saveManualHazard(newHazard);

          setPlacingHazard(false);

        } else if (placingEvacuation) {

          const newEvac = {

            position: { lat: e.latlng.lat, lng: e.latlng.lng },

            name: `Evacuation Center ${manualEvacuations.length + 1}`,

            capacity: 100,

            status: "Available",

            timestamp: new Date().toISOString()

          };

          

          console.log('Creating evacuation:', newEvac);

          // Save to database

          await saveManualEvacuation(newEvac);

          setPlacingEvacuation(false);

        }

      },

    });

    return null;

  };



  // Enhanced Export CSV function

  const exportCSV = () => {

    const headers = ["Type", "Latitude", "Longitude", "Category/Reports", "Timestamp"];

    const rows = [];



    autoHazards.forEach((h) =>

      rows.push([

        "Auto Hazard",

        h.position[0],

        h.position[1],

        `Reports: ${h.reports}`,

        new Date().toISOString()

      ])

    );



    manualHazards.forEach((h) =>

      rows.push([

        "Manual Hazard",

        h.position.lat,

        h.position.lng,

        h.category,

        new Date().toISOString()

      ])

    );



    manualEvacuations.forEach((e) =>

      rows.push([

        "Evacuation", 

        e.position.lat, 

        e.position.lng, 

        "Center",

        new Date().toISOString()

      ])

    );



    const csvContent =

      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");



    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);



    const link = document.createElement("a");

    link.href = url;

    link.download = `hazards_export_${new Date().toISOString().split('T')[0]}.csv`;

    link.click();



    URL.revokeObjectURL(url);

  };



  // Enhanced AI auto hazard detection

  const autoGenerateHazard = () => {

    const reports = Math.floor(Math.random() * 20); // simulate 0-20 reports

    const hazardTypes = ["Flood", "Fire", "Earthquake", "Landslide"];

    const randomType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];

    

    if (reports >= 10) {

      const newHazard = {

        id: Date.now(),

        position: [

          14.659 + (Math.random() - 0.5) * 0.02,

          120.977 + (Math.random() - 0.5) * 0.02,

        ],

        reports,

        category: `Auto-Detected ${randomType}`,

        severity: reports >= 15 ? "High" : "Moderate",

        timestamp: new Date().toISOString()

      };

      setAutoHazards((prev) => [...prev, newHazard]);

    }

  };



  

  // Static demo data (can later be wired to API)

  const earthquakeMarkers = [];

  const evacuationCenters = [];



  

  return (

    <div className="flex h-screen bg-gray-50">

      {/* Side Panel */}

      <div className="w-72 bg-white shadow-lg p-3 overflow-hidden flex flex-col">

        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">

          <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />

          Hazard Controls

        </h2>



        {/* Search Bar */}

        <div className="mb-3">

          <label className="block text-sm font-medium text-gray-700 mb-2">

            Search Location

          </label>

          <div className="flex gap-2">

            <input

              type="text"

              value={query}

              onChange={(e) => setQuery(e.target.value)}

              placeholder="Search barangay, street..."

              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"

              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}

            />

            <button

              onClick={handleSearch}

              disabled={isLoading}

              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"

            >

              <Search className="h-3 w-3" />

            </button>

            <button

              onClick={clearSearch}

              className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"

            >

              Clear

            </button>

          </div>

        </div>



        {/* Layer Toggles */}

        <div className="mb-3">

          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">

            <Layers className="h-3 w-3 mr-2 text-blue-600" />

            Map Layers

          </h3>

          

          <div className="space-y-1">

            <label className="flex items-center justify-between p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">

              <span className="font-medium text-gray-700 text-sm">Flood</span>

              <div className="relative">

                <input

                  type="checkbox"

                  checked={activeLayer.flood}

                  onChange={() => toggleLayer('flood')}

                  className="sr-only"

                />

                <div className={`w-8 h-4 rounded-full transition-colors ${

                  activeLayer.flood ? 'bg-blue-500' : 'bg-gray-300'

                }`}>

                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${

                    activeLayer.flood ? 'translate-x-4' : 'translate-x-0.5'

                  }`}></div>

                </div>

              </div>

            </label>



            <label className="flex items-center justify-between p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">

              <span className="font-medium text-gray-700 text-sm">Fire</span>

              <div className="relative">

                <input

                  type="checkbox"

                  checked={activeLayer.fire}

                  onChange={() => toggleLayer('fire')}

                  className="sr-only"

                />

                <div className={`w-8 h-4 rounded-full transition-colors ${

                  activeLayer.fire ? 'bg-orange-500' : 'bg-gray-300'

                }`}>

                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${

                    activeLayer.fire ? 'translate-x-4' : 'translate-x-0.5'

                  }`}></div>

                </div>

              </div>

            </label>



            <label className="flex items-center justify-between p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">

              <span className="font-medium text-gray-700 text-sm">Earthquake</span>

              <div className="relative">

                <input

                  type="checkbox"

                  checked={activeLayer.earthquake}

                  onChange={() => toggleLayer('earthquake')}

                  className="sr-only"

                />

                <div className={`w-8 h-4 rounded-full transition-colors ${

                  activeLayer.earthquake ? 'bg-purple-500' : 'bg-gray-300'

                }`}>

                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${

                    activeLayer.earthquake ? 'translate-x-4' : 'translate-x-0.5'

                  }`}></div>

                </div>

              </div>

            </label>



            <label className="flex items-center justify-between p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">

              <span className="font-medium text-gray-700 text-sm">Evacuation</span>

              <div className="relative">

                <input

                  type="checkbox"

                  checked={activeLayer.evacuation}

                  onChange={() => toggleLayer('evacuation')}

                  className="sr-only"

                />

                <div className={`w-8 h-4 rounded-full transition-colors ${

                  activeLayer.evacuation ? 'bg-green-500' : 'bg-gray-300'

                }`}>

                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${

                    activeLayer.evacuation ? 'translate-x-4' : 'translate-x-0.5'

                  }`}></div>

                </div>

              </div>

            </label>



            <label className="flex items-center justify-between p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">

              <span className="font-medium text-gray-700 text-sm">Road Accident</span>

              <div className="relative">

                <input

                  type="checkbox"

                  checked={activeLayer.roadAccident}

                  onChange={() => toggleLayer('roadAccident')}

                  className="sr-only"

                />

                <div className={`w-8 h-4 rounded-full transition-colors ${

                  activeLayer.roadAccident ? 'bg-red-600' : 'bg-gray-300'

                }`}>

                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${

                    activeLayer.roadAccident ? 'translate-x-4' : 'translate-x-0.5'

                  }`}></div>

                </div>

              </div>

            </label>

            <label className="flex items-center justify-between p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">

              <span className="font-medium text-gray-700 text-sm">Power Outage</span>

              <div className="relative">

                <input

                  type="checkbox"

                  checked={activeLayer.powerOutage}

                  onChange={() => toggleLayer('powerOutage')}

                  className="sr-only"

                />

                <div className={`w-8 h-4 rounded-full transition-colors ${

                  activeLayer.powerOutage ? 'bg-yellow-500' : 'bg-gray-300'

                }`}>

                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${

                    activeLayer.powerOutage ? 'translate-x-4' : 'translate-x-0.5'

                  }`}></div>

                </div>

              </div>

            </label>

          </div>



          <div className="mt-2 flex gap-2">

            <button

              onClick={toggleAllLayers}

              className="flex-1 px-1 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"

            >

              All

            </button>

            <button

              onClick={resetLayersToDefault}

              className="flex-1 px-1 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"

            >

              Reset

            </button>

          </div>

        </div>



        

        

        {/* Instructions */}

        {(placingHazard || placingEvacuation || isDrawingFlood) && (

          <div className="p-1 bg-yellow-50 rounded border border-yellow-200">

            <p className="text-xs text-yellow-800">

              {placingHazard 

                ? "Click map to place." 

                : placingEvacuation

                ? "Click map to place."

                : "Click map to add vertices."

              }

            </p>

            {isDrawingFlood && (

              <p className="text-xs text-yellow-600">

                {currentFloodVertices.length}/3 min

              </p>

            )}

            <button

              onClick={cancelPlacement}

              className="w-full px-1 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors mt-1"

            >

              Cancel

            </button>

          </div>

        )}



        {/* Flood Drawing Controls */}

        {isDrawingFlood && (

          <div className="mt-1 p-1 bg-blue-50 rounded border border-blue-200">

            <p className="text-xs text-blue-800">

              Need 3+ points

            </p>

            <div className="flex gap-1 mt-1">

              <button

                onClick={undoFloodVertex}

                disabled={currentFloodVertices.length === 0}

                className="flex-1 px-1 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

              >

                Undo

              </button>

              <button

                onClick={finishFloodPolygon}

                disabled={currentFloodVertices.length < 3}

                className="flex-1 px-1 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

              >

                Finish

              </button>

            </div>

          </div>

        )}

      </div>



      {/* Map Container */}

      <div className="flex-1 p-6">

        <div className="h-[600px] rounded-lg overflow-hidden border border-gray-300">

          <MapContainer

            center={mapCenter}

            zoom={mapZoom}

            style={{ height: "100%", width: "100%" }}

            key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}

          >

            <MapClickHandler />

            <MapEventHandler />

            <TileLayer

              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

            />



            {/* Auto-detected hazards */}

            {activeLayer.flood &&

              autoHazards.map((hazard) => (

                <Marker

                  key={hazard.id}

                  position={hazard.position}

                  icon={L.divIcon({

                    className: "custom-div-icon",

                    html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>`,

                    iconSize: [28, 28],

                    iconAnchor: [14, 14],

                  })}

                >

                  <Popup>

                    <div className="p-2">

                      <h3 className="font-bold text-red-600">Auto-Detected Hazard</h3>

                      <p className="text-sm">Reports: {hazard.reports}</p>

                      <p className="text-sm">Severity: {hazard.severity}</p>

                      <p className="text-sm">Type: {hazard.category}</p>

                      
                    </div>

                  </Popup>

                </Marker>

              ))}



            {/* Manual hazards */}

            {manualHazards.map((hazard) => {

              // Get color and icon based on category

              const getCategoryStyle = (category) => {

                switch(category?.toLowerCase()) {

                  case 'flood':

                    return { color: '#3b82f6', icon: '🌊', label: 'Flood' };

                  case 'fire':

                    return { color: '#ef4444', icon: '🔥', label: 'Fire' };

                  case 'earthquake':

                    return { color: '#8b5cf6', icon: '🌋', label: 'Earthquake' };

                  case 'road accident':

                    return { color: '#dc2626', icon: '🚗', label: 'Road Accident' };

                  case 'power outage':

                    return { color: '#fbbf24', icon: '⚡', label: 'Power Outage' };

                  case 'landslide':

                    return { color: '#a16207', icon: '⛰️', label: 'Landslide' };

                  case 'storm':

                    return { color: '#06b6d4', icon: '🌪️', label: 'Storm' };

                  default:

                    return { color: '#f59e0b', icon: '⚠️', label: 'Unknown' };

                }

              };



              const categoryStyle = getCategoryStyle(hazard.category);

              // Check if this hazard should be visible based on layer settings
              const isVisible = 
                (hazard.category?.toLowerCase() === 'flood' && activeLayer.flood) ||
                (hazard.category?.toLowerCase() === 'fire' && activeLayer.fire) ||
                (hazard.category?.toLowerCase() === 'earthquake' && activeLayer.earthquake) ||
                (hazard.category?.toLowerCase() === 'road accident' && activeLayer.fire) ||
                (hazard.category?.toLowerCase() === 'power outage' && activeLayer.flood);

              if (!isVisible) return null;



              return (

                <Marker

                  key={hazard.id}

                  position={[hazard.position.lat, hazard.position.lng]}

                  icon={L.divIcon({

                    className: "custom-div-icon",

                    html: `<div style="background-color: ${categoryStyle.color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">${categoryStyle.icon}</div>`,

                    iconSize: [32, 32],

                    iconAnchor: [16, 16],

                  })}

                >

                  <Popup>

                    <div className="p-2">

                      <h3 className="font-bold" style={{ color: categoryStyle.color }}>

                        {categoryStyle.icon} {categoryStyle.label}

                      </h3>

                      <div className="mt-2">

                        <label className="text-xs font-medium text-gray-600">Category:</label>

                        <span className="ml-2 text-xs">{hazard.category}</span>

                      </div>

                      <p className="text-sm mt-2">Severity: {hazard.severity}</p>

                      <p className="text-xs text-gray-500">

                        {new Date(hazard.timestamp).toLocaleString()}

                      </p>

                      {hazard.city && (

                        <p className="text-xs text-gray-500">City: {hazard.city}</p>

                      )}

                      
                    </div>

                  </Popup>

                </Marker>

              );

            })}



            {/* Evacuation centers */}

            {activeLayer.evacuation &&
              manualEvacuations.map((evac) => (
                <Marker
                  key={evac.id}
                  position={[evac.position.lat, evac.position.lng]}
                  icon={L.divIcon({
                    className: "custom-div-icon",
                    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">E</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-green-600">Evacuation Center</h3>
                      <p className="text-sm font-medium">{evac.name}</p>
                      <p className="text-sm">Capacity: {evac.capacity}</p>
                      <p className="text-sm">Status: 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          evac.status === 'Available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {evac.status}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(evac.timestamp).toLocaleString()}
                      </p>
                      
                    </div>
                  </Popup>
                </Marker>
              ))}



            {/* Earthquake markers */}

            {activeLayer.earthquake &&

              earthquakeMarkers.map((eq, idx) => (

                <Marker

                  key={idx}

                  position={eq.position}

                  icon={L.divIcon({

                    className: "custom-div-icon",

                    html: `<div style="background-color: #8b5cf6; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>`,

                    iconSize: [28, 28],

                    iconAnchor: [14, 14],

                  })}

                >

                  <Popup>

                    <div className="p-2">

                      <h3 className="font-bold text-purple-600">Earthquake</h3>

                      <p className="text-sm">Magnitude: {eq.magnitude}</p>

                      <p className="text-sm">Depth: {eq.depth} km</p>

                      <p className="text-sm">Time: {eq.time}</p>

                    </div>

                  </Popup>

                </Marker>

              ))}



            {/* Flood polygons */}

            {activeLayer.flood &&

              floodPolygons.map((polygon, idx) => (

                <Polygon

                  key={idx}

                  positions={polygon}

                  pathOptions={{

                    color: "#3b82f6",

                    fillColor: "#3b82f6",

                    fillOpacity: 0.3,

                    weight: 2,

                  }}

                >

                  <Popup>

                    <div className="p-2">

                      <h3 className="font-bold text-blue-600">Flood Area</h3>

                      <p className="text-sm">Flood Zone #{idx + 1}</p>

                      
                    </div>

                  </Popup>

                </Polygon>

              ))}



            {/* Current flood drawing polygon */}

            {isDrawingFlood && currentFloodVertices.length > 0 && (

              <Polygon

                positions={currentFloodVertices.map(v => [v.lat, v.lng])}

                pathOptions={{

                  color: "#ef4444",

                  fillColor: "#ef4444",

                  fillOpacity: 0.2,

                  weight: 2,

                  dashArray: "5, 10",

                }}

              />

            )}



            {/* Search marker */}

            {searchMarker && (

              <Marker

                position={[searchMarker.lat, searchMarker.lng]}

                icon={L.divIcon({

                  className: "custom-div-icon",

                  html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); transform: rotate(-45deg);"></div>`,

                  iconSize: [24, 24],

                  iconAnchor: [12, 24],

                })}

              >

                <Popup>

                  <div className="p-2">

                    <h3 className="font-bold text-red-600">Search Location</h3>

                    <p className="text-sm">{searchMarker.name}</p>

                    <p className="text-xs text-gray-500">

                      Lat: {searchMarker.lat.toFixed(6)}, Lng: {searchMarker.lng.toFixed(6)}

                    </p>

                  </div>

                </Popup>

              </Marker>

            )}



            {/* Current flood drawing vertices */}

            {isDrawingFlood &&

              currentFloodVertices.map((vertex, idx) => (

                <Marker

                  key={idx}

                  position={[vertex.lat, vertex.lng]}

                  icon={L.divIcon({

                    className: "custom-div-icon",

                    html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,

                    iconSize: [12, 12],

                    iconAnchor: [6, 6],

                  })}

                />

              ))}

          </MapContainer>

        </div>

      </div>



          </div>

  );

}

