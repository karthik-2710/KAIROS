import { useState, useEffect, useRef } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/services/firebase'

export interface ESP32SensorReading {
  temperature: number | null
  humidity: number | null
  soil: {
    rawValue: number
    percentage: number
    label: string
  } | null
  rain: {
    isRaining: boolean
    rawValue: number | string | boolean
    label: string
  } | null
  gas: {
    rawValue: number
    unit: string
    label: string
  } | null
  timestamp: string | null
  lastUpdatedEpoch: number | null
}

export type ConnectionStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'ERROR'

export interface SensorTelemetryHistoryPoint {
  time: string
  epoch: number
  temperature: number | null
  humidity: number | null
  soil: number | null
  gas: number | null
  isRaining: boolean
}

export interface SensorDataState {
  data: ESP32SensorReading
  connectionStatus: ConnectionStatus
  lastUpdatedText: string
  error: string | null
  liveHistory: SensorTelemetryHistoryPoint[]
  isInitialLoading: boolean
}

// Time thresholds (in milliseconds)
const STALE_THRESHOLD_MS = 180_000 // 3 minutes
const LIVE_THRESHOLD_MS = 90_000   // 1.5 minutes

export function useSensorData(dbPath = '/'): SensorDataState {
  const [reading, setReading] = useState<ESP32SensorReading>({
    temperature: null,
    humidity: null,
    soil: null,
    rain: null,
    gas: null,
    timestamp: null,
    lastUpdatedEpoch: null
  })

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('OFFLINE')
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Never')
  const [error, setError] = useState<string | null>(null)
  const [liveHistory, setLiveHistory] = useState<SensorTelemetryHistoryPoint[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)

  const lastEpochRef = useRef<number | null>(null)

  // 1. Firebase Real-Time Listener
  useEffect(() => {
    setIsInitialLoading(true)
    setError(null)

    // Listen on root or target path
    const targetRef = ref(rtdb, dbPath || '/')

    const handleSnapshot = (snapshot: any) => {
      setIsInitialLoading(false)
      const val = snapshot.val()
      if (val) {
        parseAndSet(val)
      }
    }

    const handleError = (err: Error) => {
      console.warn('[Firebase RTDB] Listener error:', err)
      setError(err.message)
      setConnectionStatus('ERROR')
      setIsInitialLoading(false)
    }

    const unsubscribe = onValue(targetRef, handleSnapshot, handleError)

    return () => {
      unsubscribe()
    }
  }, [dbPath])

  // Helper to extract and normalize the real ESP32 sensors
  const parseAndSet = (raw: any) => {
    if (!raw || typeof raw !== 'object') return

    // Traverse to locate sensor payload
    let payload = raw
    if (raw.KAIROS && typeof raw.KAIROS === 'object') {
      payload = raw.KAIROS.sensor_data || raw.KAIROS.sensors || raw.KAIROS
    } else if (raw.sensor_data && typeof raw.sensor_data === 'object') {
      payload = raw.sensor_data
    } else if (raw.sensorData && typeof raw.sensorData === 'object') {
      payload = raw.sensorData
    } else if (raw.sensors && typeof raw.sensors === 'object') {
      payload = raw.sensors
    }

    // 1. Temperature (°C)
    let tempVal: number | null = null
    const rawTemp = payload.temperature ?? payload.temp ?? payload.t ?? payload.temp_c
    if (rawTemp !== undefined && rawTemp !== null && !isNaN(Number(rawTemp))) {
      tempVal = Math.round(Number(rawTemp) * 10) / 10
    }

    // 2. Humidity (%)
    let humVal: number | null = null
    const rawHum = payload.humidity ?? payload.hum ?? payload.h ?? payload.rel_humidity
    if (rawHum !== undefined && rawHum !== null && !isNaN(Number(rawHum))) {
      humVal = Math.round(Number(rawHum) * 10) / 10
    }

    // 3. Soil Moisture (Raw ADC & Calibrated %)
    let soilObj: ESP32SensorReading['soil'] = null
    const rawSoil = payload.soil ?? payload.soil_moisture ?? payload.moisture
    if (rawSoil !== undefined && rawSoil !== null && !isNaN(Number(rawSoil))) {
      const numSoil = Number(rawSoil)
      // ESP32 12-bit ADC (0-4095): 4095 = Dry, 1200 = Saturated Water
      const pct = Math.max(0, Math.min(100, Math.round(((4095 - numSoil) / (4095 - 1200)) * 100)))
      soilObj = {
        rawValue: numSoil,
        percentage: pct,
        label: `${pct}%`
      }
    }

    // 4. Rain Sensor (HW-103 / Rain Plate)
    let rainObj: ESP32SensorReading['rain'] = null
    const rawRain = payload.hw103 ?? payload.rain ?? payload.rain_detected ?? payload.is_raining
    if (rawRain !== undefined && rawRain !== null) {
      let isRaining = false
      if (typeof rawRain === 'boolean') {
        isRaining = rawRain
      } else if (typeof rawRain === 'string') {
        const lower = rawRain.toLowerCase().trim()
        isRaining = lower === 'detected' || lower === 'true' || lower === 'yes' || lower === '1'
      } else if (typeof rawRain === 'number') {
        // HW-103: 4095 is dry, < 3000 indicates water detected
        if (rawRain === 1) isRaining = true
        else if (rawRain > 1 && rawRain < 3000) isRaining = true
        else isRaining = false
      }

      rainObj = {
        isRaining,
        rawValue: rawRain,
        label: isRaining ? 'Rain Detected' : 'No Rain'
      }
    }

    // 5. Gas Sensor (MQ135 ADC raw integer)
    let gasObj: ESP32SensorReading['gas'] = null
    const rawGas = payload.mq135 ?? payload.gas ?? payload.mq_sensor ?? payload.air_quality ?? payload.gas_sensor
    if (rawGas !== undefined && rawGas !== null && !isNaN(Number(rawGas))) {
      const numGas = Math.round(Number(rawGas))
      gasObj = {
        rawValue: numGas,
        unit: 'ADC',
        label: `${numGas} ADC`
      }
    }

    // Timestamp & Epoch
    let epoch = Date.now()
    const rawTs = payload.timestamp ?? payload.time ?? payload.created_at
    if (rawTs) {
      if (typeof rawTs === 'number') {
        epoch = rawTs > 1e11 ? rawTs : rawTs * 1000
      } else if (typeof rawTs === 'string') {
        const parsed = Date.parse(rawTs)
        if (!isNaN(parsed)) epoch = parsed
      }
    }

    const now = Date.now()
    lastEpochRef.current = epoch

    const parsedReading: ESP32SensorReading = {
      temperature: tempVal,
      humidity: humVal,
      soil: soilObj,
      rain: rainObj,
      gas: gasObj,
      timestamp: new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lastUpdatedEpoch: epoch
    }

    setReading(parsedReading)
    setError(null)

    // Evaluate liveness immediately
    const diffMs = now - epoch
    if (diffMs < LIVE_THRESHOLD_MS) {
      setConnectionStatus('LIVE')
    } else if (diffMs < STALE_THRESHOLD_MS) {
      setConnectionStatus('STALE')
    } else {
      setConnectionStatus('LIVE')
    }

    // Append to live historical buffer
    setLiveHistory(prev => {
      const point: SensorTelemetryHistoryPoint = {
        time: new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        epoch,
        temperature: tempVal,
        humidity: humVal,
        soil: soilObj ? soilObj.percentage : null,
        gas: gasObj ? gasObj.rawValue : null,
        isRaining: rainObj ? rainObj.isRaining : false
      }
      const updated = [...prev, point]
      return updated.slice(-30)
    })
  }

  // Fast Update Timer (Every 250ms for ultra-responsive low delay updates)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastEpochRef.current) {
        setConnectionStatus('OFFLINE')
        setLastUpdatedText('No data received')
        return
      }

      const diffSec = Math.floor((Date.now() - lastEpochRef.current) / 1000)

      if (diffSec < 2) {
        setLastUpdatedText('Just now')
      } else if (diffSec < 60) {
        setLastUpdatedText(`${diffSec}s ago`)
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60)
        setLastUpdatedText(`${mins}m ago`)
      } else {
        const hrs = Math.floor(diffSec / 3600)
        setLastUpdatedText(`${hrs}h ago`)
      }

      const diffMs = Date.now() - lastEpochRef.current
      if (diffMs < LIVE_THRESHOLD_MS) {
        setConnectionStatus('LIVE')
      } else if (diffMs < STALE_THRESHOLD_MS) {
        setConnectionStatus('STALE')
      } else {
        setConnectionStatus('STALE')
      }
    }, 250)

    return () => clearInterval(timer)
  }, [])

  return {
    data: reading,
    connectionStatus,
    lastUpdatedText,
    error,
    liveHistory,
    isInitialLoading
  }
}
