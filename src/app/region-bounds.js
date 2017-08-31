/* global map, L */
import store from '../store'
import { setBounds } from '../store/actions/viewBounds'

// Store for existing bounds.
const bounds = []
let handlersAdded = false

// Subscribe to changes in state to affect the behavior of Leaflet.Editable.
store.subscribe(() => {
  const state = store.getState()

  // If bounds are cleared from state, remove current bounds.
  if (!state.viewBounds.bounds) removeAllExistingBounds()

  // If select mode has changed, stop any existing drawing interaction.
  if (state.app.analysisMode !== 'REGION' && typeof map !== 'undefined' && map.editTools) {
    map.editTools.stopDrawing()
  }
})

/**
 * Removes an existing bounds.
 *
 * @param {Number} index - remove the bounds at this index in the cache.
 *          Defaults to the earliest bounds (at index 0).
 */
function removeExistingBounds (index = 0) {
  if (bounds[index] && bounds[index].remove) {
    // Manual cleanup on Leaflet
    bounds[index].remove()

    // Remove from memory
    bounds.splice(index, 1)
  }
}

function removeAllExistingBounds () {
  while (bounds.length) {
    bounds[0].remove()
    bounds.shift()
  }
}

/**
 * Sets the appearance and interactivity of a boundary to be in disabled state.
 *
 * @param {LatLngBounds} bound - boundary object to change.
 */
function setBoundToDisabledAppearance (bound) {
  bound.setStyle({
    weight: 1,
    color: '#aaa',
    fill: '#aaa',
    fillOpacity: 0,
    dashArray: [5, 3]
  })
  bound._path.classList.add('map-bounding-box-disabled')
  bound.editor.disable()
}

function storeBounds (bounds) {
  const precision = 6
  const north = bounds.getNorth().toFixed(precision)
  const south = bounds.getSouth().toFixed(precision)
  const east = bounds.getEast().toFixed(precision)
  const west = bounds.getWest().toFixed(precision)

  // Store it.
  store.dispatch(setBounds({ north, south, east, west }))
}

function onDrawingFinished (event) {
  // The newly created rectangle is stored at `event.layer`
  bounds.push(event.layer)
  createShades(event.layer)
  // Remove previous bounds after the new one has been drawn.
  if (bounds.length > 1) {
    removeExistingBounds(0)
  }
}

function onDrawingEdited (event) {
  storeBounds(event.layer.getBounds())
  updateShades(event.layer)
}

function addEventListeners () {
  map.on('editable:drawing:commit', onDrawingFinished)
  map.on('editable:vertex:dragend', onDrawingEdited)
  map.on('editable:dragend', onDrawingEdited)
}

/**
 * Function for drawing new viewport bounds.
 *
 * @param {Object} event - from onClick handler
 * @param {Function} callback - optional. Callback function to call after the
 *          bounds has finished drawing.
 */
export function startDrawingBounds () {
  if (!handlersAdded) {
    addEventListeners()
    handlersAdded = true
  }

  // Remove the handles on existing bounds, but don't remove yet. It remains
  // as a "ghost" so that it can be referenced when new bounds are drawn over it.
  if (bounds.length) {
    bounds.forEach(setBoundToDisabledAppearance)
  }

  map.editTools.startRectangle()
}

export function drawBounds ({ west, south, east, north }) {
  const rect = L.rectangle([
    [north, west],
    [south, east]
  ]).addTo(map)
  createShades(rect)
  rect.enableEdit()

  if (!handlersAdded) {
    addEventListeners()
    handlersAdded = true
  }
  bounds.push(rect)
  storeBounds(rect.getBounds())
}

function createShades(rect) {
  map._container = L.DomUtil.create("div", "leaflet-areaselect-container", map._controlContainer)
  map._topShade = L.DomUtil.create("div", "leaflet-areaselect-shade", map._container)
  map._bottomShade = L.DomUtil.create("div", "leaflet-areaselect-shade", map._container)
  map._leftShade = L.DomUtil.create("div", "leaflet-areaselect-shade", map._container)
  map._rightShade = L.DomUtil.create("div", "leaflet-areaselect-shade", map._container)
  updateShades(rect)
}

function setDimensions(element, dimension) {
  element.style.width = dimension.width + "px"
  element.style.height = dimension.height + "px"
  element.style.top = dimension.top + "px"
  element.style.left = dimension.left + "px"
}

function updateShades(rect) {
  const size = map.getSize()
  const northEastPoint = map.latLngToContainerPoint(rect._bounds._northEast)
  const southWestPoint = map.latLngToContainerPoint(rect._bounds._southWest)
  console.log(size, northEastPoint, southWestPoint)

  setDimensions(map._topShade, {
    width: size.x,
    height: northEastPoint.y,
    top: 0,
    left: 0
  })

  setDimensions(map._bottomShade, {
    width: size.x,
    height: size.y - southWestPoint.y,
    top: southWestPoint.y,
    left: 0
  })

  setDimensions(map._leftShade, {
    width: southWestPoint.x,
    height: southWestPoint.y - northEastPoint.y,
    top: northEastPoint.y,
    left: 0
  })

  setDimensions(map._rightShade, {
    width: size.x - northEastPoint.x,
    height: southWestPoint.y - northEastPoint.y,
    top: northEastPoint.y,
    left: northEastPoint.x
  })
}
