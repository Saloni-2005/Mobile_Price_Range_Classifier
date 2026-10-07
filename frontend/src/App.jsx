import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import FeaturesPage from './pages/FeaturesPage'
import ExplainPage from './pages/ExplainPage'
import WhatIfPage from './pages/WhatIfPage'
import ModelCardPage from './pages/ModelCardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="predict" element={<PredictPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="explain" element={<ExplainPage />} />
          <Route path="explain/:predictionId" element={<ExplainPage />} />
          <Route path="what-if" element={<WhatIfPage />} />
          <Route path="model-card" element={<ModelCardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
