import type { OpenCell } from "../../hooks/useAppContext";

// ===========================
//  Landing Point Popup HTML
// ===========================
export function buildLandingPointPopupHTML(name: string) {
  return `<div class="cell-popup">
            <div class="cell-popup-header">${name}</div>
            <div class="cell-popup-row">
              <span class="cell-popup-label">Type</span>
              <span class="cell-popup-value">Landing Point</span>
            </div>
          </div>`;
}

// ============
//  Popup HTML
// ============
export function buildPopupHTML(cell: OpenCell, paramKey: string) {
  const { lngLat, props } = cell;
  const capacity = props[paramKey];

  const depth_m = props.depth_m;
  const wind_speed_m_s = props.wind_speed_m_s;
  const export_cable_km = props.export_cable_km;
  const e_w = props.e_w;
  const n_surveys = props.n_surveys;

  return `<div class="cell-popup">
            <div class="cell-popup-header">
              Cell Details
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Longitude</span>
              <span class="cell-popup-value">${lngLat[0].toFixed(6)}</span>
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Latitude</span>
              <span class="cell-popup-value">${lngLat[1].toFixed(6)}</span>
            </div>

            <div class="cell-popup-row">
              <span class="cell-popup-label">Installed Capacity</span>
              <span class="cell-popup-value">${
                typeof capacity === "number"
                  ? `${capacity.toFixed(2)} MW`
                  : "No data"
              }</span>
            </div>

            <div class="cell-popup-section">
              <div class="cell-popup-section-title">Additional Information</div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Water Depth</span>
                <span class="cell-popup-value">${
                  typeof depth_m === "number"
                    ? `${depth_m.toFixed(2)} m`
                    : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Average Wind Speed (150m AMSL)</span>
                <span class="cell-popup-value">${
                  typeof wind_speed_m_s === "number"
                    ? `${wind_speed_m_s.toFixed(2)} m/s`
                    : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Export Cable Length</span>
                <span class="cell-popup-value">${
                  typeof export_cable_km === "number"
                    ? `${export_cable_km.toFixed(2)} km`
                    : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Sea Bird Exposure Score for Cell</span>
                <span class="cell-popup-value">${
                  typeof e_w === "number" ? `${e_w.toFixed(2)}` : "Error"
                }</span>
              </div>

              <div class="cell-popup-row">
                <span class="cell-popup-label">Number of Bird Surveys</span>
                <span class="cell-popup-value">${
                  typeof n_surveys === "number"
                    ? `${n_surveys.toFixed(0)}`
                    : "Error"
                }</span>
              </div>

            </div>
          </div>`;
}
