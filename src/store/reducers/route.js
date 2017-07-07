// Experimental: try Ducks (https://github.com/erikras/ducks-modular-redux)

// Actions
export const SET_WAYPOINT = 'analyst-ui/route/SET_WAYPOINT'
export const REMOVE_WAYPOINT = 'analyst-ui/route/REMOVE_WAYPOINT'
export const SET_ROUTE = 'analyst-ui/route/SET_ROUTE'
export const RESET = 'analyst-ui/route/RESET'

// Reducer
const initialState = {
  waypoints: [],
  positions: null
}

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case SET_WAYPOINT:
      return {
        ...state,
        waypoints: [...state.waypoints, action.waypoint]
      }
    case REMOVE_WAYPOINT:
      return {
        ...state,
        waypoints: state.waypoints.filter(waypoint => waypoint !== action.waypoint)
      }
    case SET_ROUTE:
      return {
        ...state,
        positions: action.positions
      }
    case RESET:
      return initialState
    default:
      return state
  }
}

// Action creators
export function setWaypoint (waypoint) {
  return {
    type: SET_WAYPOINT,
    waypoint
  }
}

export function removeWaypoint (waypoint) {
  return {
    type: REMOVE_WAYPOINT,
    waypoint
  }
}

export function setRoute (positions) {
  return {
    type: SET_ROUTE,
    positions
  }
}

export function resetRoute () {
  return { type: RESET }
}

// Thunks
