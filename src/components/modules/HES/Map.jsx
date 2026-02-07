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
import { API_BASE_URL } from '../../../config';


// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function HazardMapUI() {
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
  const [searchMarker, setSearchMarker] = useState(null);

  // Hazards & Evacuation markers
  const [autoHazards, setAutoHazards] = useState([]);
  const [manualHazards, setManualHazards] = useState([]);
  const [manualEvacuations, setManualEvacuations] = useState([]);

  // Fetch functions
  const fetchManualEvacuations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hes/evacuations.php`);
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
      setManualEvacuations(formattedData);
      console.log('Current manualEvacuations state after setting:', formattedData);
    } catch (error) {
      console.error('Error fetching manual evacuations:', error);
      setManualEvacuations([]); // Set empty array on error
    }
  };

  const fetchManualHazards = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hes/hazards.php`);
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
      setManualHazards(formattedData);
      console.log('Current manualHazards state after setting:', formattedData);
    } catch (error) {
      console.error('Error fetching manual hazards:', error);
      setManualHazards([]); // Set empty array on error
    }
  };

  // States for placing markers
  const [placingHazard, setPlacingHazard] = useState(false);
  const [placingEvacuation, setPlacingEvacuation] = useState(false);

  const [mapCenter, setMapCenter] = useState([14.6596, 120.9771]);
  const [mapZoom, setMapZoom] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [savedData, setSavedData] = useState(null);
  // Sound settings for alerts
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(1.0); // 0.0 - 1.0
  const emergencyCtxRef = useRef(null);
  const emergencyStopRef = useRef(null);

  // ===== Flood polygon drawing states =====
  const [floodPolygons, setFloodPolygons] = useState([]);
  const [isDrawingFlood, setIsDrawingFlood] = useState(false);
  const [currentFloodVertices, setCurrentFloodVertices] = useState([]); // [{lat,lng}, ...]


  // Fetch data from API
  useEffect(() => {
    fetchManualEvacuations();
    fetchManualHazards();
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

  // ========== ALERT MANAGEMENT ==========
  const dismissAlert = () => {
    stopEmergencySiren();
    // In a real app, this would update the alert status
  };

  const createCustomAlert = (severity = "High", message = "Custom Alert") => {
    if (severity === 'High' || severity === 'Critical') {
      startEmergencySiren(8000); // louder, longer siren for emergencies
    } else {
      playAlertSound();
    }
    // In a real app, this would create a new alert
  };

  // Play an alert tone using Web Audio API (no external file needed)
  const playAlertSound = () => {
    try {
      if (!soundEnabled || typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      // Siren-like up-down sweep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(1000, now + 0.25);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(Math.max(0.05, Math.min(1, soundVolume)), now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.72);
      // Close context after sound to release resources
      osc.onended = () => {
        try { ctx.close(); } catch (_) { }
      };
    } catch (_) {
      // noop if audio fails (browser gesture restrictions, etc.)
    }
  };

  // Emergency continuous siren (two-oscillator phasing), auto-stops after durationMs
  const startEmergencySiren = (durationMs = 8000) => {
    try {
      if (!soundEnabled || typeof window === 'undefined') return;
      stopEmergencySiren();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      // Main tones
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(650, now);
      osc2.frequency.setValueAtTime(700, now);

      // LFO for wailing effect  (0.9 Hz)
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.9, now);
      lfoGain.gain.setValueAtTime(200, now); // deviate +/- 200 Hz
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      // Output gain with quick attack and slow release
      const volume = Math.max(0.1, Math.min(1, soundVolume));
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);

      const stopAt = now + durationMs / 1000;
      const stop = () => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
          osc1.stop(ctx.currentTime + 0.15);
          osc2.stop(ctx.currentTime + 0.15);
          lfo.stop(ctx.currentTime + 0.15);
          setTimeout(() => { try { ctx.close(); } catch (_) { } }, 250);
        } catch (_) { }
        emergencyCtxRef.current = null;
        emergencyStopRef.current = null;
      };

      emergencyCtxRef.current = ctx;
      emergencyStopRef.current = stop;

      // Auto stop timer
      setTimeout(() => {
        if (emergencyStopRef.current) emergencyStopRef.current();
      }, durationMs);
    } catch (_) {
      // ignore audio errors
    }
  };

  const stopEmergencySiren = () => {
    try {
      if (emergencyStopRef.current) emergencyStopRef.current();
    } catch (_) { }
  };

  // ========== DATA PERSISTENCE ==========
  const saveMapData = () => {
    const mapData = {
      autoHazards,
      manualHazards,
      manualEvacuations,
      activeLayer,
      mapCenter,
      mapZoom,
      floodPolygons,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('hazardMapData', JSON.stringify(mapData));
    setSavedData(mapData);
  };

  const loadMapData = () => {
    const saved = localStorage.getItem('hazardMapData');
    if (saved) {
      const data = JSON.parse(saved);
      setAutoHazards(data.autoHazards || []);
      setManualHazards(data.manualHazards || []);
      setManualEvacuations(data.manualEvacuations || []);
      setActiveLayer(data.activeLayer || activeLayer);
      setMapCenter(data.mapCenter || [14.6596, 120.9771]);
      setMapZoom(data.mapZoom || 12);
      setFloodPolygons(data.floodPolygons || []);
      setSavedData(data);
    }
  };

  const clearSavedData = () => {
    if (window.confirm("Are you sure you want to clear saved data?")) {
      localStorage.removeItem('hazardMapData');
      setSavedData(null);
    }
  };

  // ========== REPORTING FUNCTIONS ==========
  const generateHazardReport = () => {
    const report = {
      totalAutoHazards: autoHazards.length,
      totalManualHazards: manualHazards.length,
      totalEvacuationCenters: manualEvacuations.length,
      hazardsByCategory: manualHazards.reduce((acc, hazard) => {
        acc[hazard.category] = (acc[hazard.category] || 0) + 1;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };

    console.log("Hazard Report:", report);
    return report;
  };

  const exportDetailedReport = () => {
    const report = generateHazardReport();
    const csvContent = [
      "Hazard Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Summary:",
      `Auto Hazards: ${report.totalAutoHazards}`,
      `Manual Hazards: ${report.totalManualHazards}`,
      `Evacuation Centers: ${report.totalEvacuationCenters}`,
      "",
      "Hazards by Category:",
      ...Object.entries(report.hazardsByCategory).map(([cat, count]) => `${cat}: ${count}`),
      "",
      "Detailed Data:",
      "Type,Latitude,Longitude,Category/Reports,Date",
      ...autoHazards.map(h => `Auto Hazard,${h.position[0]},${h.position[1]},Reports: ${h.reports},${new Date().toLocaleDateString()}`),
      ...manualHazards.map(h => `Manual Hazard,${h.position.lat},${h.position.lng},${h.category},${new Date().toLocaleDateString()}`),
      ...manualEvacuations.map(e => `Evacuation Center,${e.position.lat},${e.position.lng},Center,${new Date().toLocaleDateString()}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hazard_detailed_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ========== MAP CONTROL FUNCTIONS ==========
  const resetMapView = () => {
    setMapCenter([14.6596, 120.9771]);
    setMapZoom(12);
  };

  const zoomToFitAllMarkers = () => {
    const allMarkers = [
      ...autoHazards.map(h => h.position),
      ...manualHazards.map(h => [h.position.lat, h.position.lng]),
      ...manualEvacuations.map(e => [e.position.lat, e.position.lng])
    ];

    if (allMarkers.length > 0) {
      // Calculate bounds (simplified)
      const lats = allMarkers.map(m => m[0]);
      const lngs = allMarkers.map(m => m[1]);
      const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
      const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

      setMapCenter([centerLat, centerLng]);
      setMapZoom(11);
    }
  };

  const summary = {
    Flood: { activeAlerts: 1, atRiskHH: 3420, severity: "Moderate" },
    Earthquake: { activeAlerts: 0, atRiskHH: 0, severity: "Low" },
  };

  // Static demo data (can later be wired to API)
  const earthquakeMarkers = [];

  const evacuationCenters = [];

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
    const hazardTypes = ["Flood", "Fire", "Earthquake", "Road Accident", "Power Outage"];
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
      const response = await axios.post(`${API_BASE_URL}/api/hes/hazards.php`, {
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
          fetchManualHazards(); // Refresh the hazards list
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
      const response = await axios.post(`${API_BASE_URL}/api/hes/evacuations.php`, {
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
          fetchManualEvacuations(); // Refresh the evacuations list
        }, 500);
      }
    } catch (error) {
      console.error('Error saving manual evacuation:', error);
    }
  };

  // Enhanced Delete functions with notifications
  const deleteHazard = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/hes/hazards.php?id=${id}`);
      fetchManualHazards();
    } catch (error) {
      console.error('Error deleting hazard:', error);
    }
  };

  const deleteEvacuation = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/hes/evacuations.php?id=${id}`);
      fetchManualEvacuations();
    } catch (error) {
      console.error('Error deleting evacuation:', error);
    }
  };

  const deleteAutoHazard = (id) => {
    setAutoHazards((prev) => prev.filter((h) => h.id !== id));
  };

  // Enhanced Update hazard category
  const updateHazardCategory = async (id, category) => {
    try {
      await axios.put(`${API_BASE_URL}/api/hes/hazards.php?id=${id}`, { category });
      fetchManualHazards();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const updateHazardSeverity = async (id, severity) => {
    try {
      await axios.put(`${API_BASE_URL}/api/hes/hazards.php?id=${id}`, { severity });
      fetchManualHazards();
    } catch (error) {
      console.error('Error updating severity:', error);
    }
  };

  const updateEvacuationCapacity = async (id, capacity) => {
    try {
      await axios.put(`${API_BASE_URL}/api/hes/evacuations.php?id=${id}`, { capacity: parseInt(capacity) });
      fetchManualEvacuations();
    } catch (error) {
      console.error('Error updating capacity:', error);
    }
  };

  const updateEvacuationStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/hes/evacuations.php?id=${id}`, { status });
      fetchManualEvacuations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 text-gray-900 dark:text-gray-100">
      {/* Top banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-600 dark:text-red-400" />
          <div>
            <h1 className="text-2xl font-bold">Caloocan Hazard Map</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={startPlacingHazard}
            className={`flex items-center gap-2 text-white px-3 py-2 rounded-lg shadow-sm text-sm transition-colors ${placingHazard ? "bg-red-800" : "bg-red-600 hover:bg-red-700"
              }`}
            title="Click to place a manual hazard marker"
          >
            + Manual Hazard
          </button>

          <button
            onClick={startPlacingEvacuation}
            className={`flex items-center gap-2 text-white px-3 py-2 rounded-lg shadow-sm text-sm transition-colors ${placingEvacuation ? "bg-indigo-800" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            title="Click to place an evacuation center"
          >
            + Evacuation
          </button>

          {(placingHazard || placingEvacuation) && (
            <button
              onClick={cancelPlacement}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-sm text-sm transition-colors"
              title="Cancel marker placement"
            >
              ❌ Cancel
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-sm text-sm transition-colors"
            title="Export basic CSV report"
          >
            <Download /> Export
          </button>

        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEFT PANEL */}
        <aside className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-6 h-fit">
          {/* Search */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">
              Search place / barangay
            </label>
            <div className="flex items-center gap-2 mb-2">
              <Search className="text-gray-500 dark:text-gray-300" />
              <input
                className="flex-1 p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Search any location or barangay in Caloocan or Quezon City"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                {isLoading ? "🔍 Searching..." : "🔍 Search"}
              </button>
              <button
                onClick={clearSearch}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Layers */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Layers</h3>
              <div className="flex gap-1">
                <button
                  onClick={toggleAllLayers}
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                  title="Toggle all layers on/off"
                >
                  All
                </button>
                <button
                  onClick={resetLayersToDefault}
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                  title="Reset layers to default"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { key: "flood", label: "Flood", color: "blue-600" },
                { key: "earthquake", label: "Earthquake", color: "red-600" },
                { key: "evacuation", label: "Evacuation", color: "indigo-600" },
                { key: "fire", label: "Fire", color: "orange-600" },
                { key: "roadAccident", label: "Road Accident", color: "red-700" },
                { key: "powerOutage", label: "Power Outage", color: "yellow-600" },
              ].map((layer) => (
                <label
                  key={layer.key}
                  className="flex items-center justify-between gap-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Layers className={`text-${layer.color}`} />
                    {layer.label}
                  </div>
                  <ToggleRight
                    className={`cursor-pointer ${activeLayer[layer.key]
                      ? "text-green-600"
                      : "text-gray-400 dark:text-gray-300"
                      }`}
                    onClick={() => toggleLayer(layer.key)}
                  />
                </label>
              ))}
            </div>
          </div>


        </aside>

        {/* CENTER: Map */}
        <main className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="h-[70vh] w-full relative z-0"
            key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
            style={{ zIndex: 0 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapClickHandler />

            {/* Flood polygons */}
            {activeLayer.flood &&
              floodPolygons.map((poly, idx) => (
                <Polygon
                  key={idx}
                  positions={poly}
                  pathOptions={{ color: "blue", fillOpacity: 0.3 }}
                />
              ))}

            {/* In-progress flood polygon preview */}
            {isDrawingFlood && currentFloodVertices.length >= 2 && (
              <Polygon
                positions={currentFloodVertices.map(v => [v.lat, v.lng])}
                pathOptions={{ color: "cyan", dashArray: "6", fillOpacity: 0.1 }}
              />
            )}

            {/* Earthquake markers */}
            {activeLayer.earthquake &&
              earthquakeMarkers.map((eq, idx) => (
                <Marker key={idx} position={eq.position}>
                  <Popup>
                    Earthquake M{eq.magnitude} <br /> Date: {eq.date}
                  </Popup>
                </Marker>
              ))}

            {/* Evacuation centers */}
            {activeLayer.evacuation &&
              evacuationCenters.map((ev, idx) => (
                <Marker key={idx} position={ev.position}>
                  <Popup>{ev.name}</Popup>
                </Marker>
              ))}

            {/* Auto Hazards */}
            {autoHazards.map((hz) => (
              <Marker key={hz.id} position={hz.position}>
                <Popup>
                  <div className="space-y-2 min-w-[200px]">
                    <div className="border-b pb-2">
                      <strong>🤖 Auto-generated Hazard</strong> <br />
                      <small>Reports: {hz.reports} | Severity: {hz.severity}</small><br />
                      <small>Category: {hz.category}</small><br />
                      <small>Detected: {new Date(hz.timestamp).toLocaleString()}</small>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteAutoHazard(hz.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                        title="Delete this hazard"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={() => addNotification(`Auto hazard details copied to clipboard`, "info")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                        title="Copy hazard details"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Manual Hazards */}
            {console.log('Rendering manual hazards:', manualHazards)}
            {manualHazards
              .filter(hz => {
                if (hz.category === 'Flood' && !activeLayer.flood) return false;
                if (hz.category === 'Earthquake' && !activeLayer.earthquake) return false;
                if (hz.category === 'Fire' && !activeLayer.fire) return false;
                if (hz.category === 'Road Accident' && !activeLayer.fire) return false;
                if (hz.category === 'Power Outage' && !activeLayer.flood) return false;
                return true; // Show if not filtered out
              })
              .map((hz) => (
                <Marker key={hz.id} position={hz.position}>
                  <Popup>
                    <div className="space-y-3 min-w-[250px]">
                      <div className="border-b pb-2">
                        <strong>⚠️ Manual Hazard</strong> <br />
                        <small>Added: {new Date(hz.timestamp).toLocaleString()}</small><br />
                        <small>Location: ({hz.position.lat.toFixed(4)}, {hz.position.lng.toFixed(4)})</small>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium">Category:</label>
                          <select
                            className="w-full border rounded p-1 text-sm"
                            value={hz.category}
                            onChange={(e) => updateHazardCategory(hz.id, e.target.value)}
                          >
                            <option>Flood</option>
                            <option>Earthquake</option>
                            <option>Fire</option>
                            <option>Road Accident</option>
                            <option>Power Outage</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium">Severity:</label>
                          <select
                            className="w-full border rounded p-1 text-sm"
                            value={hz.severity || "Moderate"}
                            onChange={(e) => updateHazardSeverity(hz.id, e.target.value)}
                          >
                            <option>Low</option>
                            <option>Moderate</option>
                            <option>High</option>
                            <option>Critical</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => deleteHazard(hz.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                          title="Delete this hazard"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Manual Evacuations */}
            {console.log('Rendering manual evacuations:', manualEvacuations)}
            {activeLayer.evacuation && manualEvacuations.map((ev) => (
              <Marker key={ev.id} position={ev.position}>
                <Popup>
                  <div className="space-y-3 min-w-[250px]">
                    <div className="border-b pb-2">
                      <strong>🏥 {ev.name}</strong> <br />
                      <small>Added: {new Date(ev.timestamp).toLocaleString()}</small><br />
                      <small>Location: ({ev.position.lat.toFixed(4)}, {ev.position.lng.toFixed(4)})</small>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium">Capacity:</label>
                        <input
                          type="number"
                          className="w-full border rounded p-1 text-sm"
                          value={ev.capacity || 100}
                          onChange={(e) => updateEvacuationCapacity(ev.id, e.target.value)}
                          min="1"
                          max="10000"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium">Status:</label>
                        <select
                          className="w-full border rounded p-1 text-sm"
                          value={ev.status || "Available"}
                          onChange={async (e) => {
                            try {
                              await axios.put(`${API_BASE_URL}/api/hes/evacuations.php?id=${ev.id}`, { status: e.target.value });
                              fetchManualEvacuations();
                            } catch (error) {
                              console.error('Error updating status:', error);
                            }
                          }}
                        >
                          <option>Available</option>
                          <option>At Capacity</option>
                          <option>Closed</option>
                          <option>Under Maintenance</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => deleteEvacuation(ev.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                        title="Delete evacuation center"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={() => { }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                        title="Copy center details"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => { }}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
                        title="Activate center"
                      >
                        ✅ Activate
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

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
          </MapContainer>

          {/* Bottom Summary */}
          <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <b>{selectedHazard} summary</b>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Alerts: {summary[selectedHazard].activeAlerts} • Severity: {""}
                  {summary[selectedHazard].severity}
                </div>
              </div>
              <div className="text-sm">
                <b>At-risk households</b>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {summary[selectedHazard].atRiskHH.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

