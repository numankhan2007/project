import { formatTime } from '../../utils/helpers';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

// Parse text and convert URLs to clickable links
const parseMessageContent = (text, isOwn) => {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  // Check if this is a location message
  const isLocationMessage = text.startsWith('📍') || text.includes('google.com/maps');

  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    if (urlPattern.test(part)) {
      // Reset regex lastIndex
      urlPattern.lastIndex = 0;

      const isMapLink = part.includes('google.com/maps') || part.includes('openstreetmap');

      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 underline hover:opacity-80 transition-opacity ${
            isOwn ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {isMapLink ? (
            <>
              <Navigation size={12} />
              Open in Maps
              <ExternalLink size={10} />
            </>
          ) : (
            part.length > 40 ? part.substring(0, 40) + '...' : part
          )}
        </a>
      );
    }
    return part;
  });
};

// Special component for location messages
function LocationBubble({ message, isOwn }) {
  const urlMatch = message.text.match(/(https?:\/\/[^\s]+)/);
  const locationUrl = urlMatch ? urlMatch[0] : null;

  // Try to extract coordinates from URL
  let coords = null;
  if (locationUrl) {
    const coordMatch = locationUrl.match(/[?&]q=([-\d.]+),([-\d.]+)/);
    if (coordMatch) {
      coords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }
  }

  // Check if it's a live location
  const isLiveLocation = message.text.includes('🔴 Live Location') || message.text.includes('live=true');

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl overflow-hidden shadow-lg
          ${isOwn
            ? 'rounded-br-md'
            : 'rounded-bl-md'
          }`}
      >
        {/* Map Preview */}
        <div className={`relative w-64 h-32 ${isOwn ? 'gradient-bg' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-1 ${
                isLiveLocation ? 'bg-red-500 animate-pulse' : 'bg-white/20'
              }`}>
                {isLiveLocation ? (
                  <div className="relative">
                    <MapPin size={24} className="text-white" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full animate-ping"></span>
                  </div>
                ) : (
                  <MapPin size={24} />
                )}
              </div>
              <p className="text-xs font-medium opacity-90">
                {isLiveLocation ? 'Live Location Shared' : 'Location Shared'}
              </p>
              {coords && (
                <p className="text-[10px] opacity-70 mt-0.5">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className={`px-4 py-2.5 ${isOwn ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {locationUrl ? (
            <a
              href={locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Navigation size={16} />
              Open in Maps
              <ExternalLink size={14} />
            </a>
          ) : (
            <span className="text-white/70 text-sm">Location unavailable</span>
          )}
        </div>

        {/* Timestamp */}
        <div className={`px-4 py-1.5 text-[10px] ${isOwn ? 'bg-indigo-700 text-white/60' : 'bg-emerald-700 text-white/60'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default function MessageBubble({ message, isOwn }) {
  // Check if this is a location message
  const isLocationMessage = message.text.startsWith('📍') ||
    (message.text.includes('google.com/maps') && message.text.includes('Location'));

  if (isLocationMessage) {
    return <LocationBubble message={message} isOwn={isOwn} />;
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
          ${isOwn
            ? 'gradient-bg text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
          }`}
      >
        <p className="leading-relaxed break-words">{parseMessageContent(message.text, isOwn)}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
