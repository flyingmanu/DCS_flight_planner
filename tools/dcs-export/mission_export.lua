--[[
  DCS Flight Planner - theater data discovery/export script

  Purpose: dump whatever data the DCS mission scripting API exposes for every
  airbase on the current theater (name, position, runways, radio info, ...)
  as JSON, written into dcs.log via env.info().

  This is a DISCOVERY script: we don't yet know exactly which getters your
  DCS version supports, so it defensively probes a list of known Airbase
  methods and includes whatever succeeds. Fields that aren't supported by
  your DCS version simply come back as null - that's expected and useful
  information in itself.

  Runs entirely inside the default sandboxed mission scripting environment
  (no io/os/lfs access needed, no edits to MissionScripting.lua required).

  Install: add a MISSION START trigger with a "DO SCRIPT FILE" action
  pointing at this file. See README.md in this folder for full steps.
--]]

local function isArray(t)
  local n = 0
  for _ in pairs(t) do
    n = n + 1
  end
  for i = 1, n do
    if t[i] == nil then
      return false
    end
  end
  return true, n
end

local function serialize(value, depth)
  depth = depth or 0
  local t = type(value)

  if value == nil then
    return "null"
  elseif t == "boolean" then
    return value and "true" or "false"
  elseif t == "number" then
    if value ~= value then
      return "null"
    end
    return tostring(value)
  elseif t == "string" then
    local s = value:gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n"):gsub("\r", "")
    return '"' .. s .. '"'
  elseif t == "table" then
    if depth >= 5 then
      return '"[max depth]"'
    end
    local arr, n = isArray(value)
    local parts = {}
    if arr then
      for i = 1, n do
        table.insert(parts, serialize(value[i], depth + 1))
      end
      return "[" .. table.concat(parts, ",") .. "]"
    else
      for k, v in pairs(value) do
        if type(k) == "string" or type(k) == "number" then
          table.insert(parts, serialize(tostring(k), 0) .. ":" .. serialize(v, depth + 1))
        end
      end
      return "{" .. table.concat(parts, ",") .. "}"
    end
  else
    return '"[' .. t .. ']"'
  end
end

local function try(obj, method, ...)
  if type(obj[method]) ~= "function" then
    return nil
  end
  local ok, result = pcall(obj[method], obj, ...)
  if ok then
    return result
  end
  return nil
end

local function dumpAirbase(ab)
  local data = {}
  data.name = try(ab, "getName")
  data.callsign = try(ab, "getCallsign")
  data.category = try(ab, "getCategoryEx") or try(ab, "getCategory")
  data.coalition = try(ab, "getCoalition")
  data.country = try(ab, "getCountry")
  data.typeName = try(ab, "getTypeName")

  local point = try(ab, "getPoint")
  if point then
    local lat, lon, alt = coord.LOtoLL(point)
    data.lat, data.lon, data.alt = lat, lon, alt
    data.point = point
  end

  data.runways = try(ab, "getRunways")
  data.radioSilentMode = try(ab, "getRadioSilentMode")
  data.desc = try(ab, "getDesc")

  return data
end

local ok, err = pcall(function()
  local result = {
    theater = env.mission.theatre,
    airbases = {},
  }

  local airbases = world.getAirbases()
  for _, ab in ipairs(airbases) do
    table.insert(result.airbases, dumpAirbase(ab))
  end

  local json = serialize(result, 0)

  local CHUNK = 700
  env.info("===DCS_EXPORT_BEGIN===")
  for i = 1, #json, CHUNK do
    env.info("DCS_EXPORT|" .. json:sub(i, i + CHUNK - 1))
  end
  env.info("===DCS_EXPORT_END===")
end)

if not ok then
  env.info("DCS_EXPORT_ERROR|" .. tostring(err))
end
