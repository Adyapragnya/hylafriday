import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import './MyMapComponent.css';

const createCustomIcon = (heading, width, height, iconType) => {
  let iconUrl;

  switch (iconType) {
    case 'small':
      iconUrl = '/ship-popup.png';
      break;
    case 'medium':
      iconUrl = '/ship-popup.png';
      break;
    case 'large':
      iconUrl = '/ship-popup.png';
      break;
    case 'extra-large':
      iconUrl = '/ship-popup.png';
      break;
    default:
      iconUrl = '/ship-popup.png';
  }

  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="transform: rotate(${heading}deg); width: ${width}px; height: ${height}px;">
             <img src="${iconUrl}" style="width: 100%; height: 100%;" />
           </div>`,
    iconSize: [width, height],
  });
};

const getIconForZoom = (zoom, isSelected) => {
  // Increase size if the vessel is selected
  const sizeMultiplier = isSelected ? 1.5 : 1;
  if (zoom > 23) return { width: 50 * sizeMultiplier, height: 120 * sizeMultiplier, type: 'extra-large' };
  if (zoom > 15) return { width: 40 * sizeMultiplier, height: 100 * sizeMultiplier, type: 'large' };
  if (zoom > 14.75) return { width: 40 * sizeMultiplier, height: 90 * sizeMultiplier, type: 'medium' };
  if (zoom > 13.75) return { width: 30 * sizeMultiplier, height: 70 * sizeMultiplier, type: 'medium' };
  if (zoom > 12.75) return { width: 20 * sizeMultiplier, height: 50 * sizeMultiplier, type: 'small' };
  if (zoom > 11.5) return { width: 20 * sizeMultiplier, height: 35 * sizeMultiplier, type: 'small' };
  if (zoom > 10.75) return { width: 15 * sizeMultiplier, height: 30 * sizeMultiplier, type: 'small' };
  if (zoom > 9.75) return { width: 15 * sizeMultiplier, height: 30 * sizeMultiplier, type: 'small' };
  if (zoom > 8.75) return { width: 10 * sizeMultiplier, height: 20 * sizeMultiplier, type: 'small' };
  if (zoom > 7) return { width: 10 * sizeMultiplier, height: 20* sizeMultiplier, type: 'small' };
  if (zoom > 6) return { width: 10 * sizeMultiplier, height: 15 * sizeMultiplier, type: 'small' };
  if (zoom > 6) return { width: 10 * sizeMultiplier, height: 15 * sizeMultiplier, type: 'point' };
  return { width: 5 * sizeMultiplier, height: 10 * sizeMultiplier, type: 'point' };
};

const MyMapComponent = ({ selectedVessel, style }) => {
  const mapRef = useRef(null);
  const [vessels, setVessels] = useState([]);
  const [iconSize, setIconSize] = useState(getIconForZoom(5, false));

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    axios
      .get(`${baseURL}/api/get-tracked-vessels`)
      .then((response) => {
        setVessels(response.data);
      })
      .catch((err) => {
        console.error('Error fetching vessel data:', err);
      });
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (map) {
      const updateIconSize = () => {
        const currentZoom = map.getZoom();
        setIconSize(getIconForZoom(currentZoom, !!selectedVessel)); // Update based on zoom and vessel selection
      };

      updateIconSize();
      map.on('zoomend', updateIconSize);

      return () => {
        map.off('zoomend', updateIconSize);
      };
    }
  }, [selectedVessel]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      if (selectedVessel && selectedVessel.AIS.LATITUDE && selectedVessel.AIS.LONGITUDE) {
        map.flyTo([selectedVessel.AIS.LATITUDE, selectedVessel.AIS.LONGITUDE], 15, {
          duration: 1.5,
        });
      } else {
        // If no vessel is selected, zoom out to level 2
        map.setView([0, 0], 2);
      }
    }
  }, [selectedVessel]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    const mapContainer = document.querySelector('.map-card');
    if (mapContainer) {
      resizeObserver.observe(mapContainer);
    }

    return () => {
      if (mapContainer) {
        resizeObserver.unobserve(mapContainer);
      }
    };
  }, []);

  return (
    <div className="map-timeline-container">
      {selectedVessel ? (
        <div className="vessel-info">
          <h4>Voyage Details</h4>
          <table className="voyage-table">
            <tbody>
              <tr>
                <td>Departure Port:</td>
                <td>{selectedVessel.AIS.DESTINATION || 'N/A'}</td>
              </tr>
              <tr>
                <td>Arrival Port:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Arrival Date:</td>
                <td>{selectedVessel.AIS.ETA || 'N/A'}</td>
              </tr>
              <tr>
                <td>Actual Arrival Date:</td>
                <td>{selectedVessel.AIS.ETA || 'N/A'}</td>
              </tr>
              <tr>
                <td>Voyage Duration:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Cargo Type:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Quantity:</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Unit:</td>
                <td>N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="map-card" style={{ flex: '1', ...style }}>
        <div className="card" style={{ borderRadius: '6px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', overflow: 'hidden' }}>
          <MapContainer
            center={[0, 0]}
            minZoom={1.5}
            zoom={6}
            maxZoom={15}
            maxBounds={[[90, -180], [-90, 180]]}
            maxBoundsViscosity={8}
            style={{ height: '567px', width: '100%', backgroundColor: 'rgba(170,211,223,255)' }}
            ref={mapRef}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" noWrap={true} />
            {selectedVessel && (
              <Marker
                position={[selectedVessel.AIS.LATITUDE, selectedVessel.AIS.LONGITUDE]}
                icon={createCustomIcon(selectedVessel.AIS.HEADING, iconSize.width, iconSize.height, iconSize.type)}
              >
                <Popup>
                  Name: {selectedVessel.AIS.NAME || 'No name'}<br />
                  IMO: {selectedVessel.AIS.IMO || 'N/A'}<br />
                  Heading: {selectedVessel.AIS.HEADING || 'N/A'}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

MyMapComponent.propTypes = {
  selectedVessel: PropTypes.shape({
    AIS: PropTypes.shape({
      NAME: PropTypes.string,
      IMO: PropTypes.string,
      CALLSIGN: PropTypes.string,
      DESTINATION: PropTypes.string,
      LATITUDE: PropTypes.number,
      LONGITUDE: PropTypes.number,
      HEADING: PropTypes.number,
      ETA: PropTypes.string,
    }),
  }),
  style: PropTypes.object,
};

export default MyMapComponent;