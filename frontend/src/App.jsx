import React, { useState, useEffect, useCallback } from 'react'
import { useWeeks } from './hooks/useWeeks'
import { useLiveData } from './hooks/useLiveData'
import { useIntelligence } from './hooks/useIntelligence'
import { useForecast } from './hooks/useForecast'
import TopBar from './components/layout/TopBar'
import WeekSelector from './components/layout/WeekSelector'
import Footer from './components/layout/Footer'
import Toast from './components/layout/Toast'
import WeeklyTab from './components/weekly/WeeklyTab'
import DailyTab from './components/daily/DailyTab'
import HistoricalTab from './components/historical/HistoricalTab'
import RiskTab from './components/risk/RiskTab'
import SettingsTab from './components/settings/SettingsTab'
import IntelligenceTab from './components/intelligence/IntelligenceTab'
import MarketsTab from './components/markets/MarketsTab'
import JournalTab from './components/journal/JournalTab'
import PrepTab from './components/prep/PrepTab'
import { getHistorical, getJournalStats } from './api'
import { useNews } from './hooks/useNews'
import { useSymbol } from './hooks/useSymbol'

export default function App() {
  const [symbol, setSymbol] = useSymbol()
  const { weeks, loading } = useWeeks()
  const { liveData, updateLive, resetLive } = useLiveData(symbol)
  const { intelligence, economicEvents, earningsEvents, warnings } = useIntelligence(symbol)
  const { forecast, dailyForecasts, refresh: refreshForecast } = useForecast(symbol)
  const { news } = useNews()
  const [selectedWeekId, setSelectedWeekId] = useState(null)
  const [activeTab, setActiveTab] = useState('intelligence')
  const [historical, setHistorical] = useState([])
  const [toast, setToast] = useState('')
  const [journalStats, setJournalStats] = useState(null)

  useEffect(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeks[weeks.length - 1].id)
    }
  }, [weeks])

  useEffect(() => {
    setHistorical([])
    getHistorical(symbol).then(d => setHistorical(d.historical || [])).catch(() => {})
  }, [symbol])

  useEffect(() => {
    getJournalStats({}).then(setJournalStats).catch(() => {})
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const selectedWeek = weeks.find(w => w.id === selectedWeekId) || null

  if (loading) {
    return (
      <div style={{ color: 'var(--text)', padding: '40px', textAlign: 'center', fontFamily: 'var(--sans)' }}>
        Loading...
      </div>
    )
  }

  return (
    <>
      <TopBar liveData={liveData} activeTab={activeTab} onTabChange={setActiveTab} symbol={symbol} onSymbolChange={setSymbol} />
      <div className="main">
        {activeTab !== 'intelligence' && activeTab !== 'weekly' && activeTab !== 'daily' && activeTab !== 'journal' && activeTab !== 'prep' && (
          <WeekSelector weeks={weeks} selectedWeekId={selectedWeekId} onSelect={setSelectedWeekId} />
        )}
        {activeTab === 'intelligence' && (
          <IntelligenceTab
            liveData={liveData}
            intelligence={intelligence}
            economicEvents={economicEvents}
            earningsEvents={earningsEvents}
            warnings={warnings}
            week={selectedWeek}
            news={news}
            symbol={symbol}
          />
        )}
        {activeTab === 'weekly' && <WeeklyTab forecast={forecast} liveData={liveData} refreshForecast={refreshForecast} news={news} journalStats={journalStats} symbol={symbol} />}
        {activeTab === 'daily' && <DailyTab dailyForecasts={dailyForecasts} liveData={liveData} refreshForecast={refreshForecast} news={news} symbol={symbol} />}
        {activeTab === 'prep' && <PrepTab liveData={liveData} economicEvents={economicEvents} symbol={symbol} />}
        {activeTab === 'markets' && <MarketsTab week={selectedWeek} allWeeks={weeks} liveData={liveData} economicEvents={economicEvents} symbol={symbol} />}
        {activeTab === 'historical' && <HistoricalTab historical={historical} allWeeks={weeks} liveData={liveData} symbol={symbol} />}
        {activeTab === 'risk' && <RiskTab week={selectedWeek} liveData={liveData} economicEvents={economicEvents} journalStats={journalStats} />}
        {activeTab === 'journal' && <JournalTab onShowToast={showToast} />}
        {activeTab === 'settings' && (
          <SettingsTab
            liveData={liveData}
            symbol={symbol}
            onUpdateLive={updateLive}
            onResetLive={resetLive}
            onShowToast={showToast}
          />
        )}
      </div>
      <Footer />
      <Toast message={toast} />
    </>
  )
}
