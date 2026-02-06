import React, { useState, useEffect } from 'react';
import { encode, decode, Location } from "@pranamphd/digipin";

const DigiPinTester = () => {
  // Initial state uses coordinates from your first database row
  const [coords, setCoords] = useState<Location>({ 
    latitude: 19.1102976, 
    longitude: 72.8623248 
  });
  const [pin, setPin] = useState('');
  const [reverseCoords, setReverseCoords] = useState<Location | null>(null);

  // Update PIN whenever coordinates change
  useEffect(() => {
    try {
      const generatedPin = encode(coords);
      setPin(generatedPin);
      
      // Verification step: Decode it back to check precision
      const decoded = decode(generatedPin);
      setReverseCoords(decoded);
    } catch (err) {
      console.error("Encoding error:", err);
    }
  }, [coords]);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800">DigiPIN Field Tester</h2>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Input Coordinates (from Supabase)</label>
        <input 
          type="number" 
          placeholder="Latitude"
          className="w-full p-2 border rounded"
          value={coords.latitude}
          onChange={(e) => setCoords({...coords, latitude: parseFloat(e.target.value)})}
        />
        <input 
          type="number" 
          placeholder="Longitude"
          className="w-full p-2 border rounded"
          value={coords.longitude}
          onChange={(e) => setCoords({...coords, longitude: parseFloat(e.target.value)})}
        />
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-xs uppercase font-bold text-blue-600">Generated DigiPIN</span>
        <div className="text-2xl font-mono tracking-widest text-blue-900">{pin}</div>
      </div>

      {reverseCoords && (
        <div className="text-xs text-slate-500 italic">
          Verification: Decodes back to {reverseCoords.latitude.toFixed(5)}, {reverseCoords.longitude.toFixed(5)}
        </div>
      )}
    </div>
  );
};

export default DigiPinTester;