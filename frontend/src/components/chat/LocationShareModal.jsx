import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Crosshair,
  Loader2,
  Send,
  Radio,
  Search,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

const SHARE_MODES = [
  {
    id: 'current',
    label: 'Current Location',
    description: 'Share your current GPS location',
    icon: Crosshair,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'live',
    label: 'Live Location',
    description: 'Share real-time location for 15 minutes',
    icon: Radio,
    color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  },
  {
    id: 'manual',
    label: 'Select on Map',
    description: 'Pick a custom location manually',
    icon: MapPin,
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  },
];

// Popular campus locations for quick selection
const QUICK_LOCATIONS = [
  { name: 'Main Gate', offset: { lat: 0.001, lng: 0 } },
  { name: 'Library', offset: { lat: 0.0005, lng: 0.001 } },
  { name: 'Cafeteria', offset: { lat: -0.0005, lng: 0.0008 } },
  { name: 'Hostel Area', offset: { lat: 0.002, lng: -0.001 } },
];

export default function LocationShareModal({ isOpen, onClose, onSend }) {
  const [mode, setMode] = useState('current');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveInterval, setLiveInterval] = useState(null);
  const mapRef = useRef(null);

  // Get current location on mount
  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
    return () => {
      if (liveInterval) {
        clearInterval(liveInterval);
      }
    };
  }, [isOpen]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(coords);
        setLoading(false);

        // Try to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'UniMart-App' } }
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name.split(',').slice(0, 3).join(','));
          }
        } catch {
          // Address lookup failed - non-critical, location still works
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const handleMapClick = (e) => {
    if (mode !== 'manual') return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect || !location) return;

    // Calculate approximate click position relative to center
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

    // Adjust coordinates (rough approximation for zoom level 15)
    const zoomFactor = 0.01; // Roughly 1km at zoom 15
    const newLat = location.lat - y * zoomFactor;
    const newLng = location.lng + x * zoomFactor;

    setLocation({ ...location, lat: newLat, lng: newLng });
    setAddress(''); // Clear address since we moved
  };

  const handleQuickLocation = (quickLoc) => {
    if (!location) return;
    setMode('manual');
    setLocation({
      ...location,
      lat: location.lat + quickLoc.offset.lat,
      lng: location.lng + quickLoc.offset.lng,
    });
    setAddress(quickLoc.name);
  };

  const handleShare = async () => {
    if (!location) {
      setError('Please wait for location to be detected');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const googleMapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

      let message = '';
      if (mode === 'live') {
        message = `🔴 Live Location (15 min)\n📍 ${address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}\n${googleMapsUrl}?live=true`;
      } else if (mode === 'manual') {
        message = `📍 Meeting Point: ${address || 'Selected Location'}\n${googleMapsUrl}`;
      } else {
        message = `📍 My Location: ${address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}\n${googleMapsUrl}`;
      }

      await onSend(message);

      // If live mode, start interval for updates
      if (mode === 'live') {
        startLiveSharing();
      }

      onClose();
    } catch (err) {
      setError('Failed to share location. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const startLiveSharing = () => {
    // Start updating location every 30 seconds for 15 minutes
    let updateCount = 0;
    const maxUpdates = 30; // 30 updates x 30 seconds = 15 minutes

    const interval = setInterval(async () => {
      if (updateCount >= maxUpdates) {
        clearInterval(interval);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
          const message = `🔄 Live Location Update\n📍 ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}\n${googleMapsUrl}?live=true`;

          try {
            await onSend(message);
          } catch (err) {
            console.error('Live update failed:', err);
          }

          updateCount++;
        },
        (err) => console.error('Live location error:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 30000);

    setLiveInterval(interval);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <MapPin className="text-emerald-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Share Location</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose how to share your location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Share Mode Selection */}
          <div className="space-y-2 mb-6">
            {SHARE_MODES.map((shareMode) => (
              <button
                key={shareMode.id}
                onClick={() => setMode(shareMode.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${
                  mode === shareMode.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shareMode.color}`}>
                  <shareMode.icon size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${
                    mode === shareMode.id
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {shareMode.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {shareMode.description}
                  </p>
                </div>
                {mode === shareMode.id && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Live Mode Warning */}
          {mode === 'live' && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <div className="flex items-start gap-2">
                <Clock className="text-amber-500 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Live Sharing Active for 15 Minutes
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Your location will be shared every 30 seconds. The other person can track your movement in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Map Preview */}
          <div className="mb-4">
            <div
              ref={mapRef}
              onClick={handleMapClick}
              className={`relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
                mode === 'manual' ? 'cursor-crosshair' : ''
              }`}
            >
              {location ? (
                <>
                  {/* OpenStreetMap Embed (no API key required) */}
                  <iframe
                    title="Location Preview"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.008},${location.lng + 0.01},${location.lat + 0.008}&layer=mapnik&marker=${location.lat},${location.lng}`}
                    loading="lazy"
                  />

                  {/* Mode Indicator */}
                  {mode === 'manual' && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg">
                      Click anywhere to select location
                    </div>
                  )}

                  {/* Live Indicator */}
                  {mode === 'live' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-500 text-white text-xs rounded-lg animate-pulse">
                      <Radio size={12} />
                      Live
                    </div>
                  )}

                  {/* Crosshair Overlay for Manual Mode */}
                  {mode === 'manual' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 border-2 border-emerald-500 rounded-full flex items-center justify-center bg-emerald-500/20">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                  {loading ? (
                    <div className="text-center">
                      <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Getting location...</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Location not available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Info */}
          {location && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {address || 'Current Location'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    {location.accuracy && (
                      <span className="ml-2">
                        (accuracy: ~{Math.round(location.accuracy)}m)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                  title="Refresh location"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Navigation size={18} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Locations (for manual mode) */}
          {mode === 'manual' && location && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Quick Select
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleQuickLocation(loc)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-500 mt-0.5" size={16} />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sending || !location}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send size={16} />
                Share Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
