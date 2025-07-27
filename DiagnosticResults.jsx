import React, { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

const DiagnosticResults = ({ result, onNewSession }) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [followUpResponse, setFollowUpResponse] = useState('')
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false)
  const [followUpHistory, setFollowUpHistory] = useState([])

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault()
    if (!followUpQuestion.trim()) return

    setIsLoadingFollowUp(true)
    
    try {
      const response = await fetch('https://5003-ifso0ycmvzfunyjvom75k-e8649773.manusvm.computer/api/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_analysis: result.chatgpt_analysis,
          follow_up_question: followUpQuestion,
          diagnostic_context: {
            equipment_type: result.equipment_type,
            symptoms: result.symptoms,
            measurements: result.measurements
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newFollowUp = {
          question: followUpQuestion,
          answer: data.follow_up_response,
          timestamp: new Date().toLocaleString()
        }
        setFollowUpHistory([...followUpHistory, newFollowUp])
        setFollowUpQuestion('')
      } else {
        console.error('Follow-up request failed')
      }
    } catch (error) {
      console.error('Error sending follow-up question:', error)
    } finally {
      setIsLoadingFollowUp(false)
    }
  }

  const formatChatGPTAnalysis = (analysis) => {
    if (!analysis) return ''
    
    // Enhanced formatting to make it look more like ChatGPT
    let formatted = analysis
    
    // Add proper headers and structure
    formatted = formatted.replace(/(\d+\.\s*)(PRIMARY DIAGNOSIS|ROOT CAUSES|IMMEDIATE ACTIONS|SAFETY WARNINGS|REPAIR ESTIMATE):/gi, 
      '\n## $2\n\n')
    
    // Format sub-sections with proper markdown
    formatted = formatted.replace(/(-\s*)(Compressor Failure|Refrigerant Leak|Electrical Issues|Fan Motor|Control Board)/gi, 
      '\n### $2\n\n')
    
    // Format likelihood percentages
    formatted = formatted.replace(/\((\d+%\s*likelihood)\)/gi, ' **($1)**')
    
    // Format tool names and technical terms
    formatted = formatted.replace(/(multimeter|manifold gauge|leak detector|ohmmeter)/gi, '`$1`')
    
    // Format safety warnings
    formatted = formatted.replace(/(Always|Never|Caution|Warning|Important)/gi, '**$1**')
    
    // Format repair time estimates
    formatted = formatted.replace(/(\d+-\d+\s*hours?)/gi, '**$1**')
    
    // Add proper spacing and structure
    formatted = formatted.replace(/\.\s*-\s*/g, '.\n\n- ')
    formatted = formatted.replace(/\.\s*\d+\./g, '.\n\n$&')
    
    return formatted
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500 dark:text-slate-400">
          No diagnostic results available
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                Diagnostic Analysis Complete
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Session ID: {result.session_id} • {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-full text-sm font-medium">
              {result.confidence_score}% Confidence
            </div>
            <button
              onClick={onNewSession}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>New Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* ChatGPT Analysis Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 sm:mb-8">
          {/* ChatGPT Header */}
          <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  AI Diagnostic Analysis
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  ChatGPT-4 Professional Analysis
                </p>
              </div>
            </div>
          </div>

          {/* ChatGPT Content */}
          <div className="p-4 sm:p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base">
              <MarkdownRenderer content={formatChatGPTAnalysis(result.chatgpt_analysis)} />
            </div>
          </div>
        </div>

        {/* Follow-up Questions Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 sm:mb-8">
          <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-600">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Follow-up Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Ask additional questions about this diagnosis
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {/* Follow-up Form */}
            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              <div>
                <textarea
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Ask a follow-up question about this diagnosis..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none text-sm sm:text-base"
                  rows={3}
                  disabled={isLoadingFollowUp}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!followUpQuestion.trim() || isLoadingFollowUp}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm sm:text-base"
                >
                  {isLoadingFollowUp ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Asking...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Ask Question</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Follow-up History */}
            {followUpHistory.length > 0 && (
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                <h4 className="text-sm sm:text-md font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                  Previous Questions
                </h4>
                {followUpHistory.map((followUp, index) => (
                  <div key={index} className="space-y-3 sm:space-y-4">
                    {/* Question */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">Q</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 dark:text-slate-200 font-medium text-sm sm:text-base break-words">
                            {followUp.question}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {followUp.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Answer */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        <div className="flex-1 min-w-0 prose prose-slate dark:prose-invert prose-sm max-w-none">
                          <MarkdownRenderer content={followUp.answer} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Export Report</span>
          </button>
          <button
            onClick={onNewSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Start New Diagnostic</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticResults

