import React, { useState } from 'react'
import type { AnalysisMatch, StructuredResponse } from '../../types'
import './AnalysisResultTable.scss'

interface AnalysisResultTableProps {
  response: StructuredResponse
  onHighlight: (match: AnalysisMatch) => void
  onClearHighlights: () => void
}

export const AnalysisResultTable: React.FC<AnalysisResultTableProps> = ({
  response,
  onHighlight,
  onClearHighlights,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleHighlight = (match: AnalysisMatch) => {
    if (activeId === match.id) {
      setActiveId(null)
      onClearHighlights()
    } else {
      setActiveId(match.id)
      onHighlight(match)
    }
  }

  const relationshipLabel: Record<string, string> = {
    equivalent: 'Equivalent',
    similar: 'Similar',
    'one-sided': 'One-sided',
  }

  return (
    <div className="analysis-table">
      {response.summary && (
        <p className="analysis-table__summary">{response.summary}</p>
      )}

      {response.matches.length > 0 && (
        <div className="analysis-table__scroll">
          <table className="analysis-table__table">
            <thead>
              <tr>
                <th></th>
                <th>Relationship</th>
                <th>Page A</th>
                <th>Page B</th>
              </tr>
            </thead>
            <tbody>
              {response.matches.map((match) => (
                <tr key={match.id} className={activeId === match.id ? 'analysis-table__row--active' : ''}>
                  <td>
                    <button
                      className={`analysis-table__highlight-btn${activeId === match.id ? ' analysis-table__highlight-btn--active' : ''}`}
                      onClick={() => handleHighlight(match)}
                      title={activeId === match.id ? 'Clear highlight' : 'Highlight in both panes'}
                    >
                      {activeId === match.id ? <ClearIcon /> : <HighlightIcon />}
                    </button>
                  </td>
                  <td>
                    <span
                      className={`analysis-table__badge analysis-table__badge--${match.relationship}`}
                      title={match.explanation}
                    >
                      {relationshipLabel[match.relationship] ?? match.relationship}
                    </span>
                  </td>
                  <td>
                    <ElementCell label={match.labelA} selector={match.selectorA} />
                  </td>
                  <td>
                    <ElementCell label={match.labelB} selector={match.selectorB} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const ElementCell: React.FC<{ label: string | null; selector: string | null }> = ({ label, selector }) => {
  if (!label && !selector) {
    return <span className="analysis-table__absent">Not present</span>
  }
  return (
    <span className="analysis-table__element">
      <span className="analysis-table__element-label">{label || 'Unknown'}</span>
      {selector && (
        <code className="analysis-table__element-selector">{selector}</code>
      )}
    </span>
  )
}

function HighlightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
